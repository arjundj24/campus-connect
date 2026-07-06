const express = require('express');
const Club = require('../models/Club');
const User = require('../models/User');
const protect = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', async function (req, res) {
  try {
    const clubs = await Club.find({ isActive: true }).sort({ name: 1 });

    res.json({
      success: true,
      count: clubs.length,
      clubs: clubs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clubs.',
      error: error.message
    });
  }
});

router.get('/admin/all', protect, authorizeRoles('superadmin'), async function (req, res) {
  try {
    const clubs = await Club.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: clubs.length,
      clubs: clubs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch all clubs.',
      error: error.message
    });
  }
});

router.get('/admin/:id', protect, authorizeRoles('superadmin'), async function (req, res) {
  try {
    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found.'
      });
    }

    res.json({
      success: true,
      club: club
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch club.',
      error: error.message
    });
  }
});

router.get('/:id', async function (req, res) {
  try {
    const club = await Club.findById(req.params.id);

    if (!club || !club.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Club not found.'
      });
    }

    res.json({
      success: true,
      club: club
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch club.',
      error: error.message
    });
  }
});

router.post('/', protect, authorizeRoles('superadmin'), async function (req, res) {
  try {
    const {
      name,
      description,
      logoUrl,
      facultyCoordinator,
      studentCoordinator,
      email,
      phone,
      instagramUrl,
      whatsappLink
    } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: 'Club name and description are required.'
      });
    }

    const existingClub = await Club.findOne({ name: name });

    if (existingClub) {
      return res.status(400).json({
        success: false,
        message: 'A club with this name already exists.'
      });
    }

    const club = await Club.create({
      name: name,
      description: description,
      logoUrl: logoUrl || '',
      facultyCoordinator: facultyCoordinator || '',
      studentCoordinator: studentCoordinator || '',
      email: email || '',
      phone: phone || '',
      instagramUrl: instagramUrl || '',
      whatsappLink: whatsappLink || ''
    });

    res.status(201).json({
      success: true,
      message: 'Club created successfully.',
      club: club
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create club.',
      error: error.message
    });
  }
});

router.put('/:id', protect, authorizeRoles('superadmin'), async function (req, res) {
  try {
    const {
      name,
      description,
      logoUrl,
      facultyCoordinator,
      studentCoordinator,
      email,
      phone,
      instagramUrl,
      whatsappLink
    } = req.body;

    const club = await Club.findByIdAndUpdate(
      req.params.id,
      {
        name: name,
        description: description,
        logoUrl: logoUrl || '',
        facultyCoordinator: facultyCoordinator || '',
        studentCoordinator: studentCoordinator || '',
        email: email || '',
        phone: phone || '',
        instagramUrl: instagramUrl || '',
        whatsappLink: whatsappLink || ''
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found.'
      });
    }

    res.json({
      success: true,
      message: 'Club updated successfully.',
      club: club
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update club.',
      error: error.message
    });
  }
});

router.patch('/:id/status', protect, authorizeRoles('superadmin'), async function (req, res) {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be true or false.'
      });
    }

    const club = await Club.findByIdAndUpdate(
      req.params.id,
      { isActive: isActive },
      { new: true }
    );

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found.'
      });
    }

    if (isActive === false) {
      await User.updateMany({ club: club._id }, { isActive: false });
    }

    res.json({
      success: true,
      message: isActive ? 'Club activated successfully.' : 'Club deactivated successfully.',
      club: club
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update club status.',
      error: error.message
    });
  }
});

module.exports = router;
