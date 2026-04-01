// ─── Shared types used across all project sections ───

export const STOCK_LENGTHS_FT = [4, 6, 8, 10, 12, 16, 20] as const;
export type StockLengthFt = (typeof STOCK_LENGTHS_FT)[number];

export interface LumberSpec {
  label: string;
  actualThickness: number; // inches
  actualWidth: number; // inches
  stockLengths: readonly StockLengthFt[];
  pricing: Partial<Record<StockLengthFt, number>>;
  url: string;
}

export interface DeckingSpec {
  label: string;
  actualThickness: number;
  actualWidth: number;
  pricing: Partial<Record<StockLengthFt, number>>;
  url: string;
}

/** One line item in the shopping list */
export interface BoardPurchase {
  label: string;
  stockLengthFt: number;
  count: number;
  cutsFromThis: number;
  wasteInches: number;
}

export interface CostLineItem {
  description: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  url?: string;
}
