import React from 'react';
import type { Recipe } from '../types';
import { RecipeList } from './RecipeList';

interface GeneratedRecipeListProps {
  recipes: Recipe[];
  onDelete: (recipeId: string) => void;
}

export const GeneratedRecipeList: React.FC<GeneratedRecipeListProps> = ({ recipes, onDelete }) => {
  if (recipes.length === 0) {
    return null;
  }

  return (
    <div className="bg-white/70 backdrop-blur-lg p-6 rounded-2xl border-2 border-[var(--border-light)] shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="m-0 text-xl flex items-center gap-2">
          <span className="text-2xl">🎨</span>
          Generated Recipes
        </h3>
        <span className="text-sm text-[var(--text-secondary)] font-medium">
          {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
        </span>
      </div>

      <div className="space-y-4">
        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            className="bg-white/90 backdrop-blur-lg border-2 border-[var(--border-light)] rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] relative"
          >
            <button
              onClick={() => onDelete(recipe.id)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-600 rounded-full border-none cursor-pointer transition-colors text-sm font-bold"
              title="Delete recipe"
            >
              ×
            </button>

            <div className="mb-3 pr-8">
              <h3 className="m-0 mb-2.5 text-lg font-bold text-[var(--text-primary)] tracking-tight">
                {recipe.name}
              </h3>
              <div className="flex gap-3 text-[var(--text-secondary)] text-xs font-medium">
                <span className="flex items-center gap-1">
                  ⏱️ {recipe.prepTime} min
                </span>
                <span className="flex items-center gap-1">
                  👥 {recipe.servings}
                </span>
              </div>
            </div>

            <div className="mb-3">
              <div className="text-xs font-bold mb-2 text-[var(--text-secondary)] uppercase tracking-wider">
                Ingredients
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recipe.ingredients.map((ingredient, idx) => (
                  <span
                    key={idx}
                    className="bg-gradient-to-br from-[#ecfeff] to-[#cffafe] text-[#0e7490] px-2.5 py-1 rounded-lg text-xs font-semibold border border-[#a5f3fc]"
                  >
                    {ingredient}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold mb-2.5 text-[var(--text-secondary)] uppercase tracking-wider">
                Instructions
              </div>
              <ol className="m-0 pl-5 text-[var(--text-secondary)]">
                {recipe.instructions.map((instruction, idx) => (
                  <li key={idx} className="mb-2.5 text-xs leading-relaxed font-medium">
                    {instruction}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

