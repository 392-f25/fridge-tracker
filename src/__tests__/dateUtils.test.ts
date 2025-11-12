import { describe, it, expect } from 'vitest';
import {
  calculateDaysUntilExpiration,
  getExpirationSeverity,
  isExpired,
  isExpiringSoon,
} from '../utils/dateUtils';

describe('dateUtils', () => {
  describe('calculateDaysUntilExpiration', () => {
    it('should return positive days for future dates', () => {
      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      const days = calculateDaysUntilExpiration(futureDate);
      expect(days).toBe(5);
    });

    it('should return negative days for past dates', () => {
      const pastDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const days = calculateDaysUntilExpiration(pastDate);
      expect(days).toBe(-3);
    });

    it('should return 0 for today', () => {
      const today = new Date();
      const days = calculateDaysUntilExpiration(today);
      expect(days).toBe(0);
    });

    it('should return Infinity for missing dates', () => {
      const days = calculateDaysUntilExpiration(null);
      expect(days).toBe(Number.POSITIVE_INFINITY);
    });
  });

  describe('getExpirationSeverity', () => {
    it('should return critical for expired items', () => {
      expect(getExpirationSeverity(-1)).toBe('critical');
      expect(getExpirationSeverity(-5)).toBe('critical');
    });

    it('should return critical for items expiring in 0-3 days', () => {
      expect(getExpirationSeverity(0)).toBe('critical');
      expect(getExpirationSeverity(1)).toBe('critical');
      expect(getExpirationSeverity(3)).toBe('critical');
    });

    it('should return warning for items expiring in 4-7 days', () => {
      expect(getExpirationSeverity(4)).toBe('warning');
      expect(getExpirationSeverity(7)).toBe('warning');
    });

    it('should return info for items expiring in more than 7 days', () => {
      expect(getExpirationSeverity(8)).toBe('info');
      expect(getExpirationSeverity(30)).toBe('info');
    });

    it('should return info when days are not finite', () => {
      expect(getExpirationSeverity(Number.POSITIVE_INFINITY)).toBe('info');
    });
  });

  describe('isExpired', () => {
    it('should return true for past dates', () => {
      const pastDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      expect(isExpired(pastDate)).toBe(true);
    });

    it('should return false for future dates', () => {
      const futureDate = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
      expect(isExpired(futureDate)).toBe(false);
    });

    it('should return false for today', () => {
      const today = new Date();
      expect(isExpired(today)).toBe(false);
    });

    it('should return false when no expiration date is provided', () => {
      expect(isExpired(null)).toBe(false);
    });
  });

  describe('isExpiringSoon', () => {
    it('should return true for items expiring in 1-7 days', () => {
      const date1 = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
      const date7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      expect(isExpiringSoon(date1)).toBe(true);
      expect(isExpiringSoon(date7)).toBe(true);
    });

    it('should return false for items expiring in more than 7 days', () => {
      const date = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      expect(isExpiringSoon(date)).toBe(false);
    });

    it('should return false for expired items', () => {
      const pastDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      expect(isExpiringSoon(pastDate)).toBe(false);
    });

    it('should return false when no expiration date is provided', () => {
      expect(isExpiringSoon(null)).toBe(false);
    });
  });
});
