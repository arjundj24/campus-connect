const mongoose = require('mongoose');

const clubRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      trim: true,
      default: ''
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    logoUrl: {
      type: String,
      default: ''
    },
    facultyCoordinator: {
      type: String,
      trim: true,
      default: ''
    },
    studentCoordinator: {
      type: String,
      trim: true,
      default: ''
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    instagramUrl: {
      type: String,
      default: ''
    },
    whatsappLink: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['permission_granted', 'submitted', 'approved', 'rejected'],
      default: 'permission_granted'
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
    createdClub: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ClubRequest', clubRequestSchema);
