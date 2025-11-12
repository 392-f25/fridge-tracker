/**
 * Convert a date to start of day (midnight)
 * @param {Date|string} value - Date to convert
 * @returns {Date|null} Date at start of day or null if invalid
 */
const toStartOfDay = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

/**
 * Calculate days until expiration from ISO date
 * @param {string} isoDate - ISO date string
 * @returns {number|null} Days until expiration (negative if expired)
 */
const calculateDaysUntilExpiration = (isoDate) => {
  const today = toStartOfDay(new Date());
  const expiry = toStartOfDay(isoDate);
  if (!today || !expiry) return null;
  const diff = expiry.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

/**
 * Format days count into human-readable text
 * @param {number} days - Days until expiration
 * @returns {string} Formatted text
 */
const formatDaysText = (days) => {
  if (days === null || days === undefined) return 'Unknown expiration';
  if (days < 0) {
    const value = Math.abs(days);
    return `Expired ${value} day${value === 1 ? '' : 's'} ago`;
  }
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires tomorrow';
  return `Expires in ${days} days`;
};

module.exports = {
  toStartOfDay,
  calculateDaysUntilExpiration,
  formatDaysText
};
