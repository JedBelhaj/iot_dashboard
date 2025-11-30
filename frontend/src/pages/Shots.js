import React, { useState, useEffect } from "react";
import { shotsAPI, huntersAPI } from "../services/api";
import "./Shots.css";

const ShotModal = ({ shot, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    hunter: "",
    latitude: "",
    longitude: "",
    weapon_used: "",
    location: "",
  });
  const [hunters, setHunters] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchHunters();
    }
    if (shot) {
      setFormData({
        hunter: shot.hunter || "",
        latitude: shot.latitude || "",
        longitude: shot.longitude || "",
        weapon_used: shot.weapon_used || "",
        location: shot.location || "",
      });
      setIsEditing(true);
    } else {
      setFormData({
        hunter: "",
        latitude: "",
        longitude: "",
        weapon_used: "",
        location: "",
      });
      setIsEditing(false);
    }
  }, [shot, isOpen]);

  const fetchHunters = async () => {
    try {
      const response = await huntersAPI.getAll();
      setHunters(response.data.results || response.data);
    } catch (error) {
      console.error("Failed to fetch hunters:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await shotsAPI.update(shot.id, formData);
      } else {
        await shotsAPI.create(formData);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error("Failed to save shot:", error);
      alert("Failed to save shot");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <i className="fas fa-bullseye"></i>
            {isEditing ? "Edit Shot" : "Record New Shot"}
          </h2>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Hunter *</label>
            <select
              value={formData.hunter}
              onChange={(e) =>
                setFormData({ ...formData, hunter: e.target.value })
              }
              required
            >
              <option value="">Select Hunter</option>
              {hunters.map((hunter) => (
                <option key={hunter.id} value={hunter.id}>
                  {hunter.name} (#{hunter.license_number})
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Latitude</label>
              <input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) =>
                  setFormData({ ...formData, latitude: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label>Longitude</label>
              <input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) =>
                  setFormData({ ...formData, longitude: e.target.value })
                }
              />
            </div>
          </div>
          <div className="form-group">
            <label>Weapon Used</label>
            <input
              type="text"
              value={formData.weapon_used}
              onChange={(e) =>
                setFormData({ ...formData, weapon_used: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label>Location Description</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
            />
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
              {isEditing ? "Update" : "Record"} Shot
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Shots = () => {
  const [shots, setShots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedShot, setSelectedShot] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchShots();
  }, []);

  const fetchShots = async () => {
    try {
      setLoading(true);
      const response = await shotsAPI.getAll();
      setShots(response.data.results || response.data);
    } catch (error) {
      console.error("Failed to fetch shots:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddShot = () => {
    setSelectedShot(null);
    setShowModal(true);
  };

  const handleEditShot = (shot) => {
    setSelectedShot(shot);
    setShowModal(true);
  };

  const handleDeleteShot = async (shot) => {
    if (window.confirm("Are you sure you want to delete this shot record?")) {
      try {
        await shotsAPI.delete(shot.id);
        fetchShots();
      } catch (error) {
        console.error("Failed to delete shot:", error);
        alert("Failed to delete shot");
      }
    }
  };

  const filteredShots = shots.filter(
    (shot) =>
      shot.hunter_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shot.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shot.weapon_used?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="shots-page">
      <div className="page-header">
        <h1>
          <i className="fas fa-bullseye"></i>
          Shots Management
        </h1>
        <p>Track and manage all recorded shots</p>
      </div>

      <div className="page-controls">
        <div className="search-filters">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search shots..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <button onClick={handleAddShot} className="btn btn-primary">
          <i className="fas fa-plus"></i>
          Record Shot
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading shots...</div>
      ) : (
        <div className="shots-table-container">
          <table className="shots-table">
            <thead>
              <tr>
                <th>Hunter</th>
                <th>Date & Time</th>
                <th>Location</th>
                <th>Coordinates</th>
                <th>Weapon</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredShots.map((shot) => (
                <tr key={shot.id}>
                  <td>
                    <div className="hunter-info">
                      <strong>{shot.hunter_name || "Unknown"}</strong>
                    </div>
                  </td>
                  <td>
                    <div className="date-info">
                      {new Date(shot.timestamp).toLocaleString()}
                    </div>
                  </td>
                  <td>
                    <div className="location-info">
                      {shot.location || "Unknown"}
                    </div>
                  </td>
                  <td>
                    <div className="coordinates">
                      {shot.latitude && shot.longitude ? (
                        <span>
                          {parseFloat(shot.latitude).toFixed(4)},<br />
                          {parseFloat(shot.longitude).toFixed(4)}
                        </span>
                      ) : (
                        <span className="no-data">No coordinates</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="weapon-info">
                      {shot.weapon_used || "Unknown"}
                    </div>
                  </td>
                  <td>
                    <div className="actions">
                      <button
                        onClick={() => handleEditShot(shot)}
                        className="btn btn-warning btn-sm"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={() => handleDeleteShot(shot)}
                        className="btn btn-danger btn-sm"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredShots.length === 0 && !loading && (
            <div className="no-data">
              <i className="fas fa-bullseye"></i>
              <h3>No shots recorded</h3>
              <p>Start tracking shots by recording the first one</p>
            </div>
          )}
        </div>
      )}

      <ShotModal
        shot={selectedShot}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={fetchShots}
      />
    </div>
  );
};

export default Shots;
