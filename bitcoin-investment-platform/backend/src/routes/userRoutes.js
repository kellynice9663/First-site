const express = require('express');
const router = express.Router();
const { getUserDashboardData } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// All routes in this file will be protected
router.use(protect);

router.get('/dashboard', getUserDashboardData);
// Future user-specific routes can be added here:
// e.g., router.put('/profile', updateUserProfile);
// e.g., router.post('/change-password', changePassword);

module.exports = router;
