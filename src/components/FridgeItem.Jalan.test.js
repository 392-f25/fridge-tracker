import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
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

describe('FridgeItemComponent color coding (Jalan)', () => {
  it('renders red styling when a newly added item expires in fewer than three days', () => {
    const nearlyExpired = new Date('2024-03-03T00:00:00.000Z');

    renderFridgeItem({
      name: 'Cherry Tomatoes',
      expirationDate: nearlyExpired,
    });

    // Ensure the expiration text reflects the critical window.
    const expirationText = screen.getByText(/Expires in 2 days/i);
    expect(expirationText).toHaveClass('text-[var(--critical-red)]');

    // The surrounding card should inherit the critical background gradient.
    const card = expirationText.closest('[class*="bg-gradient-to-br"]');
    expect(card?.className).toContain('from-[#fef2f2]');
    expect(card?.className).toContain('to-[#fee2e2]');
  });

  it('updates severity styling when an existing item’s expiration date is edited', () => {
    const infoExpiration = new Date('2024-03-15T00:00:00.000Z'); // 14 days away
    const criticalExpiration = new Date('2024-03-03T00:00:00.000Z'); // 2 days away

    const handlers = {
      onDelete: vi.fn(),
      onEdit: vi.fn(),
      onAddToShoppingList: vi.fn(),
    };

    const { rerender } = render(
      React.createElement(FridgeItemComponent, {
        item: { ...baseItem, name: 'Greek Yogurt', expirationDate: infoExpiration },
        ...handlers,
      })
    );

    const yogurtSection = screen.getByRole('heading', { name: /Greek Yogurt/i }).closest('.flex-1');
    expect(yogurtSection).toBeTruthy();
    if (!yogurtSection) throw new Error('Greek Yogurt section not found');

    const initialText = within(yogurtSection).getByText(/Expires in 14 days/i);
    expect(initialText).toHaveClass('text-[var(--fresh-mint)]');

    rerender(
      React.createElement(FridgeItemComponent, {
        item: { ...baseItem, name: 'Greek Yogurt', expirationDate: criticalExpiration },
        ...handlers,
      })
    );

    const updatedSection = screen.getByRole('heading', { name: /Greek Yogurt/i }).closest('.flex-1');
    expect(updatedSection).toBeTruthy();
    if (!updatedSection) throw new Error('Updated Greek Yogurt section not found');

    const updatedText = within(updatedSection).getByText(/Expires in 2 days/i);
    expect(updatedText).toHaveClass('text-[var(--critical-red)]');

    const updatedCard = updatedText.closest('[class*="bg-gradient-to-br"]');
    expect(updatedCard?.className).toContain('from-[#fef2f2]');
  });
});
