// utils/getNextSequence.js

const Counter = require('../models/Counter');

async function getNextCode(name, prefix = '') {
  const counter = await Counter.findOneAndUpdate(
    { name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const number = String(counter.seq).padStart(3, '0'); // "003"
  return `${prefix}${number}`; // e.g. "B003"
}

module.exports = { getNextCode };
