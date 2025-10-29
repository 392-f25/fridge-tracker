/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import './App.css';
import type { FridgeItem } from './types';
import { AddItemForm } from './components/AddItemForm';
import { FridgeItemComponent } from './components/FridgeItem';
import { ExpirationAlert } from './components/ExpirationAlert';
import { RecipeList } from './components/RecipeList';
import { EditItemModal } from './components/EditItemModal';
import { getMockRecipes, findMatchingRecipesRelaxed } from './utils/recipeUtils';
import { getExpirationWarnings, calculateDaysUntilExpiration } from './utils/dateUtils';

const STORAGE_KEY = 'fridge_items_v1';

const loadItems = (): FridgeItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as any[];
    return parsed.map(p => ({
      ...p,
      purchaseDate: new Date(p.purchaseDate),
      expirationDate: new Date(p.expirationDate),
    }));
  } catch (e) {
    console.warn('Failed to load fridge items from localStorage', e);
    return [];
  }
};

const saveItems = (items: FridgeItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Failed to save fridge items to localStorage', e);
  }
};

function App() {
  const [items, setItems] = useState<FridgeItem[]>(() => loadItems());
  const [editingItem, setEditingItem] = useState<FridgeItem | null>(null);

  useEffect(() => {
    saveItems(items);
  }, [items]);

  const handleAdd = (item: Omit<FridgeItem, 'id'>) => {
    const newItem: FridgeItem = { ...item, id: Date.now().toString() };
    setItems(prev => [newItem, ...prev]);
  };

  const handleDelete = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleUpdate = (updatedItem: FridgeItem) => {
    setItems(prev =>
      prev.map(item => (item.id === updatedItem.id ? updatedItem : item))
    );
    setEditingItem(null);
  };

  const warnings = useMemo(() => getExpirationWarnings(items), [items]);

  // Sort items by expiration date (soonest first), then alphabetically by name
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const daysA = calculateDaysUntilExpiration(a.expirationDate);
      const daysB = calculateDaysUntilExpiration(b.expirationDate);
      
      // Primary sort: by days until expiration (ascending - soonest first)
      if (daysA !== daysB) {
        return daysA - daysB;
      }
      
      // Secondary sort: alphabetically by name (case-insensitive)
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
  }, [items]);

  const recipes = useMemo(() => getMockRecipes(), []);
  const suggestedRecipes = useMemo(() => findMatchingRecipesRelaxed(items, recipes), [items, recipes]);

  return (
    <div className="app-container" style={{
      maxWidth: 1200,
      margin: '0 auto',
      padding: '40px 24px',
      minHeight: '100vh'
    }}>
      <header style={{
        textAlign: 'center',
        marginBottom: 48,
        padding: '32px 24px',
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        borderRadius: 24,
        boxShadow: '0 8px 32px rgba(6, 182, 212, 0.1)',
        border: '2px solid rgba(165, 243, 252, 0.3)'
      }}>
        <h1 style={{
          margin: '0 0 12px 0',
          fontSize: '3rem',
          letterSpacing: '-0.03em'
        }}>
          What2Eat
        </h1>
        <div style={{
          color: 'var(--text-secondary)',
          fontSize: '1.1rem',
          fontWeight: 500
        }}>
          Keep your fridge fresh & organized
        </div>
        <div style={{
          marginTop: 8,
          color: 'var(--text-muted)',
          fontSize: '0.875rem'
        }}>
          All data stored locally on your device
        </div>
      </header>

      <main>
        <ExpirationAlert warnings={warnings} />

        <AddItemForm onAdd={handleAdd} />

        <section style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1fr)',
          gap: 32,
          alignItems: 'start'
        }}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
              padding: '0 4px'
            }}>
              <h2 style={{
                fontSize: 24,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                <span style={{ fontSize: 28 }}>🧊</span>
                Your Items
                {sortedItems.length > 0 && (
                  <span style={{
                    fontSize: 14,
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, var(--fresh-cyan), var(--fresh-mint))',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: 20,
                    marginLeft: 8
                  }}>
                    {sortedItems.length}
                  </span>
                )}
              </h2>
            </div>

            {sortedItems.length === 0 && (
              <div style={{
                padding: 48,
                background: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(10px)',
                borderRadius: 16,
                border: '2px dashed var(--border-medium)',
                textAlign: 'center',
                color: 'var(--text-secondary)'
              }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🥗</div>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                  Your fridge is empty
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  Add items to start tracking freshness and get recipe suggestions
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {sortedItems.map(item => (
                <FridgeItemComponent
                  key={item.id}
                  item={item}
                  onDelete={handleDelete}
                  onEdit={(selected) => setEditingItem(selected)}
                />
              ))}
            </div>
          </div>

          <aside style={{ position: 'sticky', top: 24 }}>
            <div style={{
              marginBottom: 24,
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(10px)',
              padding: 24,
              borderRadius: 16,
              border: '2px solid var(--border-light)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)'
            }}>
              <h3 style={{
                margin: '0 0 16px 0',
                fontSize: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <span style={{ fontSize: 24 }}>🍳</span>
                Recipe Ideas
              </h3>

              {suggestedRecipes.length === 0 ? (
                <div style={{
                  padding: 20,
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  borderRadius: 12,
                  color: '#92400e',
                  textAlign: 'center',
                  fontSize: 14
                }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>👨‍🍳</div>
                  Add ingredients to unlock recipe suggestions
                </div>
              ) : (
                <>
                  {suggestedRecipes.length <= 2 && (
                    <div style={{
                      marginBottom: 12,
                      padding: 12,
                      background: 'var(--card-tertiary)',
                      borderRadius: 8,
                      color: 'var(--text-secondary)',
                      fontSize: 13,
                      borderLeft: '3px solid var(--fresh-cyan)'
                    }}>
                      Showing partial matches based on your ingredients
                    </div>
                  )}
                  <RecipeList recipes={suggestedRecipes} />
                </>
              )}
            </div>

            <div style={{
              padding: 24,
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(10px)',
              border: '2px solid var(--border-light)',
              borderRadius: 16,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)'
            }}>
              <h4 style={{
                marginTop: 0,
                marginBottom: 16,
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <span style={{ fontSize: 20 }}>⚡</span>
                Quick Actions
              </h4>
              <button
                onClick={() => {
                  if (items.length > 0 && !window.confirm('Are you sure you want to clear all items?')) {
                    return;
                  }
                  setItems([]);
                }}
                disabled={items.length === 0}
                style={{
                  width: '100%',
                  padding: 12,
                  background: items.length === 0 ? '#cbd5e1' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: items.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: items.length === 0 ? 0.5 : 1
                }}
              >
                🗑️ Clear All Items
              </button>
            </div>
          </aside>
        </section>
        {editingItem && (
          <EditItemModal
            item={editingItem}
            onCancel={() => setEditingItem(null)}
            onSave={handleUpdate}
          />
        )}
      </main>
    </div>
  );
}

export default App;
