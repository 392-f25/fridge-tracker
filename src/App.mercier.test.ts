import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import App from './App';

// Mock Firebase dependencies
const mockOnValue = vi.fn();
const mockPush = vi.fn();
const mockSet = vi.fn();
const mockRef = vi.fn();

vi.mock('firebase/database', () => ({
  onValue: (ref: any, callback: any) => {
    mockOnValue(ref, callback);
    return () => {}; // unsubscribe function
  },
  off: vi.fn(),
  push: (ref: any) => {
    return mockPush(ref);
  },
  set: (ref: any, data: any) => {
    return mockSet(ref, data);
  },
  remove: vi.fn(),
  update: vi.fn(),
  ref: (db: any, path: string) => {
    return mockRef(db, path);
  },
}));

const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
};

const { mockUploadReceiptImage, mockQueueReceiptProcessing } = vi.hoisted(() => ({
  mockUploadReceiptImage: vi.fn(),
  mockQueueReceiptProcessing: vi.fn(),
}));

vi.mock('./utils/firebase', () => ({
  useAuthState: vi.fn(() => ({
    user: mockUser,
    isAuthenticated: true,
    isInitialLoading: false,
  })),
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  getFridgeItemsRef: vi.fn((userId: string) => ({
    key: `users/${userId}/fridgeItems`,
  })),
  database: {},
  triggerTestExpirationEmail: vi.fn(),
  generateRecipeFromIngredients: vi.fn(),
  uploadReceiptImage: mockUploadReceiptImage,
  queueReceiptProcessing: mockQueueReceiptProcessing,
}));

