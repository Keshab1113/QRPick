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
    
    res.json({
      qr_code: qrCodeDataURL,
      public_url: publicUrl,
      session_token: sessionToken,
      session_id: result.insertId
    });
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

module.exports = { generateQR, getActiveSessions };