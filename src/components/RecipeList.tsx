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
          backgroundColor: '#f9fafb',
          padding: '24px',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#6b7280',
        }}
      >
        <p style={{ margin: 0 }}>
          Add items to your fridge to see recipe suggestions based on your ingredients!
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}>
        🍳 Recipe Suggestions
      </h2>
      <p style={{ color: '#6b7280', marginBottom: '16px' }}>
        Based on your available ingredients, here are some recipes you can make:
      </p>
      
      <div style={{ display: 'grid', gap: '16px' }}>
        {recipes.map(recipe => (
          <div
            key={recipe.id}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ marginBottom: '12px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600' }}>
                {recipe.name}
              </h3>
              <div style={{ display: 'flex', gap: '16px', color: '#6b7280', fontSize: '14px' }}>
                <span>⏱️ {recipe.prepTime} minutes</span>
                <span>👥 {recipe.servings} servings</span>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                Ingredients:
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {recipe.ingredients.map((ingredient, idx) => (
                  <span
                    key={idx}
                    style={{
                      backgroundColor: '#eff6ff',
                      color: '#1e40af',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '13px',
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
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#3b82f6')}
            >
              {expandedRecipe === recipe.id ? 'Hide Instructions' : 'Show Instructions'}
            </button>

            {expandedRecipe === recipe.id && (
              <div
                style={{
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid #e5e7eb',
                }}
              >
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                  Instructions:
                </h4>
                <ol style={{ margin: 0, paddingLeft: '20px', color: '#4b5563' }}>
                  {recipe.instructions.map((instruction, idx) => (
                    <li key={idx} style={{ marginBottom: '8px', fontSize: '14px' }}>
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
