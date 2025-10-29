import React, { useState } from 'react';
import type { Recipe } from '../types';

interface RecipeListProps {
  recipes: Recipe[];
}

export const RecipeList: React.FC<RecipeListProps> = ({ recipes }) => {
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);

  if (recipes.length === 0) {
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, var(--card-secondary) 0%, var(--card-tertiary) 100%)',
          padding: '28px',
          borderRadius: '12px',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          border: '2px solid var(--border-light)'
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🍽️</div>
        <p style={{ margin: 0, fontWeight: 500, fontSize: '14px' }}>
          Add items to your fridge to see recipe suggestions based on your ingredients!
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {recipes.map(recipe => (
          <div
            key={recipe.id}
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '2px solid var(--border-light)',
              borderRadius: '14px',
              padding: '18px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ marginBottom: '12px' }}>
              <h3 style={{
                margin: '0 0 10px 0',
                fontSize: '17px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em'
              }}>
                {recipe.name}
              </h3>
              <div style={{
                display: 'flex',
                gap: '12px',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: 500
              }}>
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  ⏱️ {recipe.prepTime} min
                </span>
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  👥 {recipe.servings}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <div style={{
                fontSize: '12px',
                fontWeight: '700',
                marginBottom: '8px',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Ingredients
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {recipe.ingredients.map((ingredient, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
                      color: '#0e7490',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      border: '1px solid #a5f3fc'
                    }}
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
              style={{
                background: expandedRecipe === recipe.id
                  ? 'var(--text-muted)'
                  : 'linear-gradient(135deg, var(--fresh-cyan) 0%, var(--cool-sky) 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 14px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '700',
                boxShadow: '0 2px 6px rgba(6, 182, 212, 0.2)',
                transition: 'all 0.2s ease'
              }}
            >
              {expandedRecipe === recipe.id ? '🔼 Hide Instructions' : '🔽 Show Instructions'}
            </button>

            {expandedRecipe === recipe.id && (
              <div
                style={{
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '2px solid var(--border-light)',
                }}
              >
                <div style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  marginBottom: '10px',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Instructions
                </div>
                <ol style={{
                  margin: 0,
                  paddingLeft: '20px',
                  color: 'var(--text-secondary)'
                }}>
                  {recipe.instructions.map((instruction, idx) => (
                    <li key={idx} style={{
                      marginBottom: '10px',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      fontWeight: 500
                    }}>
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
