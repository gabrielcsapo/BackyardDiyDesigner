import type {
  FirePitConfig,
  FirePitModel,
  FirePitChair,
  FirePitRing,
  BrickSpec,
  BrickRing,
  FirePitMaterialSummary,
  ChairPart,
  ChairBOMEntry,
} from "./types";
import type { CostLineItem } from "../types";
import { round2 } from "../engine";

// ─── Fire Pit Ring ───
export const FIRE_PIT_RING: FirePitRing = {
  outerDiameter: 45,
  innerDiameter: 39,
  height: 10,
  price: 63.99,
};

// ─── Retaining Wall Blocks ───
export const BRICK_SPEC: BrickSpec = {
  width: 11.75,
  height: 4,
  depth: 6.75,
  price: 2.37,
};

// ─── Lumber actual dimensions (inches) ───
const DIMS: Record<string, { t: number; w: number }> = {
  "2x4": { t: 1.5, w: 3.5 },
  "2x2": { t: 1.5, w: 1.5 },
  "1x4": { t: 0.75, w: 3.5 },
};

// ─── Chair geometry constants ───
// Based on Home Depot "How to Build an Adirondack Chair" guide
// Finished: ~27"W (arms) x 32"D x 37"H, seat ~14" front / ~11" back
const CHAIR_SEAT_WIDTH = 22.5;   // seat slat length
const CHAIR_ARM_WIDTH = 27;      // arm rest tip-to-tip
const CHAIR_DEPTH = 32;
const SEAT_FRONT_Y = 14;         // seat height at front
const SEAT_BACK_Y = 11;          // seat height at back
const ARM_Y = 22;                // arm rest height
const BACK_ANGLE = 15 * Math.PI / 180; // back tilt from vertical (radians)
const BACK_VIS_LENGTH = 26;      // visible back slat length above seat

/**
 * Per-chair BOM — Home Depot adirondack chair guide.
 */
export const CHAIR_BOM: ChairBOMEntry[] = [
  { lumber: "1x4", stockLengthFt: 8, qtyPerChair: 4, description: "1x4 x 8' board" },
  { lumber: "2x4", stockLengthFt: 8, qtyPerChair: 3, description: "2x4 x 8' board" },
  { lumber: "2x2", stockLengthFt: 6, qtyPerChair: 1, description: "2x2 x 6' board" },
];

/**
 * Cut list per chair.
 */
export const CHAIR_CUT_LIST: { role: string; lumber: string; length: number; qty: number }[] = [
  { role: "back-leg",          lumber: "2x4", length: 20.75,  qty: 2 },
  { role: "front-leg",         lumber: "2x4", length: 20,     qty: 2 },
  { role: "stringer",          lumber: "2x4", length: 31.875, qty: 2 },
  { role: "front-apron",       lumber: "2x4", length: 22.5,   qty: 1 },
  { role: "back-support",      lumber: "2x4", length: 22.5,   qty: 1 },
  { role: "back-base-support", lumber: "2x4", length: 19.5,   qty: 1 },
  { role: "arm-support",       lumber: "2x2", length: 26.5,   qty: 2 },
  { role: "seat-slat",         lumber: "1x4", length: 22.5,   qty: 5 },
  { role: "back-slat",         lumber: "1x4", length: 36,     qty: 5 },
  { role: "back-top-support",  lumber: "1x4", length: 19.5,   qty: 1 },
  { role: "arm-rest",          lumber: "1x4", length: 27,     qty: 2 },
];

// ─── Pricing ───

interface FirePitPricing {
  lumber: Record<string, Record<number, number>>;
  screws: { description: string; price: number }[];
  urls: {
    lumber: Record<string, string>;
    firePitRing: string;
    bricks: string;
    screws: string;
  };
}

