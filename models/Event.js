const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    eventType: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    rules: {
      type: String,
      default: ''
    },
    date: {
      type: String,
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    venue: {
      type: String,
      required: true,
      trim: true
    },
    registrationType: {
      type: String,
      enum: ['individual', 'team', 'both'],
      required: true
    },
    minTeamSize: {
      type: Number,
      default: 1
    },
    maxTeamSize: {
      type: Number,
      default: 1
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    fee: {
      type: Number,
      default: 0
    },
    upiId: {
      type: String,
      default: ''
    },
    whatsappGroupLink: {
      type: String,
      default: ''
    },
    contactEmail: {
      type: String,
      default: ''
    },
    contactPhone: {
      type: String,
      default: ''
    },
    posterUrl: {
      type: String,
      default: ''
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'changes_requested'],
      default: 'pending'
    },
    approvalNote: {
      type: String,
      default: ''
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    published: {
      type: Boolean,
      default: false
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    publishedAt: {
      type: Date,
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    eventStatus: {
      type: String,
      enum: ['upcoming', 'completed', 'cancelled'],
      default: 'upcoming'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Event', eventSchema);
