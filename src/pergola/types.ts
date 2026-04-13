import type { BoardPurchase, CostLineItem } from "../types";

export interface PergolaConfig {
  width: number; // inches — beam direction (default 144 / 12')
  depth: number; // inches — rafter direction (default 120 / 10')
  height: number; // inches — post height above ground (default 96 / 8')
  postSize: "4x4" | "6x6";
  beamSize: "2x8" | "2x10" | "2x12";
  rafterSize: "2x6" | "2x8";
  rafterSpacing: number; // inches, on-center (default 16)
  rafterOverhang: number; // inches past each beam (default 12)
  beamOverhang: number; // inches past each outer post (default 6)
  addShadeSlats: boolean;
  slatSize: "1x4" | "2x2";
  slatSpacing: number; // inches — gap between slats (default 3)
  posts: 4 | 6; // 6 = additional middle posts for wider spans
  wasteFactor: number; // percent (default 10)
}

export interface PergolaPost {
  id: string;
  position: [number, number, number];
  height: number; // total length including burial
  aboveGround: number;
  burialDepth: number;
  postSize: string;
  actualSize: number;
  label: string; // e.g. "corner" or "middle"
}

export interface PergolaBeam {
  id: string;
  position: [number, number, number];
  length: number;
  beamSize: string;
  actualThickness: number;
  actualWidth: number;
  side: "front" | "back";
}

export interface PergolaRafter {
  id: string;
  position: [number, number, number];
  length: number;
  rafterSize: string;
  actualThickness: number;
  actualWidth: number;
  index: number;
}

export interface PergolaSlat {
  id: string;
  position: [number, number, number];
  length: number;
  slatSize: string;
  actualThickness: number;
  actualWidth: number;
  index: number;
}

export interface PergolaMaterialSummary {
  postCount: number;
  postLength: number; // total length per post (above ground + burial)
  burialDepth: number;
  beamCount: number;
  beamLength: number;
  rafterCount: number;
  rafterLength: number;
  slatCount: number;
  slatLength: number;
  concreteBags: number;
  postBaseCount: number;
  beamBracketCount: number;
  rafterTieCount: number;
  carriageBoltCount: number;
  structuralScrewBoxes: number;
  purchases: BoardPurchase[];
  costLineItems: CostLineItem[];
  costTotal: number;
}

export interface PergolaModel {
  config: PergolaConfig;
  posts: PergolaPost[];
  beams: PergolaBeam[];
  rafters: PergolaRafter[];
  slats: PergolaSlat[];
  materials: PergolaMaterialSummary;
  warnings: string[];
}
