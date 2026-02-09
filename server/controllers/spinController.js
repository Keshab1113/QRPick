const XLSX = require('xlsx');
const pool  = require('../config/database.js');

const getRegisteredUsers = async (req, res) => {
  try {
    const { session_id } = req.params;
    
    const [users] = await pool.query(
      `SELECT id, name, koc_id, team, created_at 
       FROM users 
       WHERE qr_session_id = ? AND is_active = TRUE 
       ORDER BY created_at DESC`,
      [session_id]
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
    
    // Get all users for this session
    const [users] = await pool.query(
      'SELECT id, name, koc_id FROM users WHERE qr_session_id = ? AND is_active = TRUE',
      [session_id]
    );
    
    if (users.length === 0) {
      return res.status(400).json({ error: 'No users to spin' });
    }
    
    // Randomly select a winner
    const winner = users[Math.floor(Math.random() * users.length)];
    
    // Create spin record
    const [spinResult] = await pool.query(
      `INSERT INTO spins (qr_session_id, spin_result) 
       VALUES (?, ?)`,
      [session_id, JSON.stringify({
        winner,
        total_users: users.length,
        timestamp: new Date().toISOString()
      })]
    );
    
    // Add to selected users
    await pool.query(
      'INSERT INTO selected_users (spin_id, user_id) VALUES (?, ?)',
      [spinResult.insertId, winner.id]
    );
    
    // Emit real-time update
    io.to(`session_${session_id}`).emit('spin_result', {
      winner,
      spin_id: spinResult.insertId,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      winner,
      spin_id: spinResult.insertId,
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
    
    const [selected] = await pool.query(
      `SELECT su.*, u.name, u.koc_id, u.team 
       FROM selected_users su
       JOIN users u ON su.user_id = u.id
       JOIN spins s ON su.spin_id = s.id
       WHERE s.qr_session_id = ?
       ORDER BY su.created_at DESC`,
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
    
    const [selected] = await pool.query(
      `SELECT u.name, u.koc_id, u.email, u.team, u.mobile, su.created_at as selected_at
       FROM selected_users su
       JOIN users u ON su.user_id = u.id
       JOIN spins s ON su.spin_id = s.id
       WHERE s.qr_session_id = ?
       ORDER BY su.created_at DESC`,
      [session_id]
    );
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(selected);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Selected Users');
    
    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=selected_users_${session_id}.xlsx`);
    res.send(excelBuffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getRegisteredUsers,
  performSpin,
  getSelectedUsers,
  exportToExcel
};