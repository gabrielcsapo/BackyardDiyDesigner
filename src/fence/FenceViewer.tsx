import React, { useState, useCallback } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Edges, Grid, Html } from "@react-three/drei";
import type { FenceModel, FencePost, FenceRail, FencePanel, FenceGate } from "./types";
import { inchesToFeetInches } from "../engine";

type FenceViewMode = "finished" | "framing" | "exploded";

interface FenceViewerProps {
  model: FenceModel;
  viewMode: FenceViewMode;
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

/** Wrap a mesh group to show a tooltip on hover */
function Hoverable({
  label,
  children,
  onHover,
  onUnhover,
}: {
  label: string;
  children: React.ReactNode;
  onHover: (label: string) => void;
  onUnhover: () => void;
}) {
  return (
    <group
      onPointerOver={(e) => { e.stopPropagation(); onHover(label); }}
      onPointerOut={(e) => { e.stopPropagation(); onUnhover(); }}
    >
      {children}
    </group>
  );
}

const HOVER_EMISSIVE = "#446688";
const HOVER_INTENSITY = 0.4;

const POST_COLOR = "#c4923a";
const GATE_POST_COLOR = "#b8842f";
const RAIL_COLOR = "#c4923a";
const WIRE_COLOR = "#999999";
const GATE_COLOR = "#aa8844";
const EDGE_COLOR = "#333333";
const HINGE_COLOR = "#666666";

const BURIAL_DEPTH = 24; // 2 feet deep
const HOLE_DIAMETER = 12; // 1 foot diameter
const CONCRETE_COLOR = "#a0a0a0";
const DIRT_COLOR = "#6b5344";

function PostMesh({ post, showConcrete, onHover, onUnhover }: {
  post: FencePost;
  showConcrete: boolean;
  onHover: (label: string) => void;
  onUnhover: () => void;
}) {
  const s = post.postSpec.actualSize;
  const [px, py, pz] = post.position;

  const postLabel = `${post.postSpec.label} Post — ${inchesToFeetInches(post.height)} total\n${inchesToFeetInches(BURIAL_DEPTH)} buried${post.isGatePost ? " (gate post)" : post.isCorner ? " (corner)" : ""}`;
  const concreteLabel = `Concrete footing — ${HOLE_DIAMETER}" dia x ${BURIAL_DEPTH}" deep\n40 lbs concrete mix`;
  const [postHovered, setPostHovered] = useState(false);
  const [concreteHovered, setConcreteHovered] = useState(false);

  return (
    <group>
      <group
        onPointerOver={(e) => { e.stopPropagation(); setPostHovered(true); onHover(postLabel); }}
        onPointerOut={(e) => { e.stopPropagation(); setPostHovered(false); onUnhover(); }}
      >
        <mesh position={[px, py + post.height / 2, pz]}>
          <boxGeometry args={[s, post.height, s]} />
          <meshStandardMaterial
            color={post.isGatePost ? GATE_POST_COLOR : POST_COLOR}
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
          <mesh position={[px, py - BURIAL_DEPTH / 2, pz]}>
            <cylinderGeometry args={[HOLE_DIAMETER / 2 + 0.5, HOLE_DIAMETER / 2 + 0.5, BURIAL_DEPTH, 16]} />
            <meshStandardMaterial color={DIRT_COLOR} transparent opacity={0.5} />
            <Edges color="#4a3a2e" threshold={15} />
          </mesh>
          <mesh position={[px, py - BURIAL_DEPTH / 2, pz]}>
            <cylinderGeometry args={[HOLE_DIAMETER / 2, HOLE_DIAMETER / 2, BURIAL_DEPTH, 16]} />
            <meshStandardMaterial
              color={CONCRETE_COLOR} transparent opacity={0.7}
              emissive={concreteHovered ? HOVER_EMISSIVE : "#000"}
              emissiveIntensity={concreteHovered ? HOVER_INTENSITY : 0}
            />
            <Edges color="#888" threshold={15} />
          </mesh>
          <mesh position={[px, py - 0.25, pz]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[s / 2 + 0.5, HOLE_DIAMETER / 2, 16]} />
            <meshStandardMaterial color={CONCRETE_COLOR} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
    </group>
  );
}

function RailMesh({ rail, onHover, onUnhover }: {
  rail: FenceRail;
  onHover: (label: string) => void;
  onUnhover: () => void;
}) {
  const { actualThickness: t, actualWidth: w } = rail.railSpec;
  const label = `${rail.railSpec.label} ${rail.role} rail — ${inchesToFeetInches(rail.length)} long\n${rail.side} side, pocket-screwed to posts`;
  const [hovered, setHovered] = useState(false);
  return (
    <group
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHover(label); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); onUnhover(); }}
    >
      <mesh position={rail.position} rotation={[0, rail.rotation, 0]}>
        <boxGeometry args={[rail.length, w, t]} />
        <meshStandardMaterial
          color={RAIL_COLOR} transparent opacity={0.9}
          emissive={hovered ? HOVER_EMISSIVE : "#000"}
          emissiveIntensity={hovered ? HOVER_INTENSITY : 0}
        />
        <Edges color={EDGE_COLOR} threshold={15} />
      </mesh>
    </group>
  );
}

