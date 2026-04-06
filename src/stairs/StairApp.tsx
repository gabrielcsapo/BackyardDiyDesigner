import React, { useMemo, useState, useCallback } from "react";
import { generateBoxStair, LUMBER_OPTIONS, DECKING_OPTIONS, DEFAULT_CONFIG } from "./engine";
import StairViewer from "./StairViewer";
import StairMaterialList from "./StairMaterialList";
import FeetInchesInput from "../FeetInchesInput";
import type { StairConfig, ViewMode } from "./types";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  border: "1px solid #ccc",
  borderRadius: 4,
  fontSize: 13,
  marginBottom: 4,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  color: "#555",
  marginBottom: 2,
  marginTop: 10,
};

const buttonStyle = (active: boolean): React.CSSProperties => ({
  padding: "5px 10px",
  border: "1px solid #999",
  borderRadius: 4,
  background: active ? "#2563eb" : "#fff",
  color: active ? "#fff" : "#333",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: active ? 600 : 400,
});

const PRESETS: { label: string; config: Partial<StairConfig> }[] = [
  { label: "Single Step", config: { totalRise: 7.5, stepCount: 1, treadDepth: 11.25, stairWidth: 48 } },
  { label: "Two Step (4' wide)", config: { totalRise: 15, stepCount: 2, treadDepth: 11.25, stairWidth: 48 } },
  { label: "Three Step (4' wide)", config: { totalRise: 22.5, stepCount: 3, treadDepth: 11.25, stairWidth: 48 } },
  { label: "Wide Porch (14' wide)", config: { stairWidth: 168, totalRise: 15, stepCount: 2, treadDepth: 11.25 } },
  { label: "Narrow (3' wide)", config: { stairWidth: 36, totalRise: 15, stepCount: 2, treadDepth: 11.25 } },
];

/** Compute the min/max valid step counts for a given total rise (targeting 4"–7.75" risers). */
function stepCountRange(totalRise: number): { min: number; max: number; ideal: number } {
  const min = Math.max(1, Math.ceil(totalRise / 7.75));
  const max = Math.max(min, Math.floor(totalRise / 4));
  // Target ~7.5" risers
  const ideal = Math.max(min, Math.min(max, Math.round(totalRise / 7.5)));
  return { min, max, ideal };
}

