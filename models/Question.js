const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  test:          { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  subject:       { type: String, required: true },
  question:      { type: String, default: '' },
  questionType:  { type: String, enum: ['MCQ','Integer'], required: true },
  options:       { type: [String], default: [] },
  correctAnswer: { type: String, default: '' },
  answer:        { type: String, default: '' },       // for integer-type
  solution:      { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Question', QuestionSchema);
