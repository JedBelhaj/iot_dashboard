import React, { useState, useEffect } from "react";
import { complianceAPI } from "../services/api";
import "./Zones.css";

const ZoneModal = ({ zone, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    center_latitude: "",
    center_longitude: "",
    radius_km: "",
    season_start: "",
    season_end: "",
    daily_start_time: "",
    daily_end_time: "",
    allowed_weekdays: "1,2,3,4,5,6,0",
    is_active: true,
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (zone) {
      setFormData({
        name: zone.name || "",
        description: zone.description || "",
        center_latitude: zone.center_latitude || "",
        center_longitude: zone.center_longitude || "",
        radius_km: zone.radius_km || "",
        season_start: zone.season_start || "",
        season_end: zone.season_end || "",
        daily_start_time: zone.daily_start_time || "",
        daily_end_time: zone.daily_end_time || "",
        allowed_weekdays: zone.allowed_weekdays || "1,2,3,4,5,6,0",
        is_active: zone.is_active !== undefined ? zone.is_active : true,
      });
      setIsEditing(true);
    } else {
      setFormData({
        name: "",
        description: "",
        center_latitude: "",
        center_longitude: "",
        radius_km: "",
        season_start: "",
        season_end: "",
        daily_start_time: "",
        daily_end_time: "",
        allowed_weekdays: "1,2,3,4,5,6,0",
        is_active: true,
      });
      setIsEditing(false);
    }
  }, [zone]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await complianceAPI.updateHuntingZone(zone.id, formData);
      } else {
        await complianceAPI.createHuntingZone(formData);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error("Failed to save zone:", error);
      alert("Failed to save hunting zone");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <i className="fas fa-map-marker-alt"></i>
            {isEditing ? "Edit Hunting Zone" : "Add New Hunting Zone"}
          </h2>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Zone Name *</label>
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
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows="3"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Center Latitude *</label>
              <input
                type="number"
                step="any"
                value={formData.center_latitude}
                onChange={(e) =>
                  setFormData({ ...formData, center_latitude: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Center Longitude *</label>
              <input
                type="number"
                step="any"
                value={formData.center_longitude}
                onChange={(e) =>
                  setFormData({ ...formData, center_longitude: e.target.value })
                }
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Radius (km) *</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={formData.radius_km}
              onChange={(e) =>
                setFormData({ ...formData, radius_km: e.target.value })
              }
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Season Start *</label>
              <input
                type="date"
                value={formData.season_start}
                onChange={(e) =>
                  setFormData({ ...formData, season_start: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Season End *</label>
              <input
                type="date"
                value={formData.season_end}
                onChange={(e) =>
                  setFormData({ ...formData, season_end: e.target.value })
                }
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Daily Start Time *</label>
              <input
                type="time"
                value={formData.daily_start_time}
                onChange={(e) =>
                  setFormData({ ...formData, daily_start_time: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Daily End Time *</label>
              <input
                type="time"
                value={formData.daily_end_time}
                onChange={(e) =>
                  setFormData({ ...formData, daily_end_time: e.target.value })
                }
                required
              />
            </div>
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
              Active Zone
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
              {isEditing ? "Update" : "Create"} Zone
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Zones = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedZone, setSelectedZone] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      setLoading(true);
      const response = await complianceAPI.getHuntingZones();
      setZones(response.data.results || response.data);
    } catch (error) {
      console.error("Failed to fetch zones:", error);
      // Mock data for demonstration
      setZones([
        {
          id: 1,
          name: "Forest Zone A",
          description: "Main hunting area with mixed forest",
          center_latitude: 45.1234,
          center_longitude: -93.5678,
          radius_km: 5.0,
          season_start: "2025-10-01",
          season_end: "2025-12-31",
          daily_start_time: "06:00",
          daily_end_time: "18:00",
          allowed_weekdays: "1,2,3,4,5,6,0",
          is_active: true,
        },
        {
          id: 2,
          name: "Prairie Zone B",
          description: "Open prairie area for waterfowl hunting",
          center_latitude: 45.2345,
          center_longitude: -93.6789,
          radius_km: 3.5,
          season_start: "2025-11-15",
          season_end: "2026-01-15",
          daily_start_time: "05:30",
          daily_end_time: "17:30",
          allowed_weekdays: "6,0",
          is_active: true,
        },
        {
          id: 3,
          name: "Mountain Zone C",
          description: "High elevation hunting area - closed for season",
          center_latitude: 45.3456,
          center_longitude: -93.789,
          radius_km: 7.2,
          season_start: "2025-09-15",
          season_end: "2025-11-30",
          daily_start_time: "07:00",
          daily_end_time: "16:00",
          allowed_weekdays: "1,2,3,4,5",
          is_active: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddZone = () => {
    setSelectedZone(null);
    setShowModal(true);
  };

  const handleEditZone = (zone) => {
    setSelectedZone(zone);
    setShowModal(true);
  };

  const handleDeleteZone = async (zone) => {
    if (window.confirm(`Are you sure you want to delete ${zone.name}?`)) {
      try {
        await complianceAPI.deleteHuntingZone(zone.id);
        fetchZones();
      } catch (error) {
        console.error("Failed to delete zone:", error);
        alert("Failed to delete hunting zone");
      }
    }
  };

  const isZoneActive = (zone) => {
    if (!zone.is_active) return false;

    const now = new Date();
    const seasonStart = new Date(zone.season_start);
    const seasonEnd = new Date(zone.season_end);

    return now >= seasonStart && now <= seasonEnd;
  };

  const formatWeekdays = (weekdaysString) => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const allowedDays = weekdaysString.split(",").map((d) => parseInt(d));
    return allowedDays.map((d) => days[d]).join(", ");
  };

  const filteredZones = zones.filter((zone) => {
    const matchesSearch =
      zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zone.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "active" && isZoneActive(zone)) ||
      (filterStatus === "inactive" && !isZoneActive(zone));

    return matchesSearch && matchesFilter;
  });

  const getZoneStats = () => {
    const total = zones.length;
    const active = zones.filter((z) => isZoneActive(z)).length;
    const inactive = total - active;
    const totalArea = zones.reduce(
      (sum, z) => sum + Math.PI * Math.pow(z.radius_km, 2),
      0
    );

    return { total, active, inactive, totalArea: totalArea.toFixed(1) };
  };

  const stats = getZoneStats();

  return (
    <div className="zones-page">
      <div className="page-header">
        <h1>
          <i className="fas fa-map-marker-alt"></i>
          Hunting Zones
        </h1>
        <p>Manage legal hunting areas and their restrictions</p>
      </div>

      <div className="zones-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-map"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Zones</div>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">Active Zones</div>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">
            <i className="fas fa-pause-circle"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.inactive}</div>
            <div className="stat-label">Inactive Zones</div>
          </div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon">
            <i className="fas fa-expand-arrows-alt"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalArea}</div>
            <div className="stat-label">Total Area (km²)</div>
          </div>
        </div>
      </div>

      <div className="page-controls">
        <div className="search-filters">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search zones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Zones</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
        <button onClick={handleAddZone} className="btn btn-primary">
          <i className="fas fa-plus"></i>
          Add Zone
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading hunting zones...</div>
      ) : (
        <div className="zones-grid">
          {filteredZones.map((zone) => (
            <div
              key={zone.id}
              className={`zone-card ${
                isZoneActive(zone) ? "active" : "inactive"
              }`}
            >
              <div className="zone-header">
                <div className="zone-info">
                  <h3>{zone.name}</h3>
                  <p className="zone-description">{zone.description}</p>
                </div>
                <div
                  className={`zone-status ${
                    isZoneActive(zone) ? "active" : "inactive"
                  }`}
                >
                  <i
                    className={`fas fa-${
                      isZoneActive(zone) ? "check-circle" : "pause-circle"
                    }`}
                  ></i>
                  {isZoneActive(zone) ? "Active" : "Inactive"}
                </div>
              </div>

              <div className="zone-details">
                <div className="detail-section">
                  <h4>Location</h4>
                  <div className="location-info">
                    <div className="coordinates">
                      <i className="fas fa-map-pin"></i>
                      <span>
                        {zone.center_latitude.toFixed(4)},{" "}
                        {zone.center_longitude.toFixed(4)}
                      </span>
                    </div>
                    <div className="radius">
                      <i className="fas fa-circle"></i>
                      <span>{zone.radius_km} km radius</span>
                    </div>
                    <div className="area">
                      <i className="fas fa-expand-arrows-alt"></i>
                      <span>
                        {(Math.PI * Math.pow(zone.radius_km, 2)).toFixed(1)} km²
                        area
                      </span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Season</h4>
                  <div className="season-info">
                    <div className="season-dates">
                      <i className="fas fa-calendar-alt"></i>
                      <span>
                        {new Date(zone.season_start).toLocaleDateString()} -{" "}
                        {new Date(zone.season_end).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Schedule</h4>
                  <div className="schedule-info">
                    <div className="daily-hours">
                      <i className="fas fa-clock"></i>
                      <span>
                        {zone.daily_start_time} - {zone.daily_end_time}
                      </span>
                    </div>
                    <div className="weekdays">
                      <i className="fas fa-calendar-week"></i>
                      <span>{formatWeekdays(zone.allowed_weekdays)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="zone-actions">
                <button
                  onClick={() => handleEditZone(zone)}
                  className="btn btn-warning btn-sm"
                >
                  <i className="fas fa-edit"></i>
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteZone(zone)}
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

      {filteredZones.length === 0 && !loading && (
        <div className="no-data">
          <i className="fas fa-map-marker-alt"></i>
          <h3>No hunting zones found</h3>
          <p>Create your first hunting zone to get started</p>
        </div>
      )}

      <ZoneModal
        zone={selectedZone}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={fetchZones}
      />
    </div>
  );
};

export default Zones;
