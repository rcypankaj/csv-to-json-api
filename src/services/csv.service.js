const { parseCSV } = require('../utils/csv-parser');
const logger = require('../utils/logger');

/**
 * Convert CSV data to JSON objects
 * @param {string} csvData - CSV file content
 * @returns {Object} Object containing parsed records and count
 */
exports.convertCsvToJson = async (csvData) => {
  try {
    logger.info('Starting CSV to JSON conversion');
    
    // Parse CSV data to JSON
    const { headers, rows } = parseCSV(csvData);
    
    // Process each row
    const records = rows.map(row => {
      const record = processRow(headers, row);
      return formatForDatabase(record);
    });
    
    logger.info(`Converted ${records.length} records to JSON`);
    
    return {
      records,
      totalRecords: records.length
    };
  } catch (error) {
    logger.error('Error converting CSV to JSON:', error);
    throw new Error(`Failed to convert CSV to JSON: ${error.message}`);
  }
};

/**
 * Process a single row from CSV data
 * @param {Array} headers - CSV headers
 * @param {Array} row - CSV row data
 * @returns {Object} Processed object with nested properties
 */
function processRow(headers, row) {
  const result = {};
  
  // Process each column in the row
  headers.forEach((header, index) => {
    const value = row[index]?.trim() || '';
    
    // Handle nested properties (using dot notation)
    if (header.includes('.')) {
      const keys = header.split('.');
      let current = result;
      
      // Create nested objects for all but the last key
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!current[key]) {
          current[key] = {};
        }
        current = current[key];
      }
      
      // Set the value for the last key
      current[keys[keys.length - 1]] = value;
    } else {
      // Simple property
      result[header] = value;
    }
  });
  
  return result;
}

/**
 * Format the record for database storage
 * @param {Object} record - Processed record
 * @returns {Object} Record formatted for database
 */
function formatForDatabase(record) {
  // Extract required fields
  const firstName = record.name?.firstName || '';
  const lastName = record.name?.lastName || '';
  const age = parseInt(record.age || '0', 10);
  
  // Format name field
  const name = `${firstName} ${lastName}`.trim();
  
  // Extract address fields
  let address = null;
  if (record.address) {
    address = { ...record.address };
  }
  
  // Collect all other fields into additional_info
  const additional_info = {};
  
  // Copy all properties except name, age, and address to additional_info
  Object.entries(record).forEach(([key, value]) => {
    if (key !== 'name' && key !== 'age' && key !== 'address') {
      additional_info[key] = value;
    }
  });
  
  return {
    name,
    age,
    address: address ? JSON.stringify(address) : null,
    additional_info: Object.keys(additional_info).length > 0 ? JSON.stringify(additional_info) : null
  };
}