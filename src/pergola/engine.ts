import type {
  PergolaConfig,
  PergolaModel,
  PergolaPost,
  PergolaBeam,
  PergolaRafter,
  PergolaSlat,
  PergolaMaterialSummary,
} from "./types";
import type { BoardPurchase, CostLineItem } from "../types";
import {
  POST_LUMBER_OPTIONS,
  LUMBER_OPTIONS,
  HARDWARE_CATALOG,
  optimizePurchases,
  round2,
} from "../engine";

// ─── Pergola-specific hardware ───

export const PERGOLA_HARDWARE = {
  postBase: {
    label: "Simpson Strong-Tie post base",
    price: 25.0,
    url: "https://www.homedepot.com/p/Simpson-Strong-Tie-ABU-?"
  },
  beamBracket: {
    label: "Beam-to-post bracket/cap",
    price: 12.0,
    url: "https://www.homedepot.com/p/Simpson-Strong-Tie-BC-?"
  },
  rafterTie: {
    label: "Rafter tie / hurricane clip",
    price: 1.5,
    url: "https://www.homedepot.com/p/Simpson-Strong-Tie-H2.5A-?"
  },
  carriageBolt: {
    label: '1/2" x 8" carriage bolt',
    price: 2.0,
    url: "https://www.homedepot.com/p/Everbilt-1-2-x-8-Carriage-Bolt-?"
  },
  structuralScrews: {
    label: "#10 x 3\" structural screws (100pk)",
    screwsPerBox: 100,
    price: 22.0,
    url: "https://www.homedepot.com/p/GRK-10-x-3-RSS-?"
  },
};

/** Concrete lbs per post hole, keyed by post size. */
const CONCRETE_LBS_PER_HOLE: Record<string, number> = {
  "4x4": 80, // 12" diameter hole for pergola posts
  "6x6": 160, // 14" diameter hole × deeper for pergola
};

export const DEFAULT_PERGOLA_CONFIG: PergolaConfig = {
  width: 144, // 12'
  depth: 120, // 10'
  height: 96, // 8'
  postSize: "6x6",
  beamSize: "2x10",
  rafterSize: "2x6",
  rafterSpacing: 16,
  rafterOverhang: 12,
  beamOverhang: 6,
  addShadeSlats: false,
  slatSize: "2x2",
  slatSpacing: 3,
  posts: 4,
  wasteFactor: 10,
};

/** Post burial depth: 1/3 of above-ground height + 6", minimum 24". */
function postBurialDepth(height: number): number {
  return Math.max(24, Math.ceil(height / 3) + 6);
}

