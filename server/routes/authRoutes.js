const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.getMe);
router.post('/apikeys', authenticateToken, authController.createApiKey);
router.delete('/apikeys/:keyId', authenticateToken, authController.deleteApiKey);

module.exports = router;
