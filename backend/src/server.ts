import 'dotenv/config';
import app from './app';
import { connectDatabase } from './config/database';
import { logger } from './middlewares/logger.middleware';
import { initializeJobs } from './jobs';

const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`\n🥻 ===================================`);
      logger.info(`   RUPKATHA SAREES API SERVER`);
      logger.info(`===================================`);
      logger.info(`🚀 Server running on port: ${PORT}`);
      logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🌐 URL: http://localhost:${PORT}`);
      logger.info(`📚 API: http://localhost:${PORT}/api/v1`);
      logger.info(`❤️  Health: http://localhost:${PORT}/health`);
      logger.info(`===================================\n`);
    });

    // Initialize background jobs
    initializeJobs();

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      logger.info(`\n${signal} received. Shutting down gracefully...`);
      server.close(() => {
        logger.info('✅ HTTP server closed');
        process.exit(0);
      });

      // Force exit after 30 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle unhandled rejections
    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('Unhandled Rejection:', reason);
      gracefulShutdown('unhandledRejection');
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
