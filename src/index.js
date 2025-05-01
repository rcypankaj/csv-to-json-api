const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const { initializeDatabase } = require('./services/db.service');

const startServer = async () => {
  try {
    // Initialize database connection
    await initializeDatabase();
    logger.info('Database initialized successfully');

    // Start the server
    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();