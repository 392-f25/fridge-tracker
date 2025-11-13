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

describe('FridgeItemComponent yellow color for 3-5 day expiration', () => {
  it('renders yellow styling when a fridge item has an expiration date occurring more than 3 but less than 5 days', () => {
    // Set expiration date to 4 days from the current system time (2024-03-01)
    const warningExpiration = new Date('2024-03-05T00:00:00.000Z');

    renderFridgeItem({
      name: 'Milk',
      expirationDate: warningExpiration,
    });

    // Verify the expiration text displays correctly
    const expirationText = screen.getByText(/Expires in 4 days/i);
    
    // Check that the text has the yellow/warning color class
    expect(expirationText).toHaveClass('text-[var(--warning-orange)]');

    // Check that the surrounding card has the yellow gradient background
    const card = expirationText.closest('[class*="bg-gradient-to-br"]');
    expect(card?.className).toContain('from-[#fffbeb]');
    expect(card?.className).toContain('to-[#fef3c7]');
  });
});

