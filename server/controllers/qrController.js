const QRCode = require('qrcode');
const pool  = require('../config/database.js');
const crypto = require('crypto');

const generateQR = async (req, res) => {
  try {
    const { admin_id } = req.user;
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const publicUrl = `${process.env.FRONTEND_URL}/register/${sessionToken}`;
    
    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(publicUrl);
    
    // Save session
    const [result] = await pool.query(
      `INSERT INTO qr_sessions (admin_id, session_token, qr_code, public_url) 
       VALUES (?, ?, ?, ?)`,
      [admin_id, sessionToken, qrCodeDataURL, publicUrl]
    );
    
    // Fetch the complete session data including created_at
    const [sessionData] = await pool.query(
      'SELECT * FROM qr_sessions WHERE id = ?',
      [result.insertId]
    );
    
    // Return the complete session object
    res.json(sessionData[0]);
  } catch (error) {
    console.error('QR generation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getActiveSessions = async (req, res) => {
  try {
    const { admin_id } = req.user;
    
    const [sessions] = await pool.query(
      `SELECT * FROM qr_sessions 
       WHERE admin_id = ? AND is_active = TRUE 
       ORDER BY created_at DESC`,
      [admin_id]
    );
    
    res.json(sessions);
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteSession = async (req, res) => {
  try {
    const { session_id } = req.params;
    const { admin_id } = req.user;
    
    // Verify session belongs to admin
    const [sessions] = await pool.query(
      'SELECT * FROM qr_sessions WHERE id = ? AND admin_id = ?',
      [session_id, admin_id]
    );
    
    if (sessions.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Soft delete by setting is_active to false
    await pool.query(
      'UPDATE qr_sessions SET is_active = FALSE WHERE id = ?',
      [session_id]
    );
    
    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { generateQR, getActiveSessions, deleteSession };