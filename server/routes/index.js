const express = require('express');
const router = express.Router();
const { adminLogin, registerUser, getUserSession } = require('../controllers/authController');
const { generateQR, getActiveSessions } = require('../controllers/qrController');
const {
  getRegisteredUsers,
  performSpin,
  getSelectedUsers,
  exportToExcel
} = require('../controllers/spinController');
const { authenticateAdmin, authenticateToken } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');

// Public routes
router.post('/auth/admin/login', validateRequest(schemas.adminLogin), adminLogin);
router.post('/auth/register', validateRequest(schemas.userRegister), registerUser);

// Protected user routes
router.get('/user/session', authenticateToken, getUserSession);

// Protected admin routes
router.post('/qr/generate', authenticateAdmin, generateQR);
router.get('/qr/sessions', authenticateAdmin, getActiveSessions);

// Session specific routes
router.get('/session/:session_id/users', authenticateToken, getRegisteredUsers);
router.post('/session/:session_id/spin', authenticateAdmin, performSpin);
router.get('/session/:session_id/selected', authenticateToken, getSelectedUsers);
router.get('/session/:session_id/export', authenticateAdmin, exportToExcel);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = router;
