import React, { useMemo, useState, useCallback } from "react";
import { generateGardenBed, DEFAULT_GARDENBED_CONFIG, BRICK } from "./engine";
import GardenBedViewer from "./GardenBedViewer";
import GardenBedMaterialList from "./GardenBedMaterialList";
import FeetInchesInput from "../FeetInchesInput";
import type { GardenBedConfig } from "./types";
import { inchesToFeetInches } from "../engine";

type GardenBedViewMode = "finished" | "exploded";

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

const PRESETS: { label: string; config: Partial<GardenBedConfig> }[] = [
  { label: "Small 4'×2'",   config: { length: 48, width: 24, height: 18 } },
  { label: "Medium 6'×3'",  config: { length: 72, width: 36, height: 18 } },
  { label: "Standard 8'×4'", config: { length: 96, width: 48, height: 18 } },
  { label: "Large 12'×4'",  config: { length: 144, width: 48, height: 24 } },
  { label: "Tall 8'×4'×2'", config: { length: 96, width: 48, height: 24 } },
];

export default function GardenBedApp() {
  const [config, setConfig] = useState<GardenBedConfig>(DEFAULT_GARDENBED_CONFIG);
  const [viewMode, setViewMode] = useState<GardenBedViewMode>("finished");
  const update = useCallback((partial: Partial<GardenBedConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const model = useMemo(() => generateGardenBed(config), [config]);

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
        <h2 style={{ margin: "0 0 4px", fontSize: 18 }}>Brick Garden Bed</h2>
        <p style={{ fontSize: 11, color: "#888", margin: "0 0 12px" }}>
          Design a raised garden bed with bricks &amp; mortar
        </p>

        {/* Brick info */}
        <div
          style={{
            background: "#fef3c7",
            border: "1px solid #f59e0b",
            borderRadius: 6,
            padding: "8px 10px",
            marginBottom: 12,
            fontSize: 11,
          }}
        >
          <strong>Standard Modular Brick</strong>
          <br />
          {BRICK.length}" × {BRICK.height}" × {BRICK.width}"
          <br />
          <span style={{ color: "#92400e" }}>${BRICK.price.toFixed(2)} each</span>
        </div>

        {/* Presets */}
        <label style={labelStyle}>Presets</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              style={{ ...buttonStyle(false), fontSize: 11, padding: "3px 8px" }}
              onClick={() => update(p.config)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Dimensions */}
        <label style={labelStyle}>Length (outer)</label>
        <FeetInchesInput
          value={config.length}
          min={24}
          max={240}
          onChange={(v) => update({ length: v })}
        />

        <label style={labelStyle}>Width (outer)</label>
        <FeetInchesInput
          value={config.width}
          min={12}
          max={120}
          onChange={(v) => update({ width: v })}
        />

        <label style={labelStyle}>Height</label>
        <FeetInchesInput
          value={config.height}
          min={4}
          max={48}
          onChange={(v) => update({ height: v })}
        />

        {/* Wall thickness */}
        <label style={labelStyle}>Wall Thickness</label>
        <select
          value={config.wallThickness}
          onChange={(e) => update({ wallThickness: +e.target.value })}
          style={{ width: "100%", padding: "6px 8px", fontSize: 13, borderRadius: 4, border: "1px solid #ccc" }}
        >
          <option value={1}>Single wythe ({BRICK.width}")</option>
          <option value={2}>Double wythe ({(BRICK.width * 2 + config.mortarJoint).toFixed(2)}")</option>
        </select>

        {/* Interior dimensions note */}
        <div style={{ fontSize: 11, color: "#888", marginTop: 6 }}>
          Interior: {inchesToFeetInches(config.length - config.wallThickness * BRICK.width * 2)} × {inchesToFeetInches(config.width - config.wallThickness * BRICK.width * 2)}
        </div>

        {/* Advanced */}
        <details style={{ marginTop: 12 }}>
          <summary style={{ fontSize: 12, cursor: "pointer", color: "#555" }}>
            Advanced Options
          </summary>
          <div style={{ marginTop: 8 }}>
            <label style={labelStyle}>Mortar Joint (inches)</label>
            <select
              value={config.mortarJoint}
              onChange={(e) => update({ mortarJoint: +e.target.value })}
              style={{ width: "100%", padding: "6px 8px", fontSize: 13, borderRadius: 4, border: "1px solid #ccc" }}
            >
              <option value={0.25}>1/4"</option>
              <option value={0.375}>3/8" (standard)</option>
              <option value={0.5}>1/2"</option>
            </select>

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
          </div>
        </details>

        <GardenBedMaterialList model={model} />
      </div>

      {/* 3D Viewer */}
      <div style={{ flex: 1, position: "relative" }}>
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
          {(["finished", "exploded"] as GardenBedViewMode[]).map((mode) => (
            <button
              key={mode}
              style={buttonStyle(viewMode === mode)}
              onClick={() => setViewMode(mode)}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        <GardenBedViewer model={model} viewMode={viewMode} />
      </div>
    </div>
  );
}
