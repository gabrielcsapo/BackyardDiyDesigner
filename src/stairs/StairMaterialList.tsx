import React from "react";
import type { StairModel } from "./types";
import type { BoardPurchase } from "../types";
import { inchesToFeetInches } from "../engine";
import CostEstimate, { sectionHeader, tableStyle, thLeft, thRight, cellStyle, Row } from "../CostEstimate";

interface MaterialListProps {
  model: StairModel;
}

export default function MaterialList({ model }: MaterialListProps) {
  const { materials, steps, riserHeight, config } = model;

  const allPurchases: BoardPurchase[] = [
    ...materials.framingPurchases,
    ...materials.deckingPurchases,
    ...(config.addFascia ? materials.fasciaPurchases : []),
  ];

  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={sectionHeader}>Dimensions</h3>
      <table style={tableStyle}>
        <tbody>
          <Row label="Riser Height" value={inchesToFeetInches(riserHeight)} />
          <Row label="Total Run" value={inchesToFeetInches(model.totalRun)} />
          <Row label="Tread Depth" value={`${config.treadDepth}"`} />
          <Row label="Stair Width" value={inchesToFeetInches(config.stairWidth)} />
        </tbody>
      </table>

      <h3 style={sectionHeader}>Cut List</h3>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thLeft}>Piece</th>
            <th style={thLeft}>Qty</th>
            <th style={thLeft}>Length</th>
          </tr>
        </thead>
        <tbody>
          {steps.map((step) => {
            // Group frame members by display name + length
            const groups = new Map<string, { count: number; length: number; name: string }>();
            for (const m of step.frameMembers) {
              const name = m.role === "front" || m.role === "back" ? "Rim" : "Cross";
              const key = `${name}-${m.length}`;
              const existing = groups.get(key);
              if (existing) {
                existing.count++;
              } else {
                groups.set(key, { count: 1, length: m.length, name });
              }
            }

            return (
              <React.Fragment key={step.index}>
                <tr>
                  <td colSpan={3} style={stepHeaderStyle}>
                    Step {step.index + 1} — {materials.framingLumber} framing
                  </td>
                </tr>
                {[...groups.values()].map((g, i) => (
                  <tr key={i}>
                    <td style={cellStyle}>{g.name}</td>
                    <td style={cellStyle}>{g.count}</td>
                    <td style={cellStyle}>{inchesToFeetInches(g.length)}</td>
                  </tr>
                ))}
                <tr>
                  <td style={cellStyle}>Decking ({materials.deckingType})</td>
                  <td style={cellStyle}>{step.deckBoards.length}</td>
                  <td style={cellStyle}>
                    {step.deckBoards.length > 0
                      ? inchesToFeetInches(step.deckBoards[0].length)
                      : "—"}
                  </td>
                </tr>
                {config.addFascia && step.fasciaBoards.length > 0 && (
                  <>
                    {step.fasciaBoards.map((f, i) => (
                      <tr key={`fascia-${i}`}>
                        <td style={cellStyle}>Fascia ({f.face})</td>
                        <td style={cellStyle}>1</td>
                        <td style={cellStyle}>{inchesToFeetInches(f.length)}</td>
                      </tr>
                    ))}
                  </>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      <h3 style={sectionHeader}>Shopping List</h3>
      {allPurchases.length > 0 ? (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thLeft}>Board</th>
              <th style={thRight}>Buy</th>
              <th style={thRight}>Cuts</th>
              <th style={thRight}>Waste</th>
            </tr>
          </thead>
          <tbody>
            {allPurchases.map((p) => (
              <tr key={p.label}>
                <td style={cellStyle}>{p.label}</td>
                <td style={{ ...cellStyle, textAlign: "right", fontWeight: 600 }}>
                  {p.count}
                </td>
                <td style={{ ...cellStyle, textAlign: "right" }}>
                  {p.cutsFromThis}
                </td>
                <td style={{ ...cellStyle, textAlign: "right", color: "#888" }}>
                  {inchesToFeetInches(p.wasteInches)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ fontSize: 12, color: "#888" }}>No boards needed.</p>
      )}

      {/* Oversized warnings */}
      {materials.oversizedCuts.map((msg, i) => (
        <div key={i} style={oversizedStyle}>
          {msg}
        </div>
      ))}

      <table style={{ ...tableStyle, marginTop: 8 }}>
        <tbody>
          <Row label="Deck screws (est.)" value={`${materials.screwCount}`} />
        </tbody>
      </table>

      <CostEstimate costLineItems={materials.costLineItems} warnings={model.warnings} />
    </div>
  );
}

const stepHeaderStyle: React.CSSProperties = {
  fontWeight: "bold",
  paddingTop: 8,
  paddingBottom: 2,
  fontSize: 11,
  color: "#666",
};
const oversizedStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#cc4400",
  background: "#fff3ee",
  border: "1px solid #ffccaa",
  borderRadius: 4,
  padding: "4px 8px",
  marginTop: 6,
};
