import React, { useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import enUS from 'date-fns/locale/en-US';
import 'react-datepicker/dist/react-datepicker.css';
import type { FridgeItem } from '../types';
import { categories, units } from '../constants/itemOptions';

interface AddItemFormProps {
  onAdd: (item: Omit<FridgeItem, 'id'>) => void;
}

export const AddItemForm: React.FC<AddItemFormProps> = ({ onAdd }) => {
  const [isOpen, setIsOpen] = useState(false);
  registerLocale('en-US', enUS);

  const [formData, setFormData] = useState({
    name: '',
    category: categories[0],
    quantity: 1,
    unit: units[0],
    purchaseDate: new Date(),
    expirationDate: null as Date | null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Please enter an item name');
      return;
    }

    onAdd({
      ...formData,
      purchaseDate: new Date(formData.purchaseDate),
      expirationDate: formData.expirationDate ? new Date(formData.expirationDate) : null,
    });

    setFormData({
      name: '',
      category: categories[0],
      quantity: 1,
      unit: units[0],
      purchaseDate: new Date(),
      expirationDate: null,
    });
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full p-5 bg-gradient-to-br from-[var(--fresh-cyan)] to-[var(--fresh-mint)] text-white border-none rounded-2xl text-lg font-bold cursor-pointer mb-8 shadow-[0_4px_16px_rgba(6,182,212,0.25)] flex items-center justify-center gap-2.5"
      >
        <span className="text-2xl">➕</span>
        Add New Item
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/80 backdrop-blur-lg p-7 rounded-3xl mb-8 border-2 border-[var(--border-light)] shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
    >
      <h3 className="mt-0 mb-6 text-2xl flex items-center gap-2.5 text-[var(--text-primary)]">
        <span className="text-3xl">📝</span>
        Add New Item
      </h3>

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
          <div>
            <DatePicker
              selected={formData.purchaseDate}
              onChange={(date: Date | null) => setFormData({ ...formData, purchaseDate: date || new Date() })}
              dateFormat="MMM d, yyyy"
              locale="en-US"
              className="input-date"
              portalId="react-datepicker-portal"
              wrapperClassName="date-wrapper"
            />
            {formData.purchaseDate && (
              <div className="mt-2 text-xs text-[var(--text-secondary)] font-medium">
                {new Date(formData.purchaseDate).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'short', day: 'numeric'
                })}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block mb-2 text-sm font-semibold text-[var(--text-primary)]">
            Expiration Date <span className="font-normal text-[var(--text-secondary)]">(optional)</span>
          </label>
          <div>
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
            {formData.expirationDate && (
              <div className="mt-2 text-xs text-[var(--text-secondary)] font-medium">
                {new Date(formData.expirationDate as Date).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'short', day: 'numeric'
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="flex-1 py-3.5 bg-gradient-to-br from-[var(--fresh-mint)] to-[var(--fresh-green)] text-white border-none rounded-xl text-base font-bold cursor-pointer shadow-[0_4px_12px_rgba(16,185,129,0.3)]"
        >
          ✅ Add Item
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="flex-1 py-3.5 bg-[var(--text-muted)] text-white border-none rounded-xl text-base font-bold cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
