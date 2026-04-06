import type {
  StairConfig,
  StairModel,
  BoxStep,
  FrameMember,
  DeckBoard,
  FasciaBoard,
  MaterialSummary,
} from "./types";
import type { LumberSpec, DeckingSpec, BoardPurchase, CostLineItem } from "../types";
import { type StockLengthFt } from "../types";
import {
  LUMBER_OPTIONS,
  DECKING_OPTIONS,
  SCREW_PRICING,
  optimizePurchases,
  inchesToFeetInches,
  round2,
} from "../engine";

export { LUMBER_OPTIONS, DECKING_OPTIONS };

export const DEFAULT_CONFIG: StairConfig = {
  totalRise: 15,
  stairWidth: 48,
  stepCount: 2,
  treadDepth: 11.25,
  frameLumber: "2x8",
  deckingBoard: "5/4x6",
  deckingGap: 0.25,
  treadOverhang: 1.0,
  supportSpacing: 16,
  wasteFactor: 10,
  fasciaBoard: "5/4x6",
  addFascia: true,
};

export function generateBoxStair(config: StairConfig): StairModel {
  const frame = LUMBER_OPTIONS[config.frameLumber];
  const decking = DECKING_OPTIONS[config.deckingBoard];
  const trim = DECKING_OPTIONS[config.fasciaBoard];
  const warnings: string[] = [];

  const riserHeight = config.totalRise / config.stepCount;
  const totalRun = config.treadDepth * config.stepCount;

  if (riserHeight > 7.75) {
    warnings.push(`Riser height ${riserHeight.toFixed(2)}" exceeds typical 7-3/4" max.`);
  }
  if (riserHeight < 4) {
    warnings.push(`Riser height ${riserHeight.toFixed(2)}" is unusually low.`);
  }
  if (config.treadDepth < 10) {
    warnings.push(`Tread depth ${config.treadDepth}" is below typical 10" minimum.`);
  }
  if (config.stairWidth < 36) {
    warnings.push(`Stair width ${config.stairWidth}" is below typical 36" minimum.`);
  }
  // Nosing overhang code compliance (IRC R311.7.5.3: 3/4" to 1-1/4")
  if (config.treadDepth < 11 && (config.treadOverhang < 0.75 || config.treadOverhang > 1.25)) {
    warnings.push(
      `Tread overhang ${config.treadOverhang}" is outside the IRC 3/4"–1-1/4" nosing range.`,
    );
  }

  const frameLengths = frame.stockLengths;
  const maxStockIn = frameLengths[frameLengths.length - 1] * 12;
  if (config.stairWidth > maxStockIn) {
    warnings.push(
      `Stair width ${inchesToFeetInches(config.stairWidth)} exceeds max stock length (${frameLengths[frameLengths.length - 1]}'). Boards will need to be spliced.`,
    );
  }

  const steps: BoxStep[] = [];

  for (let i = 0; i < config.stepCount; i++) {
    const boxDepth = config.treadDepth * (config.stepCount - i);
    const boxY = riserHeight * i;
    const boxZ = config.treadDepth * i;

    const frameMembers = generateFrameMembers(i, config.stairWidth, boxDepth, frame, config.supportSpacing, boxY, boxZ);
    const deckBoards = generateDeckBoards(i, config.stairWidth, boxDepth, config.treadDepth, decking, config.deckingGap, config.treadOverhang, boxY, boxZ, frame.actualWidth);
    const fasciaBoards = config.addFascia ? generateFascia(i, config.stepCount, config.stairWidth, boxDepth, riserHeight, frame, boxY, boxZ) : [];

    steps.push({ index: i, width: config.stairWidth, depth: boxDepth, height: riserHeight, y: boxY, z: boxZ, frameMembers, deckBoards, fasciaBoards });
  }

  const materials = calculateMaterials(steps, config, frame, decking, trim);
  return { config, steps, riserHeight, totalRun, materials, warnings };
}

