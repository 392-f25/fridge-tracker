import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { calculateDaysUntilExpiration } from '../utils/dateUtils';

const mockFridgeItems = [
    {
      id: '1',
      name: 'eggs',
      category: 'Dairy',
      quantity: 6,
      unit: 'pcs',
      purchaseDate: new Date(),
      expirationDate: new Date('2024-06-08'),
    },
    {
      id: '2',
      name: 'milk',
      category: 'Dairy',
      quantity: 1,
      unit: 'L',
      purchaseDate: new Date(),
      expirationDate: new Date('2024-06-06'),
    },
    {
      id: '3',
      name: 'bread',
      category: 'Grains',
      quantity: 1,
      unit: 'pcs',
      purchaseDate: new Date(),
      expirationDate: new Date('2024-06-04'),
    },
];


describe('Fridge items are sorted by soonest expiration date on app open', () => {
    beforeAll(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-06-01T00:00:00.000Z'));
    });

    afterAll(() => {
        vi.useRealTimers();
    });

    it('sorts items correctly by expiration date', () => {
          const sorted = [...mockFridgeItems].sort((a, b) => {
            const daysA = calculateDaysUntilExpiration(a.expirationDate);
            const daysB = calculateDaysUntilExpiration(b.expirationDate);
            if (daysA !== daysB) return daysA - daysB; // soonest first
            return a.name.toLowerCase().localeCompare(b.name.toLowerCase()); // tiebreaker
          });
        expect(sorted.map(i=>i.name)).toEqual(['bread', 'milk', 'eggs']); 
    });
}); 



