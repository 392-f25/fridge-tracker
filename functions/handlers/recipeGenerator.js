const functions = require('firebase-functions');
const { generateRecipe } = require('../services/openai');

/**
 * Firebase Callable Function to generate a recipe from selected ingredients
 * @param {Object} data - Request data containing ingredients array
 * @param {string[]} data.ingredients - Array of ingredient names
 * @returns {Promise<Object>} Generated recipe
 */
const generateRecipeFromIngredients = functions
  .runWith({ timeoutSeconds: 30, memory: '256MB' })
  .https
  .onCall(async (data, context) => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to generate recipes'
      );
    }

    const { ingredients } = data;

    // Validate input
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Ingredients array is required and must not be empty'
      );
    }

    if (ingredients.length > 10) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Maximum 10 ingredients allowed'
      );
    }

    try {
      console.log(`[generateRecipeFromIngredients] Generating recipe for user ${context.auth.uid} with ingredients:`, ingredients);

      const recipe = await generateRecipe(ingredients);
      
      // Add a generated ID and timestamp
      recipe.id = `generated-${Date.now()}`;
      recipe.generatedAt = new Date().toISOString();

      console.log(`[generateRecipeFromIngredients] Recipe generated successfully:`, recipe.name);

      return recipe;
    } catch (error) {
      console.error('[generateRecipeFromIngredients] Error generating recipe:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to generate recipe',
        error.message
      );
    }
  });

module.exports = generateRecipeFromIngredients;

