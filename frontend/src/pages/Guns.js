import React, { useState, useEffect } from "react";
import { gunsAPI } from "../services/api";
import "./Guns.css";

const Guns = () => {
  const [guns, setGuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchGuns();
  }, []);

  const fetchGuns = async () => {
    try {
      setLoading(true);
      const response = await gunsAPI.getAll();
      setGuns(response.data.results || response.data);
    } catch (error) {
      console.error("Failed to fetch guns:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGuns = guns.filter((gun) => {
    const matchesSearch =
      gun.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gun.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gun.device_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || gun.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="guns-page">
      <div className="page-header">
        <h1>
          <i className="fas fa-crosshairs"></i>
          Guns Management
        </h1>
        <p>Manage IoT gun devices and their status</p>
      </div>

      <div className="page-controls">
        <div className="search-filters">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search guns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Guns</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
        <button className="btn btn-primary">
          <i className="fas fa-plus"></i>
          Add Gun
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          Loading guns...
        </div>
      ) : (
        <div className="guns-grid">
          {filteredGuns.map((gun) => (
            <div key={gun.id} className="gun-card">
              <div className="gun-header">
                <div className="gun-info">
                  <h3>
                    {gun.make} {gun.model}
                  </h3>
                  <div className="gun-id">Device ID: {gun.device_id}</div>
                </div>
                <div className={`gun-status ${gun.status}`}>{gun.status}</div>
              </div>

              <div className="gun-details">
                <div className="detail-item">
                  <i className="fas fa-user"></i>
                  <span>{gun.owner_name || "Unknown Owner"}</span>
                </div>
                <div className="detail-item">
                  <i className="fas fa-hashtag"></i>
                  <span>{gun.serial_number}</span>
                </div>
                <div className="detail-item">
                  <i className="fas fa-cog"></i>
                  <span>{gun.weapon_type}</span>
                </div>
                <div className="detail-item">
                  <i className="fas fa-battery-three-quarters"></i>
                  <span>{gun.battery_level}%</span>
                  {gun.battery_level < 20 && (
                    <i className="fas fa-exclamation-triangle low-battery"></i>
                  )}
                </div>
              </div>

              <div className="gun-actions">
                <button className="btn btn-info btn-sm">
                  <i className="fas fa-eye"></i>
                  Details
                </button>
                <button className="btn btn-warning btn-sm">
                  <i className="fas fa-edit"></i>
                  Edit
                </button>
                <button className="btn btn-danger btn-sm">
                  <i className="fas fa-trash"></i>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredGuns.length === 0 && !loading && (
        <div className="no-data">
          <i className="fas fa-crosshairs"></i>
          <h3>No guns found</h3>
          <p>Try adjusting your search or filters, or add a new gun</p>
        </div>
      )}
    </div>
  );
};

export default Guns;
