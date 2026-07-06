const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['club_permission', 'club_request', 'club_approval', 'general'],
      default: 'general'
    },
    actionLabel: {
      type: String,
      default: ''
    },
    actionUrl: {
      type: String,
      default: ''
    },
    relatedClubRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClubRequest',
      default: null
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
