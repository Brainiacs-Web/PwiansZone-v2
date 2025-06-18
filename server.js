// server.js
require('dotenv').config();

const express  = require('express');
const mongoose = require('mongoose');
const path     = require('path');
const cors     = require('cors');

const batchesRouter     = require('./routes/batches');
const testsRouter       = require('./routes/tests');
const questionsRouter   = require('./routes/questions');
const chaptersRouter    = require('./routes/chapters');
const testSeriesRouter  = require('./routes/testSeries');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Mount your existing API routes
app.use('/api/batches',    batchesRouter);
app.use('/api/tests',      testsRouter);
app.use('/api/questions',  questionsRouter);
app.use('/api/chapters',   chaptersRouter);
app.use('/api/testSeries', testSeriesRouter);


// === Submission Analytics Model & Routes ===

// Inline Submission model (or move to models/Submission.js)
const Submission = mongoose.model('Submission', new mongoose.Schema({
  test:       mongoose.Schema.Types.ObjectId,
  batchName:  String,
  username:   String,
  responses:  Object,
  createdAt:  { type: Date, default: Date.now }
}));

// Helper to build aggregation pipeline
const groupByTime = (unit) => {
  const backMs = {
    hour: 24 * 60 * 60 * 1000,     // last 24 hours
    day:  30 * 24 * 60 * 60 * 1000 // last 30 days
  };
  const fmt = unit === 'hour' ? '%Y-%m-%d %H:00' : '%Y-%m-%d';
  const range = unit === 'hour' ? backMs.hour : backMs.day;

  return [
    { $match: { createdAt: { $gte: new Date(Date.now() - range) } } },
    {
      $group: {
        _id: { $dateToString: { format: fmt, date: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ];
};

// Hourly: last 24h
app.get('/api/submissions/hourly', async (req, res) => {
  try {
    const data = await Submission.aggregate(groupByTime('hour'));
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching hourly submissions');
  }
});

// Weekly: last 7 days (daily buckets)
app.get('/api/submissions/weekly', async (req, res) => {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const data = await Submission.aggregate([
      { $match: { createdAt: { $gte: oneWeekAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching weekly submissions');
  }
});

// Monthly: last 30 days (daily buckets)
app.get('/api/submissions/monthly', async (req, res) => {
  try {
    const data = await Submission.aggregate(groupByTime('day'));
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching monthly submissions');
  }
});


// === Serve your stats.html ===
// Now http://<host>:<port>/stats will send stats.html
app.get('/stats', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'stats.html'));
});


// Start Server
const PORT = process.env.PORT || 3000;
console.log(`Binding server to 0.0.0.0 on port ${PORT}`);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
