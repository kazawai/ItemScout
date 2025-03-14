const express = require('express');
const { register, login, getCurrentUser } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Register and login routes - public
router.post('/register', register);
router.post('/login', login);

// Protected route - requires authentication
router.get('/me', protect, getCurrentUser);

module.exports = router;