const express = require('express');
const Event = require('../models/Event');
const ClubMember = require('../models/ClubMember');
const protect = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/public', async function (req, res) {
  try {
    const events = await Event.find({
      approvalStatus: 'approved',
      published: true,
      eventStatus: 'upcoming'
    })
      .populate('club')
      .sort({ date: 1, startTime: 1 });

    res.json({
      success: true,
      count: events.length,
      events: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch public events.',
      error: error.message
    });
  }
});

router.get('/admin/all', protect, authorizeRoles('superadmin'), async function (req, res) {
  try {
    const events = await Event.find()
      .populate('club')
      .populate('createdBy', 'name email role')
      .populate('approvedBy', 'name email role')
      .populate('publishedBy', 'name email role')
      .sort({ date: 1, startTime: 1 });

    res.json({
      success: true,
      count: events.length,
      events: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch all events.',
      error: error.message
    });
  }
});

router.get('/admin/club/:clubId', protect, authorizeRoles('superadmin'), async function (req, res) {
  try {
    const events = await Event.find({ club: req.params.clubId })
      .populate('club')
      .populate('createdBy', 'name email role')
      .populate('approvedBy', 'name email role')
      .populate('publishedBy', 'name email role')
      .sort({ date: 1, startTime: 1 });

    res.json({
      success: true,
      count: events.length,
      events: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch club events.',
      error: error.message
    });
  }
});

router.get('/admin/details/:id', protect, authorizeRoles('superadmin'), async function (req, res) {
  try {
    const event = await Event.findById(req.params.id)
      .populate('club')
      .populate('createdBy', 'name email role')
      .populate('approvedBy', 'name email role')
      .populate('publishedBy', 'name email role');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
    }

    res.json({
      success: true,
      event: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event details.',
      error: error.message
    });
  }
});

router.get('/member/club/:clubId', protect, async function (req, res) {
  try {
    const membership = await ClubMember.findOne({
      club: req.params.clubId,
      user: req.user._id,
      isActive: true
    }).populate('club');

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this club.'
      });
    }

    const events = await Event.find({
      club: req.params.clubId,
      approvalStatus: { $in: ['approved'] }
    })
      .populate('club')
      .sort({ date: 1, startTime: 1 });

    res.json({
      success: true,
      membership: membership,
      count: events.length,
      events: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch member club events.',
      error: error.message
    });
  }
});

router.get('/club/my-events', protect, authorizeRoles('clubadmin', 'coordinator'), async function (req, res) {
  try {
    if (!req.user.club) {
      return res.status(400).json({
        success: false,
        message: 'User is not assigned to a club.'
      });
    }

    const clubId = req.user.club._id || req.user.club;

    const events = await Event.find({ club: clubId })
      .populate('club')
      .populate('createdBy', 'name email role')
      .populate('approvedBy', 'name email role')
      .populate('publishedBy', 'name email role')
      .sort({ date: 1, startTime: 1 });

    res.json({
      success: true,
      count: events.length,
      events: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch club events.',
      error: error.message
    });
  }
});

router.get('/manage/details/:id', protect, authorizeRoles('superadmin', 'clubadmin', 'coordinator'), async function (req, res) {
  try {
    const event = await Event.findById(req.params.id)
      .populate('club')
      .populate('createdBy', 'name email role')
      .populate('approvedBy', 'name email role')
      .populate('publishedBy', 'name email role');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
    }

    if (req.user.role !== 'superadmin') {
      if (!req.user.club || String(event.club._id) !== String(req.user.club._id || req.user.club)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can view only your club events.'
        });
      }
    }

    res.json({
      success: true,
      event: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event details.',
      error: error.message
    });
  }
});

router.get('/:id', async function (req, res) {
  try {
    const event = await Event.findById(req.params.id)
      .populate('club')
      .populate('createdBy', 'name email role')
      .populate('approvedBy', 'name email role')
      .populate('publishedBy', 'name email role');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
    }

    if (!(event.approvalStatus === 'approved' && event.published === true)) {
      return res.status(403).json({
        success: false,
        message: 'This event is not publicly available.'
      });
    }

    res.json({
      success: true,
      event: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event.',
      error: error.message
    });
  }
});

