const express = require('express');
const Notification = require('../models/Notification');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/my', protect, async function (req, res) {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('relatedClubRequest')
      .sort({ createdAt: -1 });

    const unreadCount = notifications.filter(function (notification) {
      return notification.read === false;
    }).length;

    res.json({
      success: true,
      count: notifications.length,
      unreadCount: unreadCount,
      notifications: notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications.',
      error: error.message
    });
  }
});

router.patch('/:id/read', protect, async function (req, res) {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        recipient: req.user._id
      },
      {
        read: true
      },
      {
        new: true
      }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read.',
      notification: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update notification.',
      error: error.message
    });
  }
});

router.patch('/read-all/my', protect, async function (req, res) {
  try {
    await Notification.updateMany(
      { recipient: req.user._id },
      { read: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update notifications.',
      error: error.message
    });
  }
});

module.exports = router;
