import React, { useState } from 'react';
import type { Recipe } from '../types';

interface RecipeListProps {
  recipes: Recipe[];
}

export const RecipeList: React.FC<RecipeListProps> = ({ recipes }) => {
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);

  if (recipes.length === 0) {
    return (
      <div className="bg-gradient-to-br from-[var(--card-secondary)] to-[var(--card-tertiary)] p-7 rounded-xl text-center text-[var(--text-secondary)] border-2 border-[var(--border-light)]">
        <div className="text-5xl mb-3">🍽️</div>
        <p className="m-0 font-medium text-sm">
          Add items to your fridge to see recipe suggestions based on your ingredients!
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-3">
        {recipes.map(recipe => (
          <div
            key={recipe.id}
            className="bg-white/90 backdrop-blur-lg border-2 border-[var(--border-light)] rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-200"
          >
            <div className="mb-3">
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

            <button
              onClick={() =>
                setExpandedRecipe(expandedRecipe === recipe.id ? null : recipe.id)
              }
              className={`${expandedRecipe === recipe.id ? 'bg-[var(--text-muted)]' : 'bg-gradient-to-br from-[var(--fresh-cyan)] to-[var(--cool-sky)]'} text-white border-none rounded-lg px-3.5 py-2 cursor-pointer text-xs font-bold shadow-[0_2px_6px_rgba(6,182,212,0.2)] transition-all duration-200`}
            >
              {expandedRecipe === recipe.id ? '🔼 Hide Instructions' : '🔽 Show Instructions'}
            </button>

            {expandedRecipe === recipe.id && (
              <div className="mt-4 pt-4 border-t-2 border-[var(--border-light)]">
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
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
