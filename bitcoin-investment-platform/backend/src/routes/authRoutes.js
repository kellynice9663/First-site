const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  setupTwoFactorAuth,
  verifyTwoFactorAuth,
  disableTwoFactorAuth,
  getUserProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Routes for 2FA verification during login (does not require full JWT yet, uses userId)
router.post('/verify-2fa', verifyTwoFactorAuth); // Note: verifyTwoFactorAuth handles both login and enabling 2FA contexts

// Protected routes (require JWT)
router.post('/setup-2fa', protect, setupTwoFactorAuth);
// router.post('/verify-2fa-enable', protect, verifyTwoFactorAuth); // This is handled by '/verify-2fa' with protect middleware context
router.post('/disable-2fa', protect, disableTwoFactorAuth);
router.get('/profile', protect, getUserProfile);

module.exports = router;
