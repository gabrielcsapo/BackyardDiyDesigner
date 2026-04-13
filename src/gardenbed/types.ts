import type { CostLineItem } from "../types";

export interface GardenBedConfig {
  length: number;       // inches (outer)
  width: number;        // inches (outer)
  height: number;       // inches (wall height)
  wallThickness: number; // 1 = single wythe, 2 = double wythe
  mortarJoint: number;  // inches (typically 3/8")
  wasteFactor: number;  // percentage 0-25
}

export interface BrickInstance {
  id: string;
  wall: "north" | "south" | "east" | "west";
  course: number;
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number, number];
}

export interface GardenBedGeometry {
  bricks: BrickInstance[];
}

export interface GardenBedMaterialSummary {
  totalBricks: number;
  bricksWithWaste: number;
  coursesHigh: number;
  bricksPerCourse: number;
  mortarBags: number;
  costLineItems: CostLineItem[];
  costTotal: number;
}

export interface GardenBedModel {
  config: GardenBedConfig;
  geometry: GardenBedGeometry;
  materials: GardenBedMaterialSummary;
  warnings: string[];
}
