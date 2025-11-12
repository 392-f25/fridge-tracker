import React from 'react';
import type { FridgeItem } from '../types';

interface ShoppingListModalProps {
  items: FridgeItem[];
  onClose: () => void;
  onRemove: (id: string) => void;
}

export const ShoppingListModal: React.FC<ShoppingListModalProps> = ({ items, onClose, onRemove }) => {
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-[rgba(15,23,42,0.5)] flex items-center justify-center p-6 z-[12000]"
      onClick={handleOverlayClick}
    >
      <div 
        className="w-full max-w-[600px] bg-white/95 backdrop-blur-lg rounded-3xl p-7 border-2 border-[var(--border-light)] shadow-[0_24px_50px_rgba(15,23,42,0.15)] max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h3 className="m-0 text-2xl flex items-center gap-2.5">
            <span className="text-3xl">🛒</span>
            Shopping List
            {items.length > 0 && (
              <span className="text-sm font-semibold bg-gradient-to-br from-[var(--fresh-cyan)] to-[var(--fresh-mint)] text-white px-3 py-1 rounded-full ml-2">
                {items.length}
              </span>
            )}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="bg-transparent text-[var(--text-secondary)] text-2xl font-semibold px-2.5 py-1.5 shadow-none hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <div className="p-12 bg-gradient-to-br from-[#f0fdfa] to-[#ccfbf1] rounded-2xl border-2 border-dashed border-[var(--border-medium)] text-center text-[var(--text-secondary)]">
            <div className="text-6xl mb-4">🛒</div>
            <div className="text-lg font-semibold mb-2">
              Your shopping list is empty
            </div>
            <div className="text-[var(--text-muted)]">
              Add items from your fridge to your shopping list
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map(item => (
              <div
                key={item.id}
                className="bg-gradient-to-br from-[#f0fdfa] to-[#ccfbf1] border-2 border-[#a7f3d0] rounded-2xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-200"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="m-0 mb-2 text-lg font-bold text-[var(--text-primary)] tracking-tight">
                      {item.name}
                    </h4>
                    <div className="flex gap-3 flex-wrap">
                      <span className="bg-white/80 px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] inline-flex items-center gap-1.5 border border-[var(--border-light)]">
                        📦 {item.quantity} {item.unit}
                      </span>
                      <span className="bg-white/80 px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] inline-flex items-center gap-1.5 border border-[var(--border-light)]">
                        🏷️ {item.category}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemove(item.id)}
                    className="bg-gradient-to-br from-[#ef4444] to-[#dc2626] text-white border-none rounded-xl px-4 py-2.5 cursor-pointer text-sm font-bold shadow-[0_2px_8px_rgba(239,68,68,0.3)] transition-all duration-200 whitespace-nowrap ml-3"
                    aria-label={`Remove ${item.name} from shopping list`}
                  >
                    🗑️ Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

