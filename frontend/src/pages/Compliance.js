import React, { useState, useEffect } from "react";
import { complianceAPI } from "../services/api";
import "./Compliance.css";

const ViolationModal = ({ violation, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    resolved: false,
    notes: "",
  });

  useEffect(() => {
    if (violation) {
      setFormData({
        resolved: violation.resolved || false,
        notes: violation.notes || "",
      });
    }
  }, [violation]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        ...formData,
        resolved_at: formData.resolved ? new Date().toISOString() : null,
      };
      await complianceAPI.updateViolation(violation.id, updateData);
      onSave();
      onClose();
    } catch (error) {
      console.error("Failed to update violation:", error);
      alert("Failed to update violation");
    }
  };

  if (!isOpen || !violation) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <i className="fas fa-shield-alt"></i>
            Update Violation Status
          </h2>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="violation-details">
          <h3>{violation.violation_type_display}</h3>
          <p>
            <strong>Hunter:</strong> {violation.hunter_name}
          </p>
          <p>
            <strong>Severity:</strong>{" "}
            <span className={`severity ${violation.severity?.toLowerCase()}`}>
              {violation.severity}
            </span>
          </p>
          <p>
            <strong>Detected:</strong>{" "}
            {new Date(violation.detected_at).toLocaleString()}
          </p>
          <p>
            <strong>Description:</strong> {violation.description}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.resolved}
                onChange={(e) =>
                  setFormData({ ...formData, resolved: e.target.checked })
                }
              />
              Mark as Resolved
            </label>
          </div>
          <div className="form-group">
            <label>Resolution Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows="4"
              placeholder="Add notes about the resolution..."
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
              Update Violation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Compliance = () => {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchComplianceData();
  }, []);

  const fetchComplianceData = async () => {
    try {
      setLoading(true);
      const violationsRes = await complianceAPI.getViolations();
      setViolations(violationsRes.data.results || violationsRes.data);
    } catch (error) {
      console.error("Failed to fetch compliance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateViolation = (violation) => {
    setSelectedViolation(violation);
    setShowModal(true);
  };

  const handleDeleteViolation = async (violation) => {
    if (window.confirm("Are you sure you want to delete this violation?")) {
      try {
        await complianceAPI.deleteViolation(violation.id);
        fetchComplianceData();
      } catch (error) {
        console.error("Failed to delete violation:", error);
        alert("Failed to delete violation");
      }
    }
  };

  const filteredViolations = violations.filter((violation) => {
    const matchesSearch =
      violation.hunter_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      violation.violation_type_display
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      violation.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity =
      filterSeverity === "all" || violation.severity === filterSeverity;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "resolved" && violation.resolved) ||
      (filterStatus === "unresolved" && !violation.resolved);

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const getViolationStats = () => {
    const total = violations.length;
    const resolved = violations.filter((v) => v.resolved).length;
    const unresolved = total - resolved;
    const critical = violations.filter((v) => v.severity === "CRITICAL").length;
    const high = violations.filter((v) => v.severity === "HIGH").length;

    return { total, resolved, unresolved, critical, high };
  };

  const violationStats = getViolationStats();

  return (
    <div className="compliance-page">
      <div className="page-header">
        <h1>
          <i className="fas fa-shield-alt"></i>
          Compliance Management
        </h1>
        <p>Monitor and manage hunting compliance violations</p>
      </div>

      <div className="compliance-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-list"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{violationStats.total}</div>
            <div className="stat-label">Total Violations</div>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{violationStats.unresolved}</div>
            <div className="stat-label">Unresolved</div>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{violationStats.resolved}</div>
            <div className="stat-label">Resolved</div>
          </div>
        </div>
        <div className="stat-card danger">
          <div className="stat-icon">
            <i className="fas fa-exclamation"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {violationStats.critical + violationStats.high}
            </div>
            <div className="stat-label">Critical/High</div>
          </div>
        </div>
      </div>

      <div className="page-controls">
        <div className="search-filters">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search violations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Severities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="resolved">Resolved</option>
            <option value="unresolved">Unresolved</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading compliance data...</div>
      ) : (
        <div className="violations-list">
          {filteredViolations.map((violation) => (
            <div
              key={violation.id}
              className={`violation-card ${violation.severity?.toLowerCase()} ${
                violation.resolved ? "resolved" : "unresolved"
              }`}
            >
              <div className="violation-header">
                <div className="violation-info">
                  <h3>{violation.violation_type_display}</h3>
                  <div className="hunter-info">
                    <i className="fas fa-user"></i>
                    <span>{violation.hunter_name}</span>
                  </div>
                </div>
                <div className="violation-badges">
                  <span
                    className={`severity-badge ${violation.severity?.toLowerCase()}`}
                  >
                    {violation.severity}
                  </span>
                  <span
                    className={`status-badge ${
                      violation.resolved ? "resolved" : "unresolved"
                    }`}
                  >
                    {violation.resolved ? "Resolved" : "Unresolved"}
                  </span>
                </div>
              </div>

              <div className="violation-content">
                <p className="description">{violation.description}</p>

                <div className="violation-details">
                  <div className="detail-item">
                    <i className="fas fa-calendar"></i>
                    <span>
                      {new Date(violation.detected_at).toLocaleString()}
                    </span>
                  </div>
                  {violation.resolved_at && (
                    <div className="detail-item">
                      <i className="fas fa-check"></i>
                      <span>
                        Resolved:{" "}
                        {new Date(violation.resolved_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {violation.notes && (
                  <div className="violation-notes">
                    <strong>Notes:</strong> {violation.notes}
                  </div>
                )}
              </div>

              <div className="violation-actions">
                <button
                  onClick={() => handleUpdateViolation(violation)}
                  className="btn btn-primary btn-sm"
                >
                  <i className="fas fa-edit"></i>
                  Update
                </button>
                <button
                  onClick={() => handleDeleteViolation(violation)}
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

      {filteredViolations.length === 0 && !loading && (
        <div className="no-data">
          <i className="fas fa-shield-alt"></i>
          <h3>No violations found</h3>
          <p>Great! No compliance violations match your current filters.</p>
        </div>
      )}

      <ViolationModal
        violation={selectedViolation}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={fetchComplianceData}
      />
    </div>
  );
};

export default Compliance;
