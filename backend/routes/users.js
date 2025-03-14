const express = require('express');
const { getUserById } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/:id', getUserById);

module.exports = router;