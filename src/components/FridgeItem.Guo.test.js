import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { FridgeItemComponent } from './FridgeItem';

const baseItem = {
  id: 'item-1',
  name: 'Sample Item',
  category: 'Produce',
  quantity: 1,
  unit: 'lb',
  purchaseDate: new Date('2024-01-01T00:00:00.000Z'),
  expirationDate: new Date('2024-01-10T00:00:00.000Z'),
};

const renderFridgeItem = (overrides = {}) => {
  return render(
    React.createElement(FridgeItemComponent, {
      item: { ...baseItem, ...overrides },
      onDelete: vi.fn(),
      onEdit: vi.fn(),
      onAddToShoppingList: vi.fn(),
    })
  );
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2024-03-01T00:00:00.000Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('FridgeItemComponent color coding - green for items expiring in >5 days', () => {
  it('renders green styling when a new item has an expiration date greater than 5 days', () => {
    const futureExpiration = new Date('2024-03-09T00:00:00.000Z');

    renderFridgeItem({
      name: 'Fresh Lettuce',
      expirationDate: futureExpiration,
    });

    // the item should display "Expires in 8 days"
    const expirationText = screen.getByText(/Expires in 8 days/i);

    // check that the text has the green/mint color class
    expect(expirationText).toHaveClass('text-[var(--fresh-mint)]');

    // the surrounding card should have the green gradient background
    const card = expirationText.closest('[class*="bg-gradient-to-br"]');
    expect(card?.className).toContain('from-[#f0fdfa]');
    expect(card?.className).toContain('to-[#ccfbf1]');
  });
});
