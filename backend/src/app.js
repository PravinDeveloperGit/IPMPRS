import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security and CORS
app.use(cors({
  origin: (origin, callback) => {
    // Allow local development ports and matching frontends
    if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      callback(null, true);
    } else {
      callback(null, true); // Dev relaxed, production would match env.FRONTEND_URL strictly
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (env.NODE_ENV !== 'test') {
  app.use(morgan('short'));
}

// Mount API routes
app.use('/api', apiRoutes);

// Root landing endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'IPMPRS Core API',
    tagline: 'Intelligent Proposal Management & Precedent Retrieval System',
    jurisdiction: 'Puducherry Police Hackathon 2026',
    status: 'OPERATIONAL',
    apiDocumentation: '/api/health',
  });
});

// 404 Not Found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found on path: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized error handling middleware
app.use(errorHandler);

export default app;