function ChickenWirePanel({
  panel,
  explodeOffset,
  onHover,
  onUnhover,
}: {
  panel: FencePanel;
  explodeOffset: number;
  onHover: (label: string) => void;
  onUnhover: () => void;
}) {
  const ex = Math.sin(panel.rotation) * explodeOffset;
  const ez = -Math.cos(panel.rotation) * explodeOffset;
  const label = `Chicken wire panel — ${inchesToFeetInches(panel.width)} x ${inchesToFeetInches(panel.height)}\nStapled to rails`;
  const [hovered, setHovered] = useState(false);
  return (
    <group
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHover(label); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); onUnhover(); }}
    >
      <mesh
        position={[
          panel.position[0] + ex,
          panel.position[1],
          panel.position[2] + ez,
        ]}
        rotation={[0, panel.rotation, 0]}
      >
        <boxGeometry args={[panel.width, panel.height, 0.1]} />
        <meshStandardMaterial
          color={hovered ? "#ccddee" : WIRE_COLOR}
          transparent
          opacity={hovered ? 0.5 : 0.3}
          wireframe
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

const GATE_FRAME_COLOR = "#d4a24a"; // brighter golden to stand out from fence
const GATE_WIRE_COLOR = "#bbbbbb"; // lighter wire than fence panels
const GATE_SWING_ANGLE = 0.35; // ~20 degrees open so it reads as a door

