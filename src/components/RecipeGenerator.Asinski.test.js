import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { RecipeGenerator } from './RecipeGenerator';

// Mock the generateRecipeFromIngredients function
const mockGenerateRecipeFromIngredients = vi.fn();

vi.mock('../utils/firebase', () => ({
  generateRecipeFromIngredients: (...args) => mockGenerateRecipeFromIngredients(...args),
}));

describe('RecipeGenerator', () => {
  const mockOnRecipeGenerated = vi.fn();

  const baseItems = [
    {
      id: 'item-1',
      name: 'Milk',
      category: 'Dairy',
      quantity: 1,
      unit: 'gallon',
      purchaseDate: new Date('2024-01-01'),
      expirationDate: new Date('2024-01-10'),
    },
    {
      id: 'item-2',
      name: 'Eggs',
      category: 'Dairy',
      quantity: 12,
      unit: 'count',
      purchaseDate: new Date('2024-01-01'),
      expirationDate: new Date('2024-01-08'),
    },
    {
      id: 'item-3',
      name: 'Bread',
      category: 'Bakery',
      quantity: 1,
      unit: 'loaf',
      purchaseDate: new Date('2024-01-01'),
      expirationDate: new Date('2024-01-12'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generated recipe uses all the fridge items that were sent in the initial query', async () => {
    const user = userEvent.setup();

    // Mock the recipe generation to return a recipe that includes all ingredients
    const allIngredientNames = baseItems.map(item => item.name);
    mockGenerateRecipeFromIngredients.mockResolvedValue({
      id: 'generated-recipe-1',
      name: 'Test Recipe',
      ingredients: allIngredientNames, // Recipe includes all fridge items
      instructions: ['Step 1', 'Step 2'],
      prepTime: 15,
      servings: 4,
    });

    // Render the component with all fridge items
    render(
      React.createElement(RecipeGenerator, {
        items: baseItems,
        onRecipeGenerated: mockOnRecipeGenerated,
      })
    );

    // Click the "Generate" button to show the selector
    const generateButton = screen.getByRole('button', { name: /generate/i });
    await user.click(generateButton);

    // Wait for the selector to appear and select all items
    await waitFor(() => {
      expect(screen.getByText(/select ingredients/i)).toBeInTheDocument();
    });

    // Select all items by clicking their checkboxes
    for (const item of baseItems) {
      const checkbox = screen.getByRole('checkbox', { name: new RegExp(item.name, 'i') });
      await user.click(checkbox);
    }

    // Click the "Generate Recipe" button
    const generateRecipeButton = screen.getByRole('button', { name: /generate recipe/i });
    await user.click(generateRecipeButton);

    // Wait for the recipe generation to complete
    await waitFor(() => {
      expect(mockGenerateRecipeFromIngredients).toHaveBeenCalled();
    });

    // Verify that generateRecipeFromIngredients was called with all ingredient names
    expect(mockGenerateRecipeFromIngredients).toHaveBeenCalledWith(allIngredientNames);

    // Wait for the callback to be called with the generated recipe
    await waitFor(() => {
      expect(mockOnRecipeGenerated).toHaveBeenCalled();
    });

    // Get the recipe that was passed to the callback
    const generatedRecipe = mockOnRecipeGenerated.mock.calls[0][0];

    // Verify that the generated recipe's ingredients include all fridge item names
    allIngredientNames.forEach(ingredientName => {
      expect(generatedRecipe.ingredients).toContain(ingredientName);
    });

    // Also verify that all ingredients from the recipe are accounted for
    // (the recipe should use all the items we sent)
    expect(generatedRecipe.ingredients.length).toBeGreaterThanOrEqual(allIngredientNames.length);
  });
});

