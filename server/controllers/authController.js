const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role, email: user.email }, JWT_SECRET, {
    expiresIn: '7d'
  });
};

// Signup
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email address is already registered.' });
    }

    // New signups are strictly 'user'. Admins must be promoted via Database or existing Admin.
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: 'user'
    });

    // Generate initial API Key for user convenience
    user.apiKeys.push({
      key: `certify_live_${uuidv4().replace(/-/g, '')}`,
      name: 'Default Development Key'
    });

    await user.save();

    const token = generateToken(user);
    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: userObj
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter email and password.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (user.status === 'deactivated') {
      return res.status(403).json({ success: false, message: 'Your account is deactivated. Please contact Admin.' });
    }

    const token = generateToken(user);
    const userObj = user.toObject();
    delete userObj.password;

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: userObj
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get current user profile
exports.getMe = async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
};

// Create new Developer API Key
exports.createApiKey = async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findById(req.user._id);

    const newKey = {
      key: `certify_live_${uuidv4().replace(/-/g, '')}`,
      name: name || `API Key ${user.apiKeys.length + 1}`
    };

    user.apiKeys.push(newKey);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'API Key generated successfully',
      apiKey: newKey
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete API Key
exports.deleteApiKey = async (req, res) => {
  try {
    const { keyId } = req.params;
    const user = await User.findById(req.user._id);

    user.apiKeys = user.apiKeys.filter((k) => k._id.toString() !== keyId);
    await user.save();

    res.json({
      success: true,
      message: 'API Key removed'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
