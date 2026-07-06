const mongoose = require('mongoose');

const eventAssignmentSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      required: true
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClubMember',
      required: true
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    eventRole: {
      type: String,
      required: true,
      trim: true
    },
    taskTitle: {
      type: String,
      required: true,
      trim: true
    },
    taskDescription: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['assigned', 'in_progress', 'completed'],
      default: 'assigned'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('EventAssignment', eventAssignmentSchema);
