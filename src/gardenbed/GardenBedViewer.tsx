import React, { useState, useCallback, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Edges, Grid, Html } from "@react-three/drei";
import type { GardenBedModel, BrickInstance } from "./types";
import { inchesToFeetInches } from "../engine";

type GardenBedViewMode = "finished" | "exploded";

interface GardenBedViewerProps {
  model: GardenBedModel;
  viewMode: GardenBedViewMode;
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

const EDGE_COLOR = "#6b5b4f";
const HOVER_EMISSIVE = "#886644";
const HOVER_INTENSITY = 0.4;

const WALL_COLORS: Record<string, string> = {
  north: "#b85c38",
  south: "#c0643d",
  east:  "#a8533a",
  west:  "#bf6040",
};

// ─── Brick Mesh ───

function BrickMesh({
  brick,
  explodeY,
  onHover,
  onUnhover,
}: {
  brick: BrickInstance;
  explodeY: number;
  onHover: (label: string) => void;
  onUnhover: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const color = WALL_COLORS[brick.wall] ?? "#b85c38";
  const label = `${brick.wall.charAt(0).toUpperCase() + brick.wall.slice(1)} wall — Course ${brick.course + 1}`;

  const pos: [number, number, number] = [
    brick.position[0],
    brick.position[1] + explodeY,
    brick.position[2],
  ];

  return (
    <group
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHover(label); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); onUnhover(); }}
    >
      <mesh position={pos} rotation={brick.rotation}>
        <boxGeometry args={brick.size} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.95}
          emissive={hovered ? HOVER_EMISSIVE : "#000"}
          emissiveIntensity={hovered ? HOVER_INTENSITY : 0}
        />
        <Edges color={EDGE_COLOR} threshold={15} />
      </mesh>
    </group>
  );
}

// ─── Soil fill (visual only) ───

function SoilFill({ length, width, height }: { length: number; width: number; height: number }) {
  const soilHeight = height * 0.85;
  return (
    <mesh position={[0, soilHeight / 2, 0]}>
      <boxGeometry args={[length * 0.92, soilHeight, width * 0.92]} />
      <meshStandardMaterial color="#5c4033" transparent opacity={0.5} />
    </mesh>
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
  model: GardenBedModel;
  viewMode: GardenBedViewMode;
  onHover: (label: string) => void;
  onUnhover: () => void;
}) {
  const { config, geometry } = model;
  const { length, width, height } = config;
  const maxDim = Math.max(length, width, height);

  const exploded = viewMode === "exploded";

  // In exploded mode, separate each course upward
  const courseExplodeGap = exploded ? 4 : 0;

  // Group bricks by wall for exploded side offset
  const wallOffset: Record<string, [number, number, number]> = {
    north: [0, 0, exploded ? 8 : 0],
    south: [0, 0, exploded ? -8 : 0],
    east:  [exploded ? 8 : 0, 0, 0],
    west:  [exploded ? -8 : 0, 0, 0],
  };

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[maxDim, maxDim * 1.5, maxDim]} intensity={1} castShadow />
      <directionalLight position={[-maxDim * 0.5, maxDim, -maxDim * 0.5]} intensity={0.3} />

      {/* Soil fill (only in finished mode) */}
      {viewMode === "finished" && (
        <SoilFill length={length} width={width} height={height} />
      )}

      {/* Bricks */}
      {geometry.bricks.map((brick) => {
        const wo = wallOffset[brick.wall] ?? [0, 0, 0];
        const explodeY = brick.course * courseExplodeGap + wo[1];
        return (
          <group key={brick.id} position={[wo[0], 0, wo[2]]}>
            <BrickMesh
              brick={brick}
              explodeY={explodeY}
              onHover={onHover}
              onUnhover={onUnhover}
            />
          </group>
        );
      })}

      {/* Dimension lines */}
      <DimensionLine
        start={[-length / 2, -6, -width / 2 - 8]}
        end={[length / 2, -6, -width / 2 - 8]}
        label={`Length: ${inchesToFeetInches(length)}`}
      />
      <DimensionLine
        start={[length / 2 + 8, -6, -width / 2]}
        end={[length / 2 + 8, -6, width / 2]}
        label={`Width: ${inchesToFeetInches(width)}`}
      />
      <DimensionLine
        start={[-length / 2 - 8, 0, -width / 2]}
        end={[-length / 2 - 8, height, -width / 2]}
        label={`Height: ${inchesToFeetInches(height)}`}
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
        target={[0, height / 2, 0]}
      />
    </>
  );
}

// ─── Viewer Root ───

export default function GardenBedViewer({ model, viewMode }: GardenBedViewerProps) {
  const maxDim = Math.max(model.config.length, model.config.width, model.config.height);

  const [hoverLabel, setHoverLabel] = useState<string | null>(null);
  const onHover = useCallback((label: string) => setHoverLabel(label), []);
  const onUnhover = useCallback(() => setHoverLabel(null), []);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Canvas
        camera={{
          position: [maxDim * 0.8, maxDim * 1.0, maxDim * 0.8],
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
