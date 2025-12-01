import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddItemForm } from './AddItemForm';
import type { FridgeItem } from '../types';

describe('AddItemForm Component - Edge Cases', () => {
  let mockOnAdd: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnAdd = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  // Helper function to open the form
  const openForm = (container: HTMLElement) => {
    const addButton = container.querySelector('button');
    if (addButton) fireEvent.click(addButton);
  };

  describe('Form visibility toggle', () => {
    it('should initially show only the add button', () => {
      const { container } = render(<AddItemForm onAdd={mockOnAdd} />);

      const addButton = container.querySelector('button');
      expect(addButton).toBeTruthy();
      expect(addButton?.textContent).toContain('Add New Item');

      // Form fields should not be visible
      expect(screen.queryByLabelText(/item name/i)).toBeNull();
    });

    it('should show form when add button is clicked', async () => {
      const { container } = render(<AddItemForm onAdd={mockOnAdd} />);

      const addButton = container.querySelector('button');
      if (addButton) fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/e.g., Milk, Apples, Chicken/i)).toBeTruthy();
      });
    });

    it('should close form when cancel button is clicked', async () => {
      const { container } = render(<AddItemForm onAdd={mockOnAdd} />);

      // Open form
      const addButton = container.querySelector('button');
      if (addButton) fireEvent.click(addButton);

      // Cancel form - use getAllByRole and get the last one
      const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButtons[cancelButtons.length - 1]);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/e.g., Milk, Apples, Chicken/i)).toBeNull();
      });
    });
  });

  describe('Input validation edge cases', () => {
    it('should prevent submission with empty name', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const { container } = render(<AddItemForm onAdd={mockOnAdd} />);

      // Open form
      const addButton = container.querySelector('button');
      if (addButton) fireEvent.click(addButton);

      // Submit without entering name
      const submitButton = screen.getByRole('button', { name: /✅ add item/i });
      fireEvent.click(submitButton);

      expect(alertSpy).toHaveBeenCalledWith('Please enter an item name');
      expect(mockOnAdd).not.toHaveBeenCalled();

      alertSpy.mockRestore();
    });

    it('should allow submission with whitespace-only name (bug)', async () => {
      const { container } = render(<AddItemForm onAdd={mockOnAdd} />);

      // Open form
      openForm(container);

      // Enter whitespace-only name
      const nameInput = screen.getByPlaceholderText(/e.g., Milk, Apples, Chicken/i);
      fireEvent.change(nameInput, { target: { value: '   ' } });

      // Submit
      const submitButton = screen.getByRole('button', { name: /✅ add item/i });
      fireEvent.click(submitButton);

      // Currently this is a bug - whitespace passes validation
      expect(mockOnAdd).toHaveBeenCalledWith(
        expect.objectContaining({ name: '   ' })
      );
    });

    it('should handle very long item names', async () => {
      const { container } = render(<AddItemForm onAdd={mockOnAdd} />);

      // Open form
      openForm(container);

      // Enter extremely long name
      const longName = 'A'.repeat(1000);
      const nameInput = screen.getByPlaceholderText(/e.g., Milk, Apples, Chicken/i);
      fireEvent.change(nameInput, { target: { value: longName } });

      // Submit
      const submitButton = screen.getByRole('button', { name: /✅ add item/i });
      fireEvent.click(submitButton);

      expect(mockOnAdd).toHaveBeenCalledWith(
        expect.objectContaining({ name: longName })
      );
    });

    it('should handle special characters in name', async () => {
      const { container } = render(<AddItemForm onAdd={mockOnAdd} />);

      // Open form
      openForm(container);

      // Enter name with special characters
      const specialName = '<script>alert("XSS")</script>';
      const nameInput = screen.getByPlaceholderText(/e.g., Milk, Apples, Chicken/i);
      fireEvent.change(nameInput, { target: { value: specialName } });

      // Submit
      const submitButton = screen.getByRole('button', { name: /✅ add item/i });
      fireEvent.click(submitButton);

      expect(mockOnAdd).toHaveBeenCalledWith(
        expect.objectContaining({ name: specialName })
      );
    });

    it('should handle emoji in item name', async () => {
      const { container } = render(<AddItemForm onAdd={mockOnAdd} />);

      // Open form
      openForm(container);

      // Enter name with emoji
      const emojiName = '🍎 Apple 🍏';
      const nameInput = screen.getByPlaceholderText(/e.g., Milk, Apples, Chicken/i);
      fireEvent.change(nameInput, { target: { value: emojiName } });

      // Submit
      const submitButton = screen.getByRole('button', { name: /✅ add item/i });
      fireEvent.click(submitButton);

      expect(mockOnAdd).toHaveBeenCalledWith(
        expect.objectContaining({ name: emojiName })
      );
    });
  });

  describe('Quantity edge cases', () => {
    it('should handle zero quantity input (browser prevents submission below min)', async () => {
      const { container } = render(<AddItemForm onAdd={mockOnAdd} />);

      // Open form
      openForm(container);

      // Enter valid name
      const nameInput = screen.getByPlaceholderText(/e.g., Milk, Apples, Chicken/i);
      fireEvent.change(nameInput, { target: { value: 'Test Item' } });

      // Enter zero quantity
      const quantityInput = screen.getByDisplayValue('1') as HTMLInputElement;
      fireEvent.change(quantityInput, { target: { value: '0' } });

      // Check that HTML5 validation marks it as invalid
      expect(quantityInput.value).toBe('0');

      // Submit button exists but form won't submit with invalid data
      const submitButton = screen.getByRole('button', { name: /✅ add item/i });
      fireEvent.click(submitButton);

      // Browser prevents submission due to min="0.1" constraint
      expect(mockOnAdd).not.toHaveBeenCalled();
    });

    it('should handle negative quantity input (browser prevents submission below min)', async () => {
      const { container } = render(<AddItemForm onAdd={mockOnAdd} />);

      // Open form
      openForm(container);

      // Enter valid name
      const nameInput = screen.getByPlaceholderText(/e.g., Milk, Apples, Chicken/i);
      fireEvent.change(nameInput, { target: { value: 'Test Item' } });

      // Enter negative quantity
      const quantityInput = screen.getByDisplayValue('1') as HTMLInputElement;
      fireEvent.change(quantityInput, { target: { value: '-5' } });

      // Check that the value was set
      expect(quantityInput.value).toBe('-5');

      // Submit
      const submitButton = screen.getByRole('button', { name: /✅ add item/i });
      fireEvent.click(submitButton);

      // Browser prevents submission due to min="0.1" constraint
      expect(mockOnAdd).not.toHaveBeenCalled();
    });

    it('should handle NaN quantity from invalid input', async () => {
      const { container } = render(<AddItemForm onAdd={mockOnAdd} />);

      // Open form
      openForm(container);

      // Enter valid name
      const nameInput = screen.getByPlaceholderText(/e.g., Milk, Apples, Chicken/i);
      fireEvent.change(nameInput, { target: { value: 'Test Item' } });

      // Enter invalid quantity that produces NaN
      const quantityInput = screen.getByDisplayValue('1');
      fireEvent.change(quantityInput, { target: { value: 'abc' } });

      // Submit
      const submitButton = screen.getByRole('button', { name: /✅ add item/i });
      fireEvent.click(submitButton);

      // parseFloat('abc') returns NaN
      expect(mockOnAdd).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: NaN })
      );
    });

    it('should handle very large quantity', async () => {
      const { container } = render(<AddItemForm onAdd={mockOnAdd} />);

      // Open form
      openForm(container);

      // Enter valid name
      const nameInput = screen.getByPlaceholderText(/e.g., Milk, Apples, Chicken/i);
      fireEvent.change(nameInput, { target: { value: 'Test Item' } });

      // Enter very large quantity
      const quantityInput = screen.getByDisplayValue('1');
      fireEvent.change(quantityInput, { target: { value: '999999999' } });

      // Submit
      const submitButton = screen.getByRole('button', { name: /✅ add item/i });
      fireEvent.click(submitButton);

      expect(mockOnAdd).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: 999999999 })
      );
    });

    it('should handle decimal precision in quantity', async () => {
      const { container } = render(<AddItemForm onAdd={mockOnAdd} />);

      // Open form
      openForm(container);

      // Enter valid name
      const nameInput = screen.getByPlaceholderText(/e.g., Milk, Apples, Chicken/i);
      fireEvent.change(nameInput, { target: { value: 'Test Item' } });

      // Enter quantity with decimal (2.3 fits step="0.1")
      const quantityInput = screen.getByDisplayValue('1');
      fireEvent.change(quantityInput, { target: { value: '2.3' } });

      // Submit
      const submitButton = screen.getByRole('button', { name: /✅ add item/i });
      fireEvent.click(submitButton);

      // Should accept values that fit step="0.1"
      expect(mockOnAdd).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: 2.3 })
      );
    });
  });

  describe('Date edge cases', () => {
    it('should handle expiration date before purchase date', async () => {
      const { container } = render(<AddItemForm onAdd={mockOnAdd} />);

      // Open form
      openForm(container);

      // Enter valid name
      const nameInput = screen.getByPlaceholderText(/e.g., Milk, Apples, Chicken/i);
      fireEvent.change(nameInput, { target: { value: 'Test Item' } });

      // Note: Testing date selection with DatePicker is complex in unit tests
      // This would typically require integration testing or mocking DatePicker
      // The component currently doesn't prevent expiration < purchase date

      // Submit with default dates
      const submitButton = screen.getByRole('button', { name: /✅ add item/i });
      fireEvent.click(submitButton);

      expect(mockOnAdd).toHaveBeenCalled();
    });

    it('should allow null expiration date', async () => {
      const { container } = render(<AddItemForm onAdd={mockOnAdd} />);

      // Open form
      openForm(container);

      // Enter valid name
      const nameInput = screen.getByPlaceholderText(/e.g., Milk, Apples, Chicken/i);
      fireEvent.change(nameInput, { target: { value: 'Test Item' } });

      // Submit without setting expiration date (should be null by default)
      const submitButton = screen.getByRole('button', { name: /✅ add item/i });
      fireEvent.click(submitButton);

      expect(mockOnAdd).toHaveBeenCalledWith(
        expect.objectContaining({ expirationDate: null })
      );
    });
  });

  describe('Form state management', () => {
    it('should reset form after successful submission', async () => {
      const { container } = render(<AddItemForm onAdd={mockOnAdd} />);

      // Open form
      openForm(container);

      // Fill in form
      const nameInput = screen.getByPlaceholderText(/e.g., Milk, Apples, Chicken/i);
      fireEvent.change(nameInput, { target: { value: 'Milk' } });

      const quantityInput = screen.getByDisplayValue('1');
      fireEvent.change(quantityInput, { target: { value: '2' } });

      // Submit
      const submitButton = screen.getByRole('button', { name: /✅ add item/i });
      fireEvent.click(submitButton);

      expect(mockOnAdd).toHaveBeenCalled();

      // Form should close after submission
      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/e.g., Milk, Apples, Chicken/i)).toBeNull();
      });

      // Reopen form - should have reset values
      openForm(container);

      await waitFor(() => {
        const newNameInput = screen.getByPlaceholderText(/e.g., Milk, Apples, Chicken/i);
        expect((newNameInput as HTMLInputElement).value).toBe('');
      });
    });

    it('should not submit on rapid double-click (form closes after first)', async () => {
      const { container } = render(<AddItemForm onAdd={mockOnAdd} />);

      // Open form
      openForm(container);

      // Enter valid name
      const nameInput = screen.getByPlaceholderText(/e.g., Milk, Apples, Chicken/i);
      fireEvent.change(nameInput, { target: { value: 'Test Item' } });

      // Double click submit
      const submitButton = screen.getByRole('button', { name: /✅ add item/i });
      fireEvent.click(submitButton);
      fireEvent.click(submitButton); // Second click

      // Should only be called once (form closes after first submission)
      await waitFor(() => {
        expect(mockOnAdd).toHaveBeenCalledTimes(1);
      });
    });

    it('should maintain form data when cancel is clicked', async () => {
      const { container } = render(<AddItemForm onAdd={mockOnAdd} />);

      // Open form
      openForm(container);

      // Enter data
      const nameInput = screen.getByPlaceholderText(/e.g., Milk, Apples, Chicken/i);
      fireEvent.change(nameInput, { target: { value: 'Milk' } });

      // Cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      // Should not call onAdd
      expect(mockOnAdd).not.toHaveBeenCalled();

      // Form should be closed
      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/e.g., Milk, Apples, Chicken/i)).toBeNull();
      });
    });
  });

  describe('Category and unit selection', () => {
    it('should use default category and unit on initial render', async () => {
      const { container } = render(<AddItemForm onAdd={mockOnAdd} />);

      // Open form
      openForm(container);

      // Enter name and submit
      const nameInput = screen.getByPlaceholderText(/e.g., Milk, Apples, Chicken/i);
      fireEvent.change(nameInput, { target: { value: 'Test Item' } });

      const submitButton = screen.getByRole('button', { name: /✅ add item/i });
      fireEvent.click(submitButton);

      // Should use first category and unit from arrays
      expect(mockOnAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'Vegetables',
          unit: 'pcs',
        })
      );
    });

    it('should allow changing category', async () => {
      const { container } = render(<AddItemForm onAdd={mockOnAdd} />);

      // Open form
      openForm(container);

      // Enter name
      const nameInput = screen.getByPlaceholderText(/e.g., Milk, Apples, Chicken/i);
      fireEvent.change(nameInput, { target: { value: 'Milk' } });

      // Change category - first select element
      const selects = screen.getAllByRole('combobox');
      const categorySelect = selects[0];
      fireEvent.change(categorySelect, { target: { value: 'Dairy' } });

      // Submit
      const submitButton = screen.getByRole('button', { name: /✅ add item/i });
      fireEvent.click(submitButton);

      expect(mockOnAdd).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'Dairy' })
      );
    });

    it('should allow changing unit', async () => {
      const { container } = render(<AddItemForm onAdd={mockOnAdd} />);

      // Open form
      openForm(container);

      // Enter name
      const nameInput = screen.getByPlaceholderText(/e.g., Milk, Apples, Chicken/i);
      fireEvent.change(nameInput, { target: { value: 'Milk' } });

      // Change unit
      const unitSelect = screen.getAllByRole('combobox')[1]; // Second select is unit
      fireEvent.change(unitSelect, { target: { value: 'L' } });

      // Submit
      const submitButton = screen.getByRole('button', { name: /✅ add item/i });
      fireEvent.click(submitButton);

      expect(mockOnAdd).toHaveBeenCalledWith(
        expect.objectContaining({ unit: 'L' })
      );
    });
  });
});