function GateMesh({
  gate,
  explodeOffset,
  onHover,
  onUnhover,
}: {
  gate: FenceGate;
  explodeOffset: number;
  onHover: (label: string) => void;
  onUnhover: () => void;
}) {
  const frameT = 3.0; // thicker than regular rails so the gate frame pops
  const frameD = 3.0;
  const halfW = gate.width / 2;
  const halfH = gate.height / 2;
  const diagLen = Math.sqrt(gate.width ** 2 + gate.height ** 2);
  const diagAngle = Math.atan2(gate.height, gate.width);

  const ex = Math.sin(gate.rotation) * explodeOffset;
  const ez = -Math.cos(gate.rotation) * explodeOffset;
  const gateLabel = `Gate — ${inchesToFeetInches(gate.width)} x ${inchesToFeetInches(gate.height)}\n${gate.side} side, with hinges + latch`;
  const [hovered, setHovered] = useState(false);
  const gateFrameColor = hovered ? "#eebb55" : GATE_COLOR;

  return (
    <group
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHover(gateLabel); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); onUnhover(); }}
    >
    <group
      position={[
        gate.position[0] + ex,
        gate.position[1],
        gate.position[2] + ez,
      ]}
      rotation={[0, gate.rotation, 0]}
    >
      {/* Pivot the whole gate from the left (hinge) edge, swung slightly open */}
      <group position={[-halfW, 0, 0]} rotation={[0, GATE_SWING_ANGLE, 0]}>
        <group position={[halfW, 0, 0]}>
          {/* Chicken wire fill — lighter and more visible than fence panels */}
          <mesh>
            <boxGeometry args={[gate.width, gate.height, 0.1]} />
            <meshStandardMaterial
              color={GATE_WIRE_COLOR}
              transparent
              opacity={0.2}
              wireframe
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Top rail */}
          <mesh position={[0, halfH - frameT / 2, 0]}>
            <boxGeometry args={[gate.width, frameT, frameD]} />
            <meshStandardMaterial color={gateFrameColor} emissive={hovered ? HOVER_EMISSIVE : "#000"} emissiveIntensity={hovered ? HOVER_INTENSITY : 0} />
            <Edges color={EDGE_COLOR} threshold={15} />
          </mesh>
          {/* Bottom rail */}
          <mesh position={[0, -halfH + frameT / 2, 0]}>
            <boxGeometry args={[gate.width, frameT, frameD]} />
            <meshStandardMaterial color={gateFrameColor} emissive={hovered ? HOVER_EMISSIVE : "#000"} emissiveIntensity={hovered ? HOVER_INTENSITY : 0} />
            <Edges color={EDGE_COLOR} threshold={15} />
          </mesh>
          {/* Left stile (hinge side) */}
          <mesh position={[-halfW + frameT / 2, 0, 0]}>
            <boxGeometry args={[frameT, gate.height, frameD]} />
            <meshStandardMaterial color={gateFrameColor} emissive={hovered ? HOVER_EMISSIVE : "#000"} emissiveIntensity={hovered ? HOVER_INTENSITY : 0} />
            <Edges color={EDGE_COLOR} threshold={15} />
          </mesh>
          {/* Right stile (latch side) */}
          <mesh position={[halfW - frameT / 2, 0, 0]}>
            <boxGeometry args={[frameT, gate.height, frameD]} />
            <meshStandardMaterial color={gateFrameColor} emissive={hovered ? HOVER_EMISSIVE : "#000"} emissiveIntensity={hovered ? HOVER_INTENSITY : 0} />
            <Edges color={EDGE_COLOR} threshold={15} />
          </mesh>
          {/* Diagonal brace */}
          <mesh rotation={[0, 0, diagAngle]}>
            <boxGeometry args={[diagLen * 0.92, frameT * 0.5, frameD * 0.5]} />
            <meshStandardMaterial color={gateFrameColor} emissive={hovered ? HOVER_EMISSIVE : "#000"} emissiveIntensity={hovered ? HOVER_INTENSITY : 0} />
            <Edges color={EDGE_COLOR} threshold={15} />
          </mesh>

          {/* Hinges — black T-strap style (3 hinges for visibility) */}
          {[-halfH * 0.6, 0, halfH * 0.6].map((yOff, i) => (
            <group key={`hinge-${i}`} position={[-halfW, yOff, frameD / 2 + 0.2]}>
              {/* Hinge barrel */}
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.6, 0.6, 2.0, 12]} />
                <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
              </mesh>
              {/* Strap across the gate */}
              <mesh position={[4, 0, 0]}>
                <boxGeometry args={[8, 0.8, 0.3]} />
                <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
              </mesh>
            </group>
          ))}

          {/* Latch on the right side */}
          <group position={[halfW - 2, 0, frameD / 2 + 0.2]}>
            {/* Latch plate */}
            <mesh>
              <boxGeometry args={[3, 4, 0.3]} />
              <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Latch handle */}
            <mesh position={[0, 0, 0.8]}>
              <boxGeometry args={[1.5, 1, 1.2]} />
              <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
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

function Scene({ model, viewMode, hoverLabel, onHover, onUnhover }: {
  model: FenceModel;
  viewMode: FenceViewMode;
  hoverLabel: string | null;
  onHover: (label: string) => void;
  onUnhover: () => void;
}) {
  const W = model.config.enclosureWidth;
  const D = model.config.enclosureDepth;
  const H = model.config.height;
  const explodeOffset = viewMode === "exploded" ? 6 : 0;

  const showPanels = viewMode === "finished" || viewMode === "exploded";
  const showGates = viewMode === "finished" || viewMode === "exploded";
  const showConcrete = viewMode === "finished" || viewMode === "exploded";

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[W, H * 3, D]} intensity={1} castShadow />
      <directionalLight position={[-W * 0.5, H * 2, -D * 0.5]} intensity={0.3} />

      {model.posts.map((p) => (
        <PostMesh key={p.id} post={p} showConcrete={showConcrete} onHover={onHover} onUnhover={onUnhover} />
      ))}
      {model.rails.map((r) => (
        <RailMesh key={r.id} rail={r} onHover={onHover} onUnhover={onUnhover} />
      ))}

      {showPanels && model.panels.map((p) => (
        <ChickenWirePanel key={p.id} panel={p} explodeOffset={explodeOffset} onHover={onHover} onUnhover={onUnhover} />
      ))}
      {showGates && model.gates.map((g) => (
        <GateMesh key={g.id} gate={g} explodeOffset={explodeOffset} onHover={onHover} onUnhover={onUnhover} />
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

export default function FenceViewer({ model, viewMode }: FenceViewerProps) {
  const W = model.config.enclosureWidth;
  const D = model.config.enclosureDepth;
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
        <Scene model={model} viewMode={viewMode} hoverLabel={hoverLabel} onHover={onHover} onUnhover={onUnhover} />
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
