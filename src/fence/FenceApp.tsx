import React, { useMemo, useState, useCallback } from "react";
import { generateFence, POST_OPTIONS, RAIL_OPTIONS, DEFAULT_FENCE_CONFIG } from "./engine";
import FenceViewer from "./FenceViewer";
import FenceMaterialList from "./FenceMaterialList";
import FeetInchesInput from "../FeetInchesInput";
import type { FenceConfig, FenceSide } from "./types";

type FenceViewMode = "finished" | "framing" | "exploded";

const ALL_SIDES: FenceSide[] = ["front", "back", "left", "right"];

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

const PRESETS: { label: string; config: Partial<FenceConfig> }[] = [
  {
    label: "Small Garden (8'x8')",
    config: { enclosureWidth: 96, enclosureDepth: 96, height: 36, gateSides: ["front"] },
  },
  {
    label: "Medium Garden (12'x8')",
    config: { enclosureWidth: 144, enclosureDepth: 96, height: 36, gateSides: ["front"] },
  },
  {
    label: "Large Garden (20'x12')",
    config: { enclosureWidth: 240, enclosureDepth: 144, height: 36, gateSides: ["front", "back"] },
  },
  {
    label: "Tall (4' high)",
    config: { height: 48, chickenWireHeight: 48 },
  },
];

export default function FenceApp() {
  const [config, setConfig] = useState<FenceConfig>(DEFAULT_FENCE_CONFIG);
  const [viewMode, setViewMode] = useState<FenceViewMode>("finished");
  const update = useCallback((partial: Partial<FenceConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const toggleGateSide = useCallback((side: FenceSide) => {
    setConfig((prev) => {
      const has = prev.gateSides.includes(side);
      return {
        ...prev,
        gateSides: has
          ? prev.gateSides.filter((s) => s !== side)
          : [...prev.gateSides, side],
      };
    });
  }, []);

  const model = useMemo(() => generateFence(config), [config]);

  const perimeter = 2 * (config.enclosureWidth + config.enclosureDepth);

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
        <h2 style={{ margin: "0 0 4px", fontSize: 18 }}>Fence Enclosure</h2>
        <p style={{ fontSize: 11, color: "#888", margin: "0 0 12px" }}>
          Design a chicken wire fence enclosure with gates
        </p>

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

        {/* Enclosure dimensions */}
        <label style={labelStyle}>Enclosure Width</label>
        <FeetInchesInput
          value={config.enclosureWidth}
          min={48}
          max={960}
          onChange={(v) => update({ enclosureWidth: v })}
        />

        <label style={labelStyle}>Enclosure Depth</label>
        <FeetInchesInput
          value={config.enclosureDepth}
          min={48}
          max={960}
          onChange={(v) => update({ enclosureDepth: v })}
        />

        <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
          Perimeter: {Math.round(perimeter / 12)}' ({Math.round(perimeter)}")
        </div>

        <label style={labelStyle}>Fence Height</label>
        <FeetInchesInput
          value={config.height}
          min={18}
          max={config.addChickenWire ? 72 : 96}
          onChange={(v) => update({ height: v })}
        />
        {config.addChickenWire && config.height > 72 && (
          <div style={{ fontSize: 11, color: "#cc4400", marginTop: 2 }}>
            Max 6' (72") with chicken wire — rolls only available up to 48" height.
          </div>
        )}

        <label style={labelStyle}>Post Spacing</label>
        <FeetInchesInput
          value={config.postSpacing}
          min={24}
          max={96}
          onChange={(v) => update({ postSpacing: v })}
        />

        {/* Gate placement */}
        <label style={labelStyle}>Gate Openings</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {ALL_SIDES.map((side) => {
            const active = config.gateSides.includes(side);
            return (
              <button
                key={side}
                style={{
                  padding: "4px 12px",
                  border: active ? "2px solid #2563eb" : "1px solid #ccc",
                  borderRadius: 4,
                  background: active ? "#dbeafe" : "#fff",
                  color: active ? "#1d4ed8" : "#666",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: active ? 600 : 400,
                  textTransform: "capitalize",
                }}
                onClick={() => toggleGateSide(side)}
              >
                {side}
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
          {config.gateSides.length === 0
            ? "No gates — fully enclosed"
            : `${config.gateSides.length} gate(s): ${config.gateSides.join(", ")}`}
        </div>

        {config.gateSides.length > 0 && (
          <>
            <label style={labelStyle}>Gate Width</label>
            <FeetInchesInput
              value={config.gateWidth}
              min={24}
              max={72}
              onChange={(v) => update({ gateWidth: v })}
            />
          </>
        )}

        {/* Lumber */}
        <label style={labelStyle}>Post Size</label>
        <select
          style={inputStyle}
          value={config.postSize}
          onChange={(e) => update({ postSize: e.target.value })}
        >
          {Object.entries(POST_OPTIONS).map(([key, spec]) => (
            <option key={key} value={key}>
              {spec.label} ({spec.actualSize}" actual)
            </option>
          ))}
        </select>

        <label style={labelStyle}>Rail Size</label>
        <select
          style={inputStyle}
          value={config.railSize}
          onChange={(e) => update({ railSize: e.target.value })}
        >
          {Object.entries(RAIL_OPTIONS).map(([key, spec]) => (
            <option key={key} value={key}>
              {spec.label}
            </option>
          ))}
        </select>

        {/* Chicken wire */}
        <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="checkbox"
            checked={config.addChickenWire}
            onChange={(e) => update({ addChickenWire: e.target.checked })}
          />
          Include Chicken Wire
        </label>

        {config.addChickenWire && (
          <>
            <label style={labelStyle}>Chicken Wire Height</label>
            <select
              style={inputStyle}
              value={config.chickenWireHeight}
              onChange={(e) => update({ chickenWireHeight: +e.target.value })}
            >
              <option value={24}>24" (2 ft)</option>
              <option value={36}>36" (3 ft)</option>
              <option value={48}>48" (4 ft)</option>
              <option value={60}>60" (5 ft)</option>
              <option value={72}>72" (6 ft)</option>
            </select>
          </>
        )}

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

        <FenceMaterialList model={model} />
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
          {(["finished", "framing", "exploded"] as FenceViewMode[]).map((mode) => (
            <button
              key={mode}
              style={buttonStyle(viewMode === mode)}
              onClick={() => setViewMode(mode)}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        <FenceViewer model={model} viewMode={viewMode} />
      </div>
    </div>
  );
}
