const express = require('express');
const router  = express.Router();
const Chapter = require('../models/Chapter');

// GET chapters for a given test & subject
router.get('/:testId/:subject', async (req, res) => {
  const ch = await Chapter.findOne({
    test: req.params.testId,
    subject: req.params.subject
  });
  res.json(ch || { chapters: [] });
});

// POST add (or upsert) a chapter
router.post('/', async (req, res) => {
  const { test, subject, name } = req.body;
  const ch = await Chapter.findOneAndUpdate(
    { test, subject },
    { $addToSet: { chapters: name } },
    { new: true, upsert: true }
  );
  res.json(ch);
});

module.exports = router;
