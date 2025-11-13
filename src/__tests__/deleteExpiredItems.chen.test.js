import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import { isExpired } from '../utils/dateUtils';

const mockFridgeItems = [
    {
      id: '1',
      name: 'eggs',
      category: 'Dairy',
      quantity: 6,
      unit: 'pcs',
      purchaseDate: new Date(),
      expirationDate: new Date('2024-06-10'),
    },
    {
      id: '2',
      name: 'milk',
      category: 'Dairy',
      quantity: 1,
      unit: 'L',
      purchaseDate: new Date(),
      expirationDate: new Date('2024-06-05'),
    },
    {
      id: '3',
      name: 'bread',
      category: 'Grains',
      quantity: 1,
      unit: 'pcs',
      purchaseDate: new Date(),
      expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
];

describe('deleteExpiredItems function', () => {
  beforeEach(() => {
    // Freeze time to a fixed date so expiration checks are deterministic
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-11-12T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('correctly identifies and deletes expired items', () => {
    const expiredItems = mockFridgeItems.filter(item => isExpired(item.expirationDate));
    expect(expiredItems.map(i => i.name).sort()).toEqual(['eggs', 'milk'].sort());

    const clearExpired = (items) => items.filter(i => !isExpired(i.expirationDate));

    const remaining = clearExpired(mockFridgeItems);

    expect(remaining.map(i => i.name)).toEqual(['bread']);
    expect(remaining).toHaveLength(1);
  });
}); 