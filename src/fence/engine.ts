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
import {
  POST_LUMBER_OPTIONS,
  LUMBER_OPTIONS,
  HARDWARE_CATALOG,
  optimizePurchases,
  round2,
} from "../engine";

export const POST_OPTIONS: Record<string, PostSpec> = {
  "4x4": { label: "4x4", actualSize: 3.5 },
  "6x6": { label: "6x6", actualSize: 5.5 },
};

export const RAIL_OPTIONS: Record<string, RailSpec> = {
  "2x4": { label: "2x4", actualThickness: 1.5, actualWidth: 3.5 },
  "2x6": { label: "2x6", actualThickness: 1.5, actualWidth: 5.5 },
};

/** Concrete lbs per post hole, keyed by post size. */
const CONCRETE_LBS_PER_HOLE: Record<string, number> = {
  "4x4": 60, // 10" diameter hole × 24"+ depth
  "6x6": 80, // 12" diameter hole × 24"+ depth
};

/** Standard chicken wire roll heights (inches). */
const STANDARD_WIRE_HEIGHTS = [24, 36, 48, 60, 72];

export const DEFAULT_FENCE_CONFIG: FenceConfig = {
  enclosureWidth: 144, // 12 feet
  enclosureDepth: 96, // 8 feet
  height: 36,
  postSpacing: 48,
  postSize: "4x4",
  railSize: "2x4",
  gateSides: ["front"],
  addChickenWire: true,
  chickenWireHeight: 36,
  wasteFactor: 10,
};

/** Post burial depth: 1/3 of above-ground height + 6", minimum 24". */
function postBurialDepth(fenceHeight: number): number {
  return Math.max(24, Math.ceil(fenceHeight / 3) + 6);
}

