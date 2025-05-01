const { Pool } = require('pg');
const config = require('../config');
const logger = require('../utils/logger');

let pool;

/**
 * Initialize the database connection and create tables if needed
 */
exports.initializeDatabase = async () => {
  try {
    // Create a new pool
    pool = new Pool(config.database);
    
    // Verify connection
    const client = await pool.connect();
    logger.info('Successfully connected to PostgreSQL database');
    
    // Create users table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.users (
        "name" varchar NOT NULL,
        age int4 NOT NULL,
        address jsonb NULL,
        additional_info jsonb NULL,
        id serial4 NOT NULL,
        CONSTRAINT users_pkey PRIMARY KEY (id)
      );
    `);
    
    logger.info('Users table verified/created');
    client.release();
    
    return true;
  } catch (error) {
    logger.error('Database initialization error:', error);
    throw new Error(`Failed to initialize database: ${error.message}`);
  }
};

/**
 * Save users to database
 * @param {Array} users - Array of user objects
 * @returns {Array} Array of saved users
 */
exports.saveUsers = async (users) => {
  try {
    if (!users || users.length === 0) {
      return [];
    }
    
    logger.info(`Saving ${users.length} users to database`);
    
    // Use batching for better performance with large datasets
    const batchSize = 1000;
    const savedUsers = [];
    
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      const values = batch.map((user, index) => {
        const params = [
          user.name,
          user.age,
          user.address,
          user.additional_info
        ];
        
        // Create placeholders like ($1, $2, $3, $4)
        const placeholders = params.map((_, paramIndex) => 
          `$${index * 4 + paramIndex + 1}`
        ).join(', ');
        
        return `(${placeholders})`;
      }).join(', ');
      
      // Flatten all parameters into a single array
      const flatParams = batch.flatMap(user => [
        user.name,
        user.age,
        user.address,
        user.additional_info
      ]);
      
      const query = `
        INSERT INTO users (name, age, address, additional_info)
        VALUES ${values}
        RETURNING id, name, age;
      `;
      
      const { rows } = await pool.query(query, flatParams);
      savedUsers.push(...rows);
      
      logger.info(`Saved batch of ${rows.length} users`);
    }
    
    return savedUsers;
  } catch (error) {
    logger.error('Error saving users to database:', error);
    throw new Error(`Failed to save users to database: ${error.message}`);
  }
};

/**
 * Get all users from database
 * @returns {Array} Array of user objects
 */
exports.getAllUsers = async () => {
  try {
    const { rows } = await pool.query('SELECT * FROM users');
    return rows;
  } catch (error) {
    logger.error('Error getting users from database:', error);
    throw new Error(`Failed to get users from database: ${error.message}`);
  }
};

/**
 * Get age statistics from database
 * @returns {Object} Age statistics
 */
exports.getAgeStatistics = async () => {
  try {
    // Get counts for each age group
    const { rows } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE age < 20) as "under_20",
        COUNT(*) FILTER (WHERE age >= 20 AND age < 40) as "20_to_40",
        COUNT(*) FILTER (WHERE age >= 40 AND age < 60) as "40_to_60",
        COUNT(*) FILTER (WHERE age >= 60) as "over_60",
        COUNT(*) as "total"
      FROM users;
    `);
    
    return rows[0];
  } catch (error) {
    logger.error('Error getting age statistics from database:', error);
    throw new Error(`Failed to get age statistics: ${error.message}`);
  }
};