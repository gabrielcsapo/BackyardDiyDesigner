import React, { useMemo, useState, useCallback } from "react";
import { generatePergola, DEFAULT_PERGOLA_CONFIG } from "./engine";
import PergolaViewer from "./PergolaViewer";
import PergolaMaterialList from "./PergolaMaterialList";
import FeetInchesInput from "../FeetInchesInput";
import type { PergolaConfig } from "./types";

type PergolaViewMode = "finished" | "framing" | "exploded";

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

const PRESETS: { label: string; config: Partial<PergolaConfig> }[] = [
  {
    label: "Small (10'x8')",
    config: { width: 120, depth: 96, height: 96, posts: 4 },
  },
  {
    label: "Medium (12'x10')",
    config: { width: 144, depth: 120, height: 96, posts: 4 },
  },
  {
    label: "Large (16'x12')",
    config: { width: 192, depth: 144, height: 108, posts: 6 },
  },
  {
    label: "Grand (20'x14')",
    config: { width: 240, depth: 168, height: 108, posts: 6, beamSize: "2x12" as const },
  },
];

export default function PergolaApp() {
  const [config, setConfig] = useState<PergolaConfig>(DEFAULT_PERGOLA_CONFIG);
  const [viewMode, setViewMode] = useState<PergolaViewMode>("finished");
  const update = useCallback((partial: Partial<PergolaConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const model = useMemo(() => generatePergola(config), [config]);

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
        <h2 style={{ margin: "0 0 4px", fontSize: 18 }}>Pergola Designer</h2>
        <p style={{ fontSize: 11, color: "#888", margin: "0 0 12px" }}>
          Design a freestanding pergola with optional shade slats
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

        {/* Dimensions */}
        <label style={labelStyle}>Width (beam direction)</label>
        <FeetInchesInput
          value={config.width}
          min={72}
          max={480}
          onChange={(v) => update({ width: v })}
        />

        <label style={labelStyle}>Depth (rafter direction)</label>
        <FeetInchesInput
          value={config.depth}
          min={72}
          max={360}
          onChange={(v) => update({ depth: v })}
        />

        <label style={labelStyle}>Height (above ground)</label>
        <FeetInchesInput
          value={config.height}
          min={72}
          max={168}
          onChange={(v) => update({ height: v })}
        />

        {/* Posts */}
        <label style={labelStyle}>Number of Posts</label>
        <div style={{ display: "flex", gap: 6 }}>
          {([4, 6] as const).map((n) => (
            <button
              key={n}
              style={{
                padding: "4px 12px",
                border: config.posts === n ? "2px solid #2563eb" : "1px solid #ccc",
                borderRadius: 4,
                background: config.posts === n ? "#dbeafe" : "#fff",
                color: config.posts === n ? "#1d4ed8" : "#666",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: config.posts === n ? 600 : 400,
              }}
              onClick={() => update({ posts: n })}
            >
              {n} posts
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
          {config.posts === 6
            ? "6 posts — middle posts on front & back for wider spans"
            : "4 posts — corner posts only"}
        </div>

        <label style={labelStyle}>Post Size</label>
        <select
          style={inputStyle}
          value={config.postSize}
          onChange={(e) => update({ postSize: e.target.value as PergolaConfig["postSize"] })}
        >
          <option value="4x4">4x4 (3.5" actual)</option>
          <option value="6x6">6x6 (5.5" actual)</option>
        </select>

        <label style={labelStyle}>Beam Size</label>
        <select
          style={inputStyle}
          value={config.beamSize}
          onChange={(e) => update({ beamSize: e.target.value as PergolaConfig["beamSize"] })}
        >
          <option value="2x8">2x8</option>
          <option value="2x10">2x10</option>
          <option value="2x12">2x12</option>
        </select>

        <label style={labelStyle}>Rafter Size</label>
        <select
          style={inputStyle}
          value={config.rafterSize}
          onChange={(e) => update({ rafterSize: e.target.value as PergolaConfig["rafterSize"] })}
        >
          <option value="2x6">2x6</option>
          <option value="2x8">2x8</option>
        </select>

        <label style={labelStyle}>Rafter Spacing (on center)</label>
        <select
          style={inputStyle}
          value={config.rafterSpacing}
          onChange={(e) => update({ rafterSpacing: +e.target.value })}
        >
          <option value={12}>12" o.c.</option>
          <option value={16}>16" o.c.</option>
          <option value={24}>24" o.c.</option>
        </select>

        <label style={labelStyle}>Rafter Overhang</label>
        <FeetInchesInput
          value={config.rafterOverhang}
          min={0}
          max={36}
          onChange={(v) => update({ rafterOverhang: v })}
        />

        <label style={labelStyle}>Beam Overhang</label>
        <FeetInchesInput
          value={config.beamOverhang}
          min={0}
          max={24}
          onChange={(v) => update({ beamOverhang: v })}
        />

        {/* Shade slats */}
        <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="checkbox"
            checked={config.addShadeSlats}
            onChange={(e) => update({ addShadeSlats: e.target.checked })}
          />
          Include Shade Slats
        </label>

        {config.addShadeSlats && (
          <>
            <label style={labelStyle}>Slat Size</label>
            <select
              style={inputStyle}
              value={config.slatSize}
              onChange={(e) => update({ slatSize: e.target.value as PergolaConfig["slatSize"] })}
            >
              <option value="2x2">2x2</option>
              <option value="1x4">1x4</option>
            </select>

            <label style={labelStyle}>Slat Spacing (gap)</label>
            <select
              style={inputStyle}
              value={config.slatSpacing}
              onChange={(e) => update({ slatSpacing: +e.target.value })}
            >
              <option value={1}>1" (dense shade)</option>
              <option value={2}>2"</option>
              <option value={3}>3" (standard)</option>
              <option value={4}>4"</option>
              <option value={6}>6" (open)</option>
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

        <PergolaMaterialList model={model} />
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
          {(["finished", "framing", "exploded"] as PergolaViewMode[]).map((mode) => (
            <button
              key={mode}
              style={buttonStyle(viewMode === mode)}
              onClick={() => setViewMode(mode)}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        <PergolaViewer model={model} viewMode={viewMode} />
      </div>
    </div>
  );
}
