// routes/testSeries.js
const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
const Test     = require('../models/Test');
const Chapter  = require('../models/Chapter');
const Question = require('../models/Question');

// GET /api/testSeries/:id
// Returns { testName, subjects, chapters: {...}, questions: {...} }
router.get('/:id', async (req, res) => {
  try {
    const testId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(400).json({ error: 'Invalid test ID' });
    }

    // 1) Fetch test doc
    const test = await Test.findById(testId).lean();
    if (!test) return res.status(404).json({ error: 'Test not found' });

    // 2) Fetch all Chapter docs for this test
    const chapterDocs = await Chapter.find({ test: testId }).lean();
    const chaptersBySubject = {};
    chapterDocs.forEach(cd => {
      chaptersBySubject[cd.subject] = cd.chapters || [];
    });
    // ensure every subject has an array
    test.subjects.forEach(sub => {
      if (!chaptersBySubject[sub]) chaptersBySubject[sub] = [];
    });

    // 3) Fetch all Question docs for this test
    const questionDocs = await Question.find({ test: testId }).lean();
    const questionsBySubject = {};
    questionDocs.forEach(q => {
      const subj = q.subject;
      if (!questionsBySubject[subj]) questionsBySubject[subj] = {};
      questionsBySubject[subj][q._id] = {
        questionId:     String(q._id),
        question:       q.question,
        questionType:   q.questionType,
        options:        q.options,
        correctAnswer:  q.correctAnswer,
        solution:       q.solution,
        addedAt:        q.addedAt,
        // NOTE: if you later add a `chapter` field to Question,
        // you can return it here:
        chapter:        q.chapter || null
      };
    });
    // ensure empty object for any subject with no questions yet
    test.subjects.forEach(sub => {
      if (!questionsBySubject[sub]) questionsBySubject[sub] = {};
    });

    // 4) Send it back
    res.json({
      testName:  test.testName,
      subjects:  test.subjects,
      chapters:  chaptersBySubject,
      questions: questionsBySubject
    });

  } catch (err) {
    console.error('GET /api/testSeries/:id error', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