export default function App() {
  const [config, setConfig] = useState<StairConfig>(DEFAULT_CONFIG);
  const [viewMode, setViewMode] = useState<ViewMode>("finished");
  const update = useCallback((partial: Partial<StairConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...partial };
      // Auto-adjust step count when total rise changes to keep risers in code range
      if (partial.totalRise !== undefined && partial.stepCount === undefined) {
        const { min, max, ideal } = stepCountRange(next.totalRise);
        if (next.stepCount < min || next.stepCount > max) {
          next.stepCount = ideal;
        }
      }
      return next;
    });
  }, []);

  const model = useMemo(() => generateBoxStair(config), [config]);

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Sidebar */}
      <div
        style={{
          width: 320,
          minWidth: 320,
          padding: "16px 20px",
          background: "#f7f7f8",
          borderRight: "1px solid #ddd",
          overflowY: "auto",
        }}
      >
        <h2 style={{ margin: "0 0 4px", fontSize: 18 }}>BackyardDiyDesigner</h2>
        <p style={{ fontSize: 11, color: "#888", margin: "0 0 12px" }}>
          Calculate materials for box-framed deck stairs
        </p>

        {/* Presets */}
        <label style={labelStyle}>Presets</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              style={{
                ...buttonStyle(false),
                fontSize: 11,
                padding: "3px 8px",
              }}
              onClick={() => update(p.config)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Core dimensions */}
        <label style={labelStyle}>Total Rise</label>
        <FeetInchesInput
          value={config.totalRise}
          min={4}
          max={48}
          onChange={(v) => update({ totalRise: v })}
        />

        <label style={labelStyle}>Stair Width</label>
        <FeetInchesInput
          value={config.stairWidth}
          min={24}
          max={360}
          onChange={(v) => update({ stairWidth: v })}
        />

        <label style={labelStyle}>Number of Steps</label>
        {(() => {
          const range = stepCountRange(config.totalRise);
          const riserHeight = config.totalRise / config.stepCount;
          const outOfRange = riserHeight > 7.75 || riserHeight < 4;
          return (
            <>
              <input
                type="range"
                min={range.min}
                max={range.max}
                value={config.stepCount}
                style={{ width: "100%" }}
                onChange={(e) => update({ stepCount: +e.target.value })}
              />
              <div style={{ fontSize: 12, textAlign: "center", color: outOfRange ? "#cc4400" : "#666" }}>
                {config.stepCount} step{config.stepCount > 1 ? "s" : ""} — {riserHeight.toFixed(2)}" riser
              </div>
            </>
          );
        })()}

        <label style={labelStyle}>Tread Depth</label>
        <FeetInchesInput
          value={config.treadDepth}
          min={8}
          max={24}
          onChange={(v) => update({ treadDepth: v })}
        />

        {/* Lumber */}
        <label style={labelStyle}>Frame Lumber</label>
        <select
          style={inputStyle}
          value={config.frameLumber}
          onChange={(e) => update({ frameLumber: e.target.value })}
        >
          {Object.entries(LUMBER_OPTIONS).map(([key, spec]) => (
            <option key={key} value={key}>
              {spec.label} ({spec.actualWidth}" actual)
            </option>
          ))}
        </select>

        <label style={labelStyle}>Decking Board</label>
        <select
          style={inputStyle}
          value={config.deckingBoard}
          onChange={(e) => update({ deckingBoard: e.target.value })}
        >
          {Object.entries(DECKING_OPTIONS).map(([key, spec]) => (
            <option key={key} value={key}>
              {spec.label}
            </option>
          ))}
        </select>

        <label style={labelStyle}>Fascia / Trim Board</label>
        <select
          style={inputStyle}
          value={config.fasciaBoard}
          onChange={(e) => update({ fasciaBoard: e.target.value })}
        >
          {Object.entries(DECKING_OPTIONS).map(([key, spec]) => (
            <option key={key} value={key}>
              {spec.label} ({spec.actualWidth}" actual)
            </option>
          ))}
        </select>

        {/* Advanced */}
        <details style={{ marginTop: 12 }}>
          <summary style={{ fontSize: 12, cursor: "pointer", color: "#555" }}>
            Advanced Options
          </summary>
          <div style={{ marginTop: 8 }}>
            <label style={labelStyle}>Decking Gap (in)</label>
            <input
              type="number"
              style={inputStyle}
              value={config.deckingGap}
              min={0}
              max={0.5}
              step={0.0625}
              onChange={(e) => update({ deckingGap: +e.target.value })}
            />

            <label style={labelStyle}>Tread Overhang (in)</label>
            <input
              type="number"
              style={inputStyle}
              value={config.treadOverhang}
              min={0}
              max={2}
              step={0.25}
              onChange={(e) => update({ treadOverhang: +e.target.value })}
            />

            <label style={labelStyle}>Max Support Spacing (in)</label>
            <input
              type="number"
              style={inputStyle}
              value={config.supportSpacing}
              min={8}
              max={24}
              step={1}
              onChange={(e) => update({ supportSpacing: +e.target.value })}
            />

            <label style={labelStyle}>Waste Factor (%)</label>
            <input
              type="range"
              min={0}
              max={25}
              value={config.wasteFactor}
              style={{ width: "100%" }}
              onChange={(e) => update({ wasteFactor: +e.target.value })}
            />
            <div style={{ fontSize: 12, textAlign: "center", color: "#666" }}>
              {config.wasteFactor}%
            </div>

            <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="checkbox"
                checked={config.addFascia}
                onChange={(e) => update({ addFascia: e.target.checked })}
              />
              Include Fascia / Trim
            </label>
          </div>
        </details>

        {/* Material summary */}
        <StairMaterialList model={model} />
      </div>

      {/* 3D Viewer */}
      <div style={{ flex: 1, position: "relative" }}>
        {/* View mode toolbar */}
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            zIndex: 10,
            display: "flex",
            gap: 4,
          }}
        >
          {(["finished", "framing", "decking", "exploded"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              style={buttonStyle(viewMode === mode)}
              onClick={() => setViewMode(mode)}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        <StairViewer model={model} viewMode={viewMode} />
      </div>
    </div>
  );
}
