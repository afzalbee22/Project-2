import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectMongoDB, connectRedis, connectRabbitMQ, connectElasticsearch, elasticClient } from './config/db.js';
import { register, httpRequestDurationMicroseconds, totalRequests, failedRequests } from './config/monitoring.js';
import authRoutes from './routes/auth.js';
import documentRoutes from './routes/documents.js';
import searchRoutes from './routes/search.js';
import fs from 'fs';



const app = express();

app.use(cors());
app.use(express.json());

// Monitoring Middleware
app.use((req, res, next) => {
  const start = Date.now();
  totalRequests.inc({ method: req.method, route: req.path });

  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestDurationMicroseconds.observe({
      method: req.method,
      route: req.path,
      code: res.statusCode
    }, duration / 1000);

    if (res.statusCode >= 400) {
      failedRequests.inc({
        method: req.method,
        route: req.path,
        error: res.statusMessage || 'Error'
      });
    }
  });
  next();
});

// Metrics Endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.use('/uploads', express.static('uploads'));

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const initElasticsearch = async () => {
  if (!elasticClient) {
    console.log('Elasticsearch not available, skipping index creation');
    return;
  }
  try {
    const indexExists = await elasticClient.indices.exists({ index: 'documents' });
    if (!indexExists) {
      await elasticClient.indices.create({
        index: 'documents',
        body: {
          mappings: {
            properties: {
              userId: { type: 'keyword' },
              content: { type: 'text' },
              filename: { type: 'text' },
              uploadDate: { type: 'date' }
            }
          }
        }
      });
    }
  } catch (error) {
    console.error('Elasticsearch init error:', error);
  }
};

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/search', searchRoutes);

// Serve frontend static files
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve index.html for all non-API routes (SPA support)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads') && !req.path.startsWith('/metrics')) {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  }
});

app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

app.get('/.well-known/*', (req, res) => {
  res.status(204).end();
});

const PORT = 5010; // Changed to 5010 as requested

const startServer = async () => {
  await connectMongoDB();
  await connectRedis();
  await connectRabbitMQ();
  await connectElasticsearch();
  await initElasticsearch();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
