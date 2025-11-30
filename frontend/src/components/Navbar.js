import React from "react";
import { NavLink } from "react-router-dom";
import "./Navbar.css";

const Navbar = ({ connectionStatus, currentTime }) => {
  const navItems = [
    { path: "/", label: "Dashboard", icon: "tachometer-alt" },
    { path: "/hunters", label: "Hunters", icon: "users" },
    { path: "/guns", label: "Guns", icon: "crosshairs" },
    { path: "/shots", label: "Shots", icon: "bullseye" },
    { path: "/ammunition", label: "Ammunition", icon: "boxes" },
    { path: "/compliance", label: "Compliance", icon: "shield-alt" },
    { path: "/activities", label: "Activities", icon: "history" },
    { path: "/zones", label: "Hunting Zones", icon: "map-marker-alt" },
    { path: "/licenses", label: "Licenses", icon: "id-card" },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>
          <i className="fas fa-crosshairs"></i>
          IoT Gun Control Dashboard
        </h1>
      </div>

      <div className="navbar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <i className={`fas fa-${item.icon}`}></i>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="navbar-status">
        <div className={`connection-status ${connectionStatus}`}>
          <i
            className={`fas fa-${
              connectionStatus === "connected" ? "wifi" : "exclamation-triangle"
            }`}
          ></i>
          {connectionStatus === "connected"
            ? "Connected"
            : connectionStatus === "connecting"
            ? "Connecting..."
            : "Disconnected"}
        </div>
        <div className="current-time">
          <i className="fas fa-clock"></i>
          {currentTime}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
