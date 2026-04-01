import React, { useState, useMemo } from "react";
import type { CostLineItem } from "./types";

interface CostEstimateProps {
  costLineItems: CostLineItem[];
  warnings?: string[];
  priceNote?: string;
}

export default function CostEstimate({
  costLineItems,
  warnings,
  priceNote = "Prices are approximate Home Depot retail estimates and may vary by location.",
}: CostEstimateProps) {
  const [excluded, setExcluded] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const adjustedTotal = useMemo(() => {
    return costLineItems.reduce(
      (sum, li, i) => (excluded.has(i) ? sum : sum + li.lineTotal),
      0,
    );
  }, [costLineItems, excluded]);

  return (
    <>
      <h3 style={sectionHeader}>Cost Estimate</h3>
      {costLineItems.length > 0 ? (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...thLeft, width: 16 }}></th>
              <th style={thLeft}>Item</th>
              <th style={thRight}>Qty</th>
              <th style={thRight}>Unit $</th>
              <th style={thRight}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {costLineItems.map((li, i) => {
              const off = excluded.has(i);
              return (
                <tr key={i} style={{ opacity: off ? 0.4 : 1 }}>
                  <td style={cellStyle}>
                    <input
                      type="checkbox"
                      checked={!off}
                      onChange={() => toggleItem(i)}
                      style={{ margin: 0, cursor: "pointer" }}
                    />
                  </td>
                  <td style={cellStyle}>
                    {li.url ? (
                      <a
                        href={li.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#2563eb", textDecoration: off ? "line-through" : "none" }}
                      >
                        {li.description}
                      </a>
                    ) : (
                      <span style={{ textDecoration: off ? "line-through" : "none" }}>
                        {li.description}
                      </span>
                    )}
                  </td>
                  <td style={{ ...cellStyle, textAlign: "right" }}>{li.quantity}</td>
                  <td style={{ ...cellStyle, textAlign: "right" }}>
                    ${li.unitPrice.toFixed(2)}
                  </td>
                  <td style={{ ...cellStyle, textAlign: "right", fontWeight: 600 }}>
                    ${li.lineTotal.toFixed(2)}
                  </td>
                </tr>
              );
            })}
            <tr>
              <td
                colSpan={4}
                style={{ ...cellStyle, textAlign: "right", fontWeight: 700, paddingTop: 6 }}
              >
                Estimated Total
              </td>
              <td
                style={{
                  ...cellStyle,
                  textAlign: "right",
                  fontWeight: 700,
                  paddingTop: 6,
                  fontSize: 14,
                }}
              >
                ${adjustedTotal.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      ) : (
        <p style={{ fontSize: 12, color: "#888" }}>No cost data.</p>
      )}
      <p style={{ fontSize: 10, color: "#999", marginTop: 4 }}>{priceNote}</p>

      {warnings && warnings.length > 0 && (
        <>
          <h3 style={{ ...sectionHeader, color: "#cc4400", borderColor: "#cc4400" }}>
            Warnings
          </h3>
          <ul style={{ fontSize: 12, paddingLeft: 16, color: "#cc4400" }}>
            {warnings.map((w, i) => (
              <li key={i} style={{ marginBottom: 4 }}>{w}</li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

// ─── Shared styles exported for use by all material lists ───

export const sectionHeader: React.CSSProperties = {
  margin: "16px 0 8px",
  fontSize: 14,
  borderBottom: "1px solid #ccc",
  paddingBottom: 4,
};
export const tableStyle: React.CSSProperties = {
  width: "100%",
  fontSize: 12,
  borderCollapse: "collapse",
};
export const thLeft: React.CSSProperties = { textAlign: "left", padding: "2px 4px" };
export const thRight: React.CSSProperties = { textAlign: "right", padding: "2px 4px" };
export const cellStyle: React.CSSProperties = { padding: "1px 4px" };

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td style={{ padding: "2px 4px", color: "#555" }}>{label}</td>
      <td style={{ padding: "2px 4px", fontWeight: 500 }}>{value}</td>
    </tr>
  );
}
