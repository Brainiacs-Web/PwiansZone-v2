const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Test = require('../models/Test');
const Submission = require('../models/Submission');
const { getNextCode } = require('../utils/getNextSequence');

// GET all tests
router.get('/', async (req, res) => {
  const tests = await Test.find().populate('batch').sort('createdAt');
  res.json(tests);
});

// GET test by ID
router.get('/:id', async (req, res) => {
  try {
    const test = await Test.findById(req.params.id).lean();
    if (!test) return res.status(404).json({ error: 'Test not found' });
    res.json(test);
  } catch (err) {
    console.error('GET /api/tests/:id error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST create test
router.post('/', async (req, res) => {
  const { testName, batch, testDuration, subjects, subjectDocs, scheduledAt } = req.body;
  const code = await getNextCode('test', 'T');
  const test = new Test({
    code,
    testName,
    batch,
    testDuration,
    subjects,
    subjectDocs,
    scheduledAt
  });
  await test.save();
  res.json(test);
});

// PATCH publish test
router.patch('/:id/publish', async (req, res) => {
  const test = await Test.findByIdAndUpdate(
    req.params.id,
    { published: true, publishedAt: Date.now() },
    { new: true }
  );
  res.json(test);
});

// DELETE test
router.delete('/:id', async (req, res) => {
  await Test.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// POST submit test responses
router.post('/:id/submit', async (req, res) => {
  try {
    const { batchName, username, responses } = req.body;
    if (!batchName || !username || !responses) {
      return res.status(400).json({ error: 'batchName, username, and responses are required' });
    }

    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ error: 'Test not found' });

    const existing = await Submission.findOne({ test: test._id, batchName, username });
    if (existing) {
      return res.status(400).json({ error: 'Test already submitted by this user' });
    }

    const submission = new Submission({ test: test._id, batchName, username, responses });
    await submission.save();

    res.json({ success: true, submissionId: submission._id });
  } catch (err) {
    console.error('Error in POST /api/tests/:id/submit', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET results for a user
router.get('/:id/results', async (req, res) => {
  try {
    const { batchName, username } = req.query;
    const testId = req.params.id;

    if (!batchName || !username) {
      return res.status(400).json({ error: 'batchName and username are required' });
    }
    if (!mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(400).json({ error: 'Invalid test ID' });
    }

    // Load test and submission
    const [test, submission] = await Promise.all([
      Test.findById(testId).lean(),
      Submission.findOne({ test: testId, batchName, username }).lean()
    ]);

    if (!test) return res.status(404).json({ error: 'Test not found' });
    if (!submission) return res.status(404).json({ error: 'Submission not found' });

    const results = {};
    const allQuestionIds = [];

    // Collect all questionIds from submission
    for (const subjectName in submission.responses) {
      const subjectResponses = submission.responses[subjectName];
      for (const questionId in subjectResponses) {
        allQuestionIds.push(questionId);
      }
    }

    // Fetch all Question docs in one go
    const questionDocs = await Question.find({ _id: { $in: allQuestionIds } }).lean();
    const questionMap = {};
    questionDocs.forEach(q => questionMap[q._id.toString()] = q);

    // Build structured result
    for (const subjectName in submission.responses) {
      const subjectResults = [];
      const subjectResponses = submission.responses[subjectName];

      for (const questionId in subjectResponses) {
        const qDoc = questionMap[questionId] || {};
        const selectedAnswer = subjectResponses[questionId]?.selectedAnswer ?? null;

        subjectResults.push({
          questionId,
          question: qDoc.question || '',
          questionImage: qDoc.questionImage || '',
          options: qDoc.options || [],
          correctAnswer: qDoc.questionType === 'MCQ' ? qDoc.correctAnswer : qDoc.answer,
          selectedAnswer,
          solution: qDoc.solution || 'No solution provided.',
          solutionImage: qDoc.solutionImage || ''
        });
      }

      results[subjectName] = subjectResults;
    }

    return res.json({
      testName: test.testName,
      subjects: Object.keys(results),
      results
    });

  } catch (err) {
    console.error('GET /api/tests/:id/results error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET test by code
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