export const FIREPIT_PRICING: FirePitPricing = {
  lumber: {
    "1x4": { 8: 4.52 },
    "2x4": { 8: 3.50 },
    "2x2": { 6: 2.98 },
  },
  screws: [
    { description: '1¼" deck screws (1 lb)', price: 9.97 },
    { description: '2" deck screws (1 lb)', price: 9.97 },
    { description: '2½" deck screws (1 lb)', price: 9.97 },
  ],
  urls: {
    lumber: {
      "1x4": "https://www.homedepot.com/p/1-in-x-4-in-x-8-ft-Premium-Kiln-Dried-Square-Edge-Whitewood-Common-Board-914681/100023465",
      "2x4": "https://www.homedepot.com/p/2-in-x-4-in-x-8-ft-2-Prime-or-BTR-Ground-Contact-Pressure-Treated-Southern-Yellow-Pine-Lumber-106147/206970948",
      "2x2": "https://www.homedepot.com/p/2-in-x-2-in-x-6-ft-Furring-Strip-Board-75800593/100087930",
    },
    firePitRing: "https://www.vevor.com/charcoal-fire-pit-c_10232/vevor-fire-pit-ring-round-45-inch-outer-steel-liner-diy-campfire-ring-firepit-p_010351371011",
    bricks: "https://www.homedepot.com/p/4-in-x-11-75-in-x-6-75-in-Pewter-Concrete-Retaining-Wall-Block-81100/100333178",
    screws: "https://www.homedepot.com/p/GRK-8-x-2-1-2-in-Star-Drive-Bugle-Head-R4-Multi-Purpose-Screw-1-lb-Pack-772691-117723/204853166",
  },
};

export const DEFAULT_FIREPIT_CONFIG: FirePitConfig = {
  chairCount: 4,
  ringRadius: 60,
  wasteFactor: 10,
};

// ─── Brick ring ───

function calculateBrickRing(): BrickRing {
  const innerRadius = FIRE_PIT_RING.outerDiameter / 2;
  const outerRadius = innerRadius + BRICK_SPEC.depth;
  const bricksPerCourse = Math.round(2 * Math.PI * innerRadius / BRICK_SPEC.width);
  const courses = Math.ceil(FIRE_PIT_RING.height / BRICK_SPEC.height);
  return { bricksPerCourse, courses, totalBricks: bricksPerCourse * courses, innerRadius, outerRadius };
}

// ─── Main generator ───

export function generateFirePit(config: FirePitConfig): FirePitModel {
  const warnings: string[] = [];
  const ring = FIRE_PIT_RING;
  const brickRing = calculateBrickRing();

  if (config.chairCount < 1) warnings.push("At least 1 chair needed.");
  if (config.chairCount > 8) warnings.push("More than 8 chairs may be crowded.");

  const circumference = 2 * Math.PI * config.ringRadius;
  const chairArcSpace = circumference / config.chairCount;
  if (chairArcSpace < CHAIR_ARM_WIDTH + 6) {
    warnings.push(
      `Chairs may overlap — ${round2(chairArcSpace)}" arc per chair vs ${CHAIR_ARM_WIDTH + 6}" needed.`
    );
  }

  const minRadius = brickRing.outerRadius + 12;
  if (config.ringRadius < minRadius) {
    warnings.push(`Chairs too close to fire. Minimum radius ~${Math.ceil(minRadius)}".`);
  }

  const chairs: FirePitChair[] = [];
  for (let i = 0; i < config.chairCount; i++) {
    const angle = (2 * Math.PI * i) / config.chairCount;
    const cx = Math.sin(angle) * config.ringRadius;
    const cz = -Math.cos(angle) * config.ringRadius;
    chairs.push({ index: i, angle, position: [cx, 0, cz], parts: generateChairParts(i) });
  }

  return { config, ring, brick: BRICK_SPEC, brickRing, chairs, materials: calculateMaterials(config, brickRing), warnings };
}

// ─── Chair 3D geometry ───
// Local coords per chair: X = width, Y = up, Z = +toward fire (front)
// Parts store LOCAL positions and LOCAL-only rotations (tilt).
// The viewer wraps each chair in a <group> with position + Y rotation.

