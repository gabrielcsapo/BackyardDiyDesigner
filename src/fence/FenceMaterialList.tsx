import React from "react";
import type { FenceModel } from "./types";
import { inchesToFeetInches } from "../engine";
import CostEstimate, { sectionHeader, tableStyle, thLeft, thRight, cellStyle, Row } from "../CostEstimate";

interface FenceMaterialListProps {
  model: FenceModel;
}

export default function FenceMaterialList({ model }: FenceMaterialListProps) {
  const { materials, config } = model;

  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={sectionHeader}>Dimensions</h3>
      <table style={tableStyle}>
        <tbody>
          <Row label="Enclosure" value={`${inchesToFeetInches(config.enclosureWidth)} x ${inchesToFeetInches(config.enclosureDepth)}`} />
          <Row label="Perimeter" value={inchesToFeetInches(2 * (config.enclosureWidth + config.enclosureDepth))} />
          <Row label="Fence Height" value={inchesToFeetInches(config.height)} />
          <Row label="Post Spacing" value={inchesToFeetInches(config.postSpacing)} />
          <Row label="Gates" value={config.gateSides.length > 0 ? config.gateSides.join(", ") : "none"} />
          <Row label="Post Burial" value={inchesToFeetInches(materials.burialDepth)} />
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
            <td style={cellStyle}>Posts</td>
            <td style={cellStyle}>{materials.postCount}</td>
            <td style={cellStyle}>{inchesToFeetInches(materials.postLength)}</td>
          </tr>
          {materials.railCuts.map((rc, i) => (
            <tr key={i}>
              <td style={cellStyle}>Rails</td>
              <td style={cellStyle}>{rc.count}</td>
              <td style={cellStyle}>{inchesToFeetInches(rc.length)}</td>
            </tr>
          ))}
          {materials.chickenWireLinearFt > 0 && (
            <tr>
              <td style={cellStyle}>Chicken Wire</td>
              <td style={cellStyle}>—</td>
              <td style={cellStyle}>{materials.chickenWireLinearFt.toFixed(1)} linear ft</td>
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
          {materials.chickenWireRolls > 0 && (
            <Row
              label="Chicken Wire Rolls"
              value={`${materials.chickenWireRolls}`}
            />
          )}
          {materials.stapleBoxes > 0 && (
            <Row label="Staple Boxes" value={`${materials.stapleBoxes}`} />
          )}
          {materials.gateKits > 0 && (
            <Row label="Gate Kits" value={`${materials.gateKits}`} />
          )}
          <Row label="Pocket screws (est.)" value={`${materials.screwCount}`} />
        </tbody>
      </table>

      <CostEstimate costLineItems={materials.costLineItems} warnings={model.warnings} />
    </div>
  );
}
