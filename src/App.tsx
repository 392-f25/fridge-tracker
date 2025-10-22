import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import type { FridgeItem, Recipe } from './types';
import { AddItemForm } from './components/AddItemForm';
import { FridgeItemComponent } from './components/FridgeItem';
import { ExpirationAlert } from './components/ExpirationAlert';
import { RecipeList } from './components/RecipeList';
import { getMockRecipes, findMatchingRecipes } from './utils/recipeUtils';
import { getExpirationWarnings } from './utils/dateUtils';

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

  const warnings = useMemo(() => getExpirationWarnings(items), [items]);

  const recipes = useMemo(() => getMockRecipes(), []);
  const suggestedRecipes = useMemo(() => findMatchingRecipes(items, recipes), [items, recipes]);

  return (
    <div className="app-container" style={{ maxWidth: 900, margin: '32px auto', padding: '0 16px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Fridge Tracker</h1>
        <div style={{ color: '#6b7280' }}>Manage your fridge — local only</div>
      </header>

      <main>
        <ExpirationAlert warnings={warnings} />

        <AddItemForm onAdd={handleAdd} />

        <section style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
          <div>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Items</h2>
            {items.length === 0 && (
              <div style={{ padding: 20, background: '#f8fafc', borderRadius: 8, color: '#6b7280' }}>
                Your fridge is empty. Add items to get started.
              </div>
            )}
            <div style={{ marginTop: 12 }}>
              {items.map(item => (
                <FridgeItemComponent key={item.id} item={item} onDelete={handleDelete} />
              ))}
            </div>
          </div>

          <aside>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 8px 0' }}>Recipe Suggestions</h3>
              <RecipeList recipes={suggestedRecipes} />
            </div>

            <div style={{ padding: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}>
              <h4 style={{ marginTop: 0 }}>Quick Actions</h4>
              <button
                onClick={() => setItems([])}
                style={{ width: '100%', padding: 10, background: '#ef4444', color: 'white', border: 'none', borderRadius: 6 }}
              >
                Clear All Items
              </button>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

export default App;
