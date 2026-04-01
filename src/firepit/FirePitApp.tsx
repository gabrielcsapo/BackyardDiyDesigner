import React, { useMemo, useState, useCallback } from "react";
import { generateFirePit, DEFAULT_FIREPIT_CONFIG, FIRE_PIT_RING, BRICK_SPEC } from "./engine";
import FirePitViewer from "./FirePitViewer";
import FirePitMaterialList from "./FirePitMaterialList";
import FeetInchesInput from "../FeetInchesInput";
import type { FirePitConfig } from "./types";
import { inchesToFeetInches } from "../engine";

type FirePitViewMode = "finished" | "framing" | "exploded";

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

const PRESETS: { label: string; config: Partial<FirePitConfig> }[] = [
  { label: "Cozy (4 chairs)",     config: { chairCount: 4, ringRadius: 60 } },
  { label: "Gathering (6 chairs)", config: { chairCount: 6, ringRadius: 72 } },
  { label: "Party (8 chairs)",     config: { chairCount: 8, ringRadius: 84 } },
  { label: "Date Night (2 chairs)", config: { chairCount: 2, ringRadius: 54 } },
];

export default function FirePitApp() {
  const [config, setConfig] = useState<FirePitConfig>(DEFAULT_FIREPIT_CONFIG);
  const [viewMode, setViewMode] = useState<FirePitViewMode>("finished");
  const update = useCallback((partial: Partial<FirePitConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const model = useMemo(() => generateFirePit(config), [config]);

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
        <h2 style={{ margin: "0 0 4px", fontSize: 18 }}>Fire Pit Sitting</h2>
        <p style={{ fontSize: 11, color: "#888", margin: "0 0 12px" }}>
          Design a fire pit area with Adirondack chairs
        </p>

        {/* Fire pit & brick info */}
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
          <strong>Fire Pit Ring</strong>
          <br />
          VEVOR {FIRE_PIT_RING.outerDiameter}" outer / {FIRE_PIT_RING.innerDiameter}" inner, {FIRE_PIT_RING.height}" tall
          <br />
          <span style={{ color: "#92400e" }}>${FIRE_PIT_RING.price.toFixed(2)}</span>
          <br /><br />
          <strong>Retaining Wall Blocks</strong>
          <br />
          Pewter Concrete {BRICK_SPEC.width}" x {BRICK_SPEC.height}" x {BRICK_SPEC.depth}"
          <br />
          <span style={{ color: "#92400e" }}>${BRICK_SPEC.price.toFixed(2)} each</span>
          <br /><br />
          <strong>Adirondack Chair</strong>
          <br />
          1x4 + 2x4 + 2x2 per{" "}
          <a
            href="https://www.homedepot.com/c/ah/how-to-build-an-adirondack-chair/9ba683603be9fa5395fab9011c4d2695"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#2563eb" }}
          >
            Home Depot guide
          </a>
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

        {/* Chair count */}
        <label style={labelStyle}>Number of Chairs</label>
        <input
          type="range"
          min={1}
          max={8}
          value={config.chairCount}
          style={{ width: "100%" }}
          onChange={(e) => update({ chairCount: +e.target.value })}
        />
        <div style={{ fontSize: 12, textAlign: "center", color: "#666" }}>
          {config.chairCount} chairs
        </div>

        {/* Ring radius */}
        <label style={labelStyle}>Circle Radius (center to chair)</label>
        <FeetInchesInput
          value={config.ringRadius}
          min={36}
          max={144}
          onChange={(v) => update({ ringRadius: v })}
        />
        <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
          Circle diameter: {inchesToFeetInches(config.ringRadius * 2)}
        </div>

        {/* Advanced */}
        <details style={{ marginTop: 12 }}>
          <summary style={{ fontSize: 12, cursor: "pointer", color: "#555" }}>
            Advanced Options
          </summary>
          <div style={{ marginTop: 8 }}>
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

        <FirePitMaterialList model={model} />
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
          {(["finished", "framing", "exploded"] as FirePitViewMode[]).map((mode) => (
            <button
              key={mode}
              style={buttonStyle(viewMode === mode)}
              onClick={() => setViewMode(mode)}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        <FirePitViewer model={model} viewMode={viewMode} />
      </div>
    </div>
  );
}
