const express = require('express');
const EventAssignment = require('../models/EventAssignment');
const Event = require('../models/Event');
const ClubMember = require('../models/ClubMember');
const protect = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

function getUserClubId(user) {
  return user.club ? String(user.club._id || user.club) : '';
}

async function canAccessEvent(user, event) {
  if (user.role === 'superadmin') return true;
  const clubId = getUserClubId(user);
  return clubId && String(event.club._id || event.club) === clubId;
}

router.get('/my/event/:eventId', protect, async function (req, res) {
  try {
    const event = await Event.findById(req.params.eventId).populate('club');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
    }

    const member = await ClubMember.findOne({
      club: event.club._id,
      user: req.user._id,
      isActive: true
    });

    if (!member) {
      return res.json({
        success: true,
        count: 0,
        event: event,
        assignments: []
      });
    }

    const assignments = await EventAssignment.find({
      event: event._id,
      member: member._id
    })
      .populate('member')
      .populate('event')
      .populate('club')
      .populate('assignedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: assignments.length,
      event: event,
      assignments: assignments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your event assignments.',
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

    const allowed = await canAccessEvent(req.user, event);

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.'
      });
    }

    const assignments = await EventAssignment.find({ event: event._id })
      .populate('member')
      .populate('event')
      .populate('club')
      .populate('assignedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: assignments.length,
      event: event,
      assignments: assignments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event assignments.',
      error: error.message
    });
  }
});

router.post('/', protect, authorizeRoles('clubadmin'), async function (req, res) {
  try {
    const { eventId, memberId, eventRole, taskTitle, taskDescription } = req.body;

    if (!eventId || !memberId || !eventRole || !taskTitle) {
      return res.status(400).json({
        success: false,
        message: 'Event, member, event role, and task title are required.'
      });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
    }

    const clubId = getUserClubId(req.user);

    if (String(event.club) !== clubId) {
      return res.status(403).json({
        success: false,
        message: 'You can assign tasks only for your club events.'
      });
    }

    const member = await ClubMember.findOne({
      _id: memberId,
      club: clubId,
      isActive: true
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Active club member not found.'
      });
    }

    const assignment = await EventAssignment.create({
      event: event._id,
      club: event.club,
      member: member._id,
      assignedBy: req.user._id,
      eventRole: eventRole,
      taskTitle: taskTitle,
      taskDescription: taskDescription || ''
    });

    const populatedAssignment = await EventAssignment.findById(assignment._id)
      .populate('member')
      .populate('event')
      .populate('club')
      .populate('assignedBy', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Task assigned successfully.',
      assignment: populatedAssignment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to assign task.',
      error: error.message
    });
  }
});

router.put('/:id', protect, authorizeRoles('clubadmin'), async function (req, res) {
  try {
    const { eventRole, taskTitle, taskDescription, status } = req.body;
    const clubId = getUserClubId(req.user);

    const assignment = await EventAssignment.findOne({
      _id: req.params.id,
      club: clubId
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found.'
      });
    }

    if (eventRole !== undefined) assignment.eventRole = eventRole;
    if (taskTitle !== undefined) assignment.taskTitle = taskTitle;
    if (taskDescription !== undefined) assignment.taskDescription = taskDescription;
    if (status !== undefined) assignment.status = status;

    await assignment.save();

    const updatedAssignment = await EventAssignment.findById(assignment._id)
      .populate('member')
      .populate('event')
      .populate('club')
      .populate('assignedBy', 'name email role');

    res.json({
      success: true,
      message: 'Assignment updated successfully.',
      assignment: updatedAssignment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update assignment.',
      error: error.message
    });
  }
});

router.delete('/:id', protect, authorizeRoles('clubadmin'), async function (req, res) {
  try {
    const clubId = getUserClubId(req.user);

    const assignment = await EventAssignment.findOneAndDelete({
      _id: req.params.id,
      club: clubId
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found.'
      });
    }

    res.json({
      success: true,
      message: 'Assignment deleted successfully.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete assignment.',
      error: error.message
    });
  }
});

module.exports = router;