describe('App', () => {
  describe('item sorting', () => {
    let currentItems: Record<string, any>;
    let onValueCallback: ((snapshot: any) => void) | null = null;

    beforeEach(() => {
      vi.clearAllMocks();
      currentItems = {};
      onValueCallback = null;

      // Set up onValue mock to capture callback and simulate Firebase behavior
      mockOnValue.mockImplementation((_ref: any, callback: any) => {
        onValueCallback = callback;
        // Immediately call callback with current items
        const snapshot = {
          exists: () => Object.keys(currentItems).length > 0,
          val: () => currentItems,
        };
        callback(snapshot);
        return () => {}; // unsubscribe
      });

      // Set up push mock to return a ref with a key
      mockPush.mockImplementation((_ref: any) => {
        const key = `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        return { key };
      });

      // Set up set mock to update items and trigger callback
      mockSet.mockImplementation(async (ref: any, data: any) => {
        const key = ref.key || `item-${Date.now()}`;
        currentItems[key] = data;
        // Simulate Firebase triggering the listener
        if (onValueCallback) {
          const snapshot = {
            exists: () => Object.keys(currentItems).length > 0,
            val: () => currentItems,
          };
          // Use setTimeout to simulate async behavior
          setTimeout(() => {
            onValueCallback?.(snapshot);
          }, 0);
        }
      });

      mockRef.mockImplementation((_db: any, path: string) => ({
        key: path.split('/').pop(),
      }));
    });

    it('should sort new item by expiration date when added to list with multiple items', async () => {
      // Set up initial items with different expiration dates
      const now = Date.now();
      currentItems = {
        'item-1': {
          name: 'Milk',
          category: 'Dairy',
          quantity: 1,
          unit: 'L',
          addedDate: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
          expirationDate: new Date(now + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days
        },
        'item-2': {
          name: 'Bread',
          category: 'Grains',
          quantity: 1,
          unit: 'pcs',
          addedDate: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
          expirationDate: new Date(now + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days
        },
        'item-3': {
          name: 'Eggs',
          category: 'Dairy',
          quantity: 6,
          unit: 'pcs',
          addedDate: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
          expirationDate: new Date(now + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days (soonest)
        },
      };

      render(React.createElement(App));
      const user = userEvent.setup();

      // Wait for items to load
      await waitFor(() => {
        expect(screen.getByText('Eggs')).toBeInTheDocument();
        expect(screen.getByText('Milk')).toBeInTheDocument();
        expect(screen.getByText('Bread')).toBeInTheDocument();
      });

      // Get all item names in the order they appear
      const itemElements = screen.getAllByText(/^(Eggs|Milk|Bread)$/);
      const initialOrder = itemElements.map(el => el.textContent);
      
      // Initial order should be: Eggs (2 days), Milk (5 days), Bread (10 days)
      expect(initialOrder[0]).toBe('Eggs');
      expect(initialOrder[1]).toBe('Milk');
      expect(initialOrder[2]).toBe('Bread');

      // Add a new item with expiration date in 3 days (should go between Eggs and Milk)
      const addButton = screen.getByText('Add New Item');
      await user.click(addButton);

      const nameInput = screen.getByPlaceholderText(/e.g., Milk, Apples, Chicken/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Cheese');

      // Intercept mockSet to set expiration date to 3 days from now for Cheese
      const originalMockSet = mockSet.getMockImplementation();
      mockSet.mockImplementation(async (ref: any, data: any) => {
        if (data.name === 'Cheese') {
          data.expirationDate = new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString();
        }
        if (originalMockSet) {
          return originalMockSet(ref, data);
        }
      });

      // Submit the form
      const submitButton = screen.getByText('✅ Add Item');
      await user.click(submitButton);

      // Wait for the new item to appear
      await waitFor(() => {
        expect(screen.getByText('Cheese')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify the sorting: Eggs (2 days), Cheese (3 days), Milk (5 days), Bread (10 days)
      const allItemElements = screen.getAllByText(/^(Eggs|Milk|Bread|Cheese)$/);
      const finalOrder = allItemElements.map(el => el.textContent);
      
      expect(finalOrder).toContain('Cheese');
      const cheeseIndex = finalOrder.indexOf('Cheese');
      const eggsIndex = finalOrder.indexOf('Eggs');
      const milkIndex = finalOrder.indexOf('Milk');
      
      // Cheese should come after Eggs (3 days > 2 days) and before Milk (3 days < 5 days)
      expect(cheeseIndex).toBeGreaterThan(eggsIndex);
      expect(cheeseIndex).toBeLessThan(milkIndex);
    });

    it('should sort new item alphabetically when expiration dates are the same', async () => {
      const now = Date.now();
      const sameExpiration = new Date(now + 5 * 24 * 60 * 60 * 1000).toISOString();
      
      currentItems = {
        'item-1': {
          name: 'Milk',
          category: 'Dairy',
          quantity: 1,
          unit: 'L',
          addedDate: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
          expirationDate: sameExpiration,
        },
        'item-2': {
          name: 'Bread',
          category: 'Grains',
          quantity: 1,
          unit: 'pcs',
          addedDate: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
          expirationDate: sameExpiration,
        },
      };

      render(React.createElement(App));
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Bread')).toBeInTheDocument();
        expect(screen.getByText('Milk')).toBeInTheDocument();
      });

      // Initial order should be alphabetical: Bread, Milk
      const initialElements = screen.getAllByText(/^(Bread|Milk)$/);
      const initialOrder = initialElements.map(el => el.textContent);
      expect(initialOrder[0]).toBe('Bread');
      expect(initialOrder[1]).toBe('Milk');

      // Add a new item "Cheese" with the same expiration date
      const addButton = screen.getByText('Add New Item');
      await user.click(addButton);

      const nameInput = screen.getByPlaceholderText(/e.g., Milk, Apples, Chicken/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Cheese');

      // Intercept mockSet to set expiration date to same as other items for Cheese
      const originalMockSet = mockSet.getMockImplementation();
      mockSet.mockImplementation(async (ref: any, data: any) => {
        if (data.name === 'Cheese') {
          data.expirationDate = sameExpiration;
        }
        if (originalMockSet) {
          return originalMockSet(ref, data);
        }
      });

      const submitButton = screen.getByText('✅ Add Item');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Cheese')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify alphabetical sorting: Bread, Cheese, Milk
      const allElements = screen.getAllByText(/^(Bread|Milk|Cheese)$/);
      const finalOrder = allElements.map(el => el.textContent);
      
      expect(finalOrder).toContain('Cheese');
      const breadIndex = finalOrder.indexOf('Bread');
      const cheeseIndex = finalOrder.indexOf('Cheese');
      const milkIndex = finalOrder.indexOf('Milk');
      
      // Should be in alphabetical order
      expect(breadIndex).toBeLessThan(cheeseIndex);
      expect(cheeseIndex).toBeLessThan(milkIndex);
    });

    it('should place new item with no expiration date at the end of the list', async () => {
      const now = Date.now();
      currentItems = {
        'item-1': {
          name: 'Milk',
          category: 'Dairy',
          quantity: 1,
          unit: 'L',
          addedDate: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
          expirationDate: new Date(now + 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        'item-2': {
          name: 'Bread',
          category: 'Grains',
          quantity: 1,
          unit: 'pcs',
          addedDate: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
          expirationDate: new Date(now + 10 * 24 * 60 * 60 * 1000).toISOString(),
        },
      };

      render(React.createElement(App));
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Milk')).toBeInTheDocument();
        expect(screen.getByText('Bread')).toBeInTheDocument();
      });

      // Add a new item without expiration date
      const addButton = screen.getByText('Add New Item');
      await user.click(addButton);

      const nameInput = screen.getByPlaceholderText(/e.g., Milk, Apples, Chicken/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Salt');

      const submitButton = screen.getByText('✅ Add Item');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Salt')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify that Salt (no expiration) appears after items with expiration dates
      const allElements = screen.getAllByText(/^(Milk|Bread|Salt)$/);
      const finalOrder = allElements.map(el => el.textContent);
      
      expect(finalOrder).toContain('Salt');
      const saltIndex = finalOrder.indexOf('Salt');
      const milkIndex = finalOrder.indexOf('Milk');
      const breadIndex = finalOrder.indexOf('Bread');
      
      // Salt should be at the end (items with expiration dates come first)
      expect(saltIndex).toBeGreaterThan(milkIndex);
      expect(saltIndex).toBeGreaterThan(breadIndex);
    });
  });

  describe('receipt processing', () => {
    let currentItems: Record<string, any>;
    let onValueCallback: ((snapshot: any) => void) | null = null;

    beforeEach(() => {
      vi.clearAllMocks();
      currentItems = {};
      onValueCallback = null;

      // Set up onValue mock to capture callback and simulate Firebase behavior
      mockOnValue.mockImplementation((_ref: any, callback: any) => {
        onValueCallback = callback;
        // Immediately call callback with current items
        const snapshot = {
          exists: () => Object.keys(currentItems).length > 0,
          val: () => currentItems,
        };
        callback(snapshot);
        return () => {}; // unsubscribe
      });

      // Set up push mock to return a ref with a key
      mockPush.mockImplementation((_ref: any) => {
        const key = `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        return { key };
      });

      // Set up set mock to update items and trigger callback
      mockSet.mockImplementation(async (ref: any, data: any) => {
        const key = ref.key || `item-${Date.now()}`;
        currentItems[key] = data;
        // Simulate Firebase triggering the listener
        if (onValueCallback) {
          const snapshot = {
            exists: () => Object.keys(currentItems).length > 0,
            val: () => currentItems,
          };
          // Use setTimeout to simulate async behavior
          setTimeout(() => {
            onValueCallback?.(snapshot);
          }, 0);
        }
      });

      mockRef.mockImplementation((_db: any, path: string) => ({
        key: path.split('/').pop(),
      }));

      // Set up receipt upload mocks
      mockUploadReceiptImage.mockResolvedValue('https://example.com/receipt.jpg');
      mockQueueReceiptProcessing.mockImplementation(async (_imageUrl: string, _userId: string) => {
        // Simulate receipt processing by adding items to the database
        // This mimics what the Firebase function does
        const receiptId = `receipt-${Date.now()}`;
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Add items from the "receipt" to currentItems
        // This simulates the Firebase function processing the receipt
        const receiptItems = [
          {
            name: 'Milk',
            category: 'Dairy',
            quantity: 1,
            unit: 'L',
            expirationDays: 7,
          },
          {
            name: 'Bread',
            category: 'Grains',
            quantity: 1,
            unit: 'pcs',
            expirationDays: 5,
          },
          {
            name: 'Eggs',
            category: 'Dairy',
            quantity: 12,
            unit: 'pcs',
            expirationDays: 14,
          },
        ];

        const now = new Date();
        receiptItems.forEach((item, index) => {
          const expirationDate = new Date(now);
          expirationDate.setDate(expirationDate.getDate() + item.expirationDays);
          
          const itemId = `receipt-item-${receiptId}-${index}`;
          currentItems[itemId] = {
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
            addedDate: now.toISOString(),
            expirationDate: expirationDate.toISOString(),
            receiptId: receiptId,
          };
        });

        // Trigger the callback to update the UI
        if (onValueCallback) {
          const snapshot = {
            exists: () => Object.keys(currentItems).length > 0,
            val: () => currentItems,
          };
          setTimeout(() => {
            onValueCallback?.(snapshot);
          }, 0);
        }

        return receiptId;
      });
    });

    it('should recognize exactly what is in the receipt when list is empty', async () => {
      // Start with empty list
      currentItems = {};

      render(React.createElement(App));
      const user = userEvent.setup();

      // Wait for empty state to appear
      await waitFor(() => {
        expect(screen.getByText(/Your fridge is empty/i)).toBeInTheDocument();
      });

      // Find and click the receipt upload button
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();

      // Create a mock file
      const mockFile = new File(['receipt content'], 'receipt.jpg', { type: 'image/jpeg' });
      
      // Simulate file selection
      await user.upload(fileInput, mockFile);

      // Wait for preview to appear
      await waitFor(() => {
        expect(screen.getByText(/Process Receipt/i)).toBeInTheDocument();
      });

      // Click process receipt button
      const processButton = screen.getByText(/Process Receipt/i);
      await user.click(processButton);

      // Wait for items from receipt to appear
      await waitFor(() => {
        expect(screen.getByText('Milk')).toBeInTheDocument();
        expect(screen.getByText('Bread')).toBeInTheDocument();
        expect(screen.getByText('Eggs')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify that exactly the items from the receipt are present
      const milkElement = screen.getByText('Milk');
      const breadElement = screen.getByText('Bread');
      const eggsElement = screen.getByText('Eggs');

      expect(milkElement).toBeInTheDocument();
      expect(breadElement).toBeInTheDocument();
      expect(eggsElement).toBeInTheDocument();

      // Verify quantities match
      expect(screen.getByText(/1 L/i)).toBeInTheDocument(); // Milk quantity
      expect(screen.getByText(/1 pcs/i)).toBeInTheDocument(); // Bread quantity
      expect(screen.getByText(/12 pcs/i)).toBeInTheDocument(); // Eggs quantity

      // Verify that no other items are present (only the 3 from receipt)
      const allItemNames = screen.queryAllByText(/^(Milk|Bread|Eggs)$/);
      expect(allItemNames.length).toBe(3);

      // Verify receipt upload was called
      expect(mockUploadReceiptImage).toHaveBeenCalledWith(mockFile, mockUser.uid);
      expect(mockQueueReceiptProcessing).toHaveBeenCalled();
    });

    it('should add receipt items to existing items without duplicates', async () => {
      // Start with one existing item
      const now = Date.now();
      currentItems = {
        'existing-item-1': {
          name: 'Cheese',
          category: 'Dairy',
          quantity: 1,
          unit: 'pcs',
          addedDate: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
          expirationDate: new Date(now + 10 * 24 * 60 * 60 * 1000).toISOString(),
        },
      };

      render(React.createElement(App));
      const user = userEvent.setup();

      // Wait for existing item to appear
      await waitFor(() => {
        expect(screen.getByText('Cheese')).toBeInTheDocument();
      });

      // Upload receipt
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['receipt content'], 'receipt.jpg', { type: 'image/jpeg' });
      
      await user.upload(fileInput, mockFile);

      await waitFor(() => {
        expect(screen.getByText(/Process Receipt/i)).toBeInTheDocument();
      });

      const processButton = screen.getByText(/Process Receipt/i);
      await user.click(processButton);

      // Wait for receipt items to be added
      await waitFor(() => {
        expect(screen.getByText('Milk')).toBeInTheDocument();
        expect(screen.getByText('Bread')).toBeInTheDocument();
        expect(screen.getByText('Eggs')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify all items are present: existing Cheese + 3 from receipt
      expect(screen.getByText('Cheese')).toBeInTheDocument();
      expect(screen.getByText('Milk')).toBeInTheDocument();
      expect(screen.getByText('Bread')).toBeInTheDocument();
      expect(screen.getByText('Eggs')).toBeInTheDocument();

      // Verify exactly 4 items total
      const allItemNames = screen.queryAllByText(/^(Milk|Bread|Eggs|Cheese)$/);
      expect(allItemNames.length).toBe(4);
    });
  });
});
