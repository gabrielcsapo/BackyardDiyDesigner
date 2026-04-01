import type { CostLineItem } from "../types";

export interface ChairPart {
  id: string;
  chairIndex: number;
  role:
    | "front-leg"
    | "back-leg"
    | "stringer"
    | "front-apron"
    | "back-support"
    | "seat-slat"
    | "back-slat"
    | "back-top-support"
    | "back-base-support"
    | "arm-rest"
    | "arm-support";
  lumber: string; // "1x4", "2x4", "2x2"
  length: number; // inches (cut length)
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number, number]; // box geometry [width, height, depth]
}

export interface FirePitRing {
  outerDiameter: number;
  innerDiameter: number;
  height: number;
  price: number;
}

export interface BrickSpec {
  width: number;
  height: number;
  depth: number;
  price: number;
}

export interface FirePitConfig {
  chairCount: number; // 2-8
  ringRadius: number; // inches
  wasteFactor: number; // percentage 0-25
}

export interface FirePitChair {
  index: number;
  angle: number;
  position: [number, number, number];
  parts: ChairPart[];
}

export interface BrickRing {
  bricksPerCourse: number;
  courses: number;
  totalBricks: number;
  innerRadius: number;
  outerRadius: number;
}

export interface ChairBOMEntry {
  lumber: string;
  stockLengthFt: number;
  qtyPerChair: number;
  description: string;
}

export interface FirePitMaterialSummary {
  chairCount: number;
  bomPerChair: ChairBOMEntry[];
  cutListPerChair: { role: string; lumber: string; length: number; qty: number }[];
  brickRing: BrickRing;
  costLineItems: CostLineItem[];
  costTotal: number;
}

export interface FirePitModel {
  config: FirePitConfig;
  ring: FirePitRing;
  brick: BrickSpec;
  brickRing: BrickRing;
  chairs: FirePitChair[];
  materials: FirePitMaterialSummary;
  warnings: string[];
}
