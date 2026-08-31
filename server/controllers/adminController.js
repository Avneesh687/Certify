const User = require('../models/User');
const Certificate = require('../models/Certificate');
const GenerationBatch = require('../models/GenerationBatch');
const { deleteCertificatePdf } = require('../utils/storage');

// 1. Aggregated Platform Analytics & System Metrics
exports.getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const totalCertificates = await Certificate.countDocuments();
    const totalBatches = await GenerationBatch.countDocuments();

    const emailsSent = await Certificate.countDocuments({ emailStatus: 'sent' });
    const emailsFailed = await Certificate.countDocuments({ emailStatus: 'failed' });
    const emailsPending = await Certificate.countDocuments({ emailStatus: 'pending' });

    const recentBatches = await GenerationBatch.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentCertificates = await Certificate.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(8);

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalCertificates,
        totalBatches,
        emailsSent,
        emailsFailed,
        emailsPending
      },
      recentBatches,
      recentCertificates
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. List All Users
exports.getAllUsers = async (req, res) => {
  try {
    const { search, role, status } = req.query;
    const query = {};

    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Toggle User Status (Activate / Deactivate)
exports.toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body; // 'active' or 'deactivated'

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.status = status || (user.status === 'active' ? 'deactivated' : 'active');
    await user.save();

    res.json({
      success: true,
      message: `User account is now ${user.status}.`,
      user: { id: user._id, name: user.name, email: user.email, status: user.status }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Update User Role (Promote to Admin / User)
exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: `User role updated to ${role}.`,
      user: { id: user._id, name: user.name, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Get All Generation Batches Across System
exports.getAllBatches = async (req, res) => {
  try {
    const batches = await GenerationBatch.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, batches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Get All System Certificates
exports.getAllCertificates = async (req, res) => {
  try {
    const { search, page = 1, limit = 25 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { recipientName: { $regex: search, $options: 'i' } },
        { recipientEmail: { $regex: search, $options: 'i' } },
        { certificateId: { $regex: search, $options: 'i' } },
        { eventName: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Certificate.countDocuments(query);
    const certificates = await Certificate.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      certificates
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Revoke Certificate
exports.revokeCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const cert = await Certificate.findOne({ certificateId });

    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate not found.' });
    }

    cert.status = cert.status === 'valid' ? 'revoked' : 'valid';
    await cert.save();

    res.json({
      success: true,
      message: `Certificate ${certificateId} status changed to ${cert.status}.`,
      status: cert.status
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Delete Certificate (Admin)
exports.deleteCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const cert = await Certificate.findOne({ certificateId });

    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate not found.' });
    }

    await deleteCertificatePdf(cert.pdfPublicId, cert.pdfUrl);
    await Certificate.deleteOne({ _id: cert._id });

    res.json({
      success: true,
      message: `Certificate ${certificateId} and its cloud PDF file were permanently deleted.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