function generateFrameMembers(stepIndex: number, width: number, depth: number, frame: LumberSpec, maxSpacing: number, y: number, z: number): FrameMember[] {
  const members: FrameMember[] = [];
  const t = frame.actualThickness;
  const h = frame.actualWidth;

  members.push({ id: `frame-${stepIndex}-front`, stepIndex, role: "front", length: width, position: [0, y + h / 2, z + t / 2], rotation: [0, 0, 0], lumberSpec: frame });
  members.push({ id: `frame-${stepIndex}-back`, stepIndex, role: "back", length: width, position: [0, y + h / 2, z + depth - t / 2], rotation: [0, 0, 0], lumberSpec: frame });

  const crossLength = depth - 2 * t;
  const internalWidth = width - 2 * t;
  const numInternalSpans = Math.ceil(internalWidth / maxSpacing);
  const numCrossMembers = numInternalSpans + 1;

  for (let c = 0; c < numCrossMembers; c++) {
    const xFraction = c / (numCrossMembers - 1);
    const xPos = -internalWidth / 2 + xFraction * internalWidth;
    members.push({ id: `frame-${stepIndex}-cross-${c}`, stepIndex, role: "cross", length: crossLength, position: [xPos, y + h / 2, z + depth / 2], rotation: [0, Math.PI / 2, 0], lumberSpec: frame });
  }

  return members;
}

function generateDeckBoards(stepIndex: number, stairWidth: number, boxDepth: number, treadDepth: number, decking: DeckingSpec, gap: number, overhang: number, y: number, z: number, frameHeight: number): DeckBoard[] {
  const boards: DeckBoard[] = [];
  const boardWidth = decking.actualWidth;
  const boardThickness = decking.actualThickness;
  const treadStart = z - overhang;
  const treadEnd = z + treadDepth;
  const availableDepth = treadEnd - treadStart;
  const numBoards = Math.floor((availableDepth + gap) / (boardWidth + gap));

  for (let b = 0; b < numBoards; b++) {
    const boardZ = treadStart + b * (boardWidth + gap) + boardWidth / 2;
    boards.push({ id: `deck-${stepIndex}-${b}`, stepIndex, length: stairWidth, position: [0, y + frameHeight + boardThickness / 2, boardZ], deckingSpec: decking });
  }
  return boards;
}

function generateFascia(stepIndex: number, _stepCount: number, stairWidth: number, boxDepth: number, riserHeight: number, frame: LumberSpec, y: number, z: number): FasciaBoard[] {
  const boards: FasciaBoard[] = [];
  const t = frame.actualThickness;
  const sideLength = boxDepth;

  boards.push({ id: `fascia-${stepIndex}-front`, stepIndex, face: "front", length: stairWidth + 2 * t, height: riserHeight, position: [0, y + riserHeight / 2, z - t / 2], rotation: [0, 0, 0] });
  boards.push({ id: `fascia-${stepIndex}-left`, stepIndex, face: "left", length: sideLength, height: riserHeight, position: [-stairWidth / 2 - t / 2, y + riserHeight / 2, z + sideLength / 2], rotation: [0, Math.PI / 2, 0] });
  boards.push({ id: `fascia-${stepIndex}-right`, stepIndex, face: "right", length: sideLength, height: riserHeight, position: [stairWidth / 2 + t / 2, y + riserHeight / 2, z + sideLength / 2], rotation: [0, Math.PI / 2, 0] });


  return boards;
}

