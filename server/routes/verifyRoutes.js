const express = require('express');
const router = express.Router();
const verifyController = require('../controllers/verifyController');

router.get('/:certificateId', verifyController.verifyCertificate);
router.get('/:certificateId/view', verifyController.viewCertificatePdf);
router.get('/:certificateId/pdf', verifyController.viewCertificatePdf);
router.get('/:certificateId/download', verifyController.downloadCertificate);

module.exports = router;
