import React, { useState, useEffect } from "react";
import axios from "axios";
import io from "socket.io-client";
import "./index.css";

// API Configuration
const API_BASE_URL = "http://192.168.1.3:8000/api";

// Components
const Header = ({ connectionStatus, currentTime }) => (
  <div className="header">
    <h1>
      <i className="fas fa-crosshairs"></i>
      IoT Gun Control Dashboard
    </h1>
    <div className="header-info">
      <div className={`connection-status ${connectionStatus}`}>
        {connectionStatus === "connected"
          ? "Connected"
          : connectionStatus === "connecting"
          ? "Connecting..."
          : "Disconnected"}
      </div>
      <div className="time">{currentTime}</div>
    </div>
  </div>
);

const StatCard = ({ title, value, trend, icon }) => (
  <div className="stat-card fade-in">
    <h3>
      <i className={`fas fa-${icon}`}></i> {title}
    </h3>
    <div className="stat-number">{value}</div>
    {trend && (
      <div className="stat-trend">
        <i className="fas fa-arrow-up"></i>
        {trend}
      </div>
    )}
  </div>
);

const DataSection = ({
  title,
  icon,
  children,
  onAdd,
  addButtonText = "Add",
}) => (
  <div className="data-section slide-up">
    <div className="section-header">
      <h3 className="section-title">
        <i className={`fas fa-${icon}`}></i>
        {title}
      </h3>
      {onAdd && (
        <button className="add-btn" onClick={onAdd}>
          <i className="fas fa-plus"></i>
          {addButtonText}
        </button>
      )}
    </div>
    <div className="section-content">{children}</div>
  </div>
);

const HunterCard = ({ hunter, isNew }) => (
  <div className={`item-card ${isNew ? "new-item" : ""}`}>
    <div className="item-header">
      <div className="item-title">{hunter.name}</div>
      <span
        className={`item-status ${
          hunter.is_active ? "status-active" : "status-inactive"
        }`}
      >
        {hunter.is_active ? "Active" : "Inactive"}
      </span>
    </div>
    <div className="item-details">
      <strong>License:</strong> {hunter.license_number}
      <br />
      <strong>Location:</strong> {hunter.current_location}
      <br />
      <strong>Guns:</strong> {hunter.total_guns || 0}
    </div>
  </div>
);

const GunCard = ({ gun, isNew }) => (
  <div className={`item-card ${isNew ? "new-item" : ""}`}>
    <div className="item-header">
      <div className="item-title">
        {gun.make} {gun.model}
      </div>
      <span
        className={`item-status ${
          gun.status === "active"
            ? "status-active"
            : gun.battery_level < 20
            ? "status-low"
            : "status-inactive"
        }`}
      >
        {gun.status}
      </span>
    </div>
    <div className="item-details">
      <strong>Device ID:</strong> {gun.device_id}
      <br />
      <strong>Owner:</strong> {gun.owner_name || "Unknown"}
      <br />
      <strong>Type:</strong> {gun.weapon_type}
      <br />
      <strong>Battery:</strong> {gun.battery_level}%
      {gun.battery_level < 20 && (
        <i
          className="fas fa-exclamation-triangle"
          style={{ color: "#ff6b6b", marginLeft: "5px" }}
        ></i>
      )}
    </div>
  </div>
);

const AmmoCard = ({ ammo, isNew }) => (
  <div className={`item-card ${isNew ? "new-item" : ""}`}>
    <div className="item-header">
      <div className="item-title">{ammo.ammo_type}</div>
      <span
        className={`item-status ${
          ammo.quantity > 100
            ? "status-active"
            : ammo.quantity > 50
            ? "status-low"
            : "status-inactive"
        }`}
      >
        {ammo.quantity} units
      </span>
    </div>
    <div className="item-details">
      <strong>Location:</strong> {ammo.location}
      <br />
      <strong>Cost:</strong> ${ammo.cost_per_unit}/unit
      <br />
      {ammo.supplier && (
        <>
          <strong>Supplier:</strong> {ammo.supplier}
        </>
      )}
    </div>
  </div>
);

