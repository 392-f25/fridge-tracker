import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShoppingListModal } from './ShoppingListModal';

// Ensure tests don't make real network calls — stub global fetch.
const mockFetch = vi.fn(() => Promise.resolve(new Response('{}')));

beforeEach(() => {
  // stub fetch for any accidental network requests
  // @ts-ignore - vitest provides vi
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

type Item = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
};

describe('ShoppingListModal', () => {
  it('renders empty state when there are no items', async () => {
    const onClose = vi.fn();
    const onRemove = vi.fn();

    const { container } = render(<ShoppingListModal items={[]} onClose={onClose} onRemove={onRemove} />);

    expect(within(container).getByText(/Your shopping list is empty/i)).toBeInTheDocument();
    // overlay click should close — overlay is the first child of the container
    const overlay = container.firstChild as Element | null;
    expect(overlay).toBeTruthy();
    if (overlay) {
      fireEvent.click(overlay);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('renders items and shows count badge', async () => {
    const items: Item[] = [
      { id: 'a1', name: 'Milk', quantity: 1, unit: 'carton', category: 'Dairy' },
      { id: 'b2', name: 'Eggs', quantity: 12, unit: 'pcs', category: 'Dairy' },
    ];
    const onClose = vi.fn();
    const onRemove = vi.fn();

    const { container } = render(<ShoppingListModal items={items} onClose={onClose} onRemove={onRemove} />);

    // Title and badge (scope to this container)
    const header = container.querySelector('h3');
    expect(header?.textContent).toContain('Shopping List');
    const badge = within(header as Element).getByText(String(items.length));
    expect(badge).toBeInTheDocument();

    // Items are rendered
    expect(within(container).getByText('Milk')).toBeInTheDocument();
    expect(within(container).getByText('Eggs')).toBeInTheDocument();
  });

  it('calls onRemove with the item id when Remove button is clicked', async () => {
    const items: Item[] = [
      { id: 'a1', name: 'Milk', quantity: 1, unit: 'carton', category: 'Dairy' },
    ];
    const onClose = vi.fn();
    const onRemove = vi.fn();

    const { container } = render(<ShoppingListModal items={items} onClose={onClose} onRemove={onRemove} />);

    // Find the card that contains 'Milk' and click the Remove button within that card
    const milkCard = Array.from(container.querySelectorAll('div')).find((el) => el.textContent?.includes('Milk'));
    expect(milkCard).toBeTruthy();
    const removeButton = within(milkCard as Element).getByRole('button', { name: /Remove/i });
    await userEvent.click(removeButton);

    expect(onRemove).toHaveBeenCalledWith('a1');
  });

  it('calls onClose when the backdrop (overlay) is clicked but not when modal content is clicked', async () => {
    const items: Item[] = [
      { id: 'a1', name: 'Milk', quantity: 1, unit: 'carton', category: 'Dairy' },
    ];
    const onClose = vi.fn();
    const onRemove = vi.fn();

    const { container } = render(<ShoppingListModal items={items} onClose={onClose} onRemove={onRemove} />);

    // The overlay is the top-level fixed element
    const overlay = container.firstChild as Element;
    expect(overlay).toBeTruthy();

    // Clicking inside the modal content (which stops propagation) should NOT close
    const modalContent = overlay.querySelector(':scope > div');
    if (modalContent) {
      fireEvent.click(modalContent);
      expect(onClose).not.toHaveBeenCalled();
    }

    // Clicking the overlay should close
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  it('close button calls onClose', async () => {
    const items: Item[] = [
      { id: 'a1', name: 'Milk', quantity: 1, unit: 'carton', category: 'Dairy' },
    ];
    const onClose = vi.fn();
    const onRemove = vi.fn();

    const { container } = render(<ShoppingListModal items={items} onClose={onClose} onRemove={onRemove} />);

    // Close button is inside header
    const header = container.querySelector('h3');
    const closeButton = header ? within(header).getByRole('button', { name: /Close|✕/i }) : null;
    expect(closeButton).toBeTruthy();
    if (closeButton) {
      await userEvent.click(closeButton);
      expect(onClose).toHaveBeenCalled();
    }
  });
});
