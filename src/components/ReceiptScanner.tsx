import React, { useState } from 'react';
import type { ParsedLine } from '../utils/receiptParser';
import { parseReceiptImage } from '../utils/receiptParser';
import { findCandidatesForLine } from '../lib/productMatcher';

interface ReceiptScannerProps {
  onImport: (items: Array<any>) => void;
  onClose?: () => void;
}

const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onImport, onClose }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [parsed, setParsed] = useState<ParsedLine[]>([]);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [candidates, setCandidates] = useState<Record<number, Array<any>>>({});

  const handleFile = (f: File | null) => {
    if (!f) return;
    setFile(f);
    try { setImageUrl(URL.createObjectURL(f)); } catch (e) { setImageUrl(null); }
    setParsed([]);
    setCandidates({});
    setSelected({});
  };

  const runOCR = async () => {
    if (!file && !imageUrl) return;
    setProcessing(true);
    try {
      const source: any = file || imageUrl || '';
      const lines = await parseReceiptImage(source);
      setParsed(lines);
      // fetch candidates in parallel
      const candMap: Record<number, Array<any>> = {};
      await Promise.all(lines.map(async (ln, idx) => {
        try {
          const cs = await findCandidatesForLine(ln);
          candMap[idx] = cs;
        } catch (e) {
          candMap[idx] = [{ name: ln.name }];
        }
      }));
      setCandidates(candMap);
    } catch (e) {
      console.warn('OCR failed', e);
      setParsed([]);
      setCandidates({});
    }
    setProcessing(false);
  };

  const toggleSelect = (i: number) => {
    setSelected(s => ({ ...s, [i]: !s[i] }));
  };

  const applyCandidate = (i: number, cand: any) => {
    setParsed(p => p.map((line, idx) => idx === i ? ({ ...line, name: cand.name, category: cand.category }) : line));
  };

  const importSelected = () => {
    const items = parsed.map((line, idx) => ({
      name: line.name,
      category: (line as any).category || undefined,
      quantity: line.quantity || 1,
      unit: 'pcs',
      purchaseDate: new Date(),
      expirationDate: null,
    })).filter((_, idx) => selected[idx]);

    if (items.length === 0) return alert('No items selected');
    onImport(items);
    // cleanup object URLs
    if (imageUrl && imageUrl.startsWith('blob:')) {
      try { URL.revokeObjectURL(imageUrl); } catch (e) {}
    }
    setParsed([]);
    setCandidates({});
    setSelected({});
    setFile(null);
    setImageUrl(null);
    if (onClose) onClose();
  };

  return (
    <div style={{ marginTop: 12, padding: 12, background: 'var(--card-bg)', borderRadius: 8 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleFile(e.target.files ? e.target.files[0] : null)}
        />
        <button type="button" onClick={runOCR} disabled={processing || (!file && !imageUrl)} style={{ padding: '8px 12px' }}>
          {processing ? 'Processing...' : 'Run OCR'}
        </button>
        <button type="button" onClick={() => { setFile(null); setImageUrl(null); setParsed([]); setCandidates({}); }} style={{ padding: '8px 12px' }}>Clear</button>
        {onClose && <button type="button" onClick={onClose} style={{ padding: '8px 12px' }}>Close</button>}
      </div>

      {imageUrl && (
        <div style={{ marginBottom: 12 }}>
          <img src={imageUrl} alt="receipt" style={{ maxWidth: '100%', borderRadius: 8 }} />
        </div>
      )}

      {parsed.length > 0 && (
        <div>
          <div style={{ marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>Parsed lines — select items to import</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {parsed.map((ln, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 8, borderRadius: 8, background: '#fff' }}>
                <input type="checkbox" checked={!!selected[idx]} onChange={() => toggleSelect(idx)} />
                <div style={{ flex: 1 }}>
                  <input value={ln.name} onChange={(e) => setParsed(p => p.map((x,i)=> i===idx?({...x,name:e.target.value}):x))} style={{ width: '100%', padding: 6 }} />
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ln.raw}{ln.price ? ` · ${ln.price}` : ''}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {(candidates[idx] || []).slice(0,3).map((c:any, i2:number) => (
                    <button key={i2} type="button" onClick={() => applyCandidate(idx, c)} style={{ padding: '6px 8px', borderRadius: 6 }}>{c.name}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button type="button" onClick={importSelected} style={{ padding: '10px 14px', borderRadius: 8 }}>Import selected</button>
            <button type="button" onClick={() => { setParsed([]); setSelected({}); }} style={{ padding: '10px 14px', borderRadius: 8 }}>Dismiss</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptScanner;
