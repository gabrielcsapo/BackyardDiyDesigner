import React, { useState, useCallback, useMemo } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Edges, Grid, Html } from "@react-three/drei";
import type { FirePitModel, ChairPart, BrickSpec, BrickRing } from "./types";
import { inchesToFeetInches } from "../engine";

type FirePitViewMode = "finished" | "framing" | "exploded";

interface FirePitViewerProps {
  model: FirePitModel;
  viewMode: FirePitViewMode;
}

const tooltipStyle: React.CSSProperties = {
  background: "rgba(0,0,0,0.85)",
  color: "#fff",
  padding: "4px 10px",
  borderRadius: 4,
  fontSize: 12,
  whiteSpace: "nowrap",
  fontFamily: "-apple-system, sans-serif",
  pointerEvents: "none",
  lineHeight: 1.5,
};

const EDGE_COLOR = "#333333";
const HOVER_EMISSIVE = "#446688";
const HOVER_INTENSITY = 0.4;

// Chair part colors — warm wood tones
const PART_COLORS: Record<string, string> = {
  "front-leg":         "#b87333",
  "back-leg":          "#b87333",
  "stringer":          "#c4923a",
  "front-apron":       "#c4923a",
  "back-support":      "#c4923a",
  "seat-slat":         "#a0734a",
  "back-slat":         "#a0734a",
  "back-top-support":  "#8b6535",
  "back-base-support": "#8b6535",
  "arm-rest":          "#a0734a",
  "arm-support":       "#d4a060",
};

const RING_COLOR = "#444444";
const RING_INNER_COLOR = "#222222";
const BRICK_COLOR = "#8a7e72";

const ROLE_LABELS: Record<string, string> = {
  "front-leg":         "Front leg (2x4)",
  "back-leg":          "Back leg (2x4, 15° angle)",
  "stringer":          "Stringer (2x4, compound angles)",
  "front-apron":       "Front apron (2x4)",
  "back-support":      "Back support (2x4)",
  "seat-slat":         "Seat slat (1x4)",
  "back-slat":         "Back slat (1x4)",
  "back-top-support":  "Back top support (1x4)",
  "back-base-support": "Back base support (2x4)",
  "arm-rest":          "Arm rest (1x4)",
  "arm-support":       "Arm support (2x2)",
};

// ─── Chair Part Mesh ───

function ChairPartMesh({
  part,
  explodeY,
  onHover,
  onUnhover,
}: {
  part: ChairPart;
  explodeY: number;
  onHover: (label: string) => void;
  onUnhover: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const color = PART_COLORS[part.role] ?? "#c4923a";
  const label = `${ROLE_LABELS[part.role] ?? part.role} — ${part.lumber} x ${inchesToFeetInches(part.length)}\nChair #${part.chairIndex + 1}`;

  const pos: [number, number, number] = [
    part.position[0],
    part.position[1] + explodeY,
    part.position[2],
  ];

  return (
    <group
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHover(label); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); onUnhover(); }}
    >
      <mesh position={pos} rotation={part.rotation}>
        <boxGeometry args={part.size} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.9}
          emissive={hovered ? HOVER_EMISSIVE : "#000"}
          emissiveIntensity={hovered ? HOVER_INTENSITY : 0}
        />
        <Edges color={EDGE_COLOR} threshold={15} />
      </mesh>
    </group>
  );
}

// ─── Fire Pit Ring (steel insert) ───

function FirePitRingMesh({
  outerDiameter,
  innerDiameter,
  height,
  onHover,
  onUnhover,
}: {
  outerDiameter: number;
  innerDiameter: number;
  height: number;
  onHover: (label: string) => void;
  onUnhover: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const outerR = outerDiameter / 2;
  const innerR = innerDiameter / 2;
  const label = `VEVOR Fire Pit Ring\n${outerDiameter}" outer / ${innerDiameter}" inner, ${height}" tall`;

  return (
    <group
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHover(label); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); onUnhover(); }}
    >
      {/* Outer cylinder */}
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[outerR, outerR, height, 48]} />
        <meshStandardMaterial
          color={RING_COLOR}
          transparent
          opacity={0.8}
          metalness={0.6}
          roughness={0.4}
          emissive={hovered ? "#664422" : "#000"}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>
      {/* Inner cutout */}
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[innerR, innerR, height + 0.5, 48]} />
        <meshStandardMaterial color={RING_INNER_COLOR} side={THREE.BackSide} />
      </mesh>
      {/* Top ring surface */}
      <mesh position={[0, height, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[innerR, outerR, 48]} />
        <meshStandardMaterial color={RING_COLOR} metalness={0.6} roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* Fire glow inside */}
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[innerR - 2, innerR - 2, 3, 32]} />
        <meshStandardMaterial
          color="#ff4400"
          emissive="#ff6600"
          emissiveIntensity={0.8}
          transparent
          opacity={0.4}
        />
      </mesh>
    </group>
  );
}

// ─── Brick Ring ───