export function generatePergola(config: PergolaConfig): PergolaModel {
  const warnings: string[] = [];

  const postLumber = POST_LUMBER_OPTIONS[config.postSize];
  const beamLumber = LUMBER_OPTIONS[config.beamSize];
  const rafterLumber = LUMBER_OPTIONS[config.rafterSize];
  const slatLumber = LUMBER_OPTIONS[config.slatSize];

  const postActual = postLumber?.actualWidth ?? 3.5;
  const beamThick = beamLumber?.actualThickness ?? 1.5;
  const beamWidth = beamLumber?.actualWidth ?? 9.25;
  const rafterThick = rafterLumber?.actualThickness ?? 1.5;
  const rafterWidth = rafterLumber?.actualWidth ?? 5.5;
  const slatThick = slatLumber?.actualThickness ?? 1.5;
  const slatWidth = slatLumber?.actualWidth ?? 1.5;

  // ─── Beam span limits (single beam, post-to-post) ───
  const BEAM_MAX_SPAN: Record<string, number> = {
    "2x6": 72, "2x8": 96, "2x10": 120, "2x12": 144,
  };
  // ─── Rafter span limits by size and spacing ───
  const RAFTER_MAX_SPAN: Record<string, Record<number, number>> = {
    "2x6": { 12: 108, 16: 96, 24: 84 },
    "2x8": { 12: 156, 16: 144, 24: 120 },
    "2x10": { 12: 204, 16: 192, 24: 168 },
    "2x12": { 12: 252, 16: 240, 24: 216 },
  };

  // Effective beam span (post-to-post along width)
  const beamSpan = config.posts === 6 ? config.width / 2 : config.width;
  const beamMaxSpan = BEAM_MAX_SPAN[config.beamSize] ?? 120;
  const rafterMaxSpanTable = RAFTER_MAX_SPAN[config.rafterSize];
  const closestSpacing = [12, 16, 24].reduce((prev, curr) =>
    Math.abs(curr - config.rafterSpacing) < Math.abs(prev - config.rafterSpacing) ? curr : prev
  );
  const rafterMaxSpan = rafterMaxSpanTable?.[closestSpacing] ?? 144;

  // Validate inputs
  if (config.height < 84) warnings.push(`Pergola height under 7' may not provide adequate headroom.`);
  if (config.height > 120) warnings.push(`Pergola over 10' may require a building permit.`);
  if (config.height > 96 && config.postSize === "4x4") {
    warnings.push(`4x4 posts are not adequate for pergolas over 8' tall. Use 6x6 posts.`);
  }
  if (config.postSize === "4x4" && beamSpan > 96) {
    warnings.push(`4x4 posts with beam spans over 8' may be unstable. Consider 6x6 posts.`);
  }
  if (beamSpan > beamMaxSpan) {
    warnings.push(`Beam span ${Math.round(beamSpan / 12)}' exceeds max for single ${config.beamSize} (${beamMaxSpan / 12}'). Add intermediate posts or upsize beams.`);
  }
  if (config.width > 240 && config.posts === 4) {
    warnings.push(`Beam span of ${Math.round(config.width / 12)}' without middle posts may cause sagging. Consider using 6 posts.`);
  }
  if (config.depth > rafterMaxSpan) {
    warnings.push(`Rafter span ${Math.round(config.depth / 12)}' exceeds max for ${config.rafterSize} at ${closestSpacing}" OC (${Math.round(rafterMaxSpan / 12)}'). Upsize rafters or reduce depth.`);
  }
  if (config.rafterOverhang > 24) {
    warnings.push(`Rafter overhang beyond 24" may sag over time.`);
  }
  // Area-based permit warning
  const areaSqFt = (config.width / 12) * (config.depth / 12);
  if (areaSqFt > 120) {
    warnings.push(`Pergola area (${Math.round(areaSqFt)} sq ft) exceeds 120 sq ft. Many jurisdictions require a building permit.`);
  }
  // Shade slat span validation
  if (config.addShadeSlats) {
    const slatMaxSpan: Record<string, number> = { "1x2": 24, "2x2": 36, "1x4": 36, "2x4": 48 };
    const maxSpan = slatMaxSpan[config.slatSize] ?? 36;
    if (config.rafterSpacing > maxSpan) {
      warnings.push(`Rafter spacing ${config.rafterSpacing}" exceeds max span for ${config.slatSize} shade slats (${maxSpan}").`);
    }
  }

  const burialDepth = postBurialDepth(config.height);
  const postTotalLength = config.height + burialDepth;
  const W = config.width;
  const D = config.depth;
  const H = config.height;

  // ─── Posts ───
  const posts: PergolaPost[] = [];
  const postPositions: [number, number][] = [];

  // Corner posts — inset by half the post size for centering
  // Posts are at corners of the width x depth rectangle
  postPositions.push([0, 0]); // front-left
  postPositions.push([W, 0]); // front-right
  postPositions.push([W, D]); // back-right
  postPositions.push([0, D]); // back-left

  if (config.posts === 6) {
    // Middle posts on the width sides (front and back)
    postPositions.push([W / 2, 0]); // front-middle
    postPositions.push([W / 2, D]); // back-middle
  }

  const postLabels = ["front-left", "front-right", "back-right", "back-left", "front-middle", "back-middle"];
  for (let i = 0; i < postPositions.length; i++) {
    const [px, pz] = postPositions[i];
    posts.push({
      id: `post-${i}`,
      position: [px, 0, pz],
      height: postTotalLength,
      aboveGround: H,
      burialDepth,
      postSize: config.postSize,
      actualSize: postActual,
      label: postLabels[i] ?? `post-${i}`,
    });
  }

  // ─── Beams ───
  // Two beams running along the width direction, one on each side (front Z=0, back Z=D)
  const beamLength = W + 2 * config.beamOverhang;
  const beamY = H + beamWidth / 2; // beams sit on top of posts

  const beams: PergolaBeam[] = [
    {
      id: "beam-front",
      position: [W / 2, beamY, 0],
      length: beamLength,
      beamSize: config.beamSize,
      actualThickness: beamThick,
      actualWidth: beamWidth,
      side: "front",
    },
    {
      id: "beam-back",
      position: [W / 2, beamY, D],
      length: beamLength,
      beamSize: config.beamSize,
      actualThickness: beamThick,
      actualWidth: beamWidth,
      side: "back",
    },
  ];

  // ─── Rafters ───
  // Rafters run perpendicular to beams (along the depth direction) sitting on top of beams
  const rafterTotalLength = D + 2 * config.rafterOverhang;
  const rafterY = H + beamWidth + rafterWidth / 2; // on top of beams

  // Calculate number of rafters based on spacing
  const rafterCount = Math.floor(W / config.rafterSpacing) + 1;
  const rafters: PergolaRafter[] = [];

  for (let i = 0; i < rafterCount; i++) {
    const x = i * config.rafterSpacing;
    // Clamp to width
    const clampedX = Math.min(x, W);
    rafters.push({
      id: `rafter-${i}`,
      position: [clampedX, rafterY, D / 2],
      length: rafterTotalLength,
      rafterSize: config.rafterSize,
      actualThickness: rafterThick,
      actualWidth: rafterWidth,
      index: i,
    });
  }

  // Ensure there's a rafter at the far end if spacing doesn't land exactly
  const lastRafterX = (rafterCount - 1) * config.rafterSpacing;
  if (lastRafterX < W - 1) {
    rafters.push({
      id: `rafter-${rafterCount}`,
      position: [W, rafterY, D / 2],
      length: rafterTotalLength,
      rafterSize: config.rafterSize,
      actualThickness: rafterThick,
      actualWidth: rafterWidth,
      index: rafterCount,
    });
  }

  // ─── Shade Slats ───
  const slats: PergolaSlat[] = [];
  if (config.addShadeSlats) {
    const slatY = rafterY + rafterWidth / 2 + slatThick / 2; // on top of rafters
    // Slats run perpendicular to rafters (along width direction), on top of rafters
    const slatLength = W + 2 * config.beamOverhang;
    const slatStep = slatWidth + config.slatSpacing;
    const slatTotalSpan = D + 2 * config.rafterOverhang;
    const slatCount = Math.floor(slatTotalSpan / slatStep) + 1;
    const slatStartZ = -config.rafterOverhang;

    for (let i = 0; i < slatCount; i++) {
      const z = slatStartZ + i * slatStep;
      if (z > D + config.rafterOverhang) break;
      slats.push({
        id: `slat-${i}`,
        position: [W / 2, slatY, z],
        length: slatLength,
        slatSize: config.slatSize,
        actualThickness: slatThick,
        actualWidth: slatWidth,
        index: i,
      });
    }
  }

  const materials = calculateMaterials(config, posts, beams, rafters, slats, burialDepth);

  return { config, posts, beams, rafters, slats, materials, warnings };
}

