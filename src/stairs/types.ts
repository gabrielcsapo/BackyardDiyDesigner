import type { LumberSpec, DeckingSpec, BoardPurchase, CostLineItem } from "../types";

export interface StairConfig {
  totalRise: number;
  stairWidth: number;
  stepCount: number;
  treadDepth: number;
  frameLumber: string;
  deckingBoard: string;
  deckingGap: number;
  treadOverhang: number;
  supportSpacing: number;
  wasteFactor: number;
  fasciaBoard: string;
  addFascia: boolean;
}

export interface FrameMember {
  id: string;
  stepIndex: number;
  role: "front" | "back" | "cross";
  length: number;
  position: [number, number, number];
  rotation: [number, number, number];
  lumberSpec: LumberSpec;
}

export interface DeckBoard {
  id: string;
  stepIndex: number;
  length: number;
  position: [number, number, number];
  deckingSpec: DeckingSpec;
}

export interface FasciaBoard {
  id: string;
  stepIndex: number;
  face: "front" | "left" | "right";
  length: number;
  height: number;
  position: [number, number, number];
  rotation: [number, number, number];
}

export interface BoxStep {
  index: number;
  width: number;
  depth: number;
  height: number;
  y: number;
  z: number;
  frameMembers: FrameMember[];
  deckBoards: DeckBoard[];
  fasciaBoards: FasciaBoard[];
}

export interface MaterialSummary {
  framingLinearFt: number;
  framingCutCount: number;
  deckingLinearFt: number;
  deckingCutCount: number;
  fasciaLinearFt: number;
  fasciaCutCount: number;
  screwCount: number;
  framingLumber: string;
  deckingType: string;
  framingPurchases: BoardPurchase[];
  deckingPurchases: BoardPurchase[];
  fasciaPurchases: BoardPurchase[];
  oversizedCuts: string[];
  costLineItems: CostLineItem[];
  costTotal: number;
}

export interface StairModel {
  config: StairConfig;
  steps: BoxStep[];
  riserHeight: number;
  totalRun: number;
  materials: MaterialSummary;
  warnings: string[];
}

export type ViewMode = "finished" | "framing" | "decking" | "exploded";
