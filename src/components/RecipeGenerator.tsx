import React, { useState } from 'react';
import type { FridgeItem, Recipe } from '../types';
import { generateRecipeFromIngredients } from '../utils/firebase';

interface RecipeGeneratorProps {
  items: FridgeItem[];
  onRecipeGenerated: (recipe: Recipe) => void;
}

export const RecipeGenerator: React.FC<RecipeGeneratorProps> = ({ items, onRecipeGenerated }) => {
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);

  const handleIngredientToggle = (ingredient: string) => {
    const newSelected = new Set(selectedIngredients);
    if (newSelected.has(ingredient)) {
      newSelected.delete(ingredient);
    } else {
      newSelected.add(ingredient);
    }
    setSelectedIngredients(newSelected);
  };

  const handleGenerate = async () => {
    if (selectedIngredients.size === 0) {
      setError('Please select at least one ingredient');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const ingredientsArray = Array.from(selectedIngredients);
      const recipeData = await generateRecipeFromIngredients(ingredientsArray);
      
      // Convert to Recipe type
      const recipe: Recipe = {
        id: recipeData.id,
        name: recipeData.name,
        ingredients: recipeData.ingredients,
        instructions: recipeData.instructions,
        prepTime: recipeData.prepTime,
        servings: recipeData.servings
      };

      onRecipeGenerated(recipe);
      
      // Reset state
      setSelectedIngredients(new Set());
      setShowSelector(false);
    } catch (err: any) {
      console.error('Error generating recipe:', err);
      
      // Provide more helpful error messages
      let errorMessage = 'Failed to generate recipe. Please try again.';
      
      if (err.code === 'unavailable' || err.message?.includes('CONNECTION_REFUSED')) {
        errorMessage = 'Cannot connect to recipe service. Please ensure Firebase Functions are deployed or the emulator is running.';
      } else if (err.code === 'internal') {
        errorMessage = 'Recipe generation service error. Please check that the OpenAI API key is configured.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="bg-white/70 backdrop-blur-lg p-6 rounded-2xl border-2 border-[var(--border-light)] shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="m-0 text-xl flex items-center gap-2">
          <span className="text-2xl">✨</span>
          Generate Recipe
        </h3>
        {!showSelector && (
          <button
            onClick={() => setShowSelector(true)}
            className="px-4 py-2 bg-gradient-to-br from-[var(--fresh-cyan)] to-[var(--fresh-mint)] text-white border-none rounded-lg text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity"
          >
            Generate
          </button>
        )}
      </div>

      {showSelector && (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-[var(--text-secondary)] mb-3 font-medium">
              Select ingredients to use in your recipe:
            </p>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {items.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedIngredients.has(item.name)}
                    onChange={() => handleIngredientToggle(item.name)}
                    className="w-4 h-4 text-[var(--fresh-cyan)] rounded cursor-pointer"
                  />
                  <span className="text-sm text-[var(--text-primary)]">{item.name}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || selectedIngredients.size === 0}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold border-none ${
                isGenerating || selectedIngredients.size === 0
                  ? 'bg-[#cbd5e1] text-white cursor-not-allowed opacity-50'
                  : 'bg-gradient-to-br from-[var(--fresh-cyan)] to-[var(--fresh-mint)] text-white cursor-pointer hover:opacity-90'
              } transition-opacity`}
            >
              {isGenerating ? 'Generating...' : `Generate Recipe (${selectedIngredients.size} ingredient${selectedIngredients.size !== 1 ? 's' : ''})`}
            </button>
            <button
              onClick={() => {
                setShowSelector(false);
                setSelectedIngredients(new Set());
                setError(null);
              }}
              disabled={isGenerating}
              className="px-4 py-2 bg-[#e2e8f0] text-[var(--text-secondary)] border-none rounded-lg text-sm font-semibold cursor-pointer hover:bg-[#cbd5e1] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

