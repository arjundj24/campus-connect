const express = require('express');
const ClubMember = require('../models/ClubMember');
const User = require('../models/User');
const protect = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

function getUserClubId(user) {
  return user.club ? String(user.club._id || user.club) : '';
}

router.get('/my-memberships', protect, async function (req, res) {
  try {
    const memberships = await ClubMember.find({
      user: req.user._id,
      isActive: true
    })
      .populate('user', 'name email role')
      .populate('club')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: memberships.length,
      memberships: memberships
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your club memberships.',
      error: error.message
    });
  }
});

router.get('/my-club', protect, authorizeRoles('clubadmin', 'coordinator'), async function (req, res) {
  try {
    const clubId = getUserClubId(req.user);

    if (!clubId) {
      return res.status(400).json({
        success: false,
        message: 'User is not assigned to a club.'
      });
    }

    const members = await ClubMember.find({ club: clubId })
      .populate('user', 'name email role')
      .populate('club')
      .sort({ clubRole: 1, name: 1 });

    res.json({
      success: true,
      count: members.length,
      members: members
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch club members.',
      error: error.message
    });
  }
});

router.get('/admin/club/:clubId', protect, authorizeRoles('superadmin'), async function (req, res) {
  try {
    const members = await ClubMember.find({ club: req.params.clubId })
      .populate('user', 'name email role')
      .populate('club')
      .sort({ clubRole: 1, name: 1 });

    res.json({
      success: true,
      count: members.length,
      members: members
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch club members.',
      error: error.message
    });
  }
});

router.post('/', protect, authorizeRoles('clubadmin'), async function (req, res) {
  try {
    const clubId = getUserClubId(req.user);

    if (!clubId) {
      return res.status(400).json({
        success: false,
        message: 'Club admin is not assigned to a club.'
      });
    }

    const { email, clubRole } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Member email is required.'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No Campus Connect user found with this email. Ask the student to create an account first.'
      });
    }

    const existingMember = await ClubMember.findOne({
      club: clubId,
      email: user.email
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'This user is already a member of your club.'
      });
    }

    const member = await ClubMember.create({
      club: clubId,
      user: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      department: user.department || '',
      year: user.year || '',
      rollNumber: user.rollNumber || '',
      clubRole: clubRole || 'member'
    });

    const populatedMember = await ClubMember.findById(member._id)
      .populate('user', 'name email role')
      .populate('club');

    res.status(201).json({
      success: true,
      message: 'Club member added successfully.',
      member: populatedMember
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This user is already a member of this club.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to add club member.',
      error: error.message
    });
  }
});

router.patch('/:id/role', protect, authorizeRoles('clubadmin'), async function (req, res) {
  try {
    const clubId = getUserClubId(req.user);
    const { clubRole } = req.body;

    if (!clubRole) {
      return res.status(400).json({
        success: false,
        message: 'Club role is required.'
      });
    }

    const member = await ClubMember.findOneAndUpdate(
      {
        _id: req.params.id,
        club: clubId
      },
      {
        clubRole: clubRole
      },
      {
        new: true,
        runValidators: true
      }
    ).populate('user', 'name email role').populate('club');

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Club member not found.'
      });
    }

    res.json({
      success: true,
      message: 'Club member role updated successfully.',
      member: member
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update member role.',
      error: error.message
    });
  }
});

router.patch('/:id/status', protect, authorizeRoles('clubadmin'), async function (req, res) {
  try {
    const clubId = getUserClubId(req.user);
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be true or false.'
      });
    }

    const member = await ClubMember.findOneAndUpdate(
      {
        _id: req.params.id,
        club: clubId
      },
      {
        isActive: isActive
      },
      {
        new: true
      }
    ).populate('user', 'name email role').populate('club');

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Club member not found.'
      });
    }

    res.json({
      success: true,
      message: isActive ? 'Member activated successfully.' : 'Member deactivated successfully.',
      member: member
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update member status.',
      error: error.message
    });
  }
});

module.exports = router;
