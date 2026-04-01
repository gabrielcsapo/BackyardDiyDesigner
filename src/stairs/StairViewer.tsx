import React, { useMemo, useState, useCallback } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Edges, Grid, Html } from "@react-three/drei";
import type { StairModel, BoxStep, FrameMember, DeckBoard, FasciaBoard, ViewMode } from "./types";
import { inchesToFeetInches } from "../engine";

const FRAME_COLOR = "#c4923a";
const DECK_COLOR = "#a0734a";
const FASCIA_COLOR = "#8b6535";
const EDGE_COLOR = "#333333";

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

interface HoverCallbacks {
  onHover: (label: string) => void;
  onUnhover: () => void;
}

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

interface StairViewerProps {
  model: StairModel;
  viewMode: ViewMode;
}

const HOVER_EMISSIVE = "#446688";
const HOVER_EMISSIVE_INTENSITY = 0.4;

function FrameMemberMesh({ member, visible, onHover, onUnhover }: {
  member: FrameMember;
  visible: boolean;
} & HoverCallbacks) {
  if (!visible) return null;
  const { actualThickness: t, actualWidth: h } = member.lumberSpec;
  const roleName = member.role === "front" || member.role === "back" ? "Rim" : "Cross";
  const label = `${member.lumberSpec.label} ${roleName} — ${inchesToFeetInches(member.length)}\nStep ${member.stepIndex + 1} framing`;
  const [hovered, setHovered] = useState(false);

  return (
    <group
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHover(label); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); onUnhover(); }}
    >
      <mesh position={member.position} rotation={member.rotation}>
        <boxGeometry args={[member.length, h, t]} />
        <meshStandardMaterial
          color={FRAME_COLOR}
          transparent
          opacity={0.9}
          emissive={hovered ? HOVER_EMISSIVE : "#000"}
          emissiveIntensity={hovered ? HOVER_EMISSIVE_INTENSITY : 0}
        />
        <Edges color={EDGE_COLOR} threshold={15} />
      </mesh>
    </group>
  );
}

function DeckBoardMesh({ board, visible, onHover, onUnhover }: {
  board: DeckBoard;
  visible: boolean;
} & HoverCallbacks) {
  if (!visible) return null;
  const { actualThickness: t, actualWidth: w } = board.deckingSpec;
  const label = `${board.deckingSpec.label} decking — ${inchesToFeetInches(board.length)}\nStep ${board.stepIndex + 1} tread`;
  const [hovered, setHovered] = useState(false);

  return (
    <group
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHover(label); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); onUnhover(); }}
    >
      <mesh position={board.position}>
        <boxGeometry args={[board.length, t, w]} />
        <meshStandardMaterial
          color={DECK_COLOR}
          transparent
          opacity={0.9}
          emissive={hovered ? HOVER_EMISSIVE : "#000"}
          emissiveIntensity={hovered ? HOVER_EMISSIVE_INTENSITY : 0}
        />
        <Edges color={EDGE_COLOR} threshold={15} />
      </mesh>
    </group>
  );
}

function FasciaMesh({ fascia, visible, onHover, onUnhover }: {
  fascia: FasciaBoard;
  visible: boolean;
} & HoverCallbacks) {
  if (!visible) return null;
  const t = 0.75;
  const label = `Fascia (${fascia.face}) — ${inchesToFeetInches(fascia.length)}\nStep ${fascia.stepIndex + 1} trim`;
  const [hovered, setHovered] = useState(false);

  return (
    <group
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHover(label); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); onUnhover(); }}
    >
      <mesh position={fascia.position} rotation={fascia.rotation}>
        <boxGeometry args={[fascia.length, fascia.height, t]} />
        <meshStandardMaterial
          color={FASCIA_COLOR}
          transparent
          opacity={0.85}
          emissive={hovered ? HOVER_EMISSIVE : "#000"}
          emissiveIntensity={hovered ? HOVER_EMISSIVE_INTENSITY : 0}
        />
        <Edges color={EDGE_COLOR} threshold={15} />
      </mesh>
    </group>
  );
}

const SCREW_RADIUS = 0.15; // 0.3" diameter
const SCREW_HEIGHT = 0.15;
const SCREW_COLOR = "#888888";
const SCREW_RECESS = 0.05;

interface ScrewPosition {
  position: [number, number, number];
}

/** Compute screw positions for a single step.
 *
 * Real box-stair fastening pattern:
 * 1) Decking screws: 2 screws into EVERY cross/rim member the board crosses
 *    (driven down through decking into the framing below).
 *    For rendering we cap to ~6 visible per board on wide stairs to avoid clutter.
 * 2) Box assembly screws: face-nailed through rim into each cross member end — 2 per end.
 * 3) Rim-to-rim corner screws: 3 per corner where front/back meets end cross members.
 */
