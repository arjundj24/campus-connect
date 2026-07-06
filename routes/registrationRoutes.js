const express = require('express');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const protect = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

async function canManageEvent(user, event) {
  if (user.role === 'superadmin') {
    return true;
  }

  if (!user.club) {
    return false;
  }

  const userClubId = String(user.club._id || user.club);
  return String(event.club._id || event.club) === userClubId;
}

router.post('/events/:eventId', protect, async function (req, res) {
  try {
    if (!['student', 'clubadmin', 'coordinator', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only logged-in Campus Connect users can register for events.'
      });
    }
    const event = await Event.findById(req.params.eventId).populate('club');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
    }

    if (!(event.approvalStatus === 'approved' && event.published === true && event.eventStatus === 'upcoming')) {
      return res.status(400).json({
        success: false,
        message: 'Registration is not open for this event.'
      });
    }

    const {
      registrationType,
      participant,
      team,
      transactionId,
      screenshotUrl
    } = req.body;

    if (!registrationType || !['individual', 'team'].includes(registrationType)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid registration type.'
      });
    }

    if (event.registrationType === 'individual' && registrationType !== 'individual') {
      return res.status(400).json({
        success: false,
        message: 'This event allows only individual registration.'
      });
    }

    if (event.registrationType === 'team' && registrationType !== 'team') {
      return res.status(400).json({
        success: false,
        message: 'This event allows only team registration.'
      });
    }

    if (!participant || !participant.name || !participant.email || !participant.phone || !participant.college || !participant.department || !participant.year || !participant.rollNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all participant details.'
      });
    }

    if (registrationType === 'team') {
      if (!team || !team.teamName || !team.members || team.members.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please provide team name and team members.'
        });
      }

      const totalTeamSize = team.members.length + 1;

      if (totalTeamSize < event.minTeamSize || totalTeamSize > event.maxTeamSize) {
        return res.status(400).json({
          success: false,
          message: `Team size must be between ${event.minTeamSize} and ${event.maxTeamSize}.`
        });
      }
    }

    const existingRegistration = await Registration.findOne({
      event: event._id,
      'participant.email': participant.email
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'This email is already registered for the event.'
      });
    }

    const registration = await Registration.create({
      event: event._id,
      user: req.user._id,
      club: event.club._id,
      registrationType: registrationType,
      participant: participant,
      team: registrationType === 'team' ? {
        teamName: team.teamName,
        members: team.members
      } : {
        teamName: '',
        members: []
      },
      payment: {
        required: event.isPaid,
        amount: event.isPaid ? event.fee : 0,
        transactionId: event.isPaid ? transactionId || '' : '',
        screenshotUrl: event.isPaid ? screenshotUrl || '' : '',
        status: event.isPaid ? 'pending' : 'not_required'
      }
    });

    const populatedRegistration = await Registration.findById(registration._id)
      .populate('event')
      .populate('club');

    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully.',
      registration: populatedRegistration
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to submit registration.',
      error: error.message
    });
  }
});

router.get('/event/:eventId', protect, authorizeRoles('superadmin', 'clubadmin', 'coordinator'), async function (req, res) {
  try {
    const event = await Event.findById(req.params.eventId).populate('club');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
    }

    const allowed = await canManageEvent(req.user, event);

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can view only registrations related to your club.'
      });
    }

    const registrations = await Registration.find({ event: event._id })
      .populate('event')
      .populate('club')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: registrations.length,
      registrations: registrations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event registrations.',
      error: error.message
    });
  }
});

router.get('/my-registrations', protect, authorizeRoles('student', 'clubadmin', 'coordinator', 'superadmin'), async function (req, res) {
  try {
    const registrations = await Registration.find({
      $or: [
        { user: req.user._id },
        { 'participant.email': req.user.email }
      ]
    })
      .populate('event')
      .populate('club')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: registrations.length,
      registrations: registrations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your registrations.',
      error: error.message
    });
  }
});

router.get('/my-club', protect, authorizeRoles('clubadmin', 'coordinator'), async function (req, res) {
  try {
    if (!req.user.club) {
      return res.status(400).json({
        success: false,
        message: 'User is not assigned to a club.'
      });
    }

    const clubId = req.user.club._id || req.user.club;

    const registrations = await Registration.find({ club: clubId })
      .populate('event')
      .populate('club')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: registrations.length,
      registrations: registrations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch club registrations.',
      error: error.message
    });
  }
});

router.get('/admin/all', protect, authorizeRoles('superadmin'), async function (req, res) {
  try {
    const registrations = await Registration.find()
      .populate('event')
      .populate('club')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: registrations.length,
      registrations: registrations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch registrations.',
      error: error.message
    });
  }
});

router.patch('/:id/payment', protect, authorizeRoles('superadmin', 'clubadmin', 'coordinator'), async function (req, res) {
  try {
    const { status } = req.body;

    if (!['pending', 'verified', 'rejected', 'not_required'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status.'
      });
    }

    const registration = await Registration.findById(req.params.id).populate('event').populate('club');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found.'
      });
    }

    const allowed = await canManageEvent(req.user, registration.event);

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.'
      });
    }

    registration.payment.status = status;
    await registration.save();

    res.json({
      success: true,
      message: 'Payment status updated successfully.',
      registration: registration
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update payment status.',
      error: error.message
    });
  }
});

router.patch('/:id/attendance', protect, authorizeRoles('superadmin', 'clubadmin', 'coordinator'), async function (req, res) {
  try {
    const { present, idVerified, teamVerified } = req.body;

    const registration = await Registration.findById(req.params.id).populate('event').populate('club');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found.'
      });
    }

    const allowed = await canManageEvent(req.user, registration.event);

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.'
      });
    }

    if (typeof present === 'boolean') {
      registration.attendance.present = present;
    }

    if (typeof idVerified === 'boolean') {
      registration.attendance.idVerified = idVerified;
    }

    if (typeof teamVerified === 'boolean') {
      registration.attendance.teamVerified = teamVerified;
    }

    await registration.save();

    res.json({
      success: true,
      message: 'Attendance updated successfully.',
      registration: registration
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update attendance.',
      error: error.message
    });
  }
});

router.patch('/:id/result', protect, authorizeRoles('superadmin', 'clubadmin'), async function (req, res) {
  try {
    const { resultStatus, certificateStatus } = req.body;

    const registration = await Registration.findById(req.params.id).populate('event').populate('club');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found.'
      });
    }

    const allowed = await canManageEvent(req.user, registration.event);

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.'
      });
    }

    if (resultStatus && ['participant', 'winner', 'runner_up', 'special_mention'].includes(resultStatus)) {
      registration.resultStatus = resultStatus;
    }

    if (certificateStatus && ['not_issued', 'issued'].includes(certificateStatus)) {
      registration.certificateStatus = certificateStatus;
    }

    await registration.save();

    res.json({
      success: true,
      message: 'Result/certificate status updated successfully.',
      registration: registration
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update result status.',
      error: error.message
    });
  }
});

module.exports = router;
