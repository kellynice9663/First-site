const User = require('../models/UserModel');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const dotenv = require('dotenv');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '30d', // Token expires in 30 days
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
        twoFactorEnabled: user.twoFactorEnabled,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  try {
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      if (user.twoFactorEnabled && user.twoFactorSecret) {
        // If 2FA is enabled, don't send token immediately.
        // Send a temporary token or a flag indicating 2FA is required.
        // For simplicity here, we'll send a message.
        // A more robust solution would involve a temporary signed token for the 2FA step.
        return res.status(200).json({
          message: '2FA required. Please verify.',
          userId: user._id, // Send userId to use in the /verify-2fa step
          twoFactorRequired: true,
        });
      }

      // If 2FA is not enabled, log in directly
      res.json({
        _id: user._id,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
        twoFactorEnabled: user.twoFactorEnabled,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Setup 2FA for a user
// @route   POST /api/auth/setup-2fa
// @access  Private (requires JWT)
const setupTwoFactorAuth = async (req, res) => {
  // req.user will be available if using a JWT auth middleware
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.twoFactorEnabled) {
        return res.status(400).json({ message: '2FA is already enabled for this account.' });
    }

    const secret = speakeasy.generateSecret({
      name: `BitcoinPlatform (${user.email})`,
    });

    user.twoFactorSecret = secret.base32;
    await user.save();

    qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
      if (err) {
        console.error('Error generating QR code:', err);
        return res.status(500).json({ message: 'Error generating QR code' });
      }
      res.json({
        message: '2FA setup initiated. Scan QR code and verify.',
        secret: secret.base32, // Send secret for manual entry if QR fails
        qrCodeUrl: data_url,
        // otpAuthUrl: secret.otpauth_url // For direct import into authenticator apps
      });
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ message: 'Server error during 2FA setup' });
  }
};

// @desc    Verify 2FA token and enable 2FA OR complete login
// @route   POST /api/auth/verify-2fa
// @access  Private (for enabling) / Public (with userId for login)
const verifyTwoFactorAuth = async (req, res) => {
  const { token: twoFactorToken, userId } = req.body; // userId is for login flow, req.user.id for enabling flow

  if (!twoFactorToken) {
    return res.status(400).json({ message: 'Please provide 2FA token' });
  }

  const idForUserLookup = req.user ? req.user.id : userId;

  if (!idForUserLookup) {
      return res.status(400).json({ message: 'User identifier not found.' });
  }

  try {
    const user = await User.findById(idForUserLookup);
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ message: '2FA not set up or user not found' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: twoFactorToken,
      window: 1, // Allow for a 30-second window variance
    });

    if (verified) {
      // If this is part of the enabling 2FA flow
      if (req.user && !user.twoFactorEnabled) {
        user.twoFactorEnabled = true;
        await user.save();
        return res.json({
            message: '2FA enabled successfully!',
            token: generateToken(user._id), // Issue a new token now that 2FA is part of the identity
         });
      }
      // If this is part of the login flow
      else if (userId) {
        return res.json({
          _id: user._id,
          email: user.email,
          role: user.role,
          token: generateToken(user._id),
          twoFactorEnabled: user.twoFactorEnabled,
        });
      }
      // Should not happen, but as a fallback
      return res.status(400).json({ message: 'Invalid 2FA verification context.' });

    } else {
      res.status(401).json({ message: 'Invalid 2FA token' });
    }
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ message: 'Server error during 2FA verification' });
  }
};


// @desc    Disable 2FA for a user
// @route   POST /api/auth/disable-2fa
// @access  Private (requires JWT and current 2FA token)
const disableTwoFactorAuth = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
    const { token: twoFactorToken } = req.body;
    if (!twoFactorToken) {
        return res.status(400).json({ message: 'Please provide your current 2FA token to disable it.' });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.twoFactorEnabled || !user.twoFactorSecret) {
            return res.status(400).json({ message: '2FA is not currently enabled for this account.' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: twoFactorToken,
            window: 1,
        });

        if (verified) {
            user.twoFactorEnabled = false;
            user.twoFactorSecret = undefined; // Remove the secret
            await user.save();
            res.json({ message: '2FA disabled successfully.' });
        } else {
            res.status(401).json({ message: 'Invalid 2FA token. Disabling failed.' });
        }
    } catch (error) {
        console.error('Disable 2FA error:', error);
        res.status(500).json({ message: 'Server error during 2FA disable' });
    }
};


// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  // req.user should be set by the auth middleware
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  try {
    const user = await User.findById(req.user.id).select('-password -twoFactorSecret'); // Exclude sensitive fields
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};


module.exports = {
  registerUser,
  loginUser,
  setupTwoFactorAuth,
  verifyTwoFactorAuth,
  disableTwoFactorAuth,
  getUserProfile,
};
