import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { calculateDaysUntilExpiration } from '../utils/dateUtils';

describe('Item re-sorting after editing expiration date', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-03-01T00:00:00.000Z'));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('re-sorts items correctly when an item\'s expiration date is edited', () => {
    const items = [
      {
        id: '1',
        name: 'Apples',
        category: 'Produce',
        quantity: 5,
        unit: 'pcs',
        purchaseDate: new Date('2024-02-28'),
        expirationDate: new Date('2024-03-10'), // 9 days away
      },
      {
        id: '2',
        name: 'Milk',
        category: 'Dairy',
        quantity: 1,
        unit: 'L',
        purchaseDate: new Date('2024-02-28'),
        expirationDate: new Date('2024-03-04'), // 3 days away
      },
      {
        id: '3',
        name: 'Bread',
        category: 'Grains',
        quantity: 1,
        unit: 'loaf',
        purchaseDate: new Date('2024-02-28'),
        expirationDate: new Date('2024-03-15'), // 14 days away
      },
    ];

    const sortItems = (itemsToSort) => {
      return [...itemsToSort].sort((a, b) => {
        const daysA = calculateDaysUntilExpiration(a.expirationDate);
        const daysB = calculateDaysUntilExpiration(b.expirationDate);
        if (daysA !== daysB) {
          return daysA - daysB;
        }

        // secondary sort: alphabetically by name (case-insensitive)
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      });
    };

    const initialSorted = sortItems(items);
    expect(initialSorted.map(i => i.name)).toEqual(['Milk', 'Apples', 'Bread']);

    const updatedItems = items.map(item => {
      if (item.id === '3') {
        return {
          ...item,
          expirationDate: new Date('2024-03-03'), // now 2 days away
        };
      }
      return item;
    });

    // re-sort the items after the edit
    const resorted = sortItems(updatedItems);

    // verify that Bread is now first (expires soonest), followed by Milk, then Apples
    expect(resorted.map(i => i.name)).toEqual(['Bread', 'Milk', 'Apples']);
    expect(calculateDaysUntilExpiration(resorted[0].expirationDate)).toBe(2); // Bread
    expect(calculateDaysUntilExpiration(resorted[1].expirationDate)).toBe(3); // Milk
    expect(calculateDaysUntilExpiration(resorted[2].expirationDate)).toBe(9); // Apples
  });
});
