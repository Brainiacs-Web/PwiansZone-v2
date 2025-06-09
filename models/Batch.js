const mongoose = require('mongoose');

const BatchSchema = new mongoose.Schema({
  BatchID:   { type: String, required: true, unique: true },
  name:      { type: String, required: true },
  createdAt: { type: Date,   default: Date.now }
});

module.exports = mongoose.model('Batch', BatchSchema);
