import type {
  FenceConfig,
  FenceModel,
  FencePost,
  FenceRail,
  FencePanel,
  FenceGate,
  FenceMaterialSummary,
  FenceSide,
  PostSpec,
  RailSpec,
} from "./types";
import type { BoardPurchase, CostLineItem } from "../types";
import { STOCK_LENGTHS_FT } from "../types";
import { optimizePurchases, inchesToFeetInches, round2 } from "../engine";

export const POST_OPTIONS: Record<string, PostSpec> = {
  "4x4": { label: "4x4", actualSize: 3.5 },
  "6x6": { label: "6x6", actualSize: 5.5 },
};

export const RAIL_OPTIONS: Record<string, RailSpec> = {
  "2x4": { label: "2x4", actualThickness: 1.5, actualWidth: 3.5 },
  "2x6": { label: "2x6", actualThickness: 1.5, actualWidth: 5.5 },
};

interface FencePricingTable {
  posts: Record<string, Record<number, number>>;
  rails: Record<string, Record<number, number>>;
  chickenWire: { rollFt: number; height: number; price: number }[];
  concrete: { bagLbs: number; lbsPerHole: number; price: number };
  gateHardware: { gateKit: number };
  staples: { pricePerBox: number; linearFtPerBox: number };
  screws: { perBox: number; screwsPerBox: number; price: number };
  urls: {
    posts: Record<string, string>;
    rails: Record<string, string>;
    chickenWire: string;
    concrete: string;
    gateKit: string;
    staples: string;
    screws: string;
  };
}

/**
 * Fence pricing — Home Depot retail (2025).
 * Chicken wire: Fencer Wire confirmed via homedepot.com.
 * HD product ref: Fencer Wire 6'x150' NB20-6X150M2 (SKU 312275613).
 */
export const FENCE_PRICING: FencePricingTable = {
  posts: {
    "4x4": { 4: 5.48, 6: 8.28, 8: 10.98, 10: 15.48, 12: 19.98 },
    "6x6": { 4: 12.98, 6: 19.48, 8: 25.98, 10: 34.48, 12: 42.98 },
  },
  rails: {
    "2x4": { 4: 2.18, 6: 3.00, 8: 3.50, 10: 5.48, 12: 7.18, 16: 9.78, 20: 13.48 },
    "2x6": { 4: 3.48, 6: 4.98, 8: 6.48, 10: 8.68, 12: 10.78, 16: 15.28, 20: 19.98 },
  },
  // Fencer Wire poultry netting, 20-gauge, 2" mesh — confirmed via homedepot.com
  chickenWire: [
    { rollFt: 150, height: 24, price: 35.91 },
    { rollFt: 150, height: 36, price: 42.18 },
    { rollFt: 150, height: 48, price: 56.68 },
    { rollFt: 150, height: 60, price: 62.88 },
    { rollFt: 150, height: 72, price: 88.16 },
  ],
  concrete: { bagLbs: 80, lbsPerHole: 40, price: 5.98 },
  gateHardware: { gateKit: 27.58 }, // Everbilt Black Self-Closing Gate Kit (SKU 327599729)
  staples: { pricePerBox: 8.50, linearFtPerBox: 25 },
  screws: { perBox: 125, screwsPerBox: 125, price: 27.97 }, // Kreg pocket-hole screws
  urls: {
    posts: {
      "4x4": "https://www.homedepot.com/p/4-in-x-4-in-x-8-ft-2-Pressure-Treated-Ground-Contact-Southern-Yellow-Pine-Timber-106503/206970954",
      "6x6": "https://www.homedepot.com/p/6-in-x-6-in-x-8-ft-2-Pressure-Treated-Ground-Contact-Southern-Yellow-Pine-Timber-260691/206970966",
    },
    rails: {
      "2x4": "https://www.homedepot.com/p/2-in-x-4-in-x-8-ft-2-Prime-or-BTR-Ground-Contact-Pressure-Treated-Southern-Yellow-Pine-Lumber-106147/206970948",
      "2x6": "https://www.homedepot.com/p/2-in-x-6-in-x-8-ft-2-Prime-Ground-Contact-Pressure-Treated-Southern-Yellow-Pine-Lumber-106180/206969408",
    },
    chickenWire: "https://www.homedepot.com/p/Fencer-Wire-3-ft-x-150-ft-20-Gauge-Poultry-Netting-with-2-in-Mesh-NB20-3X150M2/312275611",
    concrete: "https://www.homedepot.com/p/Quikrete-80-lb-Fast-Setting-Concrete-Mix-100480/100318521",
    gateKit: "https://www.homedepot.com/p/Everbilt-Black-Self-Closing-Gate-Kit-24390/327599729",
    staples: "https://www.homedepot.com/p/Grip-Rite-1-in-Galvanized-Poultry-Staples-1-lb-Pack-114HGPS1/100187800",
    screws: "https://www.homedepot.com/p/Kreg-1-1-4-in-8-Coarse-Washer-Head-Zinc-Pocket-Hole-Screws-100-Pack-SML-C125-100/203814098",
  },
};

