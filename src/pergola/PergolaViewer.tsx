import React, { useState, useCallback } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Edges, Grid, Html } from "@react-three/drei";
import type { PergolaModel, PergolaPost, PergolaBeam, PergolaRafter, PergolaSlat } from "./types";
import { inchesToFeetInches } from "../engine";

type PergolaViewMode = "finished" | "framing" | "exploded";

interface PergolaViewerProps {
  model: PergolaModel;
  viewMode: PergolaViewMode;
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

const HOVER_EMISSIVE = "#446688";
const HOVER_INTENSITY = 0.4;

const POST_COLOR = "#c4923a";
const BEAM_COLOR = "#b08030";
const RAFTER_COLOR = "#c4923a";
const SLAT_COLOR = "#d4a850";
const EDGE_COLOR = "#333333";
const CONCRETE_COLOR = "#a0a0a0";
const DIRT_COLOR = "#6b5344";

function PostMesh({
  post,
  showConcrete,
  explodeY,
  onHover,
  onUnhover,
}: {
  post: PergolaPost;
  showConcrete: boolean;
  explodeY: number;
  onHover: (label: string) => void;
  onUnhover: () => void;
}) {
  const s = post.actualSize;
  const [px, , pz] = post.position;
  const holeDiameter = post.postSize === "6x6" ? 14 : 12;

  const postLabel = `${post.postSize} Post (${post.label})\n${inchesToFeetInches(post.height)} total, ${inchesToFeetInches(post.burialDepth)} buried`;
  const concreteLabel = `Concrete footing — ${holeDiameter}" dia x ${post.burialDepth}" deep`;
  const [postHovered, setPostHovered] = useState(false);
  const [concreteHovered, setConcreteHovered] = useState(false);

  return (
    <group>
      <group
        onPointerOver={(e) => { e.stopPropagation(); setPostHovered(true); onHover(postLabel); }}
        onPointerOut={(e) => { e.stopPropagation(); setPostHovered(false); onUnhover(); }}
      >
        <mesh position={[px, post.aboveGround / 2 + explodeY, pz]}>
          <boxGeometry args={[s, post.aboveGround, s]} />
          <meshStandardMaterial
            color={POST_COLOR}
            transparent opacity={0.9}
            emissive={postHovered ? HOVER_EMISSIVE : "#000"}
            emissiveIntensity={postHovered ? HOVER_INTENSITY : 0}
          />
          <Edges color={EDGE_COLOR} threshold={15} />
        </mesh>
      </group>

      {showConcrete && (
        <group
          onPointerOver={(e) => { e.stopPropagation(); setConcreteHovered(true); onHover(concreteLabel); }}
          onPointerOut={(e) => { e.stopPropagation(); setConcreteHovered(false); onUnhover(); }}
        >
          <mesh position={[px, -post.burialDepth / 2, pz]}>
            <cylinderGeometry args={[holeDiameter / 2 + 0.5, holeDiameter / 2 + 0.5, post.burialDepth, 16]} />
            <meshStandardMaterial color={DIRT_COLOR} transparent opacity={0.5} />
            <Edges color="#4a3a2e" threshold={15} />
          </mesh>
          <mesh position={[px, -post.burialDepth / 2, pz]}>
            <cylinderGeometry args={[holeDiameter / 2, holeDiameter / 2, post.burialDepth, 16]} />
            <meshStandardMaterial
              color={CONCRETE_COLOR} transparent opacity={0.7}
              emissive={concreteHovered ? HOVER_EMISSIVE : "#000"}
              emissiveIntensity={concreteHovered ? HOVER_INTENSITY : 0}
            />
            <Edges color="#888" threshold={15} />
          </mesh>
          <mesh position={[px, -0.25, pz]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[s / 2 + 0.5, holeDiameter / 2, 16]} />
            <meshStandardMaterial color={CONCRETE_COLOR} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
    </group>
  );
}

function BeamMesh({
  beam,
  explodeY,
  onHover,
  onUnhover,
}: {
  beam: PergolaBeam;
  explodeY: number;
  onHover: (label: string) => void;
  onUnhover: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const label = `${beam.beamSize} Beam (${beam.side})\n${inchesToFeetInches(beam.length)} long`;
  const [bx, by, bz] = beam.position;

  return (
    <group
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHover(label); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); onUnhover(); }}
    >
      <mesh position={[bx, by + explodeY, bz]}>
        <boxGeometry args={[beam.length, beam.actualWidth, beam.actualThickness]} />
        <meshStandardMaterial
          color={BEAM_COLOR}
          transparent opacity={0.9}
          emissive={hovered ? HOVER_EMISSIVE : "#000"}
          emissiveIntensity={hovered ? HOVER_INTENSITY : 0}
        />
        <Edges color={EDGE_COLOR} threshold={15} />
      </mesh>
    </group>
  );
}

function RafterMesh({
  rafter,
  explodeY,
  onHover,
  onUnhover,
}: {
  rafter: PergolaRafter;
  explodeY: number;
  onHover: (label: string) => void;
  onUnhover: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const label = `${rafter.rafterSize} Rafter #${rafter.index + 1}\n${inchesToFeetInches(rafter.length)} long`;
  const [rx, ry, rz] = rafter.position;

  return (
    <group
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHover(label); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); onUnhover(); }}
    >
      <mesh position={[rx, ry + explodeY, rz]}>
        {/* Rafters run along Z (depth direction) */}
        <boxGeometry args={[rafter.actualThickness, rafter.actualWidth, rafter.length]} />
        <meshStandardMaterial
          color={RAFTER_COLOR}
          transparent opacity={0.9}
          emissive={hovered ? HOVER_EMISSIVE : "#000"}
          emissiveIntensity={hovered ? HOVER_INTENSITY : 0}
        />
        <Edges color={EDGE_COLOR} threshold={15} />
      </mesh>
    </group>
  );
}

