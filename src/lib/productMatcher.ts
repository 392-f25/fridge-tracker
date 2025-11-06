import type { ParsedLine } from '../utils/receiptParser';

type Candidate = {
  name: string;
  category?: string;
  confidence?: number;
  thumbnail?: string;
};

export async function findCandidatesForLine(line: ParsedLine): Promise<Candidate[]> {
  try {
    const mod = await import('../utils/productApi');
    if (typeof mod.searchProductsByTerm === 'function') {
      const results: any = await mod.searchProductsByTerm(line.name || line.raw);
      if (results && Array.isArray(results.products)) {
        return results.products.slice(0, 5).map((p: any) => ({
          name: p.product_name || p.name || line.name,
          category: p.categories ? p.categories.split(',')[0] : undefined,
          confidence: 0.8, // heuristic default
          thumbnail: p.image_small_url || p.image_url || undefined,
        }));
      }
    }
  } catch (e) {
    // ignore
    console.warn('productMatcher error', e);
  }
  // fallback: return the raw line as single candidate
  return [{ name: line.name || line.raw, confidence: 0.5 }];
}

export default { findCandidatesForLine };