export const DEFAULT_FENCE_CONFIG: FenceConfig = {
  enclosureWidth: 144, // 12 feet
  enclosureDepth: 96, // 8 feet
  height: 36,
  postSpacing: 48,
  postSize: "4x4",
  railSize: "2x4",
  gateSides: ["front"],
  gateWidth: 36,
  addChickenWire: true,
  chickenWireHeight: 36,
  wasteFactor: 10,
};

const POST_BURIAL_DEPTH = 24;

interface WallDef {
  side: FenceSide;
  startX: number;
  startZ: number;
  endX: number;
  endZ: number;
  length: number;
  rotation: number; // Y-axis rotation for rails/panels
}

export function generateFence(config: FenceConfig): FenceModel {
  const postSpec = POST_OPTIONS[config.postSize] ?? POST_OPTIONS["4x4"];
  const railSpec = RAIL_OPTIONS[config.railSize] ?? RAIL_OPTIONS["2x4"];
  const warnings: string[] = [];
  const ps = postSpec.actualSize;

  if (config.height < 24) warnings.push(`Fence height ${config.height}" is unusually low.`);
  if (config.height > 72) warnings.push(`Fence height ${config.height}" exceeds typical 6' max.`);
  if (config.postSpacing > 96) warnings.push(`Post spacing exceeds 8' max — fence may sag.`);
  if (config.addChickenWire && config.height > 72) {
    warnings.push(`Chicken wire is only available up to 6' (72") fence height. Current height ${config.height}" exceeds maximum supported size.`);
  }
  if (config.addChickenWire && config.chickenWireHeight > 72) {
    warnings.push(`Chicken wire rolls are only available up to 72" (6') height. Selected ${config.chickenWireHeight}" is not a standard size.`);
  }

  const postTotalLength = config.height + POST_BURIAL_DEPTH;
  const W = config.enclosureWidth;
  const D = config.enclosureDepth;

  // Define 4 walls (outer edge positions).
  // Posts sit at corners and along each wall.
  // Walls go clockwise: front (near Z=0), right, back, left
  const walls: WallDef[] = [
    { side: "front", startX: 0, startZ: 0, endX: W, endZ: 0, length: W, rotation: 0 },
    { side: "right", startX: W, startZ: 0, endX: W, endZ: D, length: D, rotation: Math.PI / 2 },
    { side: "back", startX: W, startZ: D, endX: 0, endZ: D, length: W, rotation: Math.PI },
    { side: "left", startX: 0, startZ: D, endX: 0, endZ: 0, length: D, rotation: -Math.PI / 2 },
  ];

  const gateSideSet = new Set(config.gateSides);

  const posts: FencePost[] = [];
  const rails: FenceRail[] = [];
  const panels: FencePanel[] = [];
  const gates: FenceGate[] = [];
  let postIdx = 0;

  for (const wall of walls) {
    const hasGate = gateSideSet.has(wall.side);
    const wallLen = wall.length;

    // How many bays along this wall?
    const bayCount = Math.max(1, Math.round(wallLen / config.postSpacing));
    const actualSpacing = wallLen / bayCount;

    // Which bay gets the gate (middle bay)
    const gateBay = hasGate ? Math.floor(bayCount / 2) : -1;

    // Direction vector along this wall
    const dx = (wall.endX - wall.startX) / wallLen;
    const dz = (wall.endZ - wall.startZ) / wallLen;

    // Generate posts along this wall. The LAST post of each wall is the FIRST post
    // of the next wall (corner), so we only generate posts 0..bayCount-1 and let
    // the next wall's first post be the shared corner.
    for (let i = 0; i < bayCount; i++) {
      const x = wall.startX + dx * actualSpacing * i;
      const z = wall.startZ + dz * actualSpacing * i;
      const isCorner = i === 0;
      const isGatePost = hasGate && (i === gateBay || i === gateBay + 1);

      posts.push({
        id: `post-${wall.side}-${i}`,
        index: postIdx++,
        position: [x, 0, z],
        height: postTotalLength,
        isGatePost,
        isCorner,
        postSpec,
      });
    }

    // Generate bays (rails, panels, gates)
    for (let bay = 0; bay < bayCount; bay++) {
      const startDist = bay * actualSpacing;
      const endDist = (bay + 1) * actualSpacing;
      const midDist = (startDist + endDist) / 2;

      const cx = wall.startX + dx * midDist;
      const cz = wall.startZ + dz * midDist;
      const spanLength = actualSpacing - ps;

      const isGateBay = bay === gateBay;

      // Top rail
      rails.push({
        id: `rail-top-${wall.side}-${bay}`,
        position: [cx, config.height - railSpec.actualWidth / 2, cz],
        rotation: wall.rotation,
        length: spanLength,
        role: "top",
        side: wall.side,
        railSpec,
      });

      // Bottom rail
      rails.push({
        id: `rail-bot-${wall.side}-${bay}`,
        position: [cx, railSpec.actualWidth / 2, cz],
        rotation: wall.rotation,
        length: spanLength,
        role: "bottom",
        side: wall.side,
        railSpec,
      });

      if (isGateBay) {
        const gateHeight = config.height - railSpec.actualWidth;
        gates.push({
          id: `gate-${wall.side}`,
          position: [cx, gateHeight / 2, cz],
          rotation: wall.rotation,
          width: spanLength,
          height: gateHeight,
          side: wall.side,
        });
      } else if (config.addChickenWire) {
        const panelBottom = railSpec.actualWidth;
        const panelTop = config.height - railSpec.actualWidth;
        const panelH = panelTop - panelBottom;
        panels.push({
          id: `panel-${wall.side}-${bay}`,
          position: [cx, panelBottom + panelH / 2, cz],
          rotation: wall.rotation,
          width: spanLength,
          height: panelH,
        });
      }
    }
  }

  const materials = calculateMaterials(
    config, posts, rails, panels, gates, postSpec, railSpec, postTotalLength
  );

  return { config, posts, rails, panels, gates, materials, warnings };
}

