/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import type { FridgeItem } from './types';
import { AddItemForm } from './components/AddItemForm';
import { FridgeItemComponent } from './components/FridgeItem';
import { ExpirationAlert } from './components/ExpirationAlert';
import { RecipeList } from './components/RecipeList';
import { EditItemModal } from './components/EditItemModal';
import ReceiptUpload from './components/ReceiptUpload';
import ReceiptStatus from './components/ReceiptStatus';
import { getMockRecipes, findMatchingRecipesRelaxed } from './utils/recipeUtils';
import { getExpirationWarnings, calculateDaysUntilExpiration, isExpired } from './utils/dateUtils';
import { Banner } from './components/banner';
import { useAuthState, signInWithGoogle, getFridgeItemsRef, database, triggerTestExpirationEmail } from './utils/firebase';
import { onValue, push, set, remove, update, ref } from 'firebase/database';

function App() {
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [editingItem, setEditingItem] = useState<FridgeItem | null>(null);
  const [uploadNotification, setUploadNotification] = useState<string | null>(null);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const { user, isAuthenticated, isInitialLoading } = useAuthState();
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  const showNotification = (message: string) => {
    setUploadNotification(message);
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    notificationTimeoutRef.current = setTimeout(() => {
      setUploadNotification(null);
      notificationTimeoutRef.current = null;
    }, 5000);
  };

  // Firebase listener for fridge items
  useEffect(() => {
    if (!user) {
      setItems([]);
      setIsLoadingItems(false);
      return;
    }

    const itemsRef = getFridgeItemsRef(user.uid);

    const unsubscribe = onValue(itemsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const itemsArray = Object.entries(data).map(([id, item]: [string, any]) => ({
          id,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit || 'unit',
          purchaseDate: new Date(item.addedDate),
          expirationDate: new Date(item.expirationDate),
          imageUrl: item.imageUrl,
          receiptId: item.receiptId
        }));
        setItems(itemsArray);
      } else {
        setItems([]);
      }
      setIsLoadingItems(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAdd = async (item: Omit<FridgeItem, 'id'>) => {
    if (!user) return;

    const itemsRef = getFridgeItemsRef(user.uid);
    const newItemRef = push(itemsRef);

    await set(newItemRef, {
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      addedDate: item.purchaseDate.toISOString(),
      expirationDate: item.expirationDate.toISOString(),
      imageUrl: item.imageUrl || null
    });
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    await remove(ref(database, `users/${user.uid}/fridgeItems/${id}`));
  };

  const handleUpdate = async (updatedItem: FridgeItem) => {
    if (!user) return;
    await update(ref(database, `users/${user.uid}/fridgeItems/${updatedItem.id}`), {
      name: updatedItem.name,
      category: updatedItem.category,
      quantity: updatedItem.quantity,
      unit: updatedItem.unit,
      expirationDate: updatedItem.expirationDate.toISOString(),
      addedDate: updatedItem.purchaseDate.toISOString()
    });
    setEditingItem(null);
  };

  const handleUploadComplete = (receiptId: string) => {
    showNotification(`Receipt ${receiptId} uploaded! Items will appear shortly.`);
  };

  const handleUploadError = (error: string) => {
    showNotification(`Error: ${error}`);
  };

  const handleTestEmail = async () => {
    if (!user) {
      showNotification('Please sign in to send a test email.');
      return;
    }

    setIsSendingTestEmail(true);
    try {
      const result = await triggerTestExpirationEmail();

      if (result.status === 'sent') {
        showNotification(`Email sent! ${result.counts?.expiring ?? 0} expiring / ${result.counts?.expired ?? 0} expired items.`);
      } else if (result.reason === 'NO_ITEMS') {
        showNotification('All clear — nothing is expiring or expired.');
      } else if (result.reason === 'NO_EMAIL') {
        showNotification('Cannot send email because your account has no email address.');
      } else {
        showNotification('Test email skipped.');
      }
    } catch (error) {
      console.error('[handleTestEmail] Failed to send test email', error);
      showNotification('Unable to send the test email right now.');
    } finally {
      setIsSendingTestEmail(false);
    }
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
    <div className="app-container max-w-[1200px] mx-auto px-6 py-10 min-h-screen">
      <Banner />

      {/* Notification Toast */}
      {uploadNotification && (
        <div className="fixed top-20 right-6 bg-white/95 backdrop-blur-lg rounded-xl p-4 shadow-lg z-50 max-w-md animate-fade-in">
          <p className="text-[#0f172a]">{uploadNotification}</p>
        </div>
      )}

      <header className="text-center mb-12 p-8 bg-white/70 backdrop-blur-lg rounded-3xl shadow-[0_8px_32px_rgba(6,182,212,0.1)] border-2 border-[rgba(165,243,252,0.3)]">
        <h1 className="m-0 mb-3 text-5xl tracking-tight">
          What2Eat
        </h1>
        <div className="text-[var(--text-secondary)] text-lg font-medium">
          Keep your groceries fresh & organized
        </div>
        <div className="mt-2 text-[var(--text-muted)] text-sm">
          Track your fridge items and get recipe suggestions
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

                {isLoadingItems ? (
                  <div className="text-center py-12 text-[#94a3b8]">
                    Loading items...
                  </div>
                ) : sortedItems.length === 0 ? (
                  <div className="p-12 bg-white/60 backdrop-blur-lg rounded-2xl border-2 border-dashed border-(--border-medium) text-center text-(--text-secondary)">
                    <div className="text-6xl mb-4">🥗</div>
                    <div className="text-lg font-semibold mb-2">
                      Your fridge is empty
                    </div>
                    <div className="text-(--text-muted)">
                      Add items to start tracking freshness and get recipe suggestions
                    </div>
                  </div>
                ) : (
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
                )}
              </div>

              <aside className="sticky top-6 space-y-6">
                {/* Receipt Upload Section */}
                <ReceiptUpload
                  onUploadComplete={handleUploadComplete}
                  onUploadError={handleUploadError}
                />

                {/* Receipt Status Section */}
                <ReceiptStatus />

                {/* Recipe Ideas Section */}
                <div className="bg-white/70 backdrop-blur-lg p-6 rounded-2xl border-2 border-(--border-light) shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
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
                  {
                    // Only clear expired items
                  }
                  <button
                    onClick={async () => {
                      const expired = items.filter(i => isExpired(i.expirationDate));
                      if (expired.length === 0) return;
                      if (!window.confirm(`Are you sure you want to remove ${expired.length} expired item${expired.length > 1 ? 's' : ''}?`)) {
                        return;
                      }
                      // Delete all expired items from Firebase
                      for (const item of expired) {
                        await handleDelete(item.id);
                      }
                    }}
                    disabled={items.filter(i => isExpired(i.expirationDate)).length === 0}
                    className={`w-full p-3 ${items.filter(i => isExpired(i.expirationDate)).length === 0 ? 'bg-[#cbd5e1]' : 'bg-gradient-to-br from-[#ef4444] to-[#dc2626]'} text-white border-none rounded-xl text-sm font-semibold ${items.filter(i => isExpired(i.expirationDate)).length === 0 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer opacity-100'}`}
                  >
                    🗑️ Clear Expired Items
                  </button>
                  <button
                    onClick={handleTestEmail}
                    disabled={isSendingTestEmail}
                    className={`w-full mt-3 p-3 rounded-xl text-sm font-semibold ${
                      isSendingTestEmail
                        ? 'bg-[#cbd5e1] cursor-wait text-white opacity-80'
                        : 'bg-gradient-to-br from-[var(--fresh-cyan)] to-[var(--fresh-mint)] text-white cursor-pointer'
                    }`}
                  >
                    {isSendingTestEmail ? 'Sending test email…' : '📧 Send Test Email'}
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