function computeScrewPositions(step: BoxStep): ScrewPosition[] {
  const screws: ScrewPosition[] = [];

  const crossMembers = step.frameMembers.filter((m) => m.role === "cross");
  const rimMembers = step.frameMembers.filter(
    (m) => m.role === "front" || m.role === "back"
  );

  // --- 1) Decking screws: down through deck board into every vertical member below ---
  for (const board of step.deckBoards) {
    const [, by, bz] = board.position;
    const halfThick = board.deckingSpec.actualThickness / 2;
    const screwY = by + halfThick - SCREW_RECESS;

    // All framing members this board sits above
    const allFraming = [...crossMembers, ...rimMembers];

    // For rendering, pick evenly spaced subset if there are many
    const sorted = [...allFraming].sort((a, b) => a.position[0] - b.position[0]);
    const maxVisible = 8;
    let visible: typeof sorted;
    if (sorted.length <= maxVisible) {
      visible = sorted;
    } else {
      // Always include first and last, evenly sample the rest
      visible = [sorted[0]];
      const step = (sorted.length - 1) / (maxVisible - 1);
      for (let i = 1; i < maxVisible - 1; i++) {
        visible.push(sorted[Math.round(i * step)]);
      }
      visible.push(sorted[sorted.length - 1]);
    }

    const spacing = 1.5;
    for (const fm of visible) {
      const cx = fm.position[0];
      screws.push({ position: [cx - spacing, screwY, bz] });
      screws.push({ position: [cx + spacing, screwY, bz] });
    }
  }

  // --- 2) Box assembly: face-nail through rim into cross member ends ---
  // 2 screws per end of each cross member, driven through the rim board face
  for (const cm of crossMembers) {
    const [cx, cy] = cm.position;
    const halfLen = cm.length / 2;
    const cmZ = cm.position[2];
    const offsetY = cm.lumberSpec.actualWidth / 4;

    // Front end
    screws.push({ position: [cx, cy + offsetY, cmZ - halfLen - 0.3] });
    screws.push({ position: [cx, cy - offsetY, cmZ - halfLen - 0.3] });
    // Back end
    screws.push({ position: [cx, cy + offsetY, cmZ + halfLen + 0.3] });
    screws.push({ position: [cx, cy - offsetY, cmZ + halfLen + 0.3] });
  }

  // --- 3) Rim-to-rim corner screws (3 per corner) ---
  // The end cross members are at the left/right edges; front+back rims meet them
  if (crossMembers.length >= 2) {
    const sortedByX = [...crossMembers].sort(
      (a, b) => a.position[0] - b.position[0]
    );
    const leftCross = sortedByX[0];
    const rightCross = sortedByX[sortedByX.length - 1];

    for (const rim of rimMembers) {
      const rimZ = rim.position[2];
      const rimY = rim.position[1];
      const h = rim.lumberSpec.actualWidth;

      for (const corner of [leftCross, rightCross]) {
        const cornerX = corner.position[0];
        // 3 screws spread vertically through the rim face into the end grain of the cross
        for (const yOff of [-h / 3, 0, h / 3]) {
          screws.push({ position: [cornerX, rimY + yOff, rimZ] });
        }
      }
    }
  }

  return screws;
}

function ScrewInstances({ steps, explodeGap }: { steps: BoxStep[]; explodeGap: number }) {
  const allScrews = useMemo(() => {
    const result: { position: [number, number, number]; explodeOffset: number }[] = [];
    for (const step of steps) {
      const positions = computeScrewPositions(step);
      const offset = step.index * explodeGap;
      for (const s of positions) {
        result.push({
          position: s.position,
          explodeOffset: offset,
        });
      }
    }
    return result;
  }, [steps, explodeGap]);

  const screwGeometry = useMemo(() => new THREE.CylinderGeometry(SCREW_RADIUS, SCREW_RADIUS, SCREW_HEIGHT, 8), []);
  const screwMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: SCREW_COLOR, metalness: 0.7, roughness: 0.3 }), []);

  if (allScrews.length === 0) return null;

  // Use InstancedMesh for performance when many screws
  if (allScrews.length > 50) {
    return (
      <instancedMesh
        args={[screwGeometry, screwMaterial, allScrews.length]}
        ref={(mesh) => {
          if (!mesh) return;
          const dummy = new THREE.Object3D();
          allScrews.forEach((s, i) => {
            dummy.position.set(s.position[0], s.position[1] + s.explodeOffset, s.position[2]);
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
          });
          mesh.instanceMatrix.needsUpdate = true;
        }}
      />
    );
  }

  return (
    <group>
      {allScrews.map((s, i) => (
        <mesh
          key={i}
          geometry={screwGeometry}
          material={screwMaterial}
          position={[s.position[0], s.position[1] + s.explodeOffset, s.position[2]]}
        />
      ))}
    </group>
  );
}

