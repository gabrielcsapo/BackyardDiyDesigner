import type { BoardPurchase, CostLineItem } from "../types";

export interface PostSpec {
  label: string;
  actualSize: number; // inches (square cross-section)
}

export interface RailSpec {
  label: string;
  actualThickness: number;
  actualWidth: number;
}

export type FenceSide = "front" | "back" | "left" | "right";

export interface FenceConfig {
  enclosureWidth: number; // inches - X dimension
  enclosureDepth: number; // inches - Z dimension
  height: number; // inches - fence height (typical 36")
  postSpacing: number; // inches - spacing between posts (default 48" / 4 feet)
  postSize: string; // key into POST_OPTIONS
  railSize: string; // key into RAIL_OPTIONS
  gateSides: FenceSide[]; // which sides have a gate opening
  addChickenWire: boolean;
  chickenWireHeight: number; // inches - 24", 36", or 48"
  wasteFactor: number;
}

export interface FencePost {
  id: string;
  index: number;
  position: [number, number, number];
  height: number;
  isGatePost: boolean;
  isCorner: boolean;
  postSpec: PostSpec;
}

export interface FenceRail {
  id: string;
  position: [number, number, number];
  rotation: number; // Y-axis rotation in radians (0 = along X, PI/2 = along Z)
  length: number;
  role: "top" | "middle" | "bottom";
  side: FenceSide;
  railSpec: RailSpec;
}

export interface FencePanel {
  id: string;
  position: [number, number, number];
  rotation: number; // Y-axis rotation
  width: number;
  height: number;
}

export interface FenceGate {
  id: string;
  position: [number, number, number];
  rotation: number; // Y-axis rotation
  width: number;
  height: number;
  side: FenceSide;
}

export type FenceMember = FencePost | FenceRail | FencePanel | FenceGate;

export interface FenceMaterialSummary {
  postCount: number;
  postLength: number;
  burialDepth: number;
  railCount: number;
  railCuts: { length: number; count: number }[];
  chickenWireLinearFt: number;
  chickenWireRolls: number;
  stapleBoxes: number;
  concreteBags: number; // 80lb bags
  gateKits: number;
  screwCount: number;
  purchases: BoardPurchase[];
  costLineItems: CostLineItem[];
  costTotal: number;
}

export interface FenceModel {
  config: FenceConfig;
  posts: FencePost[];
  rails: FenceRail[];
  panels: FencePanel[];
  gates: FenceGate[];
  materials: FenceMaterialSummary;
  warnings: string[];
}
