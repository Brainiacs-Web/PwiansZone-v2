const express   = require('express');
const router    = express.Router();
const mongoose  = require('mongoose');
const Question  = require('../models/Question');

// 1) GET all questions for a given test & subject
//    GET /api/questions?test=<testId>&subject=<subjectName>
router.get('/', async (req, res) => {
  try {
    const { test, subject } = req.query;
    if (!test || !subject) {
      return res.status(400).json({ error: 'test and subject query params are required' });
    }
    const qs = await Question.find({ test, subject })
                              .sort('createdAt')
                              .lean();
    res.json({ questions: qs });
  } catch (err) {
    console.error('GET /api/questions error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// 2) POST create a new question
//    POST /api/questions
router.post('/', async (req, res) => {
  try {
    const { test, subject, questionType, question, options, correctAnswer, answer, solution } = req.body;
    if (!test || !subject || !questionType) {
      return res.status(400).json({ error: 'test, subject, and questionType are required' });
    }
    const q = new Question({
      test,
      subject,
      questionType,
      question:      question || '',
      options:       options || [],
      correctAnswer: correctAnswer || '',
      answer:        answer || '',
      solution:      solution || ''
    });
    await q.save();
    res.status(201).json(q);
  } catch (err) {
    console.error('POST /api/questions error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// 3) PATCH update a question by its ID
//    PATCH /api/questions/:id
router.patch('/:id', async (req, res) => {
  try {
    const updates = req.body;
    const q = await Question.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    if (!q) return res.status(404).json({ error: 'Question not found' });
    res.json(q);
  } catch (err) {
    console.error('PATCH /api/questions/:id error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// 4) DELETE a question by its ID
//    DELETE /api/questions/:id
router.delete('/:id', async (req, res) => {
  try {
    const q = await Question.findByIdAndDelete(req.params.id);
    if (!q) return res.status(404).json({ error: 'Question not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/questions/:id error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

router.delete('/test/:testId', async (req, res) => {
  await Question.deleteMany({ test: req.params.testId });
  res.json({ success: true });
});

module.exports = router;