const ShotsTable = ({ shots, newShotIds }) => (
  <div className="shots-section">
    <div className="section-header">
      <h3 className="section-title">
        <i className="fas fa-bullseye"></i>
        Recent Shots ({shots.length})
      </h3>
    </div>
    <div style={{ overflow: "auto", maxHeight: "500px" }}>
      <table className="shots-table">
        <thead>
          <tr>
            <th>Hunter</th>
            <th>Time</th>
            <th>Location</th>
            <th>Weapon</th>
            <th>Sound Level</th>
            <th>Vibration</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {shots.map((shot) => (
            <tr
              key={shot.id}
              className={newShotIds.has(shot.id) ? "new-item" : ""}
            >
              <td>{shot.hunter_name || "Unknown"}</td>
              <td>{new Date(shot.timestamp).toLocaleString()}</td>
              <td>{shot.location}</td>
              <td>{shot.weapon_used}</td>
              <td>
                {shot.sound_level
                  ? `${Math.round(shot.sound_level)} dB`
                  : "N/A"}
              </td>
              <td>
                {shot.vibration_level
                  ? `${Math.round(shot.vibration_level)} Hz`
                  : "N/A"}
              </td>
              <td>{shot.notes || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="loading">
    <div className="loading-spinner"></div>
    {message}
  </div>
);

function App() {
  // State Management
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [currentTime, setCurrentTime] = useState("");
  const [stats, setStats] = useState({
    active_hunters: 0,
    total_shots: 0,
    total_bullets: 0,
    active_locations: 0,
  });
  const [hunters, setHunters] = useState([]);
  const [guns, setGuns] = useState([]);
  const [shots, setShots] = useState([]);
  const [ammunition, setAmmunition] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newItemIds, setNewItemIds] = useState({
    hunters: new Set(),
    guns: new Set(),
    shots: new Set(),
    ammo: new Set(),
  });

  // Time Update
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString());
    };

    updateTime();
    const timeInterval = setInterval(updateTime, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  // API Functions
  const fetchData = async () => {
    try {
      setConnectionStatus("connecting");

      const [statsRes, huntersRes, gunsRes, shotsRes, ammoRes, activitiesRes] =
        await Promise.all([
          axios.get(`${API_BASE_URL}/dashboard-stats/`),
          axios.get(`${API_BASE_URL}/hunters/hunters/`),
          axios.get(`${API_BASE_URL}/hunters/guns/`),
          axios.get(`${API_BASE_URL}/hunters/shots/`),
          axios.get(`${API_BASE_URL}/ammunition/inventory/`),
          axios.get(`${API_BASE_URL}/activities/activities/`),
        ]);

      setStats(statsRes.data);
      setHunters(huntersRes.data.results || huntersRes.data);
      setGuns(gunsRes.data.results || gunsRes.data);
      setShots((shotsRes.data.results || shotsRes.data).slice(0, 50)); // Limit to 50 recent shots
      setAmmunition(ammoRes.data.results || ammoRes.data);
      setActivities(
        (activitiesRes.data.results || activitiesRes.data).slice(0, 10)
      );

      setConnectionStatus("connected");
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setConnectionStatus("disconnected");
      setLoading(false);
    }
  };

  // Real-time Updates with WebSocket (fallback to polling)
  useEffect(() => {
    // Initial data load
    fetchData();

    // Set up polling for real-time updates (every 5 seconds)
    const pollInterval = setInterval(async () => {
      try {
        // Fetch only new shots for real-time updates
        const shotsRes = await axios.get(
          `${API_BASE_URL}/hunters/shots/?limit=10`
        );
        const newShots = shotsRes.data.results || shotsRes.data;

        if (newShots.length > 0) {
          setShots((prevShots) => {
            const existingIds = new Set(prevShots.map((s) => s.id));
            const trulyNewShots = newShots.filter(
              (shot) => !existingIds.has(shot.id)
            );

            if (trulyNewShots.length > 0) {
              // Mark new shots for animation
              setNewItemIds((prev) => ({
                ...prev,
                shots: new Set(trulyNewShots.map((s) => s.id)),
              }));

              // Remove animation class after 2 seconds
              setTimeout(() => {
                setNewItemIds((prev) => ({
                  ...prev,
                  shots: new Set(),
                }));
              }, 2000);

              // Merge new shots with existing ones (keep max 50)
              return [...trulyNewShots, ...prevShots].slice(0, 50);
            }
            return prevShots;
          });

          // Update stats
          const statsRes = await axios.get(`${API_BASE_URL}/dashboard-stats/`);
          setStats(statsRes.data);
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, []);

  // Action Handlers
  const handleAddHunter = () => {
    alert("Add Hunter modal would open here");
  };

  const handleAddGun = () => {
    alert("Add Gun modal would open here");
  };

  const handleAddAmmo = () => {
    alert("Add Ammunition modal would open here");
  };

  const handleRecordShot = () => {
    alert("Record Shot modal would open here");
  };

  const refreshData = () => {
    setLoading(true);
    fetchData();
  };

  if (loading) {
    return (
      <div className="dashboard">
        <Header connectionStatus={connectionStatus} currentTime={currentTime} />
        <div className="main-content">
          <LoadingSpinner message="Loading dashboard data..." />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Header connectionStatus={connectionStatus} currentTime={currentTime} />

      <div className="main-content">
        {/* Stats Grid */}
        <div className="stats-grid">
          <StatCard
            title="Active Hunters"
            value={stats.active_hunters}
            icon="users"
          />
          <StatCard
            title="Total Shots"
            value={stats.total_shots}
            icon="bullseye"
          />
          <StatCard
            title="Ammunition"
            value={stats.total_bullets.toLocaleString()}
            icon="boxes"
          />
          <StatCard
            title="Locations"
            value={stats.active_locations}
            icon="map-marker-alt"
          />
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button className="action-btn" onClick={handleAddHunter}>
            <i className="fas fa-user-plus"></i>
            Add Hunter
          </button>
          <button className="action-btn" onClick={handleAddGun}>
            <i className="fas fa-crosshairs"></i>
            Register Gun
          </button>
          <button className="action-btn" onClick={handleRecordShot}>
            <i className="fas fa-bullseye"></i>
            Record Shot
          </button>
          <button className="action-btn" onClick={handleAddAmmo}>
            <i className="fas fa-boxes"></i>
            Add Ammo
          </button>
          <button className="action-btn" onClick={refreshData}>
            <i className="fas fa-sync-alt"></i>
            Refresh
          </button>
        </div>

        {/* Data Sections */}
        <div className="data-sections">
          <DataSection
            title="Active Hunters"
            icon="users"
            onAdd={handleAddHunter}
            addButtonText="Add Hunter"
          >
            {hunters.length === 0 ? (
              <div className="loading">No hunters registered</div>
            ) : (
              hunters.map((hunter) => (
                <HunterCard
                  key={hunter.id}
                  hunter={hunter}
                  isNew={newItemIds.hunters.has(hunter.id)}
                />
              ))
            )}
          </DataSection>

          <DataSection
            title="IoT Guns"
            icon="crosshairs"
            onAdd={handleAddGun}
            addButtonText="Register Gun"
          >
            {guns.length === 0 ? (
              <div className="loading">No guns registered</div>
            ) : (
              guns.map((gun) => (
                <GunCard
                  key={gun.id}
                  gun={gun}
                  isNew={newItemIds.guns.has(gun.id)}
                />
              ))
            )}
          </DataSection>

          <DataSection
            title="Ammunition Inventory"
            icon="boxes"
            onAdd={handleAddAmmo}
            addButtonText="Add Stock"
          >
            {ammunition.length === 0 ? (
              <div className="loading">No ammunition in inventory</div>
            ) : (
              ammunition.map((ammo) => (
                <AmmoCard
                  key={ammo.id}
                  ammo={ammo}
                  isNew={newItemIds.ammo.has(ammo.id)}
                />
              ))
            )}
          </DataSection>

          <DataSection title="Recent Activities" icon="history">
            {activities.length === 0 ? (
              <div className="loading">No recent activities</div>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="item-card">
                  <div className="item-details">
                    <strong>
                      {new Date(activity.timestamp).toLocaleString()}
                    </strong>
                    <br />
                    {activity.description}
                  </div>
                </div>
              ))
            )}
          </DataSection>
        </div>

        {/* Shots Table */}
        <ShotsTable shots={shots} newShotIds={newItemIds.shots} />
      </div>
    </div>
  );
}

export default App;
