import express from 'express';
import cors from 'cors';
import { initDatabase } from './db';
import apiRouter from './api/router';
import { config } from './config';
import fs from 'fs';
import path from 'path';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req: express.Request, res: express.Response) => {
  res.json({
    code: 0,
    data: {
      status: 'running',
      port: config.port,
      dbType: config.db.type,
      timestamp: new Date().toISOString(),
    },
  });
});

// Routes
app.use('/api', apiRouter);

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ code: -1, error: 'Internal server error' });
});

// Start server
function start(): void {
  // Initialize database
  initDatabase();
  console.log('Database initialized');

  app.listen(config.port, () => {
    console.log(`ID-App Runtime backend running on port ${config.port}`);
    console.log(`Database: ${config.db.type} at ${config.db.path}`);
  });
}

start();