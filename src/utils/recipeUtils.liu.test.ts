import { describe, it, expect } from 'vitest';
import { findMatchingRecipes } from './recipeUtils';
import type { FridgeItem, Recipe } from '../types';

describe('recipeUtils - Liu Tests', () => {
  // Test 2 (harder): Given a list of items, the function should return recipe containing all 
  // of the ingredients
  describe('findMatchingRecipes - 100% ingredient match', () => {
    it('should return recipes where all recipe ingredients are available in fridge', () => {
      const fridgeItems: FridgeItem[] = [
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
        {
          id: '4',
          name: 'butter',
          category: 'Dairy',
          quantity: 200,
          unit: 'g',
          purchaseDate: new Date(),
          expirationDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      ];

      const recipes: Recipe[] = [
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
          name: 'Buttered Toast',
          ingredients: ['bread', 'butter'],
          instructions: ['Toast bread', 'Spread butter'],
          prepTime: 5,
          servings: 1,
        },
        {
          id: '4',
          name: 'Chicken Curry',
          ingredients: ['chicken', 'curry powder', 'coconut milk', 'onion'],
          instructions: ['Cook chicken', 'Add spices', 'Simmer'],
          prepTime: 45,
          servings: 4,
        },
      ];

      const results = findMatchingRecipes(fridgeItems, recipes);

      // Should include recipes where all ingredients are available
      const recipeNames = results.map(r => r.name);
      
      // French Toast should be included (has eggs, milk, bread - all 3 ingredients available)
      expect(recipeNames).toContain('French Toast');
      
      // Scrambled Eggs should be included (has eggs, milk - both available)
      expect(recipeNames).toContain('Scrambled Eggs');
      
      // Buttered Toast should be included (has bread, butter - both available)
      expect(recipeNames).toContain('Buttered Toast');
      
      // Chicken Curry should NOT be included (missing chicken, curry powder, coconut milk, onion)
      expect(recipeNames).not.toContain('Chicken Curry');
    });

    it('should return empty array when no recipes have all ingredients available', () => {
      const fridgeItems: FridgeItem[] = [
        {
          id: '1',
          name: 'tomato',
          category: 'Vegetables',
          quantity: 3,
          unit: 'pcs',
          purchaseDate: new Date(),
          expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        },
      ];

      const recipes: Recipe[] = [
        {
          id: '1',
          name: 'Pasta Carbonara',
          ingredients: ['pasta', 'eggs', 'bacon', 'cheese'],
          instructions: ['Cook pasta', 'Mix ingredients'],
          prepTime: 20,
          servings: 2,
        },
        {
          id: '2',
          name: 'Chicken Soup',
          ingredients: ['chicken', 'carrots', 'celery', 'onion'],
          instructions: ['Boil chicken', 'Add vegetables'],
          prepTime: 45,
          servings: 4,
        },
      ];

      const results = findMatchingRecipes(fridgeItems, recipes);

      // Should return empty array since tomato doesn't match any recipe's ingredient list
      expect(results.length).toBe(0);
    });

    it('should correctly match when fridge has extra items beyond recipe requirements', () => {
      const fridgeItems: FridgeItem[] = [
        {
          id: '1',
          name: 'eggs',
          category: 'Dairy',
          quantity: 12,
          unit: 'pcs',
          purchaseDate: new Date(),
          expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        {
          id: '2',
          name: 'milk',
          category: 'Dairy',
          quantity: 2,
          unit: 'L',
          purchaseDate: new Date(),
          expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        },
        {
          id: '3',
          name: 'cheese',
          category: 'Dairy',
          quantity: 300,
          unit: 'g',
          purchaseDate: new Date(),
          expirationDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        },
        {
          id: '4',
          name: 'tomatoes',
          category: 'Vegetables',
          quantity: 5,
          unit: 'pcs',
          purchaseDate: new Date(),
          expirationDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        },
        {
          id: '5',
          name: 'spinach',
          category: 'Vegetables',
          quantity: 200,
          unit: 'g',
          purchaseDate: new Date(),
          expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
      ];

      const recipes: Recipe[] = [
        {
          id: '1',
          name: 'Omelette',
          ingredients: ['eggs', 'milk'],
          instructions: ['Beat eggs with milk', 'Cook in pan'],
          prepTime: 8,
          servings: 1,
        },
      ];

      const results = findMatchingRecipes(fridgeItems, recipes);

      // Should match Omelette even though we have extra ingredients (cheese, tomatoes, spinach)
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toBe('Omelette');
    });
  });
});
