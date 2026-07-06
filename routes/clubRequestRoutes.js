const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Club = require('../models/Club');
const ClubRequest = require('../models/ClubRequest');
const Notification = require('../models/Notification');
const ClubMember = require('../models/ClubMember');
const protect = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/assign', protect, authorizeRoles('superadmin'), async function (req, res) {
  try {
    const { studentEmail, message } = req.body;

    if (!studentEmail) {
      return res.status(400).json({
        success: false,
        message: 'Student email is required.'
      });
    }

    const student = await User.findOne({ email: studentEmail.toLowerCase() });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email. Ask the student to create an account first.'
      });
    }

    const existingPendingRequest = await ClubRequest.findOne({
      student: student._id,
      status: { $in: ['permission_granted', 'submitted'] }
    });

    if (existingPendingRequest) {
      return res.status(400).json({
        success: false,
        message: 'This student already has an active club creation request.'
      });
    }

    const clubRequest = await ClubRequest.create({
      student: student._id,
      assignedBy: req.user._id,
      status: 'permission_granted'
    });

    await Notification.create({
      recipient: student._id,
      title: 'Permission to Create a Club',
      message: message || 'You have been given permission to submit details for creating a new club in Campus Connect.',
      type: 'club_permission',
      actionLabel: 'Create Club',
      actionUrl: `create-club.html?requestId=${clubRequest._id}`,
      relatedClubRequest: clubRequest._id
    });

    const populatedRequest = await ClubRequest.findById(clubRequest._id)
      .populate('student', 'name email role')
      .populate('assignedBy', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Club creation permission assigned successfully.',
      clubRequest: populatedRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to assign club creation permission.',
      error: error.message
    });
  }
});

router.get('/my', protect, async function (req, res) {
  try {
    const requests = await ClubRequest.find({ student: req.user._id })
      .populate('assignedBy', 'name email role')
      .populate('approvedBy', 'name email role')
      .populate('createdClub')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      requests: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your club requests.',
      error: error.message
    });
  }
});

router.get('/admin/all', protect, authorizeRoles('superadmin'), async function (req, res) {
  try {
    const requests = await ClubRequest.find()
      .populate('student', 'name email role phone department year rollNumber')
      .populate('assignedBy', 'name email role')
      .populate('approvedBy', 'name email role')
      .populate('createdClub')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      requests: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch club requests.',
      error: error.message
    });
  }
});

router.get('/:id', protect, async function (req, res) {
  try {
    const clubRequest = await ClubRequest.findById(req.params.id)
      .populate('student', 'name email role phone department year rollNumber')
      .populate('assignedBy', 'name email role')
      .populate('approvedBy', 'name email role')
      .populate('createdClub');

    if (!clubRequest) {
      return res.status(404).json({
        success: false,
        message: 'Club request not found.'
      });
    }

    const isOwner = String(clubRequest.student._id) === String(req.user._id);
    const isSuperAdmin = req.user.role === 'superadmin';

    if (!isOwner && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.'
      });
    }

    res.json({
      success: true,
      clubRequest: clubRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch club request.',
      error: error.message
    });
  }
});

