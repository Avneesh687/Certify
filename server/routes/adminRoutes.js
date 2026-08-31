const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

router.use(authenticateToken, isAdmin);

router.get('/stats', adminController.getAdminStats);
router.get('/users', adminController.getAllUsers);
router.patch('/users/:userId/status', adminController.toggleUserStatus);
router.patch('/users/:userId/role', adminController.updateUserRole);
router.get('/batches', adminController.getAllBatches);
router.get('/certificates', adminController.getAllCertificates);
router.patch('/certificates/:certificateId/revoke', adminController.revokeCertificate);
router.delete('/certificates/:certificateId', adminController.deleteCertificate);

module.exports = router;
