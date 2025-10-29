import React, { useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import enUS from 'date-fns/locale/en-US';
import type { FridgeItem } from '../types';
import { categories, units } from '../constants/itemOptions';

interface EditItemModalProps {
  item: FridgeItem;
  onCancel: () => void;
  onSave: (updated: FridgeItem) => void;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({ item, onCancel, onSave }) => {
  registerLocale('en-US', enUS);

  const [formData, setFormData] = useState({
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    unit: item.unit,
    purchaseDate: new Date(item.purchaseDate),
    expirationDate: new Date(item.expirationDate),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.expirationDate) {
      alert('Please fill in all required fields');
      return;
    }

    onSave({
      ...item,
      ...formData,
      purchaseDate: new Date(formData.purchaseDate),
      expirationDate: new Date(formData.expirationDate),
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        zIndex: 12000,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: 520,
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 20,
          padding: '28px',
          border: '2px solid var(--border-light)',
          boxShadow: '0 24px 50px rgba(15, 23, 42, 0.15)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 22, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 26 }}>✏️</span>
            Edit Item
          </h3>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: 14,
              fontWeight: 600,
              padding: '6px 10px',
              boxShadow: 'none',
            }}
          >
            ✖ Close
          </button>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            Item Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '10px',
              border: '2px solid var(--border-light)',
              fontSize: 15,
              background: 'var(--card-bg)',
              color: 'var(--text-primary)',
              fontWeight: 500,
            }}
            placeholder="e.g., Milk, Apples, Chicken"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '2px solid var(--border-light)',
                fontSize: 15,
                background: 'var(--card-bg)',
                color: 'var(--text-primary)',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Quantity & Unit
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '2px solid var(--border-light)',
                  fontSize: 15,
                  background: 'var(--card-bg)',
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                }}
              />
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '2px solid var(--border-light)',
                  fontSize: 15,
                  background: 'var(--card-bg)',
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {units.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Purchase Date
            </label>
            <DatePicker
              selected={formData.purchaseDate}
              onChange={(date: Date | null) => setFormData({ ...formData, purchaseDate: date || new Date() })}
              dateFormat="MMM d, yyyy"
              locale="en-US"
              className="input-date"
              portalId="react-datepicker-portal"
              wrapperClassName="date-wrapper"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Expiration Date *
            </label>
            <DatePicker
              selected={formData.expirationDate}
              onChange={(date: Date | null) => setFormData({ ...formData, expirationDate: date || new Date() })}
              dateFormat="MMM d, yyyy"
              locale="en-US"
              className="input-date"
              portalId="react-datepicker-portal"
              wrapperClassName="date-wrapper"
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="submit"
            style={{
              flex: 1,
              padding: '14px',
              background: 'linear-gradient(135deg, var(--fresh-mint) 0%, var(--fresh-green) 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            }}
          >
            💾 Save Changes
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '14px',
              background: 'var(--text-muted)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
