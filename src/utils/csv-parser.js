const logger = require('./logger');

/**
 * Parse CSV content to structured data
 * @param {string} csvContent - Raw CSV file content
 * @returns {Object} Object containing headers and rows
 */
exports.parseCSV = (csvContent) => {
  try {
    // Split content into lines and remove empty lines
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
    
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }
    
    // Extract headers from the first line
    const headers = parseCSVLine(lines[0]).map(header => header.trim());
    
    // Process data rows
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      
      // Skip lines with incorrect number of columns
      if (values.length !== headers.length) {
        logger.warn(`Skipping line ${i + 1}: Expected ${headers.length} columns, got ${values.length}`);
        continue;
      }
      
      rows.push(values);
    }
    
    return { headers, rows };
  } catch (error) {
    logger.error('Error parsing CSV:', error);
    throw new Error(`Failed to parse CSV: ${error.message}`);
  }
};

/**
 * Parse a single CSV line respecting quoted values
 * @param {string} line - CSV line to parse
 * @returns {Array} Array of parsed values
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    // Handle quotes
    if (char === '"') {
      // Escaped quote inside quotes
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip the next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    }
    // Handle commas
    else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    }
    // Add character to current value
    else {
      current += char;
    }
  }
  
  // Add the last value
  result.push(current);
  
  return result;
}