import React from "react";
import type { GardenBedModel } from "./types";
import { inchesToFeetInches } from "../engine";
import { BRICK, MORTAR } from "./engine";
import CostEstimate, { sectionHeader, tableStyle, Row } from "../CostEstimate";

interface GardenBedMaterialListProps {
  model: GardenBedModel;
}

export default function GardenBedMaterialList({ model }: GardenBedMaterialListProps) {
  const { materials, config } = model;

  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={sectionHeader}>Dimensions</h3>
      <table style={tableStyle}>
        <tbody>
          <Row label="Outer Length" value={inchesToFeetInches(config.length)} />
          <Row label="Outer Width" value={inchesToFeetInches(config.width)} />
          <Row label="Height" value={inchesToFeetInches(config.height)} />
          <Row
            label="Interior"
            value={`${inchesToFeetInches(config.length - config.wallThickness * BRICK.width * 2)} × ${inchesToFeetInches(config.width - config.wallThickness * BRICK.width * 2)}`}
          />
          <Row label="Wall Thickness" value={config.wallThickness === 1 ? `Single wythe (${BRICK.width}")` : `Double wythe (${(BRICK.width * 2 + config.mortarJoint).toFixed(2)}")`} />
          <Row label="Mortar Joint" value={`${config.mortarJoint}"`} />
          <Row label="Courses" value={`${materials.coursesHigh}`} />
        </tbody>
      </table>

      <h3 style={sectionHeader}>Materials</h3>
      <table style={tableStyle}>
        <tbody>
          <Row label="Bricks (calculated)" value={`${materials.totalBricks}`} />
          <Row label="Bricks (with waste)" value={`${materials.bricksWithWaste} (+${config.wasteFactor}%)`} />
          <Row label="Bricks per Course" value={`~${materials.bricksPerCourse}`} />
          <Row label="Mortar Bags (80 lb)" value={`${materials.mortarBags}`} />
        </tbody>
      </table>

      <CostEstimate
        costLineItems={materials.costLineItems}
        warnings={model.warnings}
        priceNote="Brick and mortar prices are approximate Home Depot retail estimates."
      />
    </div>
  );
}
