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

// Route Mounts
app.use('/api/batches',    batchesRouter);
app.use('/api/tests',      testsRouter);
app.use('/api/questions',  questionsRouter);
app.use('/api/chapters',   chaptersRouter);
app.use('/api/testSeries', testSeriesRouter);

// === Serve stats.html ===
// Now you can go to http://<host>:<port>/stats
app.get('/stats', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'stats.html'));
});

// Optional SPA fallback
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// Start Server (bind to 0.0.0.0 for public access)
const PORT = process.env.PORT || 3000;
console.log(`Binding server to 0.0.0.0 on port ${PORT}`);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