function calculateMaterials(
  config: FenceConfig,
  posts: FencePost[],
  rails: FenceRail[],
  panels: FencePanel[],
  gates: FenceGate[],
  postSpec: PostSpec,
  railSpec: RailSpec,
  postTotalLength: number,
): FenceMaterialSummary {
  const fencePricing = FENCE_PRICING;
  const wasteMult = 1 + config.wasteFactor / 100;

  const postCount = posts.length;
  const postCuts: number[] = posts.map(() => postTotalLength);

  // Rail cuts at actual length — waste factor is applied to board count, not cut length
  const railCuts: number[] = rails.map((r) => r.length);

  const railCutSummary = new Map<number, number>();
  for (const r of rails) {
    const len = round2(r.length);
    railCutSummary.set(len, (railCutSummary.get(len) ?? 0) + 1);
  }

  const chickenWireLinearIn = panels.reduce((s, p) => s + p.width, 0);
  const chickenWireLinearFt = round2(chickenWireLinearIn / 12);

  let chickenWireRolls = 0;
  const chickenWireRollSize = 150;
  if (chickenWireLinearFt > 0) {
    chickenWireRolls = Math.ceil(chickenWireLinearFt / 150);
  }

  const stapleBoxes = chickenWireLinearFt > 0
    ? Math.ceil(chickenWireLinearFt / fencePricing.staples.linearFtPerBox)
    : 0;

  // Concrete: each post hole needs lbsPerHole of concrete, sold in bagLbs bags
  const { bagLbs, lbsPerHole } = fencePricing.concrete;
  const totalConcreteLbs = postCount * lbsPerHole;
  const concreteBags = Math.ceil(totalConcreteLbs / bagLbs);

  const gateKits = gates.length;

  // Pocket screws: 4 per rail end (2 ends = 8 per rail) to attach rail into post face
  let screwCount = rails.length * 8;
  screwCount += gates.length * 8; // gate frame assembly

  const postResult = optimizePurchases(postCuts, postSpec.label);
  const railResult = optimizePurchases(railCuts, railSpec.label);

  // Apply waste factor as extra boards (round up), not inflated cut lengths
  const applyWaste = (p: BoardPurchase[]): BoardPurchase[] =>
    p.map((b) => ({
      ...b,
      count: Math.ceil(b.count * wasteMult),
    }));

  const purchases: BoardPurchase[] = [
    ...applyWaste(postResult.purchases),
    ...applyWaste(railResult.purchases),
  ];

  const costLineItems: CostLineItem[] = [];

  const wastedPosts = applyWaste(postResult.purchases);
  const wastedRails = applyWaste(railResult.purchases);

  for (const p of wastedPosts) {
    const priceTable = fencePricing.posts[config.postSize];
    const unitPrice = priceTable?.[p.stockLengthFt] ?? 0;
    costLineItems.push({
      description: `${postSpec.label} x ${p.stockLengthFt}' post`,
      unitPrice,
      quantity: p.count,
      lineTotal: round2(unitPrice * p.count),
      url: fencePricing.urls.posts[config.postSize],
    });
  }

  for (const p of wastedRails) {
    const priceTable = fencePricing.rails[config.railSize];
    const unitPrice = priceTable?.[p.stockLengthFt] ?? 0;
    costLineItems.push({
      description: `${railSpec.label} x ${p.stockLengthFt}' rail`,
      unitPrice,
      quantity: p.count,
      lineTotal: round2(unitPrice * p.count),
      url: fencePricing.urls.rails[config.railSize],
    });
  }

  if (chickenWireRolls > 0) {
    const wireOption = fencePricing.chickenWire.find(
      (w) => w.rollFt === chickenWireRollSize && w.height === config.chickenWireHeight
    );
    const unitPrice = wireOption?.price ?? 35;
    costLineItems.push({
      description: `Chicken wire ${chickenWireRollSize}' x ${config.chickenWireHeight}" roll`,
      unitPrice,
      quantity: chickenWireRolls,
      lineTotal: round2(unitPrice * chickenWireRolls),
      url: fencePricing.urls.chickenWire,
    });
  }

  // Concrete
  if (concreteBags > 0) {
    costLineItems.push({
      description: `Concrete mix ${bagLbs}lb bag`,
      unitPrice: fencePricing.concrete.price,
      quantity: concreteBags,
      lineTotal: round2(fencePricing.concrete.price * concreteBags),
      url: fencePricing.urls.concrete,
    });
  }

  if (stapleBoxes > 0) {
    costLineItems.push({
      description: "Poultry staples (box)",
      unitPrice: fencePricing.staples.pricePerBox,
      quantity: stapleBoxes,
      lineTotal: round2(fencePricing.staples.pricePerBox * stapleBoxes),
      url: fencePricing.urls.staples,
    });
  }

  if (gateKits > 0) {
    costLineItems.push({
      description: "Everbilt Self-Closing Gate Kit",
      unitPrice: fencePricing.gateHardware.gateKit,
      quantity: gateKits,
      lineTotal: round2(fencePricing.gateHardware.gateKit * gateKits),
      url: fencePricing.urls.gateKit,
    });
  }

  if (screwCount > 0) {
    const boxesNeeded = Math.ceil(screwCount / fencePricing.screws.screwsPerBox);
    costLineItems.push({
      description: `Pocket-hole screws (${boxesNeeded} x 125pk)`,
      unitPrice: fencePricing.screws.price,
      quantity: boxesNeeded,
      lineTotal: round2(boxesNeeded * fencePricing.screws.price),
      url: fencePricing.urls.screws,
    });
  }

  const costTotal = round2(costLineItems.reduce((s, li) => s + li.lineTotal, 0));

  return {
    postCount,
    postLength: postTotalLength,
    railCount: rails.length,
    railCuts: Array.from(railCutSummary.entries()).map(([length, count]) => ({ length, count })),
    chickenWireLinearFt,
    chickenWireRolls,
    stapleBoxes,
    concreteBags,
    gateKits,
    screwCount,
    purchases,
    costLineItems,
    costTotal,
  };
}
