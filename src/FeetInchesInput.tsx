import React, { useState, useEffect } from "react";

interface FeetInchesInputProps {
  /** Total value in inches */
  value: number;
  /** Called with new total inches */
  onChange: (totalInches: number) => void;
  min?: number;
  max?: number;
  style?: React.CSSProperties;
}

export default function FeetInchesInput({
  value,
  onChange,
  min = 0,
  max = 600,
  style,
}: FeetInchesInputProps) {
  const [feet, setFeet] = useState(() => Math.floor(value / 12));
  const [inches, setInches] = useState(() => Math.round((value % 12) * 100) / 100);

  // Sync from external value changes (presets, etc.)
  useEffect(() => {
    const newFeet = Math.floor(value / 12);
    const newInches = Math.round((value % 12) * 100) / 100;
    setFeet(newFeet);
    setInches(newInches);
  }, [value]);

  function commit(f: number, i: number) {
    const total = Math.max(min, Math.min(max, f * 12 + i));
    onChange(total);
  }

  const containerStyle: React.CSSProperties = {
    display: "flex",
    gap: 4,
    alignItems: "center",
    ...style,
  };

  const fieldStyle: React.CSSProperties = {
    flex: 1,
    padding: "6px 8px",
    border: "1px solid #ccc",
    borderRadius: 4,
    fontSize: 13,
    width: 0, // let flex handle it
  };

  const unitStyle: React.CSSProperties = {
    fontSize: 12,
    color: "#777",
    flexShrink: 0,
  };

  return (
    <div style={containerStyle}>
      <input
        type="number"
        style={fieldStyle}
        value={feet}
        min={0}
        step={1}
        onChange={(e) => {
          const f = Math.max(0, Math.floor(+e.target.value));
          setFeet(f);
          commit(f, inches);
        }}
      />
      <span style={unitStyle}>ft</span>
      <input
        type="number"
        style={fieldStyle}
        value={inches}
        min={0}
        max={11.75}
        step={0.25}
        onChange={(e) => {
          const i = Math.max(0, +e.target.value);
          setInches(i);
          commit(feet, i);
        }}
      />
      <span style={unitStyle}>in</span>
    </div>
  );
}
