import { describe, it, expect, vi } from 'vitest';
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

describe('FridgeItemComponent color coding (Jalan)', () => {
  it('renders red styling when a newly added item expires in fewer than three days', () => {
    const nearlyExpired = new Date();
    nearlyExpired.setHours(0, 0, 0, 0);
    nearlyExpired.setDate(nearlyExpired.getDate() + 2);

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
});
