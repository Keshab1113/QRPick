const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database.js');

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const [admins] = await pool.query(
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
    const [sessions] = await pool.query(
      'SELECT * FROM qr_sessions WHERE session_token = ? AND is_active = TRUE',
      [session_token]
    );
    
    if (sessions.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired session' });
    }
    
    const session = sessions[0];
    
    // Check if user already exists
    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE email = ? OR koc_id = ?',
      [email, koc_id]
    );
    
    if (existingUsers.length > 0) {
      // Return existing user's token
      const existingUser = existingUsers[0];
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
        message: 'Welcome back! You were already registered.'
      });
    }
    
    // Create user
    const [result] = await pool.query(
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
    const [users] = await pool.query(
      `SELECT id, name, koc_id, team, created_at 
       FROM users 
       WHERE qr_session_id = ? AND is_active = TRUE 
       ORDER BY created_at DESC`,
      [sessionId]
    );
    
    // Get selected users
    const [selected] = await pool.query(
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