function BrickRingMesh({
  brickRing,
  brickSpec,
  onHover,
  onUnhover,
}: {
  brickRing: BrickRing;
  brickSpec: BrickSpec;
  onHover: (label: string) => void;
  onUnhover: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const label = `Retaining wall blocks\n${brickRing.bricksPerCourse} per course × ${brickRing.courses} courses = ${brickRing.totalBricks} blocks`;

  // Pre-compute all brick positions
  const bricks = useMemo(() => {
    const result: { position: [number, number, number]; rotation: number }[] = [];
    const midRadius = brickRing.innerRadius + brickSpec.depth / 2;

    for (let course = 0; course < brickRing.courses; course++) {
      const y = course * brickSpec.height + brickSpec.height / 2;
      // Stagger every other course by half a brick
      const staggerAngle = course % 2 === 0 ? 0 : Math.PI / brickRing.bricksPerCourse;

      for (let b = 0; b < brickRing.bricksPerCourse; b++) {
        const a = (2 * Math.PI * b) / brickRing.bricksPerCourse + staggerAngle;
        const x = Math.sin(a) * midRadius;
        const z = -Math.cos(a) * midRadius;
        result.push({ position: [x, y, z], rotation: a });
      }
    }
    return result;
  }, [brickRing, brickSpec]);

  return (
    <group
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHover(label); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); onUnhover(); }}
    >
      {bricks.map((b, i) => (
        <mesh key={i} position={b.position} rotation={[0, b.rotation, 0]}>
          <boxGeometry args={[brickSpec.width, brickSpec.height, brickSpec.depth]} />
          <meshStandardMaterial
            color={BRICK_COLOR}
            emissive={hovered ? "#554433" : "#000"}
            emissiveIntensity={hovered ? 0.3 : 0}
          />
          <Edges color="#5a5249" threshold={15} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Dimension Line ───

function DimensionLine({
  start,
  end,
  label,
}: {
  start: [number, number, number];
  end: [number, number, number];
  label: string;
}) {
  const mid: [number, number, number] = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
    (start[2] + end[2]) / 2,
  ];
  return (
    <group>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([...start, ...end]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ff4444" linewidth={2} />
      </line>
      <Html position={mid} center style={{ pointerEvents: "none" }}>
        <div
          style={{
            background: "rgba(0,0,0,0.75)",
            color: "white",
            padding: "2px 6px",
            borderRadius: 3,
            fontSize: 11,
            whiteSpace: "nowrap",
            fontFamily: "monospace",
          }}
        >
          {label}
        </div>
      </Html>
    </group>
  );
}

// ─── Scene ───

function Scene({
  model,
  viewMode,
  onHover,
  onUnhover,
}: {
  model: FirePitModel;
  viewMode: FirePitViewMode;
  onHover: (label: string) => void;
  onUnhover: () => void;
}) {
  const { ring, brick, brickRing, chairs, config } = model;
  const R = config.ringRadius;

  // In exploded mode, separate seat/back parts upward
  const ex = viewMode === "exploded";
  const explodeMap: Record<string, number> = {
    "front-leg":         0,
    "back-leg":          0,
    "stringer":          0,
    "front-apron":       0,
    "back-support":      ex ? 4 : 0,
    "seat-slat":         ex ? 8 : 0,
    "back-slat":         ex ? 14 : 0,
    "back-top-support":  ex ? 18 : 0,
    "back-base-support": ex ? 12 : 0,
    "arm-rest":          ex ? 20 : 0,
    "arm-support":       ex ? 6 : 0,
  };

  const framingRoles = new Set(["front-leg", "back-leg", "stringer", "front-apron", "back-support", "back-base-support"]);
  const showAllParts = viewMode === "finished" || viewMode === "exploded";

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[R * 2, R * 3, R * 2]} intensity={1} castShadow />
      <directionalLight position={[-R, R * 2, -R]} intensity={0.3} />

      {/* Fire pit steel ring */}
      <FirePitRingMesh
        outerDiameter={ring.outerDiameter}
        innerDiameter={ring.innerDiameter}
        height={ring.height}
        onHover={onHover}
        onUnhover={onUnhover}
      />

      {/* Brick surround */}
      <BrickRingMesh
        brickRing={brickRing}
        brickSpec={brick}
        onHover={onHover}
        onUnhover={onUnhover}
      />

      {/* Chairs — each wrapped in a group for position + Y rotation */}
      {chairs.map((chair) => (
        <group
          key={`chair-group-${chair.index}`}
          position={chair.position}
          rotation={[0, chair.angle, 0]}
        >
          {chair.parts
            .filter((p) => showAllParts || framingRoles.has(p.role))
            .map((part) => (
              <ChairPartMesh
                key={part.id}
                part={part}
                explodeY={explodeMap[part.role] ?? 0}
                onHover={onHover}
                onUnhover={onUnhover}
              />
            ))}
        </group>
      ))}

      {/* Dimension line: full circle diameter */}
      <DimensionLine
        start={[-R, -8, 0]}
        end={[R, -8, 0]}
        label={`Seating diameter: ${inchesToFeetInches(R * 2)}`}
      />

      <Grid
        args={[400, 400]}
        position={[0, -0.5, 0]}
        cellSize={12}
        cellColor="#888"
        sectionSize={48}
        sectionColor="#555"
        fadeDistance={400}
        fadeStrength={1}
      />

      <OrbitControls
        makeDefault
        minDistance={20}
        maxDistance={800}
        target={[0, 15, 0]}
      />
    </>
  );
}

// ─── Viewer Root ───

export default function FirePitViewer({ model, viewMode }: FirePitViewerProps) {
  const R = model.config.ringRadius;
  const maxDim = R * 2 + 60;

  const [hoverLabel, setHoverLabel] = useState<string | null>(null);
  const onHover = useCallback((label: string) => setHoverLabel(label), []);
  const onUnhover = useCallback(() => setHoverLabel(null), []);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Canvas
        camera={{
          position: [maxDim * 0.6, maxDim * 0.8, maxDim * 0.6],
          fov: 45,
          near: 0.1,
          far: 3000,
        }}
        shadows
        style={{ background: "#1a1a2e" }}
      >
        <Scene
          model={model}
          viewMode={viewMode}
          onHover={onHover}
          onUnhover={onUnhover}
        />
      </Canvas>
      {hoverLabel && (
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            ...tooltipStyle,
          }}
        >
          {hoverLabel.split("\n").map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}
    </div>
  );
}