function StepGroup({
  step,
  viewMode,
  explodeOffset,
  onHover,
  onUnhover,
}: {
  step: BoxStep;
  viewMode: ViewMode;
  explodeOffset: number;
} & HoverCallbacks) {
  const showFrame = viewMode === "finished" || viewMode === "framing" || viewMode === "exploded";
  const showDeck = viewMode === "finished" || viewMode === "decking" || viewMode === "exploded";
  const showFascia = viewMode === "finished" || viewMode === "exploded";

  return (
    <group position={[0, explodeOffset, 0]}>
      {step.frameMembers.map((m) => (
        <FrameMemberMesh key={m.id} member={m} visible={showFrame} onHover={onHover} onUnhover={onUnhover} />
      ))}
      {step.deckBoards.map((d) => (
        <DeckBoardMesh key={d.id} board={d} visible={showDeck} onHover={onHover} onUnhover={onUnhover} />
      ))}
      {step.fasciaBoards.map((f) => (
        <FasciaMesh key={f.id} fascia={f} visible={showFascia} onHover={onHover} onUnhover={onUnhover} />
      ))}
    </group>
  );
}

function DimensionLine({
  start,
  end,
  label,
  offset = 3,
  axis = "y",
}: {
  start: [number, number, number];
  end: [number, number, number];
  label: string;
  offset?: number;
  axis?: "x" | "y" | "z";
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

function Scene({ model, viewMode, onHover, onUnhover }: {
  model: StairModel;
  viewMode: ViewMode;
} & HoverCallbacks) {
  const explodeGap = viewMode === "exploded" ? 8 : 0;
  const totalWidth = model.config.stairWidth;
  const totalRun = model.totalRun;

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[50, 80, 60]} intensity={1} castShadow />
      <directionalLight position={[-30, 40, -20]} intensity={0.3} />

      {model.steps.map((step) => (
        <StepGroup
          key={step.index}
          step={step}
          viewMode={viewMode}
          explodeOffset={step.index * explodeGap}
          onHover={onHover}
          onUnhover={onUnhover}
        />
      ))}

      {/* Screw/fastener indicators — shown in finished and exploded views */}
      {(viewMode === "finished" || viewMode === "exploded") && (
        <ScrewInstances steps={model.steps} explodeGap={explodeGap} />
      )}

      {/* Dimension lines */}
      <DimensionLine
        start={[-totalWidth / 2 - 6, 0, 0]}
        end={[totalWidth / 2 + 6, 0, 0]}
        label={`Width: ${totalWidth}"`}
      />
      <DimensionLine
        start={[totalWidth / 2 + 6, 0, 0]}
        end={[totalWidth / 2 + 6, model.config.totalRise, 0]}
        label={`Rise: ${model.config.totalRise}"`}
      />
      <DimensionLine
        start={[-totalWidth / 2 - 6, 0, 0]}
        end={[-totalWidth / 2 - 6, 0, totalRun]}
        label={`Run: ${Math.round(totalRun * 100) / 100}"`}
      />

      <Grid
        args={[200, 200]}
        position={[0, -0.5, totalRun / 2]}
        cellSize={12}
        cellColor="#888"
        sectionSize={48}
        sectionColor="#555"
        fadeDistance={200}
        fadeStrength={1}
      />

      <OrbitControls
        makeDefault
        minDistance={20}
        maxDistance={300}
        target={[0, model.config.totalRise / 2, totalRun / 2]}
      />
    </>
  );
}

export default function StairViewer({ model, viewMode }: StairViewerProps) {
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);
  const onHover = useCallback((label: string) => setHoverLabel(label), []);
  const onUnhover = useCallback(() => setHoverLabel(null), []);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Canvas
        camera={{
          position: [model.config.stairWidth * 1.2, model.config.totalRise * 2, model.totalRun * 1.5],
          fov: 45,
          near: 0.1,
          far: 1000,
        }}
        shadows
        style={{ background: "#1a1a2e" }}
      >
        <Scene model={model} viewMode={viewMode} onHover={onHover} onUnhover={onUnhover} />
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
