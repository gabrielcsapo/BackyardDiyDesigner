import React from "react";
import type { FirePitModel } from "./types";
import { inchesToFeetInches } from "../engine";
import CostEstimate, { sectionHeader, tableStyle, thLeft, thRight, cellStyle, Row } from "../CostEstimate";

interface FirePitMaterialListProps {
  model: FirePitModel;
}

export default function FirePitMaterialList({ model }: FirePitMaterialListProps) {
  const { materials, config, ring } = model;

  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={sectionHeader}>Layout</h3>
      <table style={tableStyle}>
        <tbody>
          <Row label="Fire Pit Ring" value={`${ring.outerDiameter}" outer / ${ring.innerDiameter}" inner`} />
          <Row label="Brick Surround" value={`${materials.brickRing.totalBricks} blocks (${materials.brickRing.bricksPerCourse}/course × ${materials.brickRing.courses})`} />
          <Row label="Chairs" value={`${config.chairCount}`} />
          <Row label="Circle Radius" value={inchesToFeetInches(config.ringRadius)} />
          <Row label="Circle Diameter" value={inchesToFeetInches(config.ringRadius * 2)} />
        </tbody>
      </table>

      <h3 style={sectionHeader}>Per-Chair BOM</h3>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thLeft}>Board</th>
            <th style={thRight}>Qty</th>
          </tr>
        </thead>
        <tbody>
          {materials.bomPerChair.map((entry, i) => (
            <tr key={i}>
              <td style={cellStyle}>{entry.description}</td>
              <td style={{ ...cellStyle, textAlign: "right", fontWeight: 600 }}>{entry.qtyPerChair}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={sectionHeader}>Cut List (per chair)</h3>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thLeft}>Piece</th>
            <th style={thRight}>Lumber</th>
            <th style={thRight}>Qty</th>
            <th style={thRight}>Length</th>
          </tr>
        </thead>
        <tbody>
          {materials.cutListPerChair.map((cut, i) => (
            <tr key={i}>
              <td style={cellStyle}>{formatRole(cut.role)}</td>
              <td style={{ ...cellStyle, textAlign: "right" }}>{cut.lumber}</td>
              <td style={{ ...cellStyle, textAlign: "right" }}>{cut.qty}</td>
              <td style={{ ...cellStyle, textAlign: "right" }}>{inchesToFeetInches(cut.length)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <CostEstimate
        costLineItems={materials.costLineItems}
        warnings={model.warnings}
        priceNote="Lumber &amp; block prices are approximate Home Depot retail. Fire pit ring price from VEVOR."
      />
    </div>
  );
}

function formatRole(role: string): string {
  return role
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
