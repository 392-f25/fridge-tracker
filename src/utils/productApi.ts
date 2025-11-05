export async function fetchProductByBarcode(barcode: string) {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const j = await res.json();
    if (j && j.status === 1) return j.product;
    return null;
  } catch (e) {
    console.warn('OpenFoodFacts lookup failed', e);
    return null;
  }
}

export async function searchProductsByTerm(term: string) {
  try {
    const q = encodeURIComponent(term);
    const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${q}&search_simple=1&action=process&json=1&page_size=10`);
    const j = await res.json();
    return j.products || [];
  } catch (e) {
    console.warn('OpenFoodFacts search failed', e);
    return [];
  }
}
