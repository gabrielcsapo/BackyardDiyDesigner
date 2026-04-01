/**
 * Shared utilities and lumber data used across all project sections.
 */
import type { LumberSpec, DeckingSpec, BoardPurchase } from "./types";
import { STOCK_LENGTHS_FT, type StockLengthFt } from "./types";

// ─── Shared lumber catalog (used by stairs + firepit) ───

export const LUMBER_OPTIONS: Record<string, LumberSpec> = {
  "2x4": {
    label: "2x4",
    actualThickness: 1.5,
    actualWidth: 3.5,
    stockLengths: [4, 6, 8, 10, 12, 16, 20],
    pricing: { 4: 2.18, 6: 3.0, 8: 3.5, 10: 5.48, 12: 7.18, 16: 9.78, 20: 13.48 },
    url: "https://www.homedepot.com/p/2-in-x-4-in-x-8-ft-2-Ground-Contact-Pressure-Treated-Southern-Yellow-Pine-Lumber-106147/206970948",
  },
  "2x6": {
    label: "2x6",
    actualThickness: 1.5,
    actualWidth: 5.5,
    stockLengths: [4, 6, 8, 10, 12, 16, 20],
    pricing: { 4: 3.48, 6: 4.98, 8: 6.48, 10: 8.68, 12: 10.78, 16: 15.28, 20: 19.98 },
    url: "https://www.homedepot.com/p/2-in-x-6-in-x-8-ft-2-Prime-Ground-Contact-Pressure-Treated-Southern-Yellow-Pine-Lumber-106180/206969408",
  },
  "2x8": {
    label: "2x8",
    actualThickness: 1.5,
    actualWidth: 7.25,
    stockLengths: [8, 10, 12, 16, 20],
    pricing: { 8: 8.48, 10: 10.98, 12: 13.98, 16: 18.98, 20: 24.48 },
    url: "https://www.homedepot.com/p/2-in-x-8-in-x-8-ft-2-Ground-Contact-Pressure-Treated-Southern-Yellow-Pine-Lumber-106182/206935779",
  },
  "2x10": {
    label: "2x10",
    actualThickness: 1.5,
    actualWidth: 9.25,
    stockLengths: [8, 10, 12, 16, 20],
    pricing: { 8: 11.98, 10: 15.48, 12: 18.98, 16: 25.98, 20: 32.48 },
    url: "https://www.homedepot.com/p/2-in-x-10-in-x-8-ft-2-Ground-Contact-Pressure-Treated-Southern-Yellow-Pine-Lumber-106184/206934530",
  },
  "2x12": {
    label: "2x12",
    actualThickness: 1.5,
    actualWidth: 11.25,
    stockLengths: [8, 10, 12, 16, 20],
    pricing: { 8: 15.48, 10: 19.98, 12: 23.98, 16: 32.98, 20: 41.48 },
    url: "https://www.homedepot.com/p/2-in-x-12-in-x-8-ft-2-Ground-Contact-Pressure-Treated-Southern-Yellow-Pine-Lumber-106186/206931712",
  },
};

