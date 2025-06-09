// models/Submission.js
const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  batchName: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  // responses is a nested object: responses[subject][questionId] = { questionId, selectedAnswer }
  responses: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Submission', SubmissionSchema);