function SlatMesh({
  slat,
  explodeY,
  onHover,
  onUnhover,
}: {
  slat: PergolaSlat;
  explodeY: number;
  onHover: (label: string) => void;
  onUnhover: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const label = `${slat.slatSize} Shade Slat #${slat.index + 1}\n${inchesToFeetInches(slat.length)} long`;
  const [sx, sy, sz] = slat.position;

  return (
    <group
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHover(label); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); onUnhover(); }}
    >
      <mesh position={[sx, sy + explodeY, sz]}>
        {/* Slats run along X (width direction) */}
        <boxGeometry args={[slat.length, slat.actualThickness, slat.actualWidth]} />
        <meshStandardMaterial
          color={SLAT_COLOR}
          transparent opacity={0.85}
          emissive={hovered ? HOVER_EMISSIVE : "#000"}
          emissiveIntensity={hovered ? HOVER_INTENSITY : 0}
        />
        <Edges color={EDGE_COLOR} threshold={15} />
      </mesh>
    </group>
  );
}

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

function Scene({
  model,
  viewMode,
  onHover,
  onUnhover,
}: {
  model: PergolaModel;
  viewMode: PergolaViewMode;
  hoverLabel: string | null;
  onHover: (label: string) => void;
  onUnhover: () => void;
}) {
  const W = model.config.width;
  const D = model.config.depth;
  const H = model.config.height;

  const showConcrete = viewMode === "finished" || viewMode === "exploded";
  const showSlats = viewMode === "finished" || viewMode === "exploded";

  // Exploded view offsets
  const postExplodeY = 0;
  const beamExplodeY = viewMode === "exploded" ? 12 : 0;
  const rafterExplodeY = viewMode === "exploded" ? 24 : 0;
  const slatExplodeY = viewMode === "exploded" ? 36 : 0;

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[W, H * 3, D]} intensity={1} castShadow />
      <directionalLight position={[-W * 0.5, H * 2, -D * 0.5]} intensity={0.3} />

      {model.posts.map((p) => (
        <PostMesh
          key={p.id}
          post={p}
          showConcrete={showConcrete}
          explodeY={postExplodeY}
          onHover={onHover}
          onUnhover={onUnhover}
        />
      ))}
      {model.beams.map((b) => (
        <BeamMesh
          key={b.id}
          beam={b}
          explodeY={beamExplodeY}
          onHover={onHover}
          onUnhover={onUnhover}
        />
      ))}
      {model.rafters.map((r) => (
        <RafterMesh
          key={r.id}
          rafter={r}
          explodeY={rafterExplodeY}
          onHover={onHover}
          onUnhover={onUnhover}
        />
      ))}
      {showSlats && model.slats.map((s) => (
        <SlatMesh
          key={s.id}
          slat={s}
          explodeY={slatExplodeY}
          onHover={onHover}
          onUnhover={onUnhover}
        />
      ))}

      {/* Dimension lines */}
      <DimensionLine
        start={[0, -8, -8]}
        end={[W, -8, -8]}
        label={`Width: ${inchesToFeetInches(W)}`}
      />
      <DimensionLine
        start={[-8, -8, 0]}
        end={[-8, -8, D]}
        label={`Depth: ${inchesToFeetInches(D)}`}
      />
      <DimensionLine
        start={[W + 8, 0, -8]}
        end={[W + 8, H, -8]}
        label={`Height: ${inchesToFeetInches(H)}`}
      />

      <Grid
        args={[400, 400]}
        position={[W / 2, -0.5, D / 2]}
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
        target={[W / 2, H / 2, D / 2]}
      />
    </>
  );
}

export default function PergolaViewer({ model, viewMode }: PergolaViewerProps) {
  const W = model.config.width;
  const D = model.config.depth;
  const H = model.config.height;
  const maxDim = Math.max(W, D);

  const [hoverLabel, setHoverLabel] = useState<string | null>(null);
  const onHover = useCallback((label: string) => setHoverLabel(label), []);
  const onUnhover = useCallback(() => setHoverLabel(null), []);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Canvas
        camera={{
          position: [W * 0.8, H * 3, D + maxDim * 0.6],
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
          hoverLabel={hoverLabel}
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
