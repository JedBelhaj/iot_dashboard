import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Hunters from './pages/Hunters';
import Guns from './pages/Guns';
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

const HunterCard = ({ hunter, isNew, onClick }) => (
  <div
    className={`item-card clickable ${isNew ? "new-item" : ""}`}
    onClick={onClick}
  >
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
      <br />
      <strong>Total Shots:</strong> {hunter.total_shots || 0}
    </div>
    <div className="view-details">
      <i className="fas fa-eye"></i> View Details
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

const HunterDetailsModal = ({ hunter, isOpen, onClose, onUpdateHunter }) => {
  const [newAmmo, setNewAmmo] = useState({
    ammo_type: "9mm",
    quantity: 50,
    purchase_price: 25.0,
    vendor: "Gun Store",
    receipt_number: "",
  });
  const [isAddingAmmo, setIsAddingAmmo] = useState(false);
  const [hunterShots, setHunterShots] = useState([]);
  const [hunterGuns, setHunterGuns] = useState([]);
  const [hunterPurchases, setHunterPurchases] = useState([]);
  const [hunterViolations, setHunterViolations] = useState([]);
  const [hunterLicense, setHunterLicense] = useState(null);

  useEffect(() => {
    if (hunter && isOpen) {
      fetchHunterDetails();
    }
  }, [hunter, isOpen]);

  const fetchHunterDetails = async () => {
    try {
      const [shotsRes, gunsRes, purchasesRes, violationsRes, licensesRes] =
        await Promise.all([
          axios.get(`${API_BASE_URL}/hunters/shots/?hunter=${hunter.id}`),
          axios.get(`${API_BASE_URL}/hunters/guns/?owner=${hunter.id}`),
          axios.get(
            `${API_BASE_URL}/compliance/ammunition-purchases/?hunter=${hunter.id}`
          ),
          axios.get(
            `${API_BASE_URL}/compliance/violations/?hunter=${hunter.id}`
          ),
          axios.get(`${API_BASE_URL}/compliance/licenses/?hunter=${hunter.id}`),
        ]);

      setHunterShots((shotsRes.data.results || shotsRes.data).slice(0, 10));
      setHunterGuns(gunsRes.data.results || gunsRes.data);
      setHunterPurchases(purchasesRes.data.results || purchasesRes.data);
      setHunterViolations(violationsRes.data.results || violationsRes.data);
      setHunterLicense(
        (licensesRes.data.results || licensesRes.data)[0] || null
      );
    } catch (error) {
      console.error("Failed to fetch hunter details:", error);
    }
  };

  const handleAddAmmo = async (e) => {
    e.preventDefault();
    setIsAddingAmmo(true);

    try {
      await axios.post(`${API_BASE_URL}/compliance/ammunition-purchases/`, {
        ...newAmmo,
        hunter: hunter.id,
        purchase_date: new Date().toISOString(),
      });

      // Reset form
      setNewAmmo({
        ammo_type: "9mm",
        quantity: 50,
        purchase_price: 25.0,
        vendor: "Gun Store",
        receipt_number: "",
      });

      // Refresh hunter details
      fetchHunterDetails();
      onUpdateHunter(); // Refresh main dashboard

      alert("Ammunition added successfully!");
    } catch (error) {
      console.error("Failed to add ammunition:", error);
      alert("Failed to add ammunition");
    } finally {
      setIsAddingAmmo(false);
    }
  };

  const totalAmmoRemaining = hunterPurchases.reduce(
    (total, purchase) => total + (purchase.remaining_quantity || 0),
    0
  );

  if (!isOpen || !hunter) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content hunter-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>
            <i className="fas fa-user-circle"></i>
            {hunter.name} - Hunter Details
          </h2>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body">
          {/* Hunter Overview */}
          <div className="hunter-overview">
            <div className="overview-stats">
              <div className="stat-item">
                <i className="fas fa-id-card"></i>
                <div>
                  <div className="stat-label">License</div>
                  <div className="stat-value">{hunter.license_number}</div>
                </div>
              </div>
              <div className="stat-item">
                <i className="fas fa-map-marker-alt"></i>
                <div>
                  <div className="stat-label">Location</div>
                  <div className="stat-value">{hunter.current_location}</div>
                </div>
              </div>
              <div className="stat-item">
                <i className="fas fa-crosshairs"></i>
                <div>
                  <div className="stat-label">Total Shots</div>
                  <div className="stat-value">{hunterShots.length}</div>
                </div>
              </div>
              <div className="stat-item">
                <i className="fas fa-bullets"></i>
                <div>
                  <div className="stat-label">Ammo Remaining</div>
                  <div
                    className={`stat-value ${
                      totalAmmoRemaining <= 10 ? "low-ammo" : ""
                    }`}
                  >
                    {totalAmmoRemaining}
                  </div>
                </div>
              </div>
            </div>

            {/* License Status */}
            {hunterLicense && (
              <div
                className={`license-status ${
                  hunterLicense.is_valid ? "valid" : "invalid"
                }`}
              >
                <i
                  className={`fas fa-${
                    hunterLicense.is_valid
                      ? "check-circle"
                      : "exclamation-triangle"
                  }`}
                ></i>
                <span>
                  License {hunterLicense.is_valid ? "Valid" : "Invalid/Expired"}
                  {hunterLicense.is_valid &&
                    hunterLicense.days_until_expiry <= 30 &&
                    ` (Expires in ${hunterLicense.days_until_expiry} days)`}
                </span>
              </div>
            )}
          </div>

          <div className="modal-tabs">
            {/* Add Ammunition Section */}
            <div className="tab-section">
              <h3>
                <i className="fas fa-plus-circle"></i> Add Ammunition
              </h3>
              <form onSubmit={handleAddAmmo} className="ammo-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Ammunition Type</label>
                    <select
                      value={newAmmo.ammo_type}
                      onChange={(e) =>
                        setNewAmmo({ ...newAmmo, ammo_type: e.target.value })
                      }
                    >
                      <option value="9mm">9mm</option>
                      <option value=".308">.308</option>
                      <option value="12ga">12ga</option>
                      <option value=".30-06">.30-06</option>
                      <option value=".22LR">.22LR</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Quantity</label>
                    <input
                      type="number"
                      value={newAmmo.quantity}
                      onChange={(e) =>
                        setNewAmmo({
                          ...newAmmo,
                          quantity: parseInt(e.target.value),
                        })
                      }
                      min="1"
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Purchase Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newAmmo.purchase_price}
                      onChange={(e) =>
                        setNewAmmo({
                          ...newAmmo,
                          purchase_price: parseFloat(e.target.value),
                        })
                      }
                      min="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Vendor</label>
                    <input
                      type="text"
                      value={newAmmo.vendor}
                      onChange={(e) =>
                        setNewAmmo({ ...newAmmo, vendor: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Receipt Number (Optional)</label>
                  <input
                    type="text"
                    value={newAmmo.receipt_number}
                    onChange={(e) =>
                      setNewAmmo({ ...newAmmo, receipt_number: e.target.value })
                    }
                  />
                </div>
                <button
                  type="submit"
                  className="add-ammo-btn"
                  disabled={isAddingAmmo}
                >
                  {isAddingAmmo ? "Adding..." : "Add Ammunition"}
                </button>
              </form>
            </div>

            {/* Ammunition Purchases */}
            <div className="tab-section">
              <h3>
                <i className="fas fa-shopping-cart"></i> Ammunition Purchases (
                {hunterPurchases.length})
              </h3>
              <div className="purchases-list">
                {hunterPurchases.length === 0 ? (
                  <div className="no-data">
                    No ammunition purchases recorded
                  </div>
                ) : (
                  hunterPurchases.map((purchase) => (
                    <div key={purchase.id} className="purchase-item">
                      <div className="purchase-header">
                        <span className="ammo-type-badge">
                          {purchase.ammo_type}
                        </span>
                        <span className="purchase-date">
                          {new Date(
                            purchase.purchase_date
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="purchase-details">
                        <div>
                          Purchased: {purchase.quantity} | Used:{" "}
                          {purchase.used_quantity} |
                          <span
                            className={
                              purchase.remaining_quantity <= 0
                                ? "depleted"
                                : "available"
                            }
                          >
                            Remaining: {purchase.remaining_quantity}
                          </span>
                        </div>
                        <div>
                          ${purchase.purchase_price} from {purchase.vendor}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Violations */}
            {hunterViolations.length > 0 && (
              <div className="tab-section">
                <h3>
                  <i className="fas fa-exclamation-triangle"></i> Violations (
                  {hunterViolations.length})
                </h3>
                <div className="violations-list">
                  {hunterViolations.map((violation) => (
                    <div
                      key={violation.id}
                      className={`violation-item ${violation.severity.toLowerCase()}`}
                    >
                      <div className="violation-header">
                        <span
                          className={`badge ${violation.severity.toLowerCase()}`}
                        >
                          {violation.severity}
                        </span>
                        <span className="violation-date">
                          {new Date(violation.detected_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="violation-type">
                        {violation.violation_type_display}
                      </div>
                      <div className="violation-description">
                        {violation.description}
                      </div>
                      {violation.resolved && (
                        <div className="resolved-badge">
                          <i className="fas fa-check-circle"></i> Resolved
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Shots */}
            <div className="tab-section">
              <h3>
                <i className="fas fa-crosshairs"></i> Recent Shots (
                {hunterShots.length})
              </h3>
              <div className="shots-list">
                {hunterShots.length === 0 ? (
                  <div className="no-data">No shots recorded</div>
                ) : (
                  hunterShots.map((shot) => (
                    <div key={shot.id} className="shot-item">
                      <div className="shot-time">
                        {new Date(shot.timestamp).toLocaleString()}
                      </div>
                      <div className="shot-location">
                        {shot.latitude?.toFixed(4)},{" "}
                        {shot.longitude?.toFixed(4)}
                      </div>
                      <div className="shot-weapon">{shot.weapon_used}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Registered Guns */}
            <div className="tab-section">
              <h3>
                <i className="fas fa-gun"></i> Registered Guns (
                {hunterGuns.length})
              </h3>
              <div className="guns-list">
                {hunterGuns.length === 0 ? (
                  <div className="no-data">No guns registered</div>
                ) : (
                  hunterGuns.map((gun) => (
                    <div key={gun.id} className="gun-item">
                      <div className="gun-header">
                        <span className="gun-name">
                          {gun.make} {gun.model}
                        </span>
                        <span className={`status-badge ${gun.status}`}>
                          {gun.status}
                        </span>
                      </div>
                      <div className="gun-details">
                        <div>Serial: {gun.serial_number}</div>
                        <div>Device: {gun.device_id}</div>
                        <div>Battery: {gun.battery_level}%</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
  const [violations, setViolations] = useState([]);
  const [huntingZones, setHuntingZones] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [ammoPurchases, setAmmoPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHunter, setSelectedHunter] = useState(null);
  const [showHunterModal, setShowHunterModal] = useState(false);
  const [newItemIds, setNewItemIds] = useState({
    hunters: new Set(),
    guns: new Set(),
    shots: new Set(),
    ammo: new Set(),
    violations: new Set(),
    zones: new Set(),
    licenses: new Set(),
    purchases: new Set(),
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

      const [
        statsRes,
        huntersRes,
        gunsRes,
        shotsRes,
        ammoRes,
        activitiesRes,
        violationsRes,
        zonesRes,
        licensesRes,
        purchasesRes,
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/dashboard-stats/`),
        axios.get(`${API_BASE_URL}/hunters/hunters/`),
        axios.get(`${API_BASE_URL}/hunters/guns/`),
        axios.get(`${API_BASE_URL}/hunters/shots/`),
        axios.get(`${API_BASE_URL}/ammunition/inventory/`),
        axios.get(`${API_BASE_URL}/activities/activities/`),
        axios.get(`${API_BASE_URL}/compliance/violations/`),
        axios.get(`${API_BASE_URL}/compliance/hunting-zones/`),
        axios.get(`${API_BASE_URL}/compliance/licenses/`),
        axios.get(`${API_BASE_URL}/compliance/ammunition-purchases/`),
      ]);

      setStats(statsRes.data);
      setHunters(huntersRes.data.results || huntersRes.data);
      setGuns(gunsRes.data.results || gunsRes.data);
      setShots((shotsRes.data.results || shotsRes.data).slice(0, 50));
      setAmmunition(ammoRes.data.results || ammoRes.data);
      setActivities(
        (activitiesRes.data.results || activitiesRes.data).slice(0, 10)
      );
      setViolations(
        (violationsRes.data.results || violationsRes.data).slice(0, 20)
      );
      setHuntingZones(zonesRes.data.results || zonesRes.data);
      setLicenses(licensesRes.data.results || licensesRes.data);
      setAmmoPurchases(
        (purchasesRes.data.results || purchasesRes.data).slice(0, 20)
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

  // Hunter Details Modal Handlers
  const handleHunterClick = (hunter) => {
    setSelectedHunter(hunter);
    setShowHunterModal(true);
  };

  const handleCloseHunterModal = () => {
    setShowHunterModal(false);
    setSelectedHunter(null);
  };

  const handleUpdateHunter = () => {
    fetchData(); // Refresh all data
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
                  onClick={() => handleHunterClick(hunter)}
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

          <DataSection
            title="Compliance Violations"
            icon="exclamation-triangle"
          >
            {violations.length === 0 ? (
              <div className="loading">No violations detected</div>
            ) : (
              violations.map((violation) => (
                <div
                  key={violation.id}
                  className={`item-card violation-${violation.severity.toLowerCase()}`}
                >
                  <div className="item-details">
                    <div className="violation-header">
                      <strong>{violation.hunter_name}</strong>
                      <span
                        className={`badge ${violation.severity.toLowerCase()}`}
                      >
                        {violation.severity}
                      </span>
                    </div>
                    <div className="violation-type">
                      {violation.violation_type_display}
                    </div>
                    <div className="violation-description">
                      {violation.description}
                    </div>
                    <div className="violation-time">
                      {new Date(violation.detected_at).toLocaleString()}
                    </div>
                    {violation.resolved && (
                      <div className="resolved-badge">
                        <i className="fas fa-check-circle"></i> Resolved
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </DataSection>

          <DataSection title="Hunting Zones" icon="map-marker-alt">
            {huntingZones.length === 0 ? (
              <div className="loading">No hunting zones configured</div>
            ) : (
              huntingZones.map((zone) => (
                <div
                  key={zone.id}
                  className={`item-card zone-${
                    zone.is_active ? "active" : "inactive"
                  }`}
                >
                  <div className="item-details">
                    <div className="zone-header">
                      <strong>{zone.name}</strong>
                      <span
                        className={`badge ${
                          zone.is_active ? "active" : "inactive"
                        }`}
                      >
                        {zone.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="zone-description">{zone.description}</div>
                    <div className="zone-season">
                      Season: {zone.season_start} - {zone.season_end}
                    </div>
                    <div className="zone-hours">
                      Hours: {zone.daily_start_time} - {zone.daily_end_time}
                    </div>
                    <div className="zone-location">
                      Center: {zone.center_latitude}, {zone.center_longitude} (
                      {zone.radius_km} km radius)
                    </div>
                  </div>
                </div>
              ))
            )}
          </DataSection>

          <DataSection title="Hunter Licenses" icon="id-card">
            {licenses.length === 0 ? (
              <div className="loading">No licenses on record</div>
            ) : (
              licenses.map((license) => (
                <div
                  key={license.id}
                  className={`item-card license-${
                    license.is_valid ? "valid" : "invalid"
                  }`}
                >
                  <div className="item-details">
                    <div className="license-header">
                      <strong>{license.hunter_name}</strong>
                      <span
                        className={`badge ${
                          license.is_valid ? "valid" : "expired"
                        }`}
                      >
                        {license.is_valid ? "Valid" : "Expired"}
                      </span>
                    </div>
                    <div className="license-number">
                      #{license.license_number}
                    </div>
                    <div className="license-dates">
                      Issued: {license.issue_date} | Expires:{" "}
                      {license.expiry_date}
                    </div>
                    {license.days_until_expiry <= 30 &&
                      license.days_until_expiry > 0 && (
                        <div className="expiring-warning">
                          <i className="fas fa-exclamation-triangle"></i>
                          Expires in {license.days_until_expiry} days
                        </div>
                      )}
                  </div>
                </div>
              ))
            )}
          </DataSection>

          <DataSection title="Ammunition Purchases" icon="shopping-cart">
            {ammoPurchases.length === 0 ? (
              <div className="loading">No ammunition purchases recorded</div>
            ) : (
              ammoPurchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className={`item-card ammo-purchase-${
                    purchase.remaining_quantity <= 0 ? "depleted" : "available"
                  }`}
                >
                  <div className="item-details">
                    <div className="purchase-header">
                      <strong>{purchase.hunter_name}</strong>
                      <span className="ammo-type">{purchase.ammo_type}</span>
                    </div>
                    <div className="purchase-quantity">
                      {purchase.quantity} purchased | {purchase.used_quantity}{" "}
                      used |
                      <span
                        className={
                          purchase.remaining_quantity <= 0
                            ? "depleted"
                            : "available"
                        }
                      >
                        {purchase.remaining_quantity} remaining
                      </span>
                    </div>
                    <div className="purchase-details">
                      ${purchase.purchase_price} from {purchase.vendor}
                    </div>
                    <div className="purchase-date">
                      {new Date(purchase.purchase_date).toLocaleDateString()}
                    </div>
                    {purchase.used_quantity > purchase.quantity && (
                      <div className="overuse-warning">
                        <i className="fas fa-exclamation-triangle"></i>
                        OVERUSE DETECTED: Used{" "}
                        {purchase.used_quantity - purchase.quantity} rounds over
                        limit
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </DataSection>
        </div>

        {/* Shots Table */}
        <ShotsTable shots={shots} newShotIds={newItemIds.shots} />

        {/* Hunter Details Modal */}
        <HunterDetailsModal
          hunter={selectedHunter}
          isOpen={showHunterModal}
          onClose={handleCloseHunterModal}
          onUpdateHunter={handleUpdateHunter}
        />
      </div>
    </div>
  );
}

export default App;
