/**
 * Shared utilities and lumber data used across all project sections.
 */
import type { LumberSpec, DeckingSpec, BoardPurchase } from "./types";
import { STOCK_LENGTHS_FT, type StockLengthFt } from "./types";

// ─── Shared lumber catalog (used by stairs + firepit + fence) ───

export const POST_LUMBER_OPTIONS: Record<string, LumberSpec> = {
  "4x4": {
    label: "4x4",
    actualThickness: 3.5,
    actualWidth: 3.5,
    stockLengths: [6, 8, 10, 12, 16],
    pricing: { 6: 10.08, 8: 10.98, 10: 17.28, 12: 20.98, 16: 24.18 },
    url: "https://www.homedepot.com/p/4-in-x-4-in-x-8-ft-2-Pressure-Treated-Ground-Contact-Southern-Yellow-Pine-Timber-106503/206970954",
  },
  "6x6": {
    label: "6x6",
    actualThickness: 5.5,
    actualWidth: 5.5,
    stockLengths: [4, 6, 8, 10, 12],
    pricing: { 4: 12.98, 6: 19.48, 8: 25.98, 10: 34.48, 12: 42.98 },
    url: "https://www.homedepot.com/p/6-in-x-6-in-x-8-ft-2-Pressure-Treated-Ground-Contact-Southern-Yellow-Pine-Timber-260691/206970966",
  },
};