router.put('/:id/submit', protect, async function (req, res) {
  try {
    const clubRequest = await ClubRequest.findById(req.params.id);

    if (!clubRequest) {
      return res.status(404).json({
        success: false,
        message: 'Club request not found.'
      });
    }

    if (String(clubRequest.student) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You can submit only your own club request.'
      });
    }

    if (!['permission_granted', 'rejected'].includes(clubRequest.status)) {
      return res.status(400).json({
        success: false,
        message: 'This club request cannot be submitted now.'
      });
    }

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

    clubRequest.name = name;
    clubRequest.description = description;
    clubRequest.logoUrl = logoUrl || '';
    clubRequest.facultyCoordinator = facultyCoordinator || '';
    clubRequest.studentCoordinator = studentCoordinator || req.user.name;
    clubRequest.email = email || req.user.email;
    clubRequest.phone = phone || req.user.phone || '';
    clubRequest.instagramUrl = instagramUrl || '';
    clubRequest.whatsappLink = whatsappLink || '';
    clubRequest.status = 'submitted';
    clubRequest.approvalNote = '';

    await clubRequest.save();

    await Notification.create({
      recipient: clubRequest.assignedBy,
      title: 'New Club Request Submitted',
      message: `${req.user.name} submitted details for creating the club "${name}".`,
      type: 'club_request',
      actionLabel: 'Review Request',
      actionUrl: 'club-requests.html',
      relatedClubRequest: clubRequest._id
    });

    const populatedRequest = await ClubRequest.findById(clubRequest._id)
      .populate('student', 'name email role')
      .populate('assignedBy', 'name email role');

    res.json({
      success: true,
      message: 'Club details submitted for Super Admin approval.',
      clubRequest: populatedRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to submit club request.',
      error: error.message
    });
  }
});

router.patch('/:id/approval', protect, authorizeRoles('superadmin'), async function (req, res) {
  try {
    const { status, approvalNote } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be approved or rejected.'
      });
    }

    const clubRequest = await ClubRequest.findById(req.params.id).populate('student');

    if (!clubRequest) {
      return res.status(404).json({
        success: false,
        message: 'Club request not found.'
      });
    }

    if (clubRequest.status !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Only submitted club requests can be approved or rejected.'
      });
    }

    if (status === 'approved') {
      const club = await Club.create({
        name: clubRequest.name,
        description: clubRequest.description,
        logoUrl: clubRequest.logoUrl,
        facultyCoordinator: clubRequest.facultyCoordinator,
        studentCoordinator: clubRequest.studentCoordinator,
        email: clubRequest.email,
        phone: clubRequest.phone,
        instagramUrl: clubRequest.instagramUrl,
        whatsappLink: clubRequest.whatsappLink
      });

      clubRequest.status = 'approved';
      clubRequest.approvalNote = approvalNote || 'Club approved.';
      clubRequest.approvedBy = req.user._id;
      clubRequest.approvedAt = new Date();
      clubRequest.createdClub = club._id;

      const updatedUser = await User.findByIdAndUpdate(
        clubRequest.student._id,
        {
          role: 'clubadmin',
          club: club._id
        },
        { new: true }
      );

      await ClubMember.create({
        club: club._id,
        user: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone || '',
        department: updatedUser.department || '',
        year: updatedUser.year || '',
        rollNumber: updatedUser.rollNumber || '',
        clubRole: 'club_admin'
      });

      await Notification.create({
        recipient: clubRequest.student._id,
        title: 'Club Approved',
        message: `Your club "${club.name}" has been approved. You are now the Club Admin for this club.`,
        type: 'club_approval',
        actionLabel: 'Open Admin Dashboard',
        actionUrl: 'admin.html',
        relatedClubRequest: clubRequest._id
      });
    } else {
      clubRequest.status = 'rejected';
      clubRequest.approvalNote = approvalNote || 'Club request rejected.';
      clubRequest.approvedBy = req.user._id;
      clubRequest.approvedAt = new Date();

      await Notification.create({
        recipient: clubRequest.student._id,
        title: 'Club Request Rejected',
        message: clubRequest.approvalNote,
        type: 'club_approval',
        actionLabel: 'Edit and Resubmit',
        actionUrl: `create-club.html?requestId=${clubRequest._id}`,
        relatedClubRequest: clubRequest._id
      });
    }

    await clubRequest.save();

    const populatedRequest = await ClubRequest.findById(clubRequest._id)
      .populate('student', 'name email role')
      .populate('assignedBy', 'name email role')
      .populate('approvedBy', 'name email role')
      .populate('createdClub');

    res.json({
      success: true,
      message: `Club request ${status} successfully.`,
      clubRequest: populatedRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update club request approval.',
      error: error.message
    });
  }
});

module.exports = router;
