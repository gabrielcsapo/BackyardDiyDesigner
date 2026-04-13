import type {
  GardenBedConfig,
  GardenBedModel,
  GardenBedGeometry,
  GardenBedMaterialSummary,
  BrickInstance,
} from "./types";
import type { CostLineItem } from "../types";
import { round2 } from "../engine";

// ─── Standard modular brick (Home Depot) ───
// Actual: 7.625" L × 3.625" W × 2.25" H
export const BRICK = {
  length: 7.625,
  width: 3.625,
  height: 2.25,
  price: 0.75,
  url: "https://www.homedepot.com/p/7-5-8-in-x-2-1-4-in-x-3-5-8-in-Clay-Modular-Brick-RED0126MCO/100323015",
};

// ─── Mortar mix (80 lb bag) ───
export const MORTAR = {
  bagLbs: 80,
  bricksPerBag: 35,   // ~35 standard bricks per 80 lb bag (single wythe)
  price: 12.48,
  url: "https://www.homedepot.com/p/Quikrete-80-lb-Type-S-Mason-Mix-113680/100318430",
};

export const DEFAULT_GARDENBED_CONFIG: GardenBedConfig = {
  length: 96,         // 8'
  width: 48,          // 4'
  height: 18,         // 18" (~7 courses)
  wallThickness: 1,   // single wythe
  mortarJoint: 0.375, // 3/8"
  wasteFactor: 10,
};

// ─── Main generator ───

export function generateGardenBed(config: GardenBedConfig): GardenBedModel {
  const warnings: string[] = [];
  const { length, width, height, wallThickness, mortarJoint } = config;

  if (length < 24) warnings.push("Length is very short — consider at least 24\".");
  if (width < 12) warnings.push("Width is very narrow — consider at least 12\".");
  if (height < BRICK.height + mortarJoint) warnings.push("Height too short for even one course.");
  if (height > 48) warnings.push("Walls above 48\" may need reinforcement or a structural engineer.");
  if (wallThickness === 2 && width < 24) {
    warnings.push("Double-wythe walls leave very little interior space at this width.");
  }

  const coursesHigh = Math.max(1, Math.ceil(height / (BRICK.height + mortarJoint)));

  const geometry = generateGeometry(config, coursesHigh);
  const materials = calculateMaterials(config, geometry.bricks.length, coursesHigh);

  return { config, geometry, materials, warnings };
}

// ─── Geometry (3D brick positions) ───

