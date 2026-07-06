const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Club = require('../models/Club');
const protect = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

function createToken(userId) {
  return jwt.sign(
    { userId: userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function formatUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    club: user.club || null,
    phone: user.phone || '',
    college: user.college || '',
    department: user.department || '',
    year: user.year || '',
    rollNumber: user.rollNumber || ''
  };
}

router.post('/signup', async function (req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.'
      });
    }

    const existingUser = await User.findOne({ email: email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account already exists with this email.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name,
      email: email,
      password: hashedPassword,
      role: 'student',
      club: null
    });

    const token = createToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Signup successful.',
      token: token,
user: formatUser(user)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Signup failed.',
      error: error.message
    });
  }
});

router.post('/login', async function (req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.'
      });
    }

    const user = await User.findOne({ email: email }).select('+password').populate('club');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = createToken(user._id);

    res.json({
      success: true,
      message: 'Login successful.',
      token: token,
user: formatUser(user)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed.',
      error: error.message
    });
  }
});

router.get('/me', protect, function (req, res) {
  res.json({
    success: true,
user: formatUser(req.user)
  });
});


router.patch('/profile', protect, async function (req, res) {
  try {
    if (!['student', 'clubadmin', 'coordinator', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this profile.'
      });
    }

    const { name, phone, college, department, year, rollNumber } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        name: name || req.user.name,
        phone: phone || '',
        college: college || '',
        department: department || '',
        year: year || '',
        rollNumber: rollNumber || ''
      },
      { new: true, runValidators: true }
    ).populate('club');

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: formatUser(user)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile.',
      error: error.message
    });
  }
});

router.get('/users', protect, authorizeRoles('superadmin'), async function (req, res) {
  try {
    const users = await User.find().populate('club').sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      users: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users.',
      error: error.message
    });
  }
});

router.patch('/users/:id/status', protect, authorizeRoles('superadmin'), async function (req, res) {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be true or false.'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: isActive },
      { new: true }
    ).populate('club');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    res.json({
      success: true,
      message: isActive ? 'User activated successfully.' : 'User deactivated successfully.',
      user: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update user status.',
      error: error.message
    });
  }
});

router.post('/create-user', protect, authorizeRoles('superadmin'), async function (req, res) {
  try {
    const { name, email, password, role, club } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, and role.'
      });
    }

    if (!['superadmin', 'clubadmin', 'coordinator'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role.'
      });
    }

    if ((role === 'clubadmin' || role === 'coordinator') && !club) {
      return res.status(400).json({
        success: false,
        message: 'Club is required for club admins and coordinators.'
      });
    }

    if (club) {
      const clubExists = await Club.findById(club);

      if (!clubExists) {
        return res.status(404).json({
          success: false,
          message: 'Club not found.'
        });
      }
    }

    const existingUser = await User.findOne({ email: email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name,
      email: email,
      password: hashedPassword,
      role: role,
      club: role === 'superadmin' ? null : club
    });

    const populatedUser = await User.findById(user._id).populate('club');

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
user: formatUser(populatedUser)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create user.',
      error: error.message
    });
  }
});

module.exports = router;
