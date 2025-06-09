const mongoose = require('mongoose');

const ChapterSchema = new mongoose.Schema({
  test:     { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  subject:  { type: String, required: true },
  chapters: [String]
});

module.exports = mongoose.model('Chapter', ChapterSchema);
