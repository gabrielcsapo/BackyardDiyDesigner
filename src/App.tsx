import React from "react";
import { Routes, Route, Navigate, NavLink } from "react-router-dom";
import StairApp from "./stairs/StairApp";
import FenceApp from "./fence/FenceApp";
import FirePitApp from "./firepit/FirePitApp";
import GardenBedApp from "./gardenbed/GardenBedApp";
import PergolaApp from "./pergola/PergolaApp";

const navStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 16px",
  background: "#1e293b",
  color: "#fff",
  fontSize: 13,
  borderBottom: "1px solid #334155",
};

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: "6px 16px",
  border: "none",
  borderRadius: 6,
  background: active ? "#3b82f6" : "transparent",
  color: active ? "#fff" : "#94a3b8",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: active ? 600 : 400,
  textDecoration: "none",
});

export default function App() {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <nav style={navStyle}>
        <span style={{ fontWeight: 700, fontSize: 15, marginRight: 12 }}>
          Project Designer
        </span>
        <NavLink to="stairs" style={({ isActive }) => tabStyle(isActive)}>
          Box Stairs
        </NavLink>
        <NavLink to="fence" style={({ isActive }) => tabStyle(isActive)}>
          Chicken Wire Fence
        </NavLink>
        <NavLink to="firepit" style={({ isActive }) => tabStyle(isActive)}>
          Fire Pit Sitting
        </NavLink>
        <NavLink to="gardenbed" style={({ isActive }) => tabStyle(isActive)}>
          Brick Garden Bed
        </NavLink>
        <NavLink to="pergola" style={({ isActive }) => tabStyle(isActive)}>
          Pergola
        </NavLink>
      </nav>
      <div style={{ flex: 1, overflow: "hidden" }}>
        <Routes>
          <Route path="stairs" element={<StairApp />} />
          <Route path="fence" element={<FenceApp />} />
          <Route path="firepit" element={<FirePitApp />} />
          <Route path="gardenbed" element={<GardenBedApp />} />
          <Route path="pergola" element={<PergolaApp />} />
          <Route index element={<Navigate to="stairs" replace />} />
        </Routes>
      </div>
    </div>
  );
}