function generateChairParts(chairIndex: number): ChairPart[] {
  const parts: ChairPart[] = [];
  const d24 = DIMS["2x4"];  // 1.5 x 3.5
  const d22 = DIMS["2x2"];  // 1.5 x 1.5
  const d14 = DIMS["1x4"];  // 0.75 x 3.5

  const halfW = CHAIR_SEAT_WIDTH / 2;  // 11.25

  // ── Key Z positions (front = +Z toward fire) ──
  const frontLegZ = 12;
  const backLegZ = -10;
  const chairFrontZ = 16;

  // ── Key Y positions ──
  const frontLegH = 20;
  const backLegLen = 20.75;

  const strFrontZ = frontLegZ;
  const strBackZ = backLegZ;
  const strLen = 31.875;

  let idx = 0;
  const add = (
    role: ChairPart["role"],
    lumber: string,
    length: number,
    lx: number, ly: number, lz: number,
    size: [number, number, number],
    tiltRx = 0,
  ) => {
    parts.push({
      id: `chair-${chairIndex}-${role}-${idx++}`,
      chairIndex, role, lumber, length,
      position: [lx, ly, lz],        // LOCAL position (viewer applies chair transform)
      rotation: [tiltRx, 0, 0],       // LOCAL tilt only (viewer applies Y rotation)
      size,
    });
  };

  // ─── Front legs (2x4, vertical) ───
  add("front-leg", "2x4", frontLegH, -halfW, frontLegH / 2, frontLegZ, [d24.t, frontLegH, d24.w]);
  add("front-leg", "2x4", frontLegH, halfW, frontLegH / 2, frontLegZ, [d24.t, frontLegH, d24.w]);

  // ─── Back legs (2x4, angled 15° backward) ───
  const blCY = backLegLen / 2 * Math.cos(BACK_ANGLE);
  const blCZ = backLegZ - backLegLen / 2 * Math.sin(BACK_ANGLE);
  add("back-leg", "2x4", backLegLen, -halfW, blCY, blCZ, [d24.t, backLegLen, d24.w], -BACK_ANGLE);
  add("back-leg", "2x4", backLegLen, halfW, blCY, blCZ, [d24.t, backLegLen, d24.w], -BACK_ANGLE);

  // ─── Stringers (2x4, sloped front-high to back-low) ───
  const strFrontY = SEAT_FRONT_Y - d14.t - d24.w / 2;
  const strBackY = SEAT_BACK_Y - d14.t - d24.w / 2;
  const strMidY = (strFrontY + strBackY) / 2;
  const strMidZ = (strFrontZ + strBackZ) / 2;
  const seatAngle = Math.atan2(strFrontY - strBackY, strFrontZ - strBackZ);
  add("stringer", "2x4", strLen, -halfW, strMidY, strMidZ, [d24.t, d24.w, strLen], seatAngle);
  add("stringer", "2x4", strLen, halfW, strMidY, strMidZ, [d24.t, d24.w, strLen], seatAngle);

  // ─── Front apron (2x4, across front) ───
  add("front-apron", "2x4", CHAIR_SEAT_WIDTH, 0, strFrontY, frontLegZ, [CHAIR_SEAT_WIDTH, d24.w, d24.t]);

  // ─── Back support (2x4, across back legs, tilted) ───
  const bsUp = 5;
  const bsY = SEAT_BACK_Y + bsUp * Math.cos(BACK_ANGLE);
  const bsZ = backLegZ - bsUp * Math.sin(BACK_ANGLE);
  add("back-support", "2x4", CHAIR_SEAT_WIDTH, 0, bsY, bsZ, [CHAIR_SEAT_WIDTH, d24.w, d24.t], -BACK_ANGLE);

  // ─── Seat slats (1x4 × 5, on top of stringers) ───
  const seatSlats = 5;
  const seatGap = 0.5;
  const seatZSpan = strFrontZ - strBackZ;
  const seatStartZ = strFrontZ - d14.w / 2;

  for (let s = 0; s < seatSlats; s++) {
    const slZ = seatStartZ - s * (d14.w + seatGap);
    const frac = (strFrontZ - slZ) / seatZSpan;
    const slY = SEAT_FRONT_Y - frac * (SEAT_FRONT_Y - SEAT_BACK_Y) + d14.t / 2;
    add("seat-slat", "1x4", CHAIR_SEAT_WIDTH, 0, slY, slZ, [CHAIR_SEAT_WIDTH, d14.t, d14.w]);
  }

  // ─── Back slats (1x4 × 5, tall Adirondack back) ───
  const backBaseY = SEAT_BACK_Y;
  const backBaseZ = backLegZ;
  const visH = BACK_VIS_LENGTH;
  const backGap = (CHAIR_SEAT_WIDTH - 5 * d14.w) / 6;

  for (let b = 0; b < 5; b++) {
    const bx = -halfW + backGap * (b + 1) + d14.w * b + d14.w / 2;
    const cY = backBaseY + visH / 2 * Math.cos(BACK_ANGLE);
    const cZ = backBaseZ - visH / 2 * Math.sin(BACK_ANGLE);
    add("back-slat", "1x4", 36, bx, cY, cZ, [d14.w, visH, d14.t], -BACK_ANGLE);
  }

  // ─── Back top support (1x4) ───
  const topUp = visH - 3;
  add("back-top-support", "1x4", 19.5, 0,
    backBaseY + topUp * Math.cos(BACK_ANGLE),
    backBaseZ - topUp * Math.sin(BACK_ANGLE),
    [19.5, d14.w, d14.t], -BACK_ANGLE);

  // ─── Back base support (2x4) ───
  const baseUp = 3;
  add("back-base-support", "2x4", 19.5, 0,
    backBaseY + baseUp * Math.cos(BACK_ANGLE),
    backBaseZ - baseUp * Math.sin(BACK_ANGLE),
    [19.5, d24.w, d24.t], -BACK_ANGLE);

  // ─── Arm supports (2x2, diagonal from front leg top to back leg area) ───
  const asFrontY = frontLegH;
  const asBackY = SEAT_BACK_Y;
  const asDy = asFrontY - asBackY;
  const asDz = frontLegZ - backLegZ;
  const asVisLen = Math.sqrt(asDy * asDy + asDz * asDz);
  const asAngle = Math.atan2(asDy, asDz);

  add("arm-support", "2x2", 26.5, -halfW - d22.t,
    (asFrontY + asBackY) / 2, (frontLegZ + backLegZ) / 2,
    [d22.t, d22.w, asVisLen], asAngle);
  add("arm-support", "2x2", 26.5, halfW + d22.t,
    (asFrontY + asBackY) / 2, (frontLegZ + backLegZ) / 2,
    [d22.t, d22.w, asVisLen], asAngle);

  // ─── Arm rests (1x4, flat on top) ───
  const armLen = 27;
  const armHalfW = CHAIR_ARM_WIDTH / 2;
  const armCZ = chairFrontZ - armLen / 2;
  add("arm-rest", "1x4", armLen, -armHalfW + d14.w / 2, ARM_Y, armCZ, [d14.w, d14.t, armLen]);
  add("arm-rest", "1x4", armLen, armHalfW - d14.w / 2, ARM_Y, armCZ, [d14.w, d14.t, armLen]);

  return parts;
}

