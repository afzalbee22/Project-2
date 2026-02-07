import express from 'express';
import mongoose from 'mongoose';
import { authenticate } from '../middleware/auth.js';
import Search from '../models/Search.js';
import { performSearch } from '../services/searchService.js';
import { elasticClient, rabbitChannel } from '../config/db.js';

const router = express.Router();

// Keep Groq init comments if needed, but logic is moved.

router.post('/query', authenticate, async (req, res) => {
  try {
    const { query } = req.body;
    const result = await performSearch(req.userId, query);
    res.json(result);
  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/recent', authenticate, async (req, res) => {
  try {
    // Use aggregation to get unique queries, keeping only the most recent one
    const searches = await Search.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$query',
          query: { $first: '$query' },
          timestamp: { $first: '$timestamp' },
          response: { $first: '$response' }
        }
      },
      { $sort: { timestamp: -1 } },
      { $limit: 10 }
    ]);
    res.json(searches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/recent/:query', authenticate, async (req, res) => {
  try {
    const query = decodeURIComponent(req.params.query);
    await Search.deleteMany({
      userId: new mongoose.Types.ObjectId(req.userId),
      query: query
    });
    res.json({ message: 'Search deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/status', authenticate, async (req, res) => {
  try {
    res.json({ elasticsearch: !!elasticClient, openai: !!groq });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
