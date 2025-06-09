// routes/tests.js
const express    = require('express');
const router     = express.Router();
const mongoose   = require('mongoose');
const Test       = require('../models/Test');
const Submission = require('../models/Submission');
const { getNextCode } = require('../utils/getNextSequence');

// GET all tests
router.get('/', async (req, res) => {
  const tests = await Test.find().populate('batch').sort('createdAt');
  res.json(tests);
});

// GET test by ID (incl. subjects array for preview)
router.get('/:id', async (req, res) => {
  try {
    const test = await Test.findById(req.params.id).lean();
    if (!test) return res.status(404).json({ error: 'Test not found' });
    // test.subjects should be an array of strings
    res.json(test);
  } catch (err) {
    console.error('GET /api/tests/:id error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST create test
router.post('/', async (req, res) => {
  const { testName, batch, testDuration, subjects, scheduledAt } = req.body;
  const code = await getNextCode('test', 'T');
  const t    = new Test({ code, testName, batch, testDuration, subjects, scheduledAt });
  await t.save();
  res.json(t);
});

// PATCH publish test
router.patch('/:id/publish', async (req, res) => {
  const t = await Test.findByIdAndUpdate(
    req.params.id,
    { published: true, publishedAt: Date.now() },
    { new: true }
  );
  res.json(t);
});

// DELETE a test
router.delete('/:id', async (req, res) => {
  await Test.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// POST submit test responses (unchanged)
router.post('/:id/submit', async (req, res) => {
  try {
    const testId    = req.params.id;
    const { batchName, username, responses } = req.body;
    if (!batchName || !username || !responses) {
      return res.status(400).json({ error: 'batchName, username, and responses are required' });
    }
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ error: 'Test not found' });

    const sub = new Submission({ test: testId, batchName, username, responses });
    await sub.save();
    res.json({ success: true, submissionId: sub._id });
  } catch (err) {
    console.error('Error in POST /api/tests/:id/submit', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET results for a user (unchanged)
router.get('/:id/results', async (req, res) => {
  try {
    const testId = req.params.id;
    const { batchName, username } = req.query;

    if (!batchName || !username) {
      return res.status(400).json({ error: 'batchName and username are required' });
    }
    if (!mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(400).json({ error: 'Invalid test ID' });
    }

    const test = await Test.findById(testId).lean();
    if (!test) return res.status(404).json({ error: 'Test not found' });

    const sub = await Submission.findOne({ test: testId, batchName, username }).lean();
    if (!sub) return res.status(404).json({ error: 'Submission not found for this user' });

    const results = {};
    const Question = require('../models/Question');
    for (const subject of test.subjects) {
      const qs = await Question.find({ test: testId, subject }).lean();
      results[subject] = qs.map(q => ({
        questionId:     String(q._id),
        question:       q.question,
        options:        q.options || [],
        correctAnswer:  q.correctAnswer,
        solution:       q.solution,
        selectedAnswer: sub.responses?.[subject]?.[String(q._id)]?.selectedAnswer || null
      }));
    }

    res.json({
      testName: test.testName,
      subjects: test.subjects,
      results
    });
  } catch (err) {
    console.error('GET /api/tests/:id/results error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tests/code/:code
router.get('/code/:code', async (req, res) => {
  try {
    const test = await Test.findOne({ code: req.params.code }).lean();
    if (!test) return res.status(404).json({ error: 'Test not found' });
    res.json(test);
  } catch (err) {
    console.error('GET /api/tests/code/:code error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