function generateGeometry(config: GardenBedConfig, coursesHigh: number): GardenBedGeometry {
  const { length, width, wallThickness, mortarJoint } = config;
  const bricks: BrickInstance[] = [];
  const unit = BRICK.length + mortarJoint; // center-to-center along a course
  const courseH = BRICK.height + mortarJoint;
  let id = 0;

  // For running bond: offset every other course by half a brick
  // Corners interlock: even courses have long walls running full, odd courses have short walls running full

  for (let c = 0; c < coursesHigh; c++) {
    const y = c * courseH + BRICK.height / 2;
    const isEvenCourse = c % 2 === 0;
    const halfOffset = unit / 2; // running bond offset

    for (let wythe = 0; wythe < wallThickness; wythe++) {
      const wytheOffset = wythe * (BRICK.width + mortarJoint);
      // Inner wythes have a shorter effective perimeter due to corners
      const effLength = length - wytheOffset * 2;
      const effWidth = width - wytheOffset * 2;

      // ─── South wall (z = 0 side, bricks along X) ───
      {
        const wallLen = isEvenCourse ? effLength : effLength - 2 * BRICK.width;
        const startX = isEvenCourse ? 0 : BRICK.width;
        const z = BRICK.width / 2 + wytheOffset;
        const count = Math.floor(wallLen / unit);
        if (count > 0) {
          const offset = isEvenCourse ? 0 : halfOffset;
          for (let i = 0; i < count; i++) {
            const x = wytheOffset + startX + offset + i * unit + BRICK.length / 2;
            if (x + BRICK.length / 2 > length - wytheOffset + 0.5) continue;
            bricks.push({
              id: `b-${id++}`,
              wall: "south",
              course: c,
              position: [x - length / 2, y, z - width / 2],
              rotation: [0, 0, 0],
              size: [BRICK.length, BRICK.height, BRICK.width],
            });
          }
        }
      }

      // ─── North wall (z = width side, bricks along X) ───
      {
        const wallLen = isEvenCourse ? effLength : effLength - 2 * BRICK.width;
        const startX = isEvenCourse ? 0 : BRICK.width;
        const z = width - BRICK.width / 2 - wytheOffset;
        const count = Math.floor(wallLen / unit);
        if (count > 0) {
          const offset = isEvenCourse ? 0 : halfOffset;
          for (let i = 0; i < count; i++) {
            const x = wytheOffset + startX + offset + i * unit + BRICK.length / 2;
            if (x + BRICK.length / 2 > length - wytheOffset + 0.5) continue;
            bricks.push({
              id: `b-${id++}`,
              wall: "north",
              course: c,
              position: [x - length / 2, y, z - width / 2],
              rotation: [0, 0, 0],
              size: [BRICK.length, BRICK.height, BRICK.width],
            });
          }
        }
      }

      // ─── West wall (x = 0 side, bricks along Z, rotated 90°) ───
      {
        const wallLen = isEvenCourse ? effWidth - 2 * BRICK.width : effWidth;
        const startZ = isEvenCourse ? BRICK.width : 0;
        const x = BRICK.width / 2 + wytheOffset;
        const count = Math.floor(wallLen / unit);
        if (count > 0) {
          const offset = isEvenCourse ? halfOffset : 0;
          for (let i = 0; i < count; i++) {
            const z = wytheOffset + startZ + offset + i * unit + BRICK.length / 2;
            if (z + BRICK.length / 2 > width - wytheOffset + 0.5) continue;
            bricks.push({
              id: `b-${id++}`,
              wall: "west",
              course: c,
              position: [x - length / 2, y, z - width / 2],
              rotation: [0, Math.PI / 2, 0],
              size: [BRICK.length, BRICK.height, BRICK.width],
            });
          }
        }
      }

      // ─── East wall (x = length side, bricks along Z, rotated 90°) ───
      {
        const wallLen = isEvenCourse ? effWidth - 2 * BRICK.width : effWidth;
        const startZ = isEvenCourse ? BRICK.width : 0;
        const x = length - BRICK.width / 2 - wytheOffset;
        const count = Math.floor(wallLen / unit);
        if (count > 0) {
          const offset = isEvenCourse ? halfOffset : 0;
          for (let i = 0; i < count; i++) {
            const z = wytheOffset + startZ + offset + i * unit + BRICK.length / 2;
            if (z + BRICK.length / 2 > width - wytheOffset + 0.5) continue;
            bricks.push({
              id: `b-${id++}`,
              wall: "east",
              course: c,
              position: [x - length / 2, y, z - width / 2],
              rotation: [0, Math.PI / 2, 0],
              size: [BRICK.length, BRICK.height, BRICK.width],
            });
          }
        }
      }
    }
  }

  return { bricks };
}

// ─── Materials & Cost ───

function calculateMaterials(
  config: GardenBedConfig,
  geometryBrickCount: number,
  coursesHigh: number,
): GardenBedMaterialSummary {
  const { wasteFactor } = config;
  const costLineItems: CostLineItem[] = [];

  // Use the geometry brick count as the source of truth — it correctly
  // handles corner interlocking, running bond offsets, and double wythe
  const totalBricks = geometryBrickCount;
  const bricksPerCourse = coursesHigh > 0 ? Math.round(totalBricks / coursesHigh) : 0;

  const wasteMultiplier = 1 + wasteFactor / 100;
  const bricksWithWaste = Math.ceil(totalBricks * wasteMultiplier);

  // Mortar bags
  const mortarBags = Math.ceil(totalBricks / MORTAR.bricksPerBag);

  // Cost items
  costLineItems.push({
    description: "Clay Modular Brick",
    unitPrice: BRICK.price,
    quantity: bricksWithWaste,
    lineTotal: round2(BRICK.price * bricksWithWaste),
    url: BRICK.url,
  });

  costLineItems.push({
    description: "Type S Mason Mix (80 lb)",
    unitPrice: MORTAR.price,
    quantity: mortarBags,
    lineTotal: round2(MORTAR.price * mortarBags),
    url: MORTAR.url,
  });

  const costTotal = round2(costLineItems.reduce((s, li) => s + li.lineTotal, 0));

  return {
    totalBricks,
    bricksWithWaste,
    coursesHigh,
    bricksPerCourse,
    mortarBags,
    costLineItems,
    costTotal,
  };
}
