const dbService = require('../services/db.service');
const logger = require('./logger');

/**
 * Calculate age distribution from database
 * @returns {Object} Age distribution statistics
 */
exports.calculateAgeDistribution = async () => {
  try {
    // Get age statistics from database
    const stats = await dbService.getAgeStatistics();
    
    // Calculate percentages
    const total = parseInt(stats.total, 10);
    if (total === 0) {
      return {
        'under_20': 0,
        '20_to_40': 0,
        '40_to_60': 0,
        'over_60': 0
      };
    }
    
    const distribution = {
      'under_20': Math.round((parseInt(stats.under_20, 10) / total) * 100),
      '20_to_40': Math.round((parseInt(stats['20_to_40'], 10) / total) * 100),
      '40_to_60': Math.round((parseInt(stats['40_to_60'], 10) / total) * 100),
      'over_60': Math.round((parseInt(stats.over_60, 10) / total) * 100)
    };
    
    // Print distribution report to console
    console.log('\n============== Age Distribution Report ==============');
    console.log('Age-Group\t% Distribution');
    console.log('< 20\t\t', distribution.under_20);
    console.log('20 to 40\t', distribution['20_to_40']);
    console.log('40 to 60\t', distribution['40_to_60']);
    console.log('> 60\t\t', distribution.over_60);
    console.log('====================================================\n');
    
    return distribution;
  } catch (error) {
    logger.error('Error calculating age distribution:', error);
    throw new Error(`Failed to calculate age distribution: ${error.message}`);
  }
};