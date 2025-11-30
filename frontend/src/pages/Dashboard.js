import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { dashboardAPI, shotsAPI, complianceAPI } from "../services/api";
import "./Dashboard.css";

const StatCard = ({ title, value, trend, icon, linkTo, color }) => (
  <Link to={linkTo} className={`stat-card ${color}`}>
    <div className="stat-icon">
      <i className={`fas fa-${icon}`}></i>
    </div>
    <div className="stat-content">
      <h3>{title}</h3>
      <div className="stat-number">{value}</div>
      {trend && (
        <div className="stat-trend">
          <i className="fas fa-arrow-up"></i>
          {trend}
        </div>
      )}
    </div>
    <div className="stat-arrow">
      <i className="fas fa-arrow-right"></i>
    </div>
  </Link>
);

const QuickActionCard = ({ title, description, icon, onClick, color }) => (
  <div className={`quick-action-card ${color}`} onClick={onClick}>
    <div className="action-icon">
      <i className={`fas fa-${icon}`}></i>
    </div>
    <div className="action-content">
      <h4>{title}</h4>
      <p>{description}</p>
    </div>
  </div>
);

const RecentItem = ({ item, type }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  if (type === "shot") {
    return (
      <div className="recent-item">
        <div className="recent-icon">
          <i className="fas fa-bullseye"></i>
        </div>
        <div className="recent-content">
          <div className="recent-title">
            Shot by {item.hunter_name || "Unknown"}
          </div>
          <div className="recent-details">
            Location: {item.location} • {item.weapon_used}
          </div>
          <div className="recent-time">{formatTime(item.timestamp)}</div>
        </div>
      </div>
    );
  }

  if (type === "violation") {
    return (
      <div className={`recent-item violation-${item.severity}`}>
        <div className="recent-icon">
          <i className="fas fa-exclamation-triangle"></i>
        </div>
        <div className="recent-content">
          <div className="recent-title">{item.violation_type_display}</div>
          <div className="recent-details">
            {item.hunter_name} • {item.description}
          </div>
          <div className="recent-time">{formatTime(item.detected_at)}</div>
        </div>
        <div className={`severity-badge ${item.severity}`}>{item.severity}</div>
      </div>
    );
  }

  return null;
};

const Dashboard = () => {
  const [stats, setStats] = useState({
    active_hunters: 0,
    total_shots: 0,
    total_bullets: 0,
    active_locations: 0,
  });
  const [recentShots, setRecentShots] = useState([]);
  const [recentViolations, setRecentViolations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, shotsRes, violationsRes] = await Promise.all([
        dashboardAPI.getStats().catch((err) => {
          console.error("Stats API error:", err);
          return {
            data: {
              active_hunters: 0,
              total_shots: 0,
              total_bullets: 0,
              active_locations: 0,
            },
          };
        }),
        shotsAPI.getRecent(5).catch((err) => {
          console.error("Shots API error:", err);
          return { data: [] };
        }),
        complianceAPI.getRecentViolations().catch((err) => {
          console.error("Violations API error:", err);
          return { data: [] };
        }),
      ]);

      console.log("Dashboard data loaded:", {
        statsRes,
        shotsRes,
        violationsRes,
      });
      setStats(statsRes.data);
      setRecentShots(shotsRes.data.results || shotsRes.data);
      setRecentViolations(
        (violationsRes.data.results || violationsRes.data).slice(0, 5)
      );
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case "add-hunter":
        window.location.href = "/hunters";
        break;
      case "register-gun":
        window.location.href = "/guns";
        break;
      case "record-shot":
        window.location.href = "/shots";
        break;
      case "add-ammo":
        window.location.href = "/ammunition";
        break;
      case "compliance-check":
        window.location.href = "/compliance";
        break;
      case "generate-report":
        window.location.href = "/activities";
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>
          <i className="fas fa-tachometer-alt"></i>
          Dashboard Overview
        </h1>
        <p>
          Real-time monitoring and management of your IoT gun control system
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-section">
        <h2>System Overview</h2>
        <div className="stats-grid">
          <StatCard
            title="Active Hunters"
            value={stats.active_hunters}
            icon="users"
            linkTo="/hunters"
            color="blue"
          />
          <StatCard
            title="Total Shots"
            value={stats.total_shots}
            icon="bullseye"
            linkTo="/shots"
            color="green"
          />
          <StatCard
            title="Ammunition"
            value={stats.total_bullets?.toLocaleString() || "0"}
            icon="boxes"
            linkTo="/ammunition"
            color="orange"
          />
          <StatCard
            title="Active Locations"
            value={stats.active_locations}
            icon="map-marker-alt"
            linkTo="/zones"
            color="purple"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions-grid">
          <QuickActionCard
            title="Add Hunter"
            description="Register a new hunter in the system"
            icon="user-plus"
            onClick={() => handleQuickAction("add-hunter")}
            color="blue"
          />
          <QuickActionCard
            title="Register Gun"
            description="Add a new IoT gun device"
            icon="crosshairs"
            onClick={() => handleQuickAction("register-gun")}
            color="green"
          />
          <QuickActionCard
            title="Record Shot"
            description="Manually log a shot event"
            icon="bullseye"
            onClick={() => handleQuickAction("record-shot")}
            color="red"
          />
          <QuickActionCard
            title="Add Ammunition"
            description="Update ammunition inventory"
            icon="boxes"
            onClick={() => handleQuickAction("add-ammo")}
            color="orange"
          />
          <QuickActionCard
            title="Compliance Check"
            description="Run system compliance audit"
            icon="shield-alt"
            onClick={() => handleQuickAction("compliance-check")}
            color="purple"
          />
          <QuickActionCard
            title="Generate Report"
            description="Create detailed system report"
            icon="file-alt"
            onClick={() => handleQuickAction("generate-report")}
            color="teal"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity-section">
        <div className="recent-activity-grid">
          <div className="recent-section">
            <div className="section-header">
              <h2>
                <i className="fas fa-bullseye"></i>
                Recent Shots
              </h2>
              <Link to="/shots" className="view-all-link">
                View All <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
            <div className="recent-items">
              {recentShots.length === 0 ? (
                <div className="no-data">No recent shots recorded</div>
              ) : (
                recentShots.map((shot) => (
                  <RecentItem key={shot.id} item={shot} type="shot" />
                ))
              )}
            </div>
          </div>

          <div className="recent-section">
            <div className="section-header">
              <h2>
                <i className="fas fa-exclamation-triangle"></i>
                Recent Violations
              </h2>
              <Link to="/compliance" className="view-all-link">
                View All <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
            <div className="recent-items">
              {recentViolations.length === 0 ? (
                <div className="no-data">No recent violations</div>
              ) : (
                recentViolations.map((violation) => (
                  <RecentItem
                    key={violation.id}
                    item={violation}
                    type="violation"
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
