import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import App from './App';

// Reuse the same mocking style as in App.mercier.test.ts
const mockOnValue = vi.fn();
const mockPush = vi.fn();
const mockSet = vi.fn();
const mockRef = vi.fn();
const mockRemove = vi.fn();
const mockUpdate = vi.fn();

vi.mock('firebase/database', () => ({
  onValue: (ref: any, callback: any) => {
    mockOnValue(ref, callback);
    return () => {}; // unsubscribe
  },
  off: vi.fn(),
  push: (ref: any) => mockPush(ref),
  set: (ref: any, data: any) => mockSet(ref, data),
  remove: (ref: any) => mockRemove(ref),
  update: (ref: any, data: any) => mockUpdate(ref, data),
  ref: (_db: any, path: string) => mockRef(_db, path),
}));

const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
};

vi.mock('./utils/firebase', () => ({
  useAuthState: vi.fn(() => ({
    user: mockUser,
    isAuthenticated: true,
    isInitialLoading: false,
  })),
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  getFridgeItemsRef: vi.fn((userId: string) => ({ key: `users/${userId}/fridgeItems` })),
  database: {},
  triggerTestExpirationEmail: vi.fn(),
  generateRecipeFromIngredients: vi.fn(),
  uploadReceiptImage: vi.fn(async () => 'https://example.com/receipt.jpg'),
  queueReceiptProcessing: vi.fn(async () => `receipt-${Date.now()}`),
}));

// Utilities
const createIso = (daysFromNow: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString();
};

describe('App - Liu, Xinyao tests', () => {
  afterEach(() => {
    cleanup();
  });

  describe('When editing any field, the data should actually update', () => {
    let currentItems: Record<string, any>;
    let onValueCallback: ((snapshot: any) => void) | null = null;

    beforeEach(() => {
      vi.clearAllMocks();
      currentItems = {
        'item-1': {
          name: 'Milk',
          category: 'Dairy',
          quantity: 1,
          unit: 'L',
          addedDate: createIso(-1),
          expirationDate: createIso(5),
        },
      };

      mockOnValue.mockImplementation((_ref: any, callback: any) => {
        onValueCallback = callback;
        const snapshot = {
          exists: () => Object.keys(currentItems).length > 0,
          val: () => currentItems,
        };
        callback(snapshot);
        return () => {};
      });

      mockRef.mockImplementation((_db: any, path: string) => ({ key: path.split('/').pop() }));

      mockUpdate.mockImplementation(async (_ref: any, data: any) => {
        // _ref.key will be the last segment 'item-1'
        const id = _ref?.key ?? 'item-1';
        if (!currentItems[id]) return;
        currentItems[id] = {
          ...currentItems[id],
          ...data,
        };
        if (onValueCallback) {
          const snapshot = {
            exists: () => Object.keys(currentItems).length > 0,
            val: () => currentItems,
          };
          setTimeout(() => onValueCallback?.(snapshot), 0);
        }
      });
    });

    it('updates name and quantity via EditItemModal and persists to list', async () => {
      render(React.createElement(App));
      const user = userEvent.setup();

      // Wait for item to render
      await waitFor(() => {
        expect(screen.getByText('Milk')).toBeInTheDocument();
      });

  // Find the card for Milk and click its Edit button
    // Click the first Edit button (only one item exists in this test)
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await user.click(editButtons[0]);

      // Modal should be visible
      expect(screen.getByText('Edit Item')).toBeInTheDocument();

      // Change name to "Almond Milk"
      const nameInput = screen.getByPlaceholderText(/e.g., Milk, Apples, Chicken/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Almond Milk');

      // Change quantity to 2
      const qtyInput = screen.getByDisplayValue('1');
      await user.clear(qtyInput);
      await user.type(qtyInput, '2');

      // Save changes
      const saveButton = screen.getByText('💾 Save Changes');
      await user.click(saveButton);

      // Wait for UI to reflect updated values
      await waitFor(() => {
        // Old name should no longer be present as an item heading
        const headings = Array.from(document.querySelectorAll('h3')).map(h => h.textContent);
        expect(headings).not.toContain('Milk');
        expect(headings).toContain('Almond Milk');
      }, { timeout: 3000 });

      // Quantity badge should show 2 L
      expect(screen.getByText(/2\s+L/)).toBeInTheDocument();

      // Verify database update was called
      expect(mockUpdate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Deleting entries permanently removes them from the list', () => {
    let currentItems: Record<string, any>;
    let onValueCallback: ((snapshot: any) => void) | null = null;

    beforeEach(() => {
      vi.clearAllMocks();
      currentItems = {
        'item-a': {
          name: 'Yogurt',
          category: 'Dairy',
          quantity: 2,
          unit: 'cups',
          addedDate: createIso(-2),
          expirationDate: createIso(4),
        },
        'item-b': {
          name: 'Bread',
          category: 'Grains',
          quantity: 1,
          unit: 'pcs',
          addedDate: createIso(-1),
          expirationDate: createIso(6),
        },
      };

      mockOnValue.mockImplementation((_ref: any, callback: any) => {
        onValueCallback = callback;
        const snapshot = {
          exists: () => Object.keys(currentItems).length > 0,
          val: () => currentItems,
        };
        callback(snapshot);
        return () => {};
      });

      mockRef.mockImplementation((_db: any, path: string) => ({ key: path.split('/').pop() }));

      mockRemove.mockImplementation(async (refObj: any) => {
        const id = refObj?.key;
        if (id && currentItems[id]) {
          delete currentItems[id];
        }
        if (onValueCallback) {
          const snapshot = {
            exists: () => Object.keys(currentItems).length > 0,
            val: () => currentItems,
          };
          setTimeout(() => onValueCallback?.(snapshot), 0);
        }
      });
    });

    it('removes a single item and it does not reappear', async () => {
      render(React.createElement(App));
      const user = userEvent.setup();
  // (fail demo removed) restore normal remove behavior

      await waitFor(() => {
        expect(screen.getByText('Yogurt')).toBeInTheDocument();
        expect(screen.getByText('Bread')).toBeInTheDocument();
      });

      // Remove Yogurt using its card-specific Remove button
  const removeButtons = screen.getAllByRole('button', { name: /remove/i });
  await user.click(removeButtons[0]);

      await waitFor(() => {
        const headings = Array.from(document.querySelectorAll('h3')).map(h => h.textContent);
        expect(headings).not.toContain('Yogurt');
        expect(headings).toContain('Bread');
      }, { timeout: 3000 });

      expect(mockRemove).toHaveBeenCalledTimes(1);
    });

    it('removes multiple items sequentially', async () => {
      render(React.createElement(App));
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Yogurt')).toBeInTheDocument();
        expect(screen.getByText('Bread')).toBeInTheDocument();
      });

      // Delete Yogurt first
  const removeBtns1 = screen.getAllByRole('button', { name: /remove/i });
  await user.click(removeBtns1[0]);

      await waitFor(() => {
        expect(screen.queryByText('Yogurt')).not.toBeInTheDocument();
      });

      // Then delete Bread
  const removeBtns2 = screen.getAllByRole('button', { name: /remove/i });
  await user.click(removeBtns2[0]);

      await waitFor(() => {
        // Items list should be empty state now
        expect(screen.getByText(/Your fridge is empty/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      expect(mockRemove).toHaveBeenCalledTimes(2);
    });
  });
});
