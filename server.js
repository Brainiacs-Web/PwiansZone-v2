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

// Route Mounts
app.use('/api/batches',    batchesRouter);
app.use('/api/tests',      testsRouter);
app.use('/api/questions',  questionsRouter);
app.use('/api/chapters',   chaptersRouter);
app.use('/api/testSeries', testSeriesRouter);

// === Submissions Analytics API ===
const Submission = mongoose.model('Submission', new mongoose.Schema({
  test: mongoose.Schema.Types.ObjectId,
  batchName: String,
  username: String,
  responses: Object,
  createdAt: {
    type: Date,
    default: Date.now
  }
}));

const groupByTime = (unit) => {
  const durationMap = {
    hour: 24 * 60 * 60 * 1000,   // last 24 hrs
    day: 30 * 24 * 60 * 60 * 1000 // last 30 days
  };

  const format = unit === 'hour' ? "%Y-%m-%d %H:00" : "%Y-%m-%d";
  const rangeMs = unit === 'hour' ? durationMap.hour : durationMap.day;

  return [
    {
      $match: {
        createdAt: {
          $gte: new Date(Date.now() - rangeMs)
        }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: format,
            date: "$createdAt"
          }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ];
};

app.get('/api/submissions/hourly', async (req, res) => {
  try {
    const data = await Submission.aggregate(groupByTime('hour'));
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error getting hourly submissions');
  }
});

app.get('/api/submissions/weekly', async (req, res) => {
  try {
    const data = await Submission.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error getting weekly submissions');
  }
});

app.get('/api/submissions/monthly', async (req, res) => {
  try {
    const data = await Submission.aggregate(groupByTime('day'));
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error getting monthly submissions');
  }
});

// Start Server (bind to 0.0.0.0 for public access)
const PORT = process.env.PORT || 3000;
console.log(`Binding server to 0.0.0.0 on port ${PORT}`);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