router.post('/', protect, authorizeRoles('clubadmin'), async function (req, res) {
  try {
    if (!req.user.club) {
      return res.status(400).json({
        success: false,
        message: 'Club admin is not assigned to a club.'
      });
    }

    const {
      title,
      eventType,
      description,
      rules,
      date,
      startTime,
      endTime,
      venue,
      registrationType,
      minTeamSize,
      maxTeamSize,
      isPaid,
      fee,
      upiId,
      whatsappGroupLink,
      contactEmail,
      contactPhone,
      posterUrl
    } = req.body;

    if (!title || !eventType || !description || !date || !startTime || !endTime || !venue || !registrationType) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required event details.'
      });
    }

    const clubId = req.user.club._id || req.user.club;

    const event = await Event.create({
      club: clubId,
      title: title,
      eventType: eventType,
      description: description,
      rules: rules || '',
      date: date,
      startTime: startTime,
      endTime: endTime,
      venue: venue,
      registrationType: registrationType,
      minTeamSize: minTeamSize || 1,
      maxTeamSize: maxTeamSize || 1,
      isPaid: Boolean(isPaid),
      fee: isPaid ? fee || 0 : 0,
      upiId: isPaid ? upiId || '' : '',
      whatsappGroupLink: whatsappGroupLink || '',
      contactEmail: contactEmail || '',
      contactPhone: contactPhone || '',
      posterUrl: posterUrl || '',
      approvalStatus: 'pending',
      published: false,
      createdBy: req.user._id
    });

    const populatedEvent = await Event.findById(event._id).populate('club');

    res.status(201).json({
      success: true,
      message: 'Event created successfully and sent for approval.',
      event: populatedEvent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create event.',
      error: error.message
    });
  }
});

router.put('/:id', protect, authorizeRoles('clubadmin'), async function (req, res) {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
    }

    const userClubId = String(req.user.club._id || req.user.club);

    if (String(event.club) !== userClubId) {
      return res.status(403).json({
        success: false,
        message: 'You can update only your own club events.'
      });
    }

    if (event.published) {
      return res.status(400).json({
        success: false,
        message: 'Published events cannot be edited in this version.'
      });
    }

    const allowedUpdates = [
      'title',
      'eventType',
      'description',
      'rules',
      'date',
      'startTime',
      'endTime',
      'venue',
      'registrationType',
      'minTeamSize',
      'maxTeamSize',
      'isPaid',
      'fee',
      'upiId',
      'whatsappGroupLink',
      'contactEmail',
      'contactPhone',
      'posterUrl'
    ];

    allowedUpdates.forEach(function (field) {
      if (req.body[field] !== undefined) {
        event[field] = req.body[field];
      }
    });

    event.approvalStatus = 'pending';
    event.approvalNote = '';
    event.approvedBy = null;
    event.approvedAt = null;
    event.published = false;
    event.publishedBy = null;
    event.publishedAt = null;

    await event.save();

    const updatedEvent = await Event.findById(event._id).populate('club');

    res.json({
      success: true,
      message: 'Event updated and sent for approval again.',
      event: updatedEvent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update event.',
      error: error.message
    });
  }
});

router.patch('/:id/approval', protect, authorizeRoles('superadmin'), async function (req, res) {
  try {
    const { approvalStatus, approvalNote } = req.body;

    if (!['approved', 'rejected', 'changes_requested'].includes(approvalStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid approval status.'
      });
    }

    const updateData = {
      approvalStatus: approvalStatus,
      approvalNote: approvalNote || '',
      published: false,
      publishedBy: null,
      publishedAt: null
    };

    if (approvalStatus === 'approved') {
      updateData.approvedBy = req.user._id;
      updateData.approvedAt = new Date();
    } else {
      updateData.approvedBy = null;
      updateData.approvedAt = null;
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('club');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
    }

    res.json({
      success: true,
      message: `Event ${approvalStatus} successfully.`,
      event: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update event approval.',
      error: error.message
    });
  }
});

router.patch('/:id/publish', protect, authorizeRoles('clubadmin'), async function (req, res) {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
    }

    const userClubId = String(req.user.club._id || req.user.club);

    if (String(event.club) !== userClubId) {
      return res.status(403).json({
        success: false,
        message: 'You can publish only your own club events.'
      });
    }

    if (event.approvalStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved events can be published.'
      });
    }

    event.published = true;
    event.publishedBy = req.user._id;
    event.publishedAt = new Date();

    await event.save();

    const publishedEvent = await Event.findById(event._id).populate('club');

    res.json({
      success: true,
      message: 'Event published successfully.',
      event: publishedEvent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to publish event.',
      error: error.message
    });
  }
});

router.patch('/:id/unpublish', protect, authorizeRoles('clubadmin'), async function (req, res) {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
    }

    const userClubId = String(req.user.club._id || req.user.club);

    if (String(event.club) !== userClubId) {
      return res.status(403).json({
        success: false,
        message: 'You can unpublish only your own club events.'
      });
    }

    event.published = false;
    event.publishedBy = null;
    event.publishedAt = null;

    await event.save();

    const unpublishedEvent = await Event.findById(event._id).populate('club');

    res.json({
      success: true,
      message: 'Event unpublished successfully.',
      event: unpublishedEvent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to unpublish event.',
      error: error.message
    });
  }
});

module.exports = router;
