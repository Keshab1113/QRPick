const XLSX = require('xlsx');
const pool  = require('../config/database.js');

const getRegisteredUsers = async (req, res) => {
  try {
    const { session_id } = req.params;
    
    // Get users who are registered but NOT yet selected as winners
    const [users] = await pool.execute(
      `SELECT u.id, u.name, u.koc_id, u.created_at 
       FROM users u
       WHERE u.qr_session_id = ? 
         AND u.is_active = TRUE
         AND u.id NOT IN (
           SELECT su.user_id 
           FROM selected_users su
           JOIN spins s ON su.spin_id = s.id
           WHERE s.qr_session_id = ?
         )
       ORDER BY u.created_at DESC`,
      [session_id, session_id]
    );
    
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const performSpin = async (req, res) => {
  try {
    const { session_id } = req.params;
    const io = req.app.get('socketio');
    
    // Get only users who haven't been selected yet
    const [users] = await pool.execute(
      `SELECT u.id, u.name, u.koc_id
       FROM users u
       WHERE u.qr_session_id = ? 
         AND u.is_active = TRUE
         AND u.id NOT IN (
           SELECT su.user_id 
           FROM selected_users su
           JOIN spins s ON su.spin_id = s.id
           WHERE s.qr_session_id = ?
         )`,
      [session_id, session_id]
    );
    
    if (users.length === 0) {
      return res.status(400).json({ 
        error: 'No users available to spin. All users have been selected!' 
      });
    }
    
    // Randomly select a winner from available users
    const winner = users[Math.floor(Math.random() * users.length)];
    
    // Create spin record
    const [spinResult] = await pool.execute(
      `INSERT INTO spins (qr_session_id, spin_result) 
       VALUES (?, ?)`,
      [session_id, JSON.stringify({
        winner,
        total_users: users.length,
        total_available: users.length,
        timestamp: new Date().toISOString()
      })]
    );
    
    // Add to selected users
    await pool.execute(
      'INSERT INTO selected_users (spin_id, user_id) VALUES (?, ?)',
      [spinResult.insertId, winner.id]
    );

    setTimeout(() => {
      io.to(`session_${session_id}`).emit('spin_result', {
        winner,
        spin_id: spinResult.insertId,
        remaining_users: users.length - 1,
        timestamp: new Date().toISOString()
      });
    }, 6000);
    
    res.json({
      winner,
      spin_id: spinResult.insertId,
      remaining_users: users.length - 1,
      message: 'Spin completed successfully'
    });
  } catch (error) {
    console.error('Spin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getSelectedUsers = async (req, res) => {
  try {
    const { session_id } = req.params;
    
    const [selected] = await pool.execute(
      `SELECT su.id, su.created_at, u.name, u.koc_id, u.id as user_id
       FROM selected_users su
       JOIN users u ON su.user_id = u.id
       JOIN spins s ON su.spin_id = s.id
       WHERE s.qr_session_id = ?
       ORDER BY su.created_at ASC`,
      [session_id]
    );
    
    res.json(selected);
  } catch (error) {
    console.error('Get selected users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const exportToExcel = async (req, res) => {
  try {
    const { session_id } = req.params;
    
    const [selected] = await pool.execute(
      `SELECT u.name, u.koc_id, u.email, 
              su.created_at as selected_at,
              ROW_NUMBER() OVER (ORDER BY su.created_at ASC) as selection_order
       FROM selected_users su
       JOIN users u ON su.user_id = u.id
       JOIN spins s ON su.spin_id = s.id
       WHERE s.qr_session_id = ?
       ORDER BY su.created_at ASC`,
      [session_id]
    );
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Format data with proper order
    const formattedData = selected.map(row => ({
      'Selection Order': row.selection_order,
      'Name': row.name,
      'KOC ID': row.koc_id,
      'Email': row.email,
      'Selected At': new Date(row.selected_at).toLocaleString()
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    
    // Set column widths
    const colWidths = [
      {wch: 15}, // Selection Order
      {wch: 25}, // Name
      {wch: 15}, // KOC ID
      {wch: 30}, // Email
      {wch: 25}  // Selected At
    ];
    worksheet['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Selected Winners');
    
    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=selected_winners_${session_id}.xlsx`);
    res.send(excelBuffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const exportRegisteredToExcel = async (req, res) => {
  try {
    const { session_id } = req.params;
    
    // Export ALL registered users (including selected ones)
    const [registered] = await pool.execute(
      `SELECT name, koc_id, email, created_at
       FROM users 
       WHERE qr_session_id = ? AND is_active = TRUE
       ORDER BY created_at ASC`,
      [session_id]
    );
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(registered);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registered Users');
    
    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=registered_users_${session_id}.xlsx`);
    res.send(excelBuffer);
  } catch (error) {
    console.error('Export registered error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// New helper function to get available user count
const getAvailableUserCount = async (req, res) => {
  try {
    const { session_id } = req.params;
    
    const [result] = await pool.execute(
      `SELECT COUNT(*) as available_count
       FROM users u
       WHERE u.qr_session_id = ? 
         AND u.is_active = TRUE
         AND u.id NOT IN (
           SELECT su.user_id 
           FROM selected_users su
           JOIN spins s ON su.spin_id = s.id
           WHERE s.qr_session_id = ?
         )`,
      [session_id, session_id]
    );
    
    const [totalResult] = await pool.execute(
      `SELECT COUNT(*) as total_count
       FROM users
       WHERE qr_session_id = ? AND is_active = TRUE`,
      [session_id]
    );
    
    const [selectedResult] = await pool.execute(
      `SELECT COUNT(*) as selected_count
       FROM selected_users su
       JOIN spins s ON su.spin_id = s.id
       WHERE s.qr_session_id = ?`,
      [session_id]
    );
    
    res.json({
      available: result[0].available_count,
      total: totalResult[0].total_count,
      selected: selectedResult[0].selected_count
    });
  } catch (error) {
    console.error('Get count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getRegisteredUsers,
  performSpin,
  getSelectedUsers,
  exportToExcel,
  exportRegisteredToExcel,
  getAvailableUserCount
};