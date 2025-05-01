const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const csvService = require('../services/csv.service');
const dbService = require('../services/db.service');
const { calculateAgeDistribution } = require('../utils/statistics');

/**
 * Process uploaded CSV file
 */
exports.processCSV = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No CSV file uploaded' });
    }

    logger.info(`Processing CSV file: ${req.file.filename}`);
    
    // Read file content
    const filePath = path.join(req.file.destination, req.file.filename);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Parse CSV to JSON
    const { records, totalRecords } = await csvService.convertCsvToJson(fileContent);
    
    logger.info(`Successfully parsed ${totalRecords} records from CSV file`);
    
    // Save to database
    const savedRecords = await dbService.saveUsers(records);
    
    logger.info(`Successfully saved ${savedRecords.length} records to database`);
    
    // Calculate age distribution
    const ageDistribution = await calculateAgeDistribution();
    
    // Clean up the uploaded file
    fs.unlinkSync(filePath);
    
    return res.status(200).json({
      success: true,
      message: `Successfully processed ${totalRecords} records`,
      savedRecords: savedRecords.length,
      ageDistribution
    });
  } catch (error) {
    logger.error('Error processing CSV file:', error);
    return next(error);
  }
};