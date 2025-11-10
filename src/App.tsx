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
import { Banner } from './components/banner';
import { useAuthState, signInWithGoogle } from './utils/firebase';

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

  const { isAuthenticated, isInitialLoading } = useAuthState();

  return (
    <div className="app-container max-w-[1200px] mx-auto px-6 py-10 min-h-screen">
      <Banner />
      <header className="text-center mb-12 p-8 bg-white/70 backdrop-blur-lg rounded-3xl shadow-[0_8px_32px_rgba(6,182,212,0.1)] border-2 border-[rgba(165,243,252,0.3)]">
        <h1 className="m-0 mb-3 text-5xl tracking-tight">
          What2Eat
        </h1>
        <div className="text-[var(--text-secondary)] text-lg font-medium">
          Keep your groceries fresh & organized
        </div>
        <div className="mt-2 text-[var(--text-muted)] text-sm">
          All data stored locally on your device
        </div>
      </header>

      <main>
        {isInitialLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center text-lg">Loading...</div>
          </div>
        ) : !isAuthenticated ? (
          <div className="w-full max-w-2xl mx-auto">
            <div className="w-full max-w-md mx-auto p-6 bg-white/80 backdrop-blur-lg rounded-2xl border-2 border-(--border-light) text-center">
              <h3 className="text-xl font-semibold mb-3">Please sign in to continue</h3>
              <p className="text-sm text-(--text-muted) mb-4">Sign in to save and manage your fridge items.</p>
              <button
                onClick={signInWithGoogle}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Sign in with Google
              </button>
            </div>
          </div>
        ) : (
          <>
            <ExpirationAlert warnings={warnings} />

            <AddItemForm onAdd={handleAdd} />

            <section className="grid grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-8 items-start">
              <div>
                <div className="flex items-center justify-between mb-5 px-1">
                  <h2 className="text-2xl m-0 flex items-center gap-2.5">
                    <span className="text-3xl">🧊</span>
                    Your Items
                    {sortedItems.length > 0 && (
                      <span className="text-sm font-semibold bg-gradient-to-br from-(--fresh-cyan) to-(--fresh-mint) text-white px-3 py-1 rounded-full ml-2">
                        {sortedItems.length}
                      </span>
                    )}
                  </h2>
                </div>

                {sortedItems.length === 0 && (
                  <div className="p-12 bg-white/60 backdrop-blur-lg rounded-2xl border-2 border-dashed border-(--border-medium) text-center text-(--text-secondary)">
                    <div className="text-6xl mb-4">🥗</div>
                    <div className="text-lg font-semibold mb-2">
                      Your fridge is empty
                    </div>
                    <div className="text-(--text-muted)">
                      Add items to start tracking freshness and get recipe suggestions
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-4">
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

              <aside className="sticky top-6">
                <div className="mb-6 bg-white/70 backdrop-blur-lg p-6 rounded-2xl border-2 border-(--border-light) shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
                  <h3 className="m-0 mb-4 text-xl flex items-center gap-2">
                    <span className="text-2xl">🍳</span>
                    Recipe Ideas
                  </h3>

                  {suggestedRecipes.length === 0 ? (
                    <div className="p-5 bg-gradient-to-br from-[#fef3c7] to-[#fde68a] rounded-xl text-[#92400e] text-center text-sm">
                      <div className="text-3xl mb-2">👨‍🍳</div>
                      Add ingredients to unlock recipe suggestions
                    </div>
                  ) : (
                    <>
                      {suggestedRecipes.length <= 2 && (
                        <div className="mb-3 p-3 bg-(--card-tertiary) rounded-lg text-(--text-secondary) text-xs border-l-[3px] border-(--fresh-cyan)">
                          Showing partial matches based on your ingredients
                        </div>
                      )}
                      <RecipeList recipes={suggestedRecipes} />
                    </>
                  )}
                </div>

                <div className="p-6 bg-white/70 backdrop-blur-lg border-2 border-(--border-light) rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
                  <h4 className="mt-0 mb-4 text-base flex items-center gap-2">
                    <span className="text-xl">⚡</span>
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
                    className={`w-full p-3 ${items.length === 0 ? 'bg-[#cbd5e1]' : 'bg-gradient-to-br from-[#ef4444] to-[#dc2626]'} text-white border-none rounded-xl text-sm font-semibold ${items.length === 0 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer opacity-100'}`}
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
          </>
        )}
      </main>
    </div>
  );
}

export default App;
