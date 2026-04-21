import express from 'express';
import cors from 'cors';
import { initDatabase } from './db';
import apiRouter from './api/router';
import { config } from './config';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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