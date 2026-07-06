const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
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
    rollNumber: {
      type: String,
      trim: true,
      default: ''
    },
    department: {
      type: String,
      trim: true,
      default: ''
    },
    year: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { _id: false }
);

const registrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      required: true
    },
    registrationType: {
      type: String,
      enum: ['individual', 'team'],
      required: true
    },
    participant: {
      name: {
        type: String,
        required: true,
        trim: true
      },
      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
      },
      phone: {
        type: String,
        required: true,
        trim: true
      },
      college: {
        type: String,
        required: true,
        trim: true
      },
      department: {
        type: String,
        required: true,
        trim: true
      },
      year: {
        type: String,
        required: true,
        trim: true
      },
      rollNumber: {
        type: String,
        required: true,
        trim: true
      }
    },
    team: {
      teamName: {
        type: String,
        default: ''
      },
      members: {
        type: [teamMemberSchema],
        default: []
      }
    },
    payment: {
      required: {
        type: Boolean,
        default: false
      },
      amount: {
        type: Number,
        default: 0
      },
      transactionId: {
        type: String,
        default: ''
      },
      screenshotUrl: {
        type: String,
        default: ''
      },
      status: {
        type: String,
        enum: ['not_required', 'pending', 'verified', 'rejected'],
        default: 'not_required'
      }
    },
    attendance: {
      present: {
        type: Boolean,
        default: false
      },
      idVerified: {
        type: Boolean,
        default: false
      },
      teamVerified: {
        type: Boolean,
        default: false
      }
    },
    resultStatus: {
      type: String,
      enum: ['participant', 'winner', 'runner_up', 'special_mention'],
      default: 'participant'
    },
    certificateStatus: {
      type: String,
      enum: ['not_issued', 'issued'],
      default: 'not_issued'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Registration', registrationSchema);