function calculateMaterials(
  config: PergolaConfig,
  posts: PergolaPost[],
  beams: PergolaBeam[],
  rafters: PergolaRafter[],
  slats: PergolaSlat[],
  burialDepth: number,
): PergolaMaterialSummary {
  const hw = HARDWARE_CATALOG;
  const phw = PERGOLA_HARDWARE;
  const wasteMult = 1 + config.wasteFactor / 100;

  const postCount = posts.length;
  const postTotalLength = posts[0]?.height ?? 0;
  const beamCount = beams.length;
  const beamLength = beams[0]?.length ?? 0;
  const rafterCount = rafters.length;
  const rafterLength = rafters[0]?.length ?? 0;
  const slatCount = slats.length;
  const slatLength = slats[0]?.length ?? 0;

  // ─── Lumber cuts ───
  const postCuts = posts.map(() => postTotalLength);
  const beamCuts = beams.map(() => beamLength);
  const rafterCuts = rafters.map(() => rafterLength);
  const slatCuts = slats.map(() => slatLength);

  // ─── Bin-packing ───
  const postLumber = POST_LUMBER_OPTIONS[config.postSize];
  const beamLumber = LUMBER_OPTIONS[config.beamSize];
  const rafterLumber = LUMBER_OPTIONS[config.rafterSize];
  const slatLumber = LUMBER_OPTIONS[config.slatSize];

  const postResult = optimizePurchases(postCuts, config.postSize, postLumber?.stockLengths, postLumber?.pricing);
  const beamResult = optimizePurchases(beamCuts, config.beamSize, beamLumber?.stockLengths, beamLumber?.pricing);
  const rafterResult = optimizePurchases(rafterCuts, config.rafterSize, rafterLumber?.stockLengths, rafterLumber?.pricing);
  const slatResult = slatCuts.length > 0
    ? optimizePurchases(slatCuts, config.slatSize, slatLumber?.stockLengths, slatLumber?.pricing)
    : { purchases: [], oversized: [] };

  // Apply waste factor
  const applyWaste = (p: BoardPurchase[]): BoardPurchase[] =>
    p.map((b) => ({
      ...b,
      count: Math.ceil(b.count * wasteMult),
    }));

  const wastedPosts = applyWaste(postResult.purchases);
  const wastedBeams = applyWaste(beamResult.purchases);
  const wastedRafters = applyWaste(rafterResult.purchases);
  const wastedSlats = applyWaste(slatResult.purchases);

  const purchases: BoardPurchase[] = [
    ...wastedPosts,
    ...wastedBeams,
    ...wastedRafters,
    ...wastedSlats,
  ];

  // Collect oversized warnings (handled by caller via model.warnings)
  const allOversized = [
    ...postResult.oversized,
    ...beamResult.oversized,
    ...rafterResult.oversized,
    ...slatResult.oversized,
  ];

  // ─── Hardware quantities ───
  const postBaseCount = postCount;
  // 2 brackets per post (one per beam side)
  const beamBracketCount = postCount * 2;
  // 2 ties per rafter (one per beam)
  const rafterTieCount = rafterCount * 2;
  // 2 carriage bolts per beam-to-post connection (2 beams × N posts)
  const carriageBoltCount = postCount * 2 * 2;
  // Structural screws: 2 per rafter-to-slat crossing + misc
  const slatScrewCount = slatCount * rafterCount * 2;
  const miscScrewCount = rafterCount * 4; // rafter-to-beam toe-nails
  const totalScrews = slatScrewCount + miscScrewCount;
  const structuralScrewBoxes = Math.ceil(totalScrews / phw.structuralScrews.screwsPerBox);

  // ─── Concrete ───
  const lbsPerHole = CONCRETE_LBS_PER_HOLE[config.postSize] ?? 80;
  const totalConcreteLbs = postCount * lbsPerHole;
  const concreteBags = Math.ceil(totalConcreteLbs / hw.concrete.bagLbs);

  // ─── Cost line items ───
  const costLineItems: CostLineItem[] = [];

  for (const p of wastedPosts) {
    const unitPrice = postLumber?.pricing[p.stockLengthFt as keyof typeof postLumber.pricing] ?? 0;
    costLineItems.push({
      description: `${config.postSize} x ${p.stockLengthFt}'`,
      unitPrice,
      quantity: p.count,
      lineTotal: round2(unitPrice * p.count),
      url: postLumber?.url,
    });
  }

  for (const p of wastedBeams) {
    const unitPrice = beamLumber?.pricing[p.stockLengthFt as keyof typeof beamLumber.pricing] ?? 0;
    costLineItems.push({
      description: `${config.beamSize} beam x ${p.stockLengthFt}'`,
      unitPrice,
      quantity: p.count,
      lineTotal: round2(unitPrice * p.count),
      url: beamLumber?.url,
    });
  }

  for (const p of wastedRafters) {
    const unitPrice = rafterLumber?.pricing[p.stockLengthFt as keyof typeof rafterLumber.pricing] ?? 0;
    costLineItems.push({
      description: `${config.rafterSize} rafter x ${p.stockLengthFt}'`,
      unitPrice,
      quantity: p.count,
      lineTotal: round2(unitPrice * p.count),
      url: rafterLumber?.url,
    });
  }

  for (const p of wastedSlats) {
    const unitPrice = slatLumber?.pricing[p.stockLengthFt as keyof typeof slatLumber.pricing] ?? 0;
    costLineItems.push({
      description: `${config.slatSize} slat x ${p.stockLengthFt}'`,
      unitPrice,
      quantity: p.count,
      lineTotal: round2(unitPrice * p.count),
      url: slatLumber?.url,
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

  // Post bases
  if (postBaseCount > 0) {
    costLineItems.push({
      description: phw.postBase.label,
      unitPrice: phw.postBase.price,
      quantity: postBaseCount,
      lineTotal: round2(phw.postBase.price * postBaseCount),
      url: phw.postBase.url,
    });
  }

  // Beam brackets
  if (beamBracketCount > 0) {
    costLineItems.push({
      description: phw.beamBracket.label,
      unitPrice: phw.beamBracket.price,
      quantity: beamBracketCount,
      lineTotal: round2(phw.beamBracket.price * beamBracketCount),
      url: phw.beamBracket.url,
    });
  }

  // Rafter ties
  if (rafterTieCount > 0) {
    costLineItems.push({
      description: phw.rafterTie.label,
      unitPrice: phw.rafterTie.price,
      quantity: rafterTieCount,
      lineTotal: round2(phw.rafterTie.price * rafterTieCount),
      url: phw.rafterTie.url,
    });
  }

  // Carriage bolts
  if (carriageBoltCount > 0) {
    costLineItems.push({
      description: phw.carriageBolt.label,
      unitPrice: phw.carriageBolt.price,
      quantity: carriageBoltCount,
      lineTotal: round2(phw.carriageBolt.price * carriageBoltCount),
      url: phw.carriageBolt.url,
    });
  }

  // Structural screws
  if (structuralScrewBoxes > 0) {
    costLineItems.push({
      description: phw.structuralScrews.label,
      unitPrice: phw.structuralScrews.price,
      quantity: structuralScrewBoxes,
      lineTotal: round2(phw.structuralScrews.price * structuralScrewBoxes),
      url: phw.structuralScrews.url,
    });
  }

  const costTotal = round2(costLineItems.reduce((s, li) => s + li.lineTotal, 0));

  return {
    postCount,
    postLength: postTotalLength,
    burialDepth,
    beamCount,
    beamLength,
    rafterCount,
    rafterLength,
    slatCount,
    slatLength,
    concreteBags,
    postBaseCount,
    beamBracketCount,
    rafterTieCount,
    carriageBoltCount,
    structuralScrewBoxes,
    purchases,
    costLineItems,
    costTotal,
  };
}
