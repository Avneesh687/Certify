const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');
const { authenticateApiKey } = require('../middleware/authMiddleware');

router.use(authenticateApiKey);

router.post('/certificates/issue', apiController.issueCertificate);

module.exports = router;
