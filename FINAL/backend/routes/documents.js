import express from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate } from '../middleware/auth.js';
import User from '../models/User.js';
import Document from '../models/Document.js';
import Search from '../models/Search.js';
import { extractText } from '../utils/fileParser.js';
import { elasticClient } from '../config/db.js';
import { performSearch } from '../services/searchService.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /\.(pdf|doc|docx|txt|png|jpg|jpeg)$/i;
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/png',
      'image/jpeg',
      'image/jpg'
    ];

    const ext = allowedExtensions.test(file.originalname);
    const mime = allowedMimes.includes(file.mimetype);

    if (ext || mime) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: PDF, DOC, DOCX, TXT, PNG, JPG, JPEG`));
    }
  }
});

router.post('/upload', authenticate, (req, res, next) => {
  upload.array('files', 20)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }


    const documents = [];
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    for (const file of req.files) {
      const existingDoc = await Document.findOne({
        userId: req.userId,
        originalName: file.originalname,
        uploadDate: { $gte: startOfDay }
      });

      if (existingDoc) {
        documents.push(existingDoc);
        continue;
      }

      const content = await extractText(file.path, file.mimetype);
      console.log(`Extracted text from ${file.originalname}: ${content.length} characters`);

      if (!content || content.length === 0) {
        console.warn(`Warning: No content extracted from ${file.originalname}`);
      }

      const doc = new Document({
        userId: req.userId,
        filename: file.filename,
        originalName: file.originalname,
        fileType: file.mimetype,
        content
      });
      await doc.save();
      console.log(`Saved document ${file.originalname} to database`);

      if (elasticClient) {
        try {
          await elasticClient.index({
            index: 'documents',
            id: doc._id.toString(),
            document: {
              userId: req.userId,
              content,
              filename: file.originalname,
              uploadDate: doc.uploadDate
            },
            refresh: 'true' // Ensure document is immediately successfully searchable
          });
        } catch (error) {
          console.warn('Elasticsearch indexing failed:', error.message);
        }
      }

      documents.push(doc);
    }


    let searchResult = null;
    if (req.body.query) {
      console.log('Query provided with upload:', req.body.query);
      searchResult = await performSearch(req.userId, req.body.query);
    }

    res.json({
      message: 'Files uploaded successfully',
      documents,
      searchResult
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/list', authenticate, async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.userId }).sort({ uploadDate: -1 });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/all', authenticate, async (req, res) => {
  try {
    await Document.deleteMany({ userId: req.userId });

    // Also delete search history
    await Search.deleteMany({ userId: req.userId });

    if (elasticClient) {
      try {
        await elasticClient.deleteByQuery({
          index: 'documents',
          body: { query: { term: { userId: req.userId } } }
        });
      } catch (e) { console.warn('ES delete failed', e.message); }
    }

    await User.findByIdAndUpdate(req.userId, { uploadCount: 0 });
    res.json({ message: 'All documents and search history erased' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    console.log('Deleting document with ID:', req.params.id);
    const doc = await Document.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Also remove from Elasticsearch
    if (elasticClient) {
      try {
        await elasticClient.delete({
          index: 'documents',
          id: req.params.id
        });
      } catch (e) { console.warn('ES delete failed', e.message); }
    }

    console.log('Document deleted successfully:', doc.originalName);
    res.json({ message: 'Document deleted' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/upload-status', authenticate, async (req, res) => {
  try {
    res.json({
      uploadCount: 0,
      remaining: 'unlimited',
      limit: 'none'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