/** Whether fence is tall enough to need a middle rail (> 48"). */
function needsMiddleRail(fenceHeight: number): boolean {
  return fenceHeight > 48;
}

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
  if (config.addChickenWire && !STANDARD_WIRE_HEIGHTS.includes(config.chickenWireHeight)) {
    warnings.push(`Chicken wire height ${config.chickenWireHeight}" is not a standard roll size. Available: ${STANDARD_WIRE_HEIGHTS.join('", "')}".`);
  }

  const burialDepth = postBurialDepth(config.height);
  const postTotalLength = config.height + burialDepth;
  const addMiddleRail = needsMiddleRail(config.height);
  const W = config.enclosureWidth;
  const D = config.enclosureDepth;

  // Validate chicken wire height vs actual panel height
  if (config.addChickenWire) {
    const panelH = config.height - 2 * railSpec.actualWidth;
    if (config.chickenWireHeight < panelH) {
      warnings.push(`Chicken wire height ${config.chickenWireHeight}" is shorter than the panel opening (${round2(panelH)}"). Wire won't cover the full span.`);
    }
  }

  // Define 4 walls (outer edge positions).
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
    // of the next wall (corner), so we only generate posts 0..bayCount-1.
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

      // Middle rail for fences > 48"
      if (addMiddleRail) {
        rails.push({
          id: `rail-mid-${wall.side}-${bay}`,
          position: [cx, config.height / 2, cz],
          rotation: wall.rotation,
          length: spanLength,
          role: "middle",
          side: wall.side,
          railSpec,
        });
      }

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
    config, posts, rails, panels, gates, postSpec, railSpec, postTotalLength, burialDepth
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
  burialDepth: number,
): FenceMaterialSummary {
  const hw = HARDWARE_CATALOG;
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
    chickenWireRolls = Math.ceil(chickenWireLinearFt / chickenWireRollSize);
  }

  const stapleBoxes = chickenWireLinearFt > 0
    ? Math.ceil(chickenWireLinearFt / hw.poultryStaples.linearFtPerBox)
    : 0;

  // Concrete: lbs per hole varies by post size
  const lbsPerHole = CONCRETE_LBS_PER_HOLE[config.postSize] ?? 60;
  const totalConcreteLbs = postCount * lbsPerHole;
  const concreteBags = Math.ceil(totalConcreteLbs / hw.concrete.bagLbs);

  const gateKits = gates.length;

  // Pocket screws: 4 per rail end (2 ends = 8 per rail) to attach rail into post face
  let screwCount = rails.length * 8;
  screwCount += gates.length * 8; // gate frame assembly

  // Use stock lengths from the shared lumber catalog
  const postLumber = POST_LUMBER_OPTIONS[config.postSize];
  const railLumber = LUMBER_OPTIONS[config.railSize];
  const postResult = optimizePurchases(postCuts, postSpec.label, postLumber?.stockLengths, postLumber?.pricing);
  const railResult = optimizePurchases(railCuts, railSpec.label, railLumber?.stockLengths, railLumber?.pricing);

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
    const unitPrice = postLumber?.pricing[p.stockLengthFt as keyof typeof postLumber.pricing] ?? 0;
    costLineItems.push({
      description: `${postSpec.label} x ${p.stockLengthFt}'`,
      unitPrice,
      quantity: p.count,
      lineTotal: round2(unitPrice * p.count),
      url: postLumber?.url,
    });
  }

  for (const p of wastedRails) {
    const unitPrice = railLumber?.pricing[p.stockLengthFt as keyof typeof railLumber.pricing] ?? 0;
    costLineItems.push({
      description: `${railSpec.label} x ${p.stockLengthFt}'`,
      unitPrice,
      quantity: p.count,
      lineTotal: round2(unitPrice * p.count),
      url: railLumber?.url,
    });
  }

  if (chickenWireRolls > 0) {
    // Find the best matching roll height (smallest that fits the panel opening)
    const panelH = config.height - 2 * railSpec.actualWidth;
    const wireOption = hw.chickenWire.rolls.find(
      (w) => w.rollFt === chickenWireRollSize && w.height === config.chickenWireHeight
    ) ?? hw.chickenWire.rolls.find(
      (w) => w.rollFt === chickenWireRollSize && w.height >= panelH
    );
    const unitPrice = wireOption?.price ?? hw.chickenWire.rolls[0].price;
    const rollHeight = wireOption?.height ?? config.chickenWireHeight;
    costLineItems.push({
      description: `Chicken wire ${chickenWireRollSize}' x ${rollHeight}" roll`,
      unitPrice,
      quantity: chickenWireRolls,
      lineTotal: round2(unitPrice * chickenWireRolls),
      url: hw.chickenWire.url,
    });
  }

  // Concrete
  if (concreteBags > 0) {
    costLineItems.push({
      description: `Concrete mix ${hw.concrete.bagLbs}lb bag`,
      unitPrice: hw.concrete.price,
      quantity: concreteBags,
      lineTotal: round2(hw.concrete.price * concreteBags),
      url: hw.concrete.url,
    });
  }

  if (stapleBoxes > 0) {
    costLineItems.push({
      description: "Poultry staples (box)",
      unitPrice: hw.poultryStaples.pricePerBox,
      quantity: stapleBoxes,
      lineTotal: round2(hw.poultryStaples.pricePerBox * stapleBoxes),
      url: hw.poultryStaples.url,
    });
  }

  if (gateKits > 0) {
    costLineItems.push({
      description: "Everbilt Self-Closing Gate Kit",
      unitPrice: hw.gateKit.price,
      quantity: gateKits,
      lineTotal: round2(hw.gateKit.price * gateKits),
      url: hw.gateKit.url,
    });
  }

  if (screwCount > 0) {
    const boxesNeeded = Math.ceil(screwCount / hw.pocketScrews.screwsPerBox);
    costLineItems.push({
      description: `Pocket-hole screws (${boxesNeeded} x 125pk)`,
      unitPrice: hw.pocketScrews.price,
      quantity: boxesNeeded,
      lineTotal: round2(boxesNeeded * hw.pocketScrews.price),
      url: hw.pocketScrews.url,
    });
  }

  const costTotal = round2(costLineItems.reduce((s, li) => s + li.lineTotal, 0));

  return {
    postCount,
    postLength: postTotalLength,
    burialDepth,
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
