import React, { useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import enUS from 'date-fns/locale/en-US';
import 'react-datepicker/dist/react-datepicker.css';
import type { FridgeItem } from '../types';
import { categories, units } from '../constants/itemOptions';
import Scanner from './Scanner';
import ReceiptScanner from './ReceiptScanner';

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

  const [scannerOpen, setScannerOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [candidates, setCandidates] = useState<Array<{name: string; category?: string; source?: string; confidence?: number; thumbnail?: string;}>>([]);

  // helper to clear candidates and revoke any blob thumbnails
  const clearCandidates = () => {
    try {
      candidates.forEach(c => {
        if (c.thumbnail && c.thumbnail.startsWith && c.thumbnail.startsWith('blob:')) {
          try { URL.revokeObjectURL(c.thumbnail); } catch (e) {}
        }
      });
    } catch (e) {}
    setCandidates([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.expirationDate) {
      alert('Please fill in all required fields');
      return;
    }

    onAdd({
      ...formData,
      purchaseDate: new Date(formData.purchaseDate),
      expirationDate: new Date(formData.expirationDate as Date),
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
    setScannerOpen(false);
  };

  if (!isOpen) {
    return (
      <div style={{ width: '100%', marginBottom: '32px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <button
          onClick={() => setIsOpen(true)}
          style={{
            flex: 1,
            padding: '20px',
            background: 'linear-gradient(135deg, var(--fresh-cyan) 0%, var(--fresh-mint) 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            fontSize: '18px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(6, 182, 212, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          <span style={{ fontSize: '24px' }}>➕</span>
          Add New Item
        </button>

        <div style={{ width: 220 }}>
          <button
            onClick={() => setReceiptOpen(true)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '2px dashed var(--border-light)',
              background: 'var(--card-bg)',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            📄 Import from receipt
          </button>
          {receiptOpen && (
            <div style={{ marginTop: 12 }}>
              <ReceiptScanner
                onImport={(items) => {
                  items.forEach((it: any) => {
                    try {
                      onAdd({
                        name: it.name,
                        category: it.category || categories[0],
                        quantity: it.quantity || 1,
                        unit: it.unit || units[0],
                        purchaseDate: it.purchaseDate || new Date(),
                        expirationDate: it.expirationDate || null,
                      });
                    } catch (e) { console.warn('import add failed', e); }
                  });
                }}
                onClose={() => setReceiptOpen(false)}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        padding: '28px',
        borderRadius: '20px',
        marginBottom: '32px',
        border: '2px solid var(--border-light)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
      }}
    >
      <h3 style={{
        marginTop: 0,
        marginBottom: '24px',
        fontSize: '22px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        color: 'var(--text-primary)'
      }}>
        <span style={{ fontSize: '28px' }}>📝</span>
        Add New Item
      </h3>
      
      <div style={{ marginBottom: '18px' }}>
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: '600',
          color: 'var(--text-primary)'
        }}>
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
            fontSize: '15px',
            background: 'var(--card-bg)',
            color: 'var(--text-primary)',
            fontWeight: 500
          }}
          placeholder="e.g., Milk, Apples, Chicken"
        />
        <div style={{ marginTop: 8 }}>
          <button type="button" onClick={() => setScannerOpen(s => !s)} style={{ padding: '8px 12px', borderRadius: 8, marginRight: 8 }}>
            {scannerOpen ? 'Close scanner' : 'Scan / Photo'}
          </button>
          <button type="button" onClick={() => setReceiptOpen(s => !s)} style={{ padding: '8px 12px', borderRadius: 8, marginRight: 8 }}>
            {receiptOpen ? 'Close receipt import' : 'Import from receipt'}
          </button>
          <button type="button" onClick={async () => {
            const code = window.prompt('Enter barcode (or paste scanned code)');
            if (!code) return;
            try {
              const mod = await import('../utils/productApi');
              const p = await mod.fetchProductByBarcode(code);
              if (p && p.product_name) {
                setFormData(fd => ({ ...fd, name: p.product_name }));
                alert(`Found product: ${p.product_name}`);
              } else {
                alert('No product found for that barcode');
              }
            } catch (e) { console.warn(e); alert('Lookup failed'); }
          }} style={{ padding: '8px 12px', borderRadius: 8 }}>
            Lookup barcode
          </button>
        </div>
      </div>

      {scannerOpen && (
        <div style={{ margin: '12px 0' }}>
          <Scanner
            onBarcodeDetected={async (barcode) => {
              try {
                const mod = await import('../utils/productApi');
                const p = await mod.fetchProductByBarcode(barcode);
                if (p && p.product_name) {
                  const mappedCat = (p.categories && p.categories.length>0) ? p.categories.split(',')[0] : undefined;
                  setCandidates([{ name: p.product_name, category: mappedCat, source: 'barcode' }]);
                } else {
                  setCandidates([{ name: `Scanned code: ${barcode}`, source: 'barcode' }]);
                }
              } catch (e) { console.warn(e); setCandidates([{ name: `Scanned code: ${barcode}`, source: 'barcode' }]); }
            }}
            onLabelsDetected={async (labels) => {
              if (!labels || labels.length === 0) return;
              // Use raw vision labels directly as candidates (no lookup/transformation)
              const mapped = labels.slice(0, 5).map((l: any) => ({
                name: l.name || l,
                category: undefined,
                source: 'vision',
                confidence: (l && (l.score || l.confidence)) || undefined,
                thumbnail: (l && l.thumbnail) || undefined,
              }));
              setCandidates(mapped);
            }}
          />
          {receiptOpen && (
            <div style={{ marginTop: 12 }}>
              <ReceiptScanner
                onImport={(items) => {
                  // call onAdd for each imported item
                  items.forEach((it: any) => {
                    try {
                      onAdd({
                        name: it.name,
                        category: it.category || categories[0],
                        quantity: it.quantity || 1,
                        unit: it.unit || units[0],
                        purchaseDate: it.purchaseDate || new Date(),
                        expirationDate: it.expirationDate || null,
                      });
                    } catch (e) { console.warn('import add failed', e); }
                  });
                }}
                onClose={() => setReceiptOpen(false)}
              />
            </div>
          )}
          {candidates.length > 0 && (
            <div style={{ marginTop: 12, padding: 12, background: 'var(--card-bg)', borderRadius: 8 }}>
              <div style={{ marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>Detected candidates — click to autofill</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {candidates.map((c, idx) => (
                  <button key={idx} type="button" onClick={() => {
                    setFormData(fd => ({ ...fd, name: c.name, category: c.category || fd.category }));
                    // revoke other thumbnails
                    try { candidates.forEach(cc => { if (cc.thumbnail && cc.thumbnail.startsWith && cc.thumbnail.startsWith('blob:')) { try { URL.revokeObjectURL(cc.thumbnail); } catch (e) {} } }); } catch (e) {}
                    setCandidates([]);
                  }} style={{ padding: '8px 12px', borderRadius: 8, background: 'linear-gradient(135deg,#eef2ff,#e0e7ff)', border: '1px solid #c7d2fe', cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center' }}>
                    {c.thumbnail ? (
                      <img src={c.thumbnail} alt={c.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: 6, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>📷</div>
                    )}
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
                      {c.category && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.category}</div>}
                      {typeof c.confidence === 'number' && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Conf: {(c.confidence*100).toFixed(0)}%</div>}
                    </div>
                  </button>
                ))}
                <button type="button" onClick={() => clearCandidates()} style={{ padding: '8px 12px', borderRadius: 8 }}>Dismiss</button>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
        <div>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--text-primary)'
          }}>
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
              fontSize: '15px',
              background: 'var(--card-bg)',
              color: 'var(--text-primary)',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--text-primary)'
          }}>
            Quantity & Unit
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
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
                fontSize: '15px',
                background: 'var(--card-bg)',
                color: 'var(--text-primary)',
                fontWeight: 500
              }}
            />
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                border: '2px solid var(--border-light)',
                fontSize: '15px',
                background: 'var(--card-bg)',
                color: 'var(--text-primary)',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              {units.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--text-primary)'
          }}>
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
              <div style={{
                marginTop: 8,
                fontSize: 12,
                color: 'var(--text-secondary)',
                fontWeight: 500
              }}>
                {new Date(formData.purchaseDate).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'short', day: 'numeric'
                })}
              </div>
            )}
          </div>
        </div>

        <div>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--text-primary)'
          }}>
            Expiration Date *
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
            />
            {formData.expirationDate && (
              <div style={{
                marginTop: 8,
                fontSize: 12,
                color: 'var(--text-secondary)',
                fontWeight: 500
              }}>
                {new Date(formData.expirationDate as Date).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'short', day: 'numeric'
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          type="submit"
          style={{
            flex: 1,
            padding: '14px',
            background: 'linear-gradient(135deg, var(--fresh-mint) 0%, var(--fresh-green) 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
          }}
        >
          ✅ Add Item
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          style={{
            flex: 1,
            padding: '14px',
            background: 'var(--text-muted)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