// ─── Materials & Cost ───

function calculateMaterials(config: FirePitConfig, brickRing: BrickRing): FirePitMaterialSummary {
  const pricing = FIREPIT_PRICING;
  const wasteMult = 1 + config.wasteFactor / 100;
  const n = config.chairCount;
  const costLineItems: CostLineItem[] = [];

  // Fire pit ring
  costLineItems.push({
    description: `VEVOR Fire Pit Ring 45"`,
    unitPrice: FIRE_PIT_RING.price,
    quantity: 1,
    lineTotal: FIRE_PIT_RING.price,
    url: pricing.urls.firePitRing,
  });

  // Bricks
  costLineItems.push({
    description: `Pewter Retaining Wall Block`,
    unitPrice: BRICK_SPEC.price,
    quantity: brickRing.totalBricks,
    lineTotal: round2(BRICK_SPEC.price * brickRing.totalBricks),
    url: pricing.urls.bricks,
  });

  // Lumber
  for (const entry of CHAIR_BOM) {
    const qty = Math.ceil(entry.qtyPerChair * n * wasteMult);
    const unitPrice = pricing.lumber[entry.lumber]?.[entry.stockLengthFt] ?? 0;
    costLineItems.push({
      description: entry.description,
      unitPrice,
      quantity: qty,
      lineTotal: round2(unitPrice * qty),
      url: pricing.urls.lumber[entry.lumber],
    });
  }

  // Screws — 3 sizes, estimate 1 box of each per 2 chairs
  for (const screw of pricing.screws) {
    const boxes = Math.ceil(n / 2);
    costLineItems.push({
      description: screw.description,
      unitPrice: screw.price,
      quantity: boxes,
      lineTotal: round2(screw.price * boxes),
      url: pricing.urls.screws,
    });
  }

  return {
    chairCount: n,
    bomPerChair: CHAIR_BOM,
    cutListPerChair: CHAIR_CUT_LIST,
    brickRing,
    costLineItems,
    costTotal: round2(costLineItems.reduce((s, li) => s + li.lineTotal, 0)),
  };
}
