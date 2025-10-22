import type { FridgeItem, Recipe } from '../types';

export const findMatchingRecipes = (items: FridgeItem[], recipes: Recipe[]): Recipe[] => {
  const availableIngredients = items.map(item => item.name.toLowerCase());
  
  return recipes
    .map(recipe => {
      const matchedIngredients = recipe.ingredients.filter(ingredient =>
        availableIngredients.some(available =>
          ingredient.toLowerCase().includes(available) ||
          available.includes(ingredient.toLowerCase())
        )
      );
      
      const matchPercentage = matchedIngredients.length / recipe.ingredients.length;
      
      return {
        recipe,
        matchPercentage,
        matchedCount: matchedIngredients.length,
      };
    })
    .filter(result => result.matchPercentage >= 0.5) // At least 50% ingredients match
    .sort((a, b) => b.matchPercentage - a.matchPercentage)
    .map(result => result.recipe);
};

export const getMockRecipes = (): Recipe[] => {
  return [
    {
      id: '1',
      name: 'Fresh Garden Salad',
      ingredients: ['lettuce', 'tomatoes', 'cucumber', 'olive oil'],
      instructions: [
        'Wash all vegetables thoroughly',
        'Chop lettuce, tomatoes, and cucumber into bite-sized pieces',
        'Combine in a large bowl',
        'Drizzle with olive oil and season to taste',
      ],
      prepTime: 10,
      servings: 4,
    },
    {
      id: '2',
      name: 'Scrambled Eggs with Toast',
      ingredients: ['eggs', 'bread', 'butter', 'milk'],
      instructions: [
        'Beat eggs with a splash of milk',
        'Heat butter in a pan over medium heat',
        'Pour in eggs and gently scramble',
        'Toast bread and serve alongside eggs',
      ],
      prepTime: 15,
      servings: 2,
    },
    {
      id: '3',
      name: 'Chicken Stir Fry',
      ingredients: ['chicken', 'broccoli', 'carrots', 'soy sauce', 'rice'],
      instructions: [
        'Cut chicken into bite-sized pieces',
        'Chop vegetables',
        'Heat oil in a wok or large pan',
        'Cook chicken until browned, then add vegetables',
        'Add soy sauce and stir fry for 5 minutes',
        'Serve over cooked rice',
      ],
      prepTime: 25,
      servings: 4,
    },
    {
      id: '4',
      name: 'Pasta with Tomato Sauce',
      ingredients: ['pasta', 'tomatoes', 'garlic', 'olive oil', 'basil'],
      instructions: [
        'Boil pasta according to package directions',
        'Sauté garlic in olive oil',
        'Add chopped tomatoes and simmer',
        'Season with salt, pepper, and fresh basil',
        'Toss with cooked pasta',
      ],
      prepTime: 20,
      servings: 3,
    },
  ];
};
