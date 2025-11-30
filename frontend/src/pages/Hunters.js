import React, { useState, useEffect } from "react";
import { huntersAPI, complianceAPI } from "../services/api";
import "./Hunters.css";

const HunterModal = ({ hunter, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    license_number: "",
    current_location: "",
    is_active: true,
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (hunter) {
      setFormData({
        name: hunter.name || "",
        email: hunter.email || "",
        phone: hunter.phone || "",
        license_number: hunter.license_number || "",
        current_location: hunter.current_location || "",
        is_active: hunter.is_active || true,
      });
      setIsEditing(true);
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        license_number: "",
        current_location: "",
        is_active: true,
      });
      setIsEditing(false);
    }
  }, [hunter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await huntersAPI.update(hunter.id, formData);
      } else {
        await huntersAPI.create(formData);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error("Failed to save hunter:", error);
      alert("Failed to save hunter");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <i className="fas fa-user"></i>
            {isEditing ? "Edit Hunter" : "Add New Hunter"}
          </h2>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label>License Number *</label>
              <input
                type="text"
                value={formData.license_number}
                onChange={(e) =>
                  setFormData({ ...formData, license_number: e.target.value })
                }
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Current Location</label>
            <input
              type="text"
              value={formData.current_location}
              onChange={(e) =>
                setFormData({ ...formData, current_location: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
              />
              Active Hunter
            </label>
          </div>
          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditing ? "Update" : "Create"} Hunter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const HunterDetailsModal = ({ hunter, isOpen, onClose, onUpdate }) => {
  const [hunterShots, setHunterShots] = useState([]);
  const [hunterGuns, setHunterGuns] = useState([]);
  const [hunterPurchases, setHunterPurchases] = useState([]);
  const [hunterViolations, setHunterViolations] = useState([]);
  const [hunterLicense, setHunterLicense] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hunter && isOpen) {
      fetchHunterDetails();
    }
  }, [hunter, isOpen]);

  const fetchHunterDetails = async () => {
    if (!hunter) return;

    console.log("Fetching details for hunter:", hunter.id, hunter.name);
    setLoading(true);
    try {
      const [shotsRes, gunsRes, purchasesRes, violationsRes, licensesRes] =
        await Promise.all([
          huntersAPI.getShots(hunter.id),
          huntersAPI.getGuns(hunter.id),
          complianceAPI.getAmmunitionPurchases(hunter.id),
          complianceAPI.getViolations(hunter.id),
          complianceAPI.getLicenses(hunter.id),
        ]);

      console.log("API responses:", {
        shots: shotsRes.data,
        guns: gunsRes.data,
        purchases: purchasesRes.data,
        violations: violationsRes.data,
        licenses: licensesRes.data,
      });

      const shots = (shotsRes.data.results || shotsRes.data || []).slice(0, 10);
      const guns = gunsRes.data.results || gunsRes.data || [];
      const purchases = purchasesRes.data.results || purchasesRes.data || [];
      const violations = violationsRes.data.results || violationsRes.data || [];
      const licenses = licensesRes.data.results || licensesRes.data || [];
      const license = licenses[0] || null;

      console.log("Processed data:", {
        shots,
        guns,
        purchases,
        violations,
        license,
      });

      setHunterShots(shots);
      setHunterGuns(guns);
      setHunterPurchases(purchases);
      setHunterViolations(violations);
      setHunterLicense(license);
    } catch (error) {
      console.error("Failed to fetch hunter details:", error);
      // Set empty arrays on error so UI doesn't break
      setHunterShots([]);
      setHunterGuns([]);
      setHunterPurchases([]);
      setHunterViolations([]);
      setHunterLicense(null);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !hunter) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content hunter-details-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>
            <i className="fas fa-user-circle"></i>
            {hunter.name} - Details
          </h2>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {loading ? (
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
            Loading hunter details...
          </div>
        ) : (
          <div className="modal-body">
            {/* Debug Info */}
            <div
              style={{
                background: "#f0f0f0",
                padding: "10px",
                margin: "10px 0",
                fontSize: "12px",
              }}
            >
              Debug: Shots({hunterShots.length}), Guns({hunterGuns.length}),
              Purchases({hunterPurchases.length}), Violations(
              {hunterViolations.length}), License({hunterLicense ? "Yes" : "No"}
              )
            </div>

            {/* Statistics Overview */}
            <div className="hunter-stats">
              <div className="stat-item">
                <i className="fas fa-crosshairs"></i>
                <div>
                  <div className="stat-label">Total Shots</div>
                  <div className="stat-value">{hunterShots.length}</div>
                </div>
              </div>
              <div className="stat-item">
                <i className="fas fa-gun"></i>
                <div>
                  <div className="stat-label">Registered Guns</div>
                  <div className="stat-value">{hunterGuns.length}</div>
                </div>
              </div>
              <div className="stat-item">
                <i className="fas fa-bullets"></i>
                <div>
                  <div className="stat-label">Ammo Purchases</div>
                  <div className="stat-value">{hunterPurchases.length}</div>
                </div>
              </div>
              <div className="stat-item">
                <i className="fas fa-exclamation-triangle"></i>
                <div>
                  <div className="stat-label">Violations</div>
                  <div
                    className={`stat-value ${
                      hunterViolations.length > 0 ? "violations" : ""
                    }`}
                  >
                    {hunterViolations.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="hunter-info-sections">
              <div className="info-section">
                <h3>
                  <i className="fas fa-user"></i> Personal Information
                </h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Full Name:</label>
                    <span>{hunter.name}</span>
                  </div>
                  <div className="info-item">
                    <label>License Number:</label>
                    <span>{hunter.license_number || "Not provided"}</span>
                  </div>
                  <div className="info-item">
                    <label>Status:</label>
                    <span
                      className={`status-badge ${
                        hunter.is_active ? "active" : "inactive"
                      }`}
                    >
                      {hunter.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Current Location:</label>
                    <span>{hunter.current_location || "Unknown"}</span>
                  </div>
                  <div className="info-item">
                    <label>Registration Date:</label>
                    <span>
                      {hunter.registered_date
                        ? new Date(hunter.registered_date).toLocaleDateString()
                        : "Unknown"}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Last Active:</label>
                    <span>
                      {hunter.last_active
                        ? new Date(hunter.last_active).toLocaleDateString()
                        : "Unknown"}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>GPS Coordinates:</label>
                    <span>
                      {hunter.latitude && hunter.longitude
                        ? `${hunter.latitude.toFixed(
                            4
                          )}, ${hunter.longitude.toFixed(4)}`
                        : "Not available"}
                    </span>
                  </div>
                </div>
              </div>

              {/* License Information */}
              {hunterLicense && (
                <div className="info-section">
                  <h3>
                    <i className="fas fa-certificate"></i> License Information
                  </h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>License Number:</label>
                      <span>{hunterLicense.license_number}</span>
                    </div>
                    <div className="info-item">
                      <label>License Type:</label>
                      <span className="license-type">
                        {hunterLicense.license_type}
                      </span>
                    </div>
                    <div className="info-item">
                      <label>Issue Date:</label>
                      <span>
                        {new Date(
                          hunterLicense.issue_date
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="info-item">
                      <label>Expiry Date:</label>
                      <span
                        className={
                          new Date(hunterLicense.expiry_date) < new Date()
                            ? "expired"
                            : ""
                        }
                      >
                        {new Date(
                          hunterLicense.expiry_date
                        ).toLocaleDateString()}
                        {new Date(hunterLicense.expiry_date) < new Date() && (
                          <i
                            className="fas fa-exclamation-triangle expired-icon"
                            title="License Expired"
                          ></i>
                        )}
                      </span>
                    </div>
                    <div className="info-item">
                      <label>Issuing Authority:</label>
                      <span>{hunterLicense.issuing_authority}</span>
                    </div>
                    <div className="info-item">
                      <label>Status:</label>
                      <span
                        className={`license-status ${hunterLicense.status}`}
                      >
                        {hunterLicense.status}
                      </span>
                    </div>
                  </div>
                  {hunterLicense.notes && (
                    <div className="license-notes">
                      <label>Notes:</label>
                      <p>{hunterLicense.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Registered Guns */}
              <div className="info-section">
                <h3>
                  <i className="fas fa-gun"></i> Registered Guns (
                  {hunterGuns.length})
                </h3>
                {hunterGuns.length === 0 ? (
                  <div className="no-data">No guns registered</div>
                ) : (
                  <div className="guns-list">
                    {hunterGuns.map((gun) => (
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
                          <div>Device ID: {gun.device_id}</div>
                          <div>Battery: {gun.battery_level}%</div>
                          <div>Caliber: {gun.caliber}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Shots */}
              <div className="info-section">
                <h3>
                  <i className="fas fa-bullseye"></i> Recent Shots (Last 10)
                </h3>
                {hunterShots.length === 0 ? (
                  <div className="no-data">No shots recorded</div>
                ) : (
                  <div className="shots-list">
                    {hunterShots.map((shot) => (
                      <div key={shot.id} className="shot-item">
                        <div className="shot-header">
                          <span className="shot-time">
                            {new Date(shot.timestamp).toLocaleString()}
                          </span>
                          <span className="shot-accuracy">
                            {shot.accuracy
                              ? `${shot.accuracy}% accuracy`
                              : "Accuracy unknown"}
                          </span>
                        </div>
                        <div className="shot-details">
                          <div>
                            Location: {shot.latitude?.toFixed(4)},{" "}
                            {shot.longitude?.toFixed(4)}
                          </div>
                          <div>Weapon: {shot.weapon_used}</div>
                          {shot.target_type && (
                            <div>Target: {shot.target_type}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ammunition Purchases */}
              <div className="info-section">
                <h3>
                  <i className="fas fa-shopping-cart"></i> Ammunition Purchases
                  ({hunterPurchases.length})
                </h3>
                {hunterPurchases.length === 0 ? (
                  <div className="no-data">
                    No ammunition purchases recorded
                  </div>
                ) : (
                  <div className="purchases-list">
                    {hunterPurchases.slice(0, 5).map((purchase) => (
                      <div key={purchase.id} className="purchase-item">
                        <div className="purchase-header">
                          <span className="purchase-date">
                            {new Date(
                              purchase.purchase_date
                            ).toLocaleDateString()}
                          </span>
                          <span className="purchase-amount">
                            {purchase.quantity} rounds
                          </span>
                        </div>
                        <div className="purchase-details">
                          <div>Type: {purchase.ammunition_type}</div>
                          <div>Caliber: {purchase.caliber}</div>
                          <div>Vendor: {purchase.vendor}</div>
                        </div>
                      </div>
                    ))}
                    {hunterPurchases.length > 5 && (
                      <div className="more-items">
                        +{hunterPurchases.length - 5} more purchases
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Violations */}
              {hunterViolations.length > 0 && (
                <div className="info-section">
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
                            {new Date(
                              violation.detected_at
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="violation-type">
                          {violation.violation_type_display}
                        </div>
                        <div className="violation-description">
                          {violation.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Hunters = () => {
  const [hunters, setHunters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedHunter, setSelectedHunter] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchHunters();
  }, []);

  const fetchHunters = async () => {
    try {
      setLoading(true);
      const response = await huntersAPI.getAll();
      setHunters(response.data.results || response.data);
    } catch (error) {
      console.error("Failed to fetch hunters:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHunter = () => {
    setSelectedHunter(null);
    setShowModal(true);
  };

  const handleEditHunter = (hunter) => {
    setSelectedHunter(hunter);
    setShowModal(true);
  };

  const handleViewDetails = (hunter) => {
    setSelectedHunter(hunter);
    setShowDetailsModal(true);
  };

  const handleDeleteHunter = async (hunter) => {
    if (window.confirm(`Are you sure you want to delete ${hunter.name}?`)) {
      try {
        await huntersAPI.delete(hunter.id);
        fetchHunters();
      } catch (error) {
        console.error("Failed to delete hunter:", error);
        alert("Failed to delete hunter");
      }
    }
  };

  const filteredHunters = hunters.filter((hunter) => {
    const matchesSearch =
      hunter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hunter.license_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "active" && hunter.is_active) ||
      (filterStatus === "inactive" && !hunter.is_active);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="hunters-page">
      <div className="page-header">
        <h1>
          <i className="fas fa-users"></i>
          Hunters Management
        </h1>
        <p>Manage registered hunters and their information</p>
      </div>

      <div className="page-controls">
        <div className="search-filters">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search hunters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Hunters</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
        <button onClick={handleAddHunter} className="btn btn-primary">
          <i className="fas fa-plus"></i>
          Add Hunter
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          Loading hunters...
        </div>
      ) : (
        <div className="hunters-grid">
          {filteredHunters.map((hunter) => (
            <div key={hunter.id} className="hunter-card">
              <div className="hunter-header">
                <div className="hunter-info">
                  <h3>{hunter.name}</h3>
                  <div className="hunter-license">#{hunter.license_number}</div>
                </div>
                <div
                  className={`hunter-status ${
                    hunter.is_active ? "active" : "inactive"
                  }`}
                >
                  {hunter.is_active ? "Active" : "Inactive"}
                </div>
              </div>

              <div className="hunter-details">
                <div className="detail-item">
                  <i className="fas fa-envelope"></i>
                  <span>{hunter.email || "No email"}</span>
                </div>
                <div className="detail-item">
                  <i className="fas fa-phone"></i>
                  <span>{hunter.phone || "No phone"}</span>
                </div>
                <div className="detail-item">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>{hunter.current_location || "Unknown location"}</span>
                </div>
                <div className="detail-item">
                  <i className="fas fa-crosshairs"></i>
                  <span>{hunter.total_shots || 0} shots</span>
                </div>
              </div>

              <div className="hunter-actions">
                <button
                  onClick={() => handleViewDetails(hunter)}
                  className="btn btn-info btn-sm"
                >
                  <i className="fas fa-eye"></i>
                  Details
                </button>
                <button
                  onClick={() => handleEditHunter(hunter)}
                  className="btn btn-warning btn-sm"
                >
                  <i className="fas fa-edit"></i>
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteHunter(hunter)}
                  className="btn btn-danger btn-sm"
                >
                  <i className="fas fa-trash"></i>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredHunters.length === 0 && !loading && (
        <div className="no-data">
          <i className="fas fa-users"></i>
          <h3>No hunters found</h3>
          <p>Try adjusting your search or filters, or add a new hunter</p>
        </div>
      )}

      <HunterModal
        hunter={selectedHunter}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={fetchHunters}
      />

      <HunterDetailsModal
        hunter={selectedHunter}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onUpdate={fetchHunters}
      />
    </div>
  );
};

export default Hunters;
