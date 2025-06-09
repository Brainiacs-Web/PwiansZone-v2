// routes/batches.js

const express = require('express');
const router = express.Router();
const Batch = require('../models/Batch');
const { getNextCode } = require('../utils/getNextSequence');

// GET all batches
router.get('/', async (req, res) => {
  try {
    const batches = await Batch.find().sort('createdAt');
    res.json(batches);
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

// POST create batch
router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });

  try {
    const BatchID = await getNextCode('batch', 'B'); // generates "B001", "B002", etc.
    const batch = new Batch({ BatchID, name });
    await batch.save();
    res.json(batch);
  } catch (err) {
    console.error('Batch creation error:', err);
    res.status(500).json({ error: 'Failed to create batch' });
  }
});

module.exports = router;