function calculateMaterials(steps: BoxStep[], config: StairConfig, frame: LumberSpec, decking: DeckingSpec, trim: DeckingSpec): MaterialSummary {
  const framingCuts: number[] = [];
  const deckingCuts: number[] = [];
  const fasciaCuts: number[] = [];

  for (const step of steps) {
    for (const m of step.frameMembers) framingCuts.push(m.length);
    for (const d of step.deckBoards) deckingCuts.push(d.length);
    for (const f of step.fasciaBoards) fasciaCuts.push(f.length);
  }

  const framingLinearIn = framingCuts.reduce((s, l) => s + l, 0);
  const deckingLinearIn = deckingCuts.reduce((s, l) => s + l, 0);
  const fasciaLinearIn = fasciaCuts.reduce((s, l) => s + l, 0);

  let screwCount = 0;
  for (const step of steps) {
    const crossCount = step.frameMembers.filter((m) => m.role === "cross").length;
    const rimCount = step.frameMembers.filter((m) => m.role === "front" || m.role === "back").length;
    const totalFramingMembers = crossCount + rimCount;
    screwCount += step.deckBoards.length * totalFramingMembers * 2;
    screwCount += crossCount * 4;
    screwCount += 12;
  }

  // Apply waste factor: add extra cuts proportional to waste percentage.
  // This ensures the shopping list accounts for mis-cuts and defects.
  const wasteMul = 1 + (config.wasteFactor / 100);
  const framingCutsWithWaste = applyWasteFactor(framingCuts, wasteMul);
  const deckingCutsWithWaste = applyWasteFactor(deckingCuts, wasteMul);
  const fasciaCutsWithWaste = applyWasteFactor(fasciaCuts, wasteMul);

  const framingResult = optimizePurchases(framingCutsWithWaste, frame.label, frame.stockLengths, frame.pricing);
  const deckingResult = optimizePurchases(deckingCutsWithWaste, decking.label, undefined, decking.pricing);
  const fasciaResult = optimizePurchases(fasciaCutsWithWaste, trim.label, undefined, trim.pricing);

  const oversizedCuts = [...framingResult.oversized, ...deckingResult.oversized, ...fasciaResult.oversized];

  // Build cost line items, merging duplicates (e.g. same board used for decking + fascia)
  const costMap = new Map<string, CostLineItem>();

  const addCostItems = (purchases: BoardPurchase[], spec: { pricing: Partial<Record<StockLengthFt, number>>; url: string }) => {
    for (const p of purchases) {
      const unitPrice = spec.pricing[p.stockLengthFt as StockLengthFt] ?? 0;
      const existing = costMap.get(p.label);
      if (existing) {
        existing.quantity += p.count;
        existing.lineTotal = round2(existing.unitPrice * existing.quantity);
      } else {
        costMap.set(p.label, { description: p.label, unitPrice, quantity: p.count, lineTotal: round2(unitPrice * p.count), url: spec.url });
      }
    }
  };

  addCostItems(framingResult.purchases, frame);
  addCostItems(deckingResult.purchases, decking);
  addCostItems(fasciaResult.purchases, trim);

  const costLineItems = [...costMap.values()];

  const screws = SCREW_PRICING;
  const lbsNeeded = Math.ceil(screwCount / screws.screwsPerLb);
  let lbsRemaining = lbsNeeded;
  let screwCost = 0;
  const sortedBoxes = [...screws.boxSizes].sort((a, b) => b.lbs - a.lbs);
  for (const box of sortedBoxes) {
    const boxCount = Math.floor(lbsRemaining / box.lbs);
    if (boxCount > 0) { screwCost += boxCount * box.price; lbsRemaining -= boxCount * box.lbs; }
  }
  if (lbsRemaining > 0) screwCost += sortedBoxes[sortedBoxes.length - 1].price;
  if (screwCount > 0) {
    costLineItems.push({ description: `Deck screws (~${lbsNeeded} lb)`, unitPrice: round2(screwCost), quantity: 1, lineTotal: round2(screwCost), url: screws.url });
  }

  const costTotal = round2(costLineItems.reduce((s, li) => s + li.lineTotal, 0));

  return {
    framingLinearFt: framingLinearIn / 12, framingCutCount: framingCuts.length,
    deckingLinearFt: deckingLinearIn / 12, deckingCutCount: deckingCuts.length,
    fasciaLinearFt: fasciaLinearIn / 12, fasciaCutCount: fasciaCuts.length,
    screwCount, framingLumber: frame.label, deckingType: decking.label,
    framingPurchases: framingResult.purchases, deckingPurchases: deckingResult.purchases, fasciaPurchases: fasciaResult.purchases,
    oversizedCuts, costLineItems, costTotal,
  };
}

/**
 * Duplicate the longest cuts to account for a waste factor.
 * E.g. 10% waste on 10 cuts → 1 extra cut (the longest, most likely to be mis-cut).
 */
function applyWasteFactor(cuts: number[], multiplier: number): number[] {
  if (multiplier <= 1 || cuts.length === 0) return cuts;
  const extra = Math.ceil(cuts.length * (multiplier - 1));
  const sorted = [...cuts].sort((a, b) => b - a);
  // Add extra copies of the longest cuts (most expensive to re-buy)
  return [...cuts, ...sorted.slice(0, extra)];
}
