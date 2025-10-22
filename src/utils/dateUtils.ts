import type { FridgeItem, ExpirationWarning } from '../types';

export const calculateDaysUntilExpiration = (expirationDate: Date): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expirationDate);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getExpirationSeverity = (daysUntilExpiration: number): 'critical' | 'warning' | 'info' => {
  if (daysUntilExpiration < 0) return 'critical';
  if (daysUntilExpiration <= 3) return 'critical';
  if (daysUntilExpiration <= 7) return 'warning';
  return 'info';
};

export const getExpirationWarnings = (items: FridgeItem[]): ExpirationWarning[] => {
  return items
    .map(item => {
      const daysUntilExpiration = calculateDaysUntilExpiration(item.expirationDate);
      const severity = getExpirationSeverity(daysUntilExpiration);
      return {
        item,
        daysUntilExpiration,
        severity,
      };
    })
    .filter(warning => warning.daysUntilExpiration <= 7 || warning.daysUntilExpiration < 0)
    .sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration);
};

export const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const isExpired = (expirationDate: Date): boolean => {
  return calculateDaysUntilExpiration(expirationDate) < 0;
};

export const isExpiringSoon = (expirationDate: Date): boolean => {
  const days = calculateDaysUntilExpiration(expirationDate);
  return days >= 0 && days <= 7;
};