export const DECKING_OPTIONS: Record<string, DeckingSpec> = {
  "5/4x4": {
    label: "5/4 x 4", actualThickness: 1.0, actualWidth: 3.5,
    pricing: { 4: 2.38, 6: 3.28, 8: 4.37, 10: 5.47, 12: 6.56, 16: 8.72, 20: 10.9 },
    url: "https://www.homedepot.com/p/WeatherShield-5-4-in-x-4-in-x-8-ft-Standard-Ground-Contact-Pressure-Treated-Pine-Decking-Board-253930/300509050",
  },
  "5/4x6": {
    label: "5/4 x 6", actualThickness: 1.0, actualWidth: 5.5,
    pricing: { 4: 3.58, 6: 4.88, 8: 6.48, 10: 8.18, 12: 12.98, 16: 16.48, 20: 23.98 },
    url: "https://www.homedepot.com/p/WeatherShield-5-4-in-x-6-in-x-8-ft-Standard-Ground-Contact-Pressure-Treated-Pine-Decking-Board-253931/300509052",
  },
  "2x4": {
    label: "2 x 4", actualThickness: 1.5, actualWidth: 3.5,
    pricing: { 4: 2.18, 6: 3.0, 8: 3.5, 10: 5.48, 12: 7.18, 16: 9.78, 20: 13.48 },
    url: "https://www.homedepot.com/p/2-in-x-4-in-x-8-ft-2-Prime-or-BTR-Ground-Contact-Pressure-Treated-Southern-Yellow-Pine-Lumber-106147/206970948",
  },
  "2x6": {
    label: "2 x 6", actualThickness: 1.5, actualWidth: 5.5,
    pricing: { 4: 3.48, 6: 4.98, 8: 6.48, 10: 8.68, 12: 10.78, 16: 15.28, 20: 19.98 },
    url: "https://www.homedepot.com/p/2-in-x-6-in-x-8-ft-2-Prime-Ground-Contact-Pressure-Treated-Southern-Yellow-Pine-Lumber-106180/206969408",
  },
  composite: {
    label: 'Composite 5.5"', actualThickness: 1.0, actualWidth: 5.5,
    pricing: { 4: 10.34, 6: 15.49, 8: 20.68, 10: 25.83, 12: 30.98, 16: 41.58, 20: 51.98 },
    url: "https://www.homedepot.com/p/Trex-Enhance-Naturals-1-in-x-6-in-x-8-ft-Toasted-Sand-Grooved-Edge-Composite-Deck-Board-TS010608EG01/312785416",
  },
};

export const SCREW_PRICING = {
  perLb: 9.97,
  screwsPerLb: 80,
  boxSizes: [
    { lbs: 1, price: 9.97 },
    { lbs: 5, price: 34.97 },
    { lbs: 25, price: 114.0 },
  ],
  url: "https://www.homedepot.com/p/GRK-8-x-2-1-2-in-Star-Drive-Bugle-Head-R4-Multi-Purpose-Screw-1-lb-Pack-772691-117723/204853166",
};

// ─── Shared utility functions ───

/**
 * Bin-pack cuts into stock lengths (first-fit-decreasing).
 */
export function optimizePurchases(
  cutLengthsInches: number[],
  label: string,
  availableLengths?: readonly StockLengthFt[],
): { purchases: BoardPurchase[]; oversized: string[] } {
  if (cutLengthsInches.length === 0) return { purchases: [], oversized: [] };

  const lengths = availableLengths ?? STOCK_LENGTHS_FT;
  const maxStockIn = lengths[lengths.length - 1] * 12;
  const oversized: string[] = [];

  const cutsByStock = new Map<StockLengthFt, number[]>();
  for (const cut of cutLengthsInches) {
    if (cut > maxStockIn) {
      oversized.push(`${label} cut ${inchesToFeetInches(cut)} exceeds max stock (${lengths[lengths.length - 1]}'). Must splice.`);
      continue;
    }
    const stockFt = lengths.find((ft) => ft * 12 >= cut)!;
    const existing = cutsByStock.get(stockFt);
    if (existing) existing.push(cut);
    else cutsByStock.set(stockFt, [cut]);
  }

  const purchases: BoardPurchase[] = [];
  for (const [stockFt, cuts] of cutsByStock) {
    const stockIn = stockFt * 12;
    const sorted = [...cuts].sort((a, b) => b - a);
    const bins: number[] = [];
    for (const cut of sorted) {
      let placed = false;
      for (let i = 0; i < bins.length; i++) {
        if (bins[i] >= cut) { bins[i] -= cut; placed = true; break; }
      }
      if (!placed) bins.push(stockIn - cut);
    }
    purchases.push({ label: `${label} x ${stockFt}'`, stockLengthFt: stockFt, count: bins.length, cutsFromThis: cuts.length, wasteInches: bins.reduce((s, r) => s + r, 0) });
  }

  purchases.sort((a, b) => a.stockLengthFt - b.stockLengthFt);
  return { purchases, oversized };
}

export function inchesToFeetInches(inches: number): string {
  const feet = Math.floor(inches / 12);
  const remaining = Math.round((inches - feet * 12) * 100) / 100;
  return feet > 0 ? `${feet}' ${remaining}"` : `${remaining}"`;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
