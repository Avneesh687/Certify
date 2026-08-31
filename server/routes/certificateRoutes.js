const express = require('express');
const router = express.Router();
const multer = require('multer');
const certificateController = require('../controllers/certificateController');
const { authenticateToken } = require('../middleware/authMiddleware');

// In-Memory Multer storage for zero-disk serverless / cloud readiness
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

router.post('/parse-file', authenticateToken, upload.single('file'), certificateController.parseUploadedFile);
router.post('/preview', authenticateToken, certificateController.previewCertificate);
router.post('/bulk-generate', authenticateToken, certificateController.bulkGenerateCertificates);
router.post('/bulk-delete', authenticateToken, certificateController.bulkDeleteCertificates);
router.get('/', authenticateToken, certificateController.getCertificates);
router.get('/batches', authenticateToken, certificateController.getUserBatches);
router.get('/:certificateId', authenticateToken, certificateController.getCertificateById);
router.delete('/:certificateId', authenticateToken, certificateController.deleteCertificate);
router.post('/:certificateId/resend-email', authenticateToken, certificateController.resendEmail);

module.exports = router;
