import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { seedDatabaseIfEmpty } from './scripts/seed.js';
import { logger } from './utils/logger.js';

async function startServer() {
  try {
    await connectDatabase();
    
    // Automatically seed base accounts and synthetic historical precedents if empty
    await seedDatabaseIfEmpty();

    const server = app.listen(env.PORT, () => {
      logger.info(`================================================================`);
      logger.info(` IPMPRS Backend API Server running on http://127.0.0.1:${env.PORT}`);
      logger.info(` Target Audience: Puducherry Police Hackathon 2026`);
      logger.info(` Environment: ${env.NODE_ENV}`);
      logger.info(`================================================================`);
    });

    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Gracefully shutting down server...');
      server.close(() => process.exit(0));
    });

  } catch (error) {
    logger.error(`Critical error starting IPMPRS Backend: ${error.message}`);
    process.exit(1);
  }
}

startServer();
