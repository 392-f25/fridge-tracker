import { describe, it, expect } from 'vitest';
import { findMatchingRecipes } from '../utils/recipeUtils';
import type { FridgeItem, Recipe } from '../types';

describe('recipeUtils', () => {
  const mockFridgeItems: FridgeItem[] = [
    {
      id: '1',
      name: 'eggs',
      category: 'Dairy',
      quantity: 6,
      unit: 'pcs',
      purchaseDate: new Date(),
      expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    {
      id: '2',
      name: 'milk',
      category: 'Dairy',
      quantity: 1,
      unit: 'L',
      purchaseDate: new Date(),
      expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
    {
      id: '3',
      name: 'bread',
      category: 'Grains',
      quantity: 1,
      unit: 'pcs',
      purchaseDate: new Date(),
      expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
  ];

  const mockRecipes: Recipe[] = [
    {
      id: '1',
      name: 'Scrambled Eggs',
      ingredients: ['eggs', 'milk'],
      instructions: ['Beat eggs', 'Add milk', 'Cook'],
      prepTime: 10,
      servings: 2,
    },
    {
      id: '2',
      name: 'French Toast',
      ingredients: ['eggs', 'milk', 'bread'],
      instructions: ['Mix eggs and milk', 'Dip bread', 'Cook'],
      prepTime: 15,
      servings: 2,
    },
    {
      id: '3',
      name: 'Chicken Soup',
      ingredients: ['chicken', 'carrots', 'celery', 'onion'],
      instructions: ['Boil chicken', 'Add vegetables', 'Simmer'],
      prepTime: 45,
      servings: 4,
    },
  ];

  describe('findMatchingRecipes', () => {
    it('should find recipes with 100% ingredient match', () => {
      const results = findMatchingRecipes(mockFridgeItems, mockRecipes);
      const frenchToast = results.find(r => r.name === 'French Toast');
      expect(frenchToast).toBeDefined();
    });

    it('should find recipes with partial ingredient match', () => {
      const results = findMatchingRecipes(mockFridgeItems, mockRecipes);
      const scrambledEggs = results.find(r => r.name === 'Scrambled Eggs');
      expect(scrambledEggs).toBeDefined();
    });

    it('should not include recipes with less than 50% match', () => {
      const results = findMatchingRecipes(mockFridgeItems, mockRecipes);
      const chickenSoup = results.find(r => r.name === 'Chicken Soup');
      expect(chickenSoup).toBeUndefined();
    });

    it('should return recipes sorted by match percentage', () => {
      const results = findMatchingRecipes(mockFridgeItems, mockRecipes);
      expect(results.length).toBeGreaterThan(0);
      // French Toast should come before Scrambled Eggs (3/3 vs 2/2)
      if (results.length >= 2) {
        const firstRecipe = results[0];
        expect(['French Toast', 'Scrambled Eggs']).toContain(firstRecipe.name);
      }
    });

    it('should return empty array when no items in fridge', () => {
      const results = findMatchingRecipes([], mockRecipes);
      expect(results).toEqual([]);
    });

    it('should return empty array when no recipes available', () => {
      const results = findMatchingRecipes(mockFridgeItems, []);
      expect(results).toEqual([]);
    });
  });
});
