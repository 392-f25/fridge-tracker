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
    expirationDate: item.expirationDate ? new Date(item.expirationDate) : null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Please enter an item name');
      return;
    }

    onSave({
      ...item,
      ...formData,
      purchaseDate: new Date(formData.purchaseDate),
      expirationDate: formData.expirationDate ? new Date(formData.expirationDate) : null,
    });
  };

  return (
    <div className="fixed inset-0 bg-[rgba(15,23,42,0.35)] flex items-center justify-center p-6 z-[12000]">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[520px] bg-white/95 rounded-3xl p-7 border-2 border-[var(--border-light)] shadow-[0_24px_50px_rgba(15,23,42,0.15)]"
      >
        <div className="flex justify-between items-center mb-5">
          <h3 className="m-0 text-2xl flex items-center gap-2.5">
            <span className="text-3xl">✏️</span>
            Edit Item
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="bg-transparent text-[var(--text-secondary)] text-sm font-semibold px-2.5 py-1.5 shadow-none"
          >
            ✖ Close
          </button>
        </div>

        <div className="mb-4">
          <label className="block mb-2 text-sm font-semibold text-[var(--text-primary)]">
            Item Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border-2 border-[var(--border-light)] text-[15px] bg-[var(--card-bg)] text-[var(--text-primary)] font-medium"
            placeholder="e.g., Milk, Apples, Chicken"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-2 text-sm font-semibold text-[var(--text-primary)]">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 border-[var(--border-light)] text-[15px] bg-[var(--card-bg)] text-[var(--text-primary)] font-medium cursor-pointer"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-[var(--text-primary)]">
              Quantity & Unit
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-[var(--border-light)] text-[15px] bg-[var(--card-bg)] text-[var(--text-primary)] font-medium"
              />
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="px-4 py-3 rounded-xl border-2 border-[var(--border-light)] text-[15px] bg-[var(--card-bg)] text-[var(--text-primary)] font-medium cursor-pointer"
              >
                {units.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block mb-2 text-sm font-semibold text-[var(--text-primary)]">
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
            <label className="block mb-2 text-sm font-semibold text-[var(--text-primary)]">
              Expiration Date <span className="font-normal text-[var(--text-secondary)]">(optional)</span>
            </label>
            <DatePicker
              selected={formData.expirationDate}
              onChange={(date: Date | null) => setFormData({ ...formData, expirationDate: date })}
              dateFormat="MMM d, yyyy"
              locale="en-US"
              className="input-date"
              portalId="react-datepicker-portal"
              wrapperClassName="date-wrapper"
              placeholderText="Select a date or leave blank"
              isClearable
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 py-3.5 bg-gradient-to-br from-[var(--fresh-mint)] to-[var(--fresh-green)] text-white border-none rounded-xl text-base font-bold cursor-pointer shadow-[0_4px_12px_rgba(16,185,129,0.3)]"
          >
            💾 Save Changes
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3.5 bg-[var(--text-muted)] text-white border-none rounded-xl text-base font-bold cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
