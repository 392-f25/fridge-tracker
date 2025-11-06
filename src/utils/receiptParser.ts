// Lightweight receipt OCR + line parser using Tesseract.js (client-side)
export type ParsedLine = {
  raw: string;
  name: string;
  price?: number;
  quantity?: number;
};

async function runTesseract(image: string | File): Promise<string> {
  // dynamic import to keep bundle small
  const Tesseract = await import('tesseract.js');
  const img = image as any;
  const res = await Tesseract.recognize(img, 'eng', { logger: () => {} });
  return res?.data?.text || '';
}

function parsePriceToken(token: string): number | undefined {
  const m = token.match(/(\d+[.,]\d{2})/);
  if (!m) return undefined;
  return parseFloat(m[1].replace(',', '.'));
}

export async function parseReceiptImage(image: string | File): Promise<ParsedLine[]> {
  const text = await runTesseract(image);
  if (!text) return [];
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const parsed: ParsedLine[] = lines.map(line => {
    // attempt to find a price at the end
    const priceMatch = line.match(/(\d+[.,]\d{2})(?!.*\d)/);
    const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : undefined;

    // remove price tokens and quantity tokens from name
    let name = line;
    if (priceMatch) {
      name = name.replace(priceMatch[0], '').trim();
    }
    // common qty patterns
    const qtyMatch = name.match(/(x\s?\d+|\d+\s?x|qty:\s?\d+)/i);
    let qty: number | undefined;
    if (qtyMatch) {
      const m = qtyMatch[0].match(/(\d+)/);
      if (m) qty = parseInt(m[1], 10);
      name = name.replace(qtyMatch[0], '').trim();
    }

    // fallback: if name contains too many digits, drop trailing digits
    name = name.replace(/\s+\d+[.,]?\d*$/, '').trim();

    return { raw: line, name: name || line, price, quantity: qty } as ParsedLine;
  });

  return parsed;
}

export default {
  parseReceiptImage,
};
