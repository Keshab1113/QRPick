const express = require('express');
const router = express.Router();
const { adminLogin, registerUser, getUserSession } = require('../controllers/authController');
const { generateQR, getActiveSessions, deleteSession } = require('../controllers/qrController');
const {
  getRegisteredUsers,
  performSpin,
  getSelectedUsers,
  exportToExcel,
  exportRegisteredToExcel
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
router.delete('/qr/sessions/:session_id', authenticateAdmin, deleteSession);

// Session specific routes
router.get('/session/:session_id/users', authenticateToken, getRegisteredUsers);
router.post('/session/:session_id/spin', authenticateAdmin, performSpin);
router.get('/session/:session_id/selected', authenticateToken, getSelectedUsers);
router.get('/session/:session_id/export', authenticateAdmin, exportToExcel);

router.get('/session/:session_id/export-registered', authenticateAdmin, exportRegisteredToExcel);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = router;