export const LUMBER_OPTIONS: Record<string, LumberSpec> = {
  "1x4": {
    label: "1x4",
    actualThickness: 0.75,
    actualWidth: 3.5,
    stockLengths: [8, 12],
    pricing: { 8: 4.52, 12: 7.38 },
    url: "https://www.homedepot.com/p/1-in-x-4-in-x-8-ft-Premium-Kiln-Dried-Square-Edge-Whitewood-Common-Board-914681/100023465",
  },
  "2x2": {
    label: "2x2",
    actualThickness: 1.5,
    actualWidth: 1.5,
    stockLengths: [6],
    pricing: { 6: 2.98 },
    url: "https://www.homedepot.com/p/2-in-x-2-in-x-6-ft-Furring-Strip-Board-75800593/100087930",
  },
  "2x4": {
    label: "2x4",
    actualThickness: 1.5,
    actualWidth: 3.5,
    stockLengths: [4, 6, 8, 10, 12, 16],
    pricing: {
      4: 4.08,
      6: 4.78,
      8: 4.98,
      10: 7.98,
      12: 9.38,
      16: 13.88,
    },
    url: "https://www.homedepot.com/p/WeatherShield-2-in-x-4-in-x-10-ft-2-Prime-Ground-Contact-Pressure-Treated-Southern-Yellow-Pine-Lumber-253920/206967803",
  },
  "2x6": {
    label: "2x6",
    actualThickness: 1.5,
    actualWidth: 5.5,
    stockLengths: [4, 6, 8, 10, 12, 16, 20],
    pricing: {
      4: 3.48,
      6: 4.98,
      8: 6.48,
      10: 8.68,
      12: 10.78,
      16: 15.28,
      20: 19.98,
    },
    url: "https://www.homedepot.com/p/2-in-x-6-in-x-8-ft-2-Prime-Ground-Contact-Pressure-Treated-Southern-Yellow-Pine-Lumber-106180/206969408",
  },
  "2x8": {
    label: "2x8",
    actualThickness: 1.5,
    actualWidth: 7.25,
    stockLengths: [8, 10, 12, 16, 20],
    pricing: { 8: 10.18, 10: 12.68, 12: 15.28, 16: 20.68, 20: 27.28 },
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
    label: "5/4 x 4",
    actualThickness: 1.0,
    actualWidth: 3.5,
    pricing: {
      4: 2.38,
      6: 3.28,
      8: 4.37,
      10: 5.47,
      12: 6.56,
      16: 8.72,
      20: 10.9,
    },
    url: "https://www.homedepot.com/p/WeatherShield-5-4-in-x-4-in-x-8-ft-Standard-Ground-Contact-Pressure-Treated-Pine-Decking-Board-253930/300509050",
  },
  "5/4x6": {
    label: "5/4 x 6",
    actualThickness: 1.0,
    actualWidth: 5.5,
    pricing: {
      4: 3.58,
      6: 4.88,
      8: 6.58,
      10: 8.18,
      12: 9.78,
      16: 13.08,
      20: 23.98,
    },
    url: "https://www.homedepot.com/p/WeatherShield-5-4-in-x-6-in-x-8-ft-Standard-Ground-Contact-Pressure-Treated-Pine-Decking-Board-253931/300509052",
  },
  "2x4": {
    label: "2 x 4",
    actualThickness: 1.5,
    actualWidth: 3.5,
    pricing: {
      4: 2.18,
      6: 3.0,
      8: 3.5,
      10: 5.48,
      12: 7.18,
      16: 9.78,
      20: 13.48,
    },
    url: "https://www.homedepot.com/p/2-in-x-4-in-x-8-ft-2-Prime-or-BTR-Ground-Contact-Pressure-Treated-Southern-Yellow-Pine-Lumber-106147/206970948",
  },
  "2x6": {
    label: "2 x 6",
    actualThickness: 1.5,
    actualWidth: 5.5,
    pricing: {
      4: 3.48,
      6: 4.98,
      8: 6.48,
      10: 8.68,
      12: 10.78,
      16: 15.28,
      20: 19.98,
    },
    url: "https://www.homedepot.com/p/2-in-x-6-in-x-8-ft-2-Prime-Ground-Contact-Pressure-Treated-Southern-Yellow-Pine-Lumber-106180/206969408",
  },
  composite: {
    label: 'Composite 5.5"',
    actualThickness: 1.0,
    actualWidth: 5.5,
    pricing: {
      4: 10.34,
      6: 15.49,
      8: 20.68,
      10: 25.83,
      12: 30.98,
      16: 41.58,
      20: 51.98,
    },
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

// ─── Hardware & materials catalog (non-lumber) ───

export const HARDWARE_CATALOG = {
  chickenWire: {
    // Fencer Wire poultry netting, 20-gauge, 2" mesh — confirmed via homedepot.com
    rolls: [
      { rollFt: 150, height: 24, price: 35.91 },
      { rollFt: 150, height: 36, price: 42.18 },
      { rollFt: 150, height: 48, price: 56.68 },
      { rollFt: 150, height: 60, price: 62.88 },
      { rollFt: 150, height: 72, price: 88.16 },
    ] as const,
    url: "https://www.homedepot.com/p/Fencer-Wire-3-ft-x-150-ft-20-Gauge-Poultry-Netting-with-2-in-Mesh-NB20-3X150M2/312275611",
  },
  concrete: {
    bagLbs: 80,
    price: 5.98,
    url: "https://www.homedepot.com/p/Quikrete-80-lb-Fast-Setting-Concrete-Mix-100480/100318521",
  },
  gateKit: {
    // Everbilt Black Self-Closing Gate Kit (SKU 327599729)
    price: 27.58,
    url: "https://www.homedepot.com/p/Everbilt-Black-Self-Closing-Gate-Kit-24390/327599729",
  },
  poultryStaples: {
    pricePerBox: 8.5,
    linearFtPerBox: 25,
    url: "https://www.homedepot.com/p/Grip-Rite-1-in-Galvanized-Poultry-Staples-1-lb-Pack-114HGPS1/100187800",
  },
  pocketScrews: {
    // Kreg pocket-hole screws
    screwsPerBox: 125,
    price: 27.97,
    url: "https://www.homedepot.com/p/Kreg-1-1-4-in-8-Coarse-Washer-Head-Zinc-Pocket-Hole-Screws-100-Pack-SML-C125-100/203814098",
  },
  firePitRing: {
    // VEVOR Fire Pit Ring 45"
    outerDiameter: 45,
    innerDiameter: 39,
    height: 10,
    price: 63.99,
    url: "https://www.vevor.com/charcoal-fire-pit-c_10232/vevor-fire-pit-ring-round-45-inch-outer-steel-liner-diy-campfire-ring-firepit-p_010351371011",
  },
  retainingWallBlock: {
    // Pewter Concrete Retaining Wall Block
    width: 11.75,
    height: 4,
    depth: 6.75,
    price: 2.37,
    url: "https://www.homedepot.com/p/4-in-x-11-75-in-x-6-75-in-Pewter-Concrete-Retaining-Wall-Block-81100/100333178",
  },
};

// ─── Shared utility functions ───

/** Saw blade kerf allowance in inches (≈1/8"). */
const KERF = 0.125;

/**
 * Bin-pack cuts into stock lengths using first-fit-decreasing across all
 * available stock sizes.  Each bin tracks its stock length so different
 * cuts can share a board even if their minimum stock lengths differ.
 * A kerf allowance is subtracted for each additional cut placed in a bin.
 */
export function optimizePurchases(
  cutLengthsInches: number[],
  label: string,
  availableLengths?: readonly StockLengthFt[],
  pricing?: Partial<Record<StockLengthFt, number>>,
): { purchases: BoardPurchase[]; oversized: string[] } {
  if (cutLengthsInches.length === 0) return { purchases: [], oversized: [] };

  const lengths = availableLengths ?? STOCK_LENGTHS_FT;
  const maxStockIn = lengths[lengths.length - 1] * 12;
  const oversized: string[] = [];

  // Sort cuts descending for FFD
  const sorted = cutLengthsInches
    .map((cut, i) => ({ cut, i }))
    .filter(({ cut }) => {
      if (cut > maxStockIn) {
        oversized.push(
          `${label} cut ${inchesToFeetInches(cut)} exceeds max stock (${lengths[lengths.length - 1]}'). Must splice.`,
        );
        return false;
      }
      return true;
    })
    .sort((a, b) => b.cut - a.cut);

  // Each bin: stock length (ft), remaining capacity (in), number of cuts placed
  const bins: {
    stockFt: StockLengthFt;
    remaining: number;
    cutCount: number;
  }[] = [];

  // When pricing is available, pick stock by lowest cost-per-foot (not smallest-that-fits).
  // This avoids buying many expensive short boards when fewer long boards are cheaper.
  const pickStock = (cutIn: number): StockLengthFt | undefined => {
    const candidates = lengths.filter((ft) => ft * 12 >= cutIn);
    if (candidates.length === 0) return undefined;
    if (!pricing) return candidates[0]; // no pricing → smallest that fits

    // Pick the stock length with the lowest cost per foot
    let best = candidates[0];
    let bestCpf = Infinity;
    for (const ft of candidates) {
      const price = pricing[ft];
      if (price == null) continue;
      const cpf = price / ft;
      if (cpf < bestCpf) {
        bestCpf = cpf;
        best = ft;
      }
    }
    return best;
  };

  for (const { cut } of sorted) {
    // Try to fit in an existing bin (first-fit). Account for kerf on additional cuts.
    let placed = false;
    for (const bin of bins) {
      const needed = cut + KERF; // kerf before this cut (bin already has ≥1 cut)
      if (bin.remaining >= needed) {
        bin.remaining -= needed;
        bin.cutCount++;
        placed = true;
        break;
      }
    }
    if (!placed) {
      const stockFt = pickStock(cut);
      if (!stockFt) {
        oversized.push(
          `${label} cut ${inchesToFeetInches(cut)} exceeds max stock (${lengths[lengths.length - 1]}'). Must splice.`,
        );
        continue;
      }
      bins.push({ stockFt, remaining: stockFt * 12 - cut, cutCount: 1 });
    }
  }

  // Aggregate bins by stock length
  const byStock = new Map<
    StockLengthFt,
    { count: number; cuts: number; waste: number }
  >();
  for (const bin of bins) {
    const existing = byStock.get(bin.stockFt);
    if (existing) {
      existing.count++;
      existing.cuts += bin.cutCount;
      existing.waste += bin.remaining;
    } else {
      byStock.set(bin.stockFt, {
        count: 1,
        cuts: bin.cutCount,
        waste: bin.remaining,
      });
    }
  }

  const purchases: BoardPurchase[] = [];
  for (const [stockFt, data] of byStock) {
    purchases.push({
      label: `${label} x ${stockFt}'`,
      stockLengthFt: stockFt,
      count: data.count,
      cutsFromThis: data.cuts,
      wasteInches: data.waste,
    });
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
