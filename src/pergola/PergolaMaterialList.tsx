import React from "react";
import type { PergolaModel } from "./types";
import { inchesToFeetInches } from "../engine";
import CostEstimate, { sectionHeader, tableStyle, thLeft, thRight, cellStyle, Row } from "../CostEstimate";

interface PergolaMaterialListProps {
  model: PergolaModel;
}

export default function PergolaMaterialList({ model }: PergolaMaterialListProps) {
  const { materials, config } = model;

  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={sectionHeader}>Dimensions</h3>
      <table style={tableStyle}>
        <tbody>
          <Row label="Pergola Size" value={`${inchesToFeetInches(config.width)} x ${inchesToFeetInches(config.depth)}`} />
          <Row label="Height" value={inchesToFeetInches(config.height)} />
          <Row label="Posts" value={`${materials.postCount} (${config.postSize})`} />
          <Row label="Post Burial" value={inchesToFeetInches(materials.burialDepth)} />
          <Row label="Beams" value={`${materials.beamCount} x ${config.beamSize}`} />
          <Row label="Rafters" value={`${materials.rafterCount} x ${config.rafterSize} @ ${config.rafterSpacing}" o.c.`} />
          {config.addShadeSlats && (
            <Row label="Shade Slats" value={`${materials.slatCount} x ${config.slatSize} @ ${config.slatSpacing}" gap`} />
          )}
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
          <tr>
            <td style={cellStyle}>{config.postSize} Posts</td>
            <td style={cellStyle}>{materials.postCount}</td>
            <td style={cellStyle}>{inchesToFeetInches(materials.postLength)}</td>
          </tr>
          <tr>
            <td style={cellStyle}>{config.beamSize} Beams</td>
            <td style={cellStyle}>{materials.beamCount}</td>
            <td style={cellStyle}>{inchesToFeetInches(materials.beamLength)}</td>
          </tr>
          <tr>
            <td style={cellStyle}>{config.rafterSize} Rafters</td>
            <td style={cellStyle}>{materials.rafterCount}</td>
            <td style={cellStyle}>{inchesToFeetInches(materials.rafterLength)}</td>
          </tr>
          {materials.slatCount > 0 && (
            <tr>
              <td style={cellStyle}>{config.slatSize} Slats</td>
              <td style={cellStyle}>{materials.slatCount}</td>
              <td style={cellStyle}>{inchesToFeetInches(materials.slatLength)}</td>
            </tr>
          )}
        </tbody>
      </table>

      <h3 style={sectionHeader}>Shopping List</h3>
      {materials.purchases.length > 0 ? (
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
            {materials.purchases.map((p) => (
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

      <h3 style={sectionHeader}>Hardware &amp; Supplies</h3>
      <table style={tableStyle}>
        <tbody>
          <Row
            label="Concrete (80lb bags)"
            value={`${materials.concreteBags} bags (${materials.postCount} holes)`}
          />
          <Row label="Post bases" value={`${materials.postBaseCount}`} />
          <Row label="Beam brackets" value={`${materials.beamBracketCount}`} />
          <Row label="Rafter ties" value={`${materials.rafterTieCount}`} />
          <Row label="Carriage bolts" value={`${materials.carriageBoltCount}`} />
          <Row label="Structural screw boxes" value={`${materials.structuralScrewBoxes}`} />
        </tbody>
      </table>

      <CostEstimate costLineItems={materials.costLineItems} warnings={model.warnings} />
    </div>
  );
}
