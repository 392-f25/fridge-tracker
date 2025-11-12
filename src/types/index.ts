export interface FridgeItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  purchaseDate: Date;
  expirationDate: Date | null;
  imageUrl?: string;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  instructions: string[];
  prepTime: number;
  servings: number;
  imageUrl?: string;
}

export interface ExpirationWarning {
  item: FridgeItem;
  daysUntilExpiration: number;
  severity: 'critical' | 'warning' | 'info';
}

export type SortOption = 'expiration' | 'name' | 'category' | 'quantity';
export type FilterOption = 'all' | 'expiring-soon' | 'expired';
