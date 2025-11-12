const { calculateDaysUntilExpiration, formatDaysText } = require('./date');

/**
 * Map Firebase snapshot to items array
 * @param {Object} items - Items from Firebase snapshot
 * @returns {Array} Array of item objects
 */
const mapSnapshotToItems = (items = {}) => {
  return Object.entries(items).map(([id, value]) => ({
    id,
    name: value.name,
    category: value.category,
    quantity: value.quantity,
    unit: value.unit,
    expirationDate: value.expirationDate,
  }));
};

/**
 * Categorize items by expiration severity
 * @param {Array} items - Array of items
 * @returns {Object} Object with expired, expiringSoon arrays and total count
 */
const categorizeItemsBySeverity = (items) => {
  const expired = [];
  const expiringSoon = [];

  items.forEach((item) => {
    const days = calculateDaysUntilExpiration(item.expirationDate);
    if (days === null) return;

    const enhancedItem = { ...item, daysUntilExpiration: days };
    if (days < 0) {
      expired.push(enhancedItem);
    } else if (days <= 3) {
      expiringSoon.push(enhancedItem);
    }
  });

  return {
    expired,
    expiringSoon,
    total: expired.length + expiringSoon.length,
  };
};

/**
 * Format a single item as a line of text
 * @param {Object} item - Item object
 * @returns {string} Formatted item line
 */
const formatItemLine = (item) => {
  return `• ${item.name || 'Unnamed item'} (${item.category || 'uncategorized'}) - ${formatDaysText(item.daysUntilExpiration)}`;
};

/**
 * Format list of items as multiline text
 * @param {Array} items - Array of items
 * @returns {string} Formatted items list
 */
const formatItemsList = (items) => (
  items.length ? items.map(formatItemLine).join('\n') : 'None 🎉'
);

module.exports = {
  mapSnapshotToItems,
  categorizeItemsBySeverity,
  formatItemLine,
  formatItemsList
};
