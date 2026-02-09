const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database.js');

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const [admins] = await pool.execute(
      'SELECT * FROM admins WHERE email = ?',
      [email]
    );
    
    
    if (admins.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const admin = admins[0];
    const isValidPassword = await bcrypt.compare(password, admin.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: admin.id, admin_id: admin.id, email: admin.email, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role:admin.role,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const registerUser = async (req, res) => {
  try {
    const { name, koc_id, email, team, mobile, session_token } = req.body;
    
    // Find QR session
    const [sessions] = await pool.execute(
      'SELECT * FROM qr_sessions WHERE session_token = ? AND is_active = TRUE',
      [session_token]
    );
    
    if (sessions.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired session' });
    }
    
    const session = sessions[0];
    
    // Check if user with same email already exists in THIS session
    const [existingByEmail] = await pool.execute(
      'SELECT * FROM users WHERE email = ? AND qr_session_id = ? AND is_active = TRUE',
      [email, session.id]
    );
    
    if (existingByEmail.length > 0) {
      const existingUser = existingByEmail[0];
      const userToken = jwt.sign(
        { id: existingUser.id, email: existingUser.email, role: 'user', session_id: existingUser.qr_session_id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      return res.json({
        token: userToken,
        user: {
          id: existingUser.id,
          name: existingUser.name,
          koc_id: existingUser.koc_id,
          email: existingUser.email,
          team: existingUser.team,
          mobile: existingUser.mobile,
          session_id: existingUser.qr_session_id
        },
        message: 'Welcome back! You were already registered for this session.'
      });
    }
    
    // Check if KOC ID already exists in THIS session
    const [existingByKocId] = await pool.execute(
      'SELECT * FROM users WHERE koc_id = ? AND qr_session_id = ? AND is_active = TRUE',
      [koc_id, session.id]
    );
    
    if (existingByKocId.length > 0) {
      return res.status(400).json({ 
        error: 'This KOC ID is already registered for this session',
        field: 'koc_id'
      });
    }
    
    // Additional check: Check if email exists globally (across all sessions) - optional
    // Uncomment if you want to prevent same email across different sessions
    /*
    const [globalEmailCheck] = await pool.execute(
      'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
      [email]
    );
    
    if (globalEmailCheck.length > 0) {
      return res.status(400).json({ 
        error: 'This email is already registered in another session',
        field: 'email'
      });
    }
    */
    
    // Additional check: Check if KOC ID exists globally (across all sessions) - optional
    // Uncomment if you want to prevent same KOC ID across different sessions
    /*
    const [globalKocCheck] = await pool.execute(
      'SELECT * FROM users WHERE koc_id = ? AND is_active = TRUE',
      [koc_id]
    );
    
    if (globalKocCheck.length > 0) {
      return res.status(400).json({ 
        error: 'This KOC ID is already registered in another session',
        field: 'koc_id'
      });
    }
    */
    
    // Create user
    const [result] = await pool.execute(
      `INSERT INTO users (name, koc_id, email, team, mobile, qr_session_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, koc_id, email, team, mobile, session.id]
    );
    
    const userToken = jwt.sign(
      { id: result.insertId, email, role: 'user', session_id: session.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Emit real-time event for new user
    const io = req.app.get('socketio');
    if (io) {
      io.to(`session_${session.id}`).emit('new_user', {
        id: result.insertId,
        name,
        koc_id,
        team,
        created_at: new Date().toISOString()
      });
    }
    
    res.json({
      token: userToken,
      user: {
        id: result.insertId,
        name,
        koc_id,
        email,
        team,
        mobile,
        session_id: session.id
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      // Parse which field caused the duplicate
      if (error.message.includes('email')) {
        return res.status(400).json({ 
          error: 'This email is already registered',
          field: 'email'
        });
      } else if (error.message.includes('koc_id')) {
        return res.status(400).json({ 
          error: 'This KOC ID is already registered',
          field: 'koc_id'
        });
      }
      return res.status(400).json({ error: 'Email or KOC ID already registered' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getUserSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = req.user.session_id;
    
    // Get all users in this session
    const [users] = await pool.execute(
      `SELECT id, name, koc_id, team, created_at 
       FROM users 
       WHERE qr_session_id = ? AND is_active = TRUE 
       ORDER BY created_at DESC`,
      [sessionId]
    );
    
    // Get selected users
    const [selected] = await pool.execute(
      `SELECT su.*, u.name, u.koc_id, u.team 
       FROM selected_users su
       JOIN users u ON su.user_id = u.id
       JOIN spins s ON su.spin_id = s.id
       WHERE s.qr_session_id = ?
       ORDER BY su.created_at DESC`,
      [sessionId]
    );
    
    res.json({
      session_id: sessionId,
      users,
      selected
    });
  } catch (error) {
    console.error('Get user session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { adminLogin, registerUser, getUserSession };