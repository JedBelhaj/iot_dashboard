import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Licenses.css";

function Licenses() {
  const [licenses, setLicenses] = useState([]);
  const [hunters, setHunters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLicense, setEditingLicense] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const [formData, setFormData] = useState({
    hunter: "",
    license_type: "hunting",
    license_number: "",
    issue_date: "",
    expiry_date: "",
    issuing_authority: "",
    status: "active",
    notes: "",
  });

  useEffect(() => {
    fetchLicenses();
    fetchHunters();
  }, []);

  const fetchLicenses = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockLicenses = [
        {
          id: 1,
          hunter: 1,
          hunter_name: "John Doe",
          license_type: "hunting",
          license_number: "HL-2024-001",
          issue_date: "2024-01-15",
          expiry_date: "2024-12-31",
          issuing_authority: "Department of Wildlife",
          status: "active",
          notes: "General hunting license",
          days_until_expiry: 45,
        },
        {
          id: 2,
          hunter: 2,
          hunter_name: "Jane Smith",
          license_type: "firearms",
          license_number: "FL-2024-045",
          issue_date: "2024-02-01",
          expiry_date: "2025-01-31",
          issuing_authority: "Firearms Division",
          status: "active",
          notes: "Class A firearms permit",
          days_until_expiry: 400,
        },
        {
          id: 3,
          hunter: 3,
          hunter_name: "Mike Johnson",
          license_type: "hunting",
          license_number: "HL-2023-089",
          issue_date: "2023-03-10",
          expiry_date: "2024-03-09",
          issuing_authority: "Department of Wildlife",
          status: "expired",
          notes: "Expired - renewal required",
          days_until_expiry: -20,
        },
      ];
      setLicenses(mockLicenses);
    } catch (error) {
      console.error("Error fetching licenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHunters = async () => {
    try {
      const response = await axios.get("/api/hunters/");
      setHunters(response.data);
    } catch (error) {
      console.error("Error fetching hunters:", error);
      // Mock data fallback
      setHunters([
        { id: 1, first_name: "John", last_name: "Doe" },
        { id: 2, first_name: "Jane", last_name: "Smith" },
        { id: 3, first_name: "Mike", last_name: "Johnson" },
      ]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLicense) {
        // Update existing license
        console.log("Updating license:", formData);
        const updatedLicenses = licenses.map((license) =>
          license.id === editingLicense.id
            ? {
                ...license,
                ...formData,
                hunter_name:
                  hunters.find((h) => h.id === parseInt(formData.hunter))
                    ?.first_name +
                  " " +
                  hunters.find((h) => h.id === parseInt(formData.hunter))
                    ?.last_name,
              }
            : license
        );
        setLicenses(updatedLicenses);
      } else {
        // Create new license
        const newLicense = {
          id: Date.now(),
          ...formData,
          hunter: parseInt(formData.hunter),
          hunter_name:
            hunters.find((h) => h.id === parseInt(formData.hunter))
              ?.first_name +
            " " +
            hunters.find((h) => h.id === parseInt(formData.hunter))?.last_name,
          days_until_expiry: Math.ceil(
            (new Date(formData.expiry_date) - new Date()) /
              (1000 * 60 * 60 * 24)
          ),
        };
        setLicenses([...licenses, newLicense]);
      }

      handleCloseModal();
    } catch (error) {
      console.error("Error saving license:", error);
    }
  };

  const handleEdit = (license) => {
    setEditingLicense(license);
    setFormData({
      hunter: license.hunter?.toString() || "",
      license_type: license.license_type,
      license_number: license.license_number,
      issue_date: license.issue_date,
      expiry_date: license.expiry_date,
      issuing_authority: license.issuing_authority,
      status: license.status,
      notes: license.notes || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this license?")) {
      try {
        setLicenses(licenses.filter((license) => license.id !== id));
      } catch (error) {
        console.error("Error deleting license:", error);
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingLicense(null);
    setFormData({
      hunter: "",
      license_type: "hunting",
      license_number: "",
      issue_date: "",
      expiry_date: "",
      issuing_authority: "",
      status: "active",
      notes: "",
    });
  };

  const getLicenseStatus = (license) => {
    if (license.status === "expired")
      return { text: "Expired", class: "expired" };
    if (license.days_until_expiry <= 30)
      return { text: "Expiring Soon", class: "warning" };
    return { text: "Active", class: "active" };
  };

  const filteredLicenses = licenses.filter((license) => {
    const matchesSearch =
      license.hunter_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.license_number
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      license.issuing_authority
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && license.status === "active") ||
      (statusFilter === "expired" && license.status === "expired") ||
      (statusFilter === "expiring" &&
        license.days_until_expiry <= 30 &&
        license.status === "active");

    const matchesType =
      typeFilter === "all" || license.license_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate statistics
  const totalLicenses = licenses.length;
  const activeLicenses = licenses.filter((l) => l.status === "active").length;
  const expiredLicenses = licenses.filter((l) => l.status === "expired").length;
  const expiringLicenses = licenses.filter(
    (l) => l.days_until_expiry <= 30 && l.status === "active"
  ).length;

  if (loading) {
    return (
      <div className="licenses-page">
        <div className="loading-spinner">
          <span>Loading licenses...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="licenses-page">
      <div className="page-header">
        <h1>
          <i className="fas fa-certificate"></i>
          Licenses Management
        </h1>
        <p>Track and manage hunting and firearm licenses</p>
      </div>

      {/* Statistics */}
      <div className="licenses-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-certificate"></i>
          </div>
          <div>
            <div className="stat-value">{totalLicenses}</div>
            <div className="stat-label">Total Licenses</div>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div>
            <div className="stat-value">{activeLicenses}</div>
            <div className="stat-label">Active</div>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <div>
            <div className="stat-value">{expiringLicenses}</div>
            <div className="stat-label">Expiring Soon</div>
          </div>
        </div>
        <div className="stat-card danger">
          <div className="stat-icon">
            <i className="fas fa-times-circle"></i>
          </div>
          <div>
            <div className="stat-value">{expiredLicenses}</div>
            <div className="stat-label">Expired</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="page-controls">
        <div className="search-filters">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search licenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expiring">Expiring Soon</option>
            <option value="expired">Expired</option>
          </select>
          <select
            className="filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="hunting">Hunting License</option>
            <option value="firearms">Firearms Permit</option>
            <option value="guide">Guide License</option>
            <option value="special">Special Permit</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <i className="fas fa-plus"></i>
          Add License
        </button>
      </div>

      {/* Licenses Table */}
      <div className="licenses-table-container">
        {filteredLicenses.length === 0 ? (
          <div className="no-data">
            <i className="fas fa-certificate"></i>
            <h3>No Licenses Found</h3>
            <p>No licenses match your current filters</p>
          </div>
        ) : (
          <table className="licenses-table">
            <thead>
              <tr>
                <th>License #</th>
                <th>Hunter</th>
                <th>Type</th>
                <th>Issue Date</th>
                <th>Expiry Date</th>
                <th>Authority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLicenses.map((license) => {
                const status = getLicenseStatus(license);
                return (
                  <tr key={license.id}>
                    <td>
                      <span className="license-number">
                        {license.license_number}
                      </span>
                    </td>
                    <td>
                      <div className="hunter-info">
                        <i className="fas fa-user"></i>
                        {license.hunter_name}
                      </div>
                    </td>
                    <td>
                      <span className={`license-type ${license.license_type}`}>
                        {license.license_type === "hunting" && (
                          <i className="fas fa-crosshairs"></i>
                        )}
                        {license.license_type === "firearms" && (
                          <i className="fas fa-gun"></i>
                        )}
                        {license.license_type === "guide" && (
                          <i className="fas fa-map-marked-alt"></i>
                        )}
                        {license.license_type === "special" && (
                          <i className="fas fa-star"></i>
                        )}
                        {license.license_type.charAt(0).toUpperCase() +
                          license.license_type.slice(1)}
                      </span>
                    </td>
                    <td>{new Date(license.issue_date).toLocaleDateString()}</td>
                    <td>
                      <div className="expiry-info">
                        {new Date(license.expiry_date).toLocaleDateString()}
                        {license.status === "active" && (
                          <div className="days-remaining">
                            {license.days_until_expiry > 0
                              ? `${license.days_until_expiry} days left`
                              : `${Math.abs(
                                  license.days_until_expiry
                                )} days overdue`}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="authority">
                        {license.issuing_authority}
                      </span>
                    </td>
                    <td>
                      <span className={`license-status ${status.class}`}>
                        {status.class === "active" && (
                          <i className="fas fa-check-circle"></i>
                        )}
                        {status.class === "warning" && (
                          <i className="fas fa-exclamation-triangle"></i>
                        )}
                        {status.class === "expired" && (
                          <i className="fas fa-times-circle"></i>
                        )}
                        {status.text}
                      </span>
                    </td>
                    <td>
                      <div className="license-actions">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleEdit(license)}
                          title="Edit License"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(license.id)}
                          title="Delete License"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* License Modal */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && handleCloseModal()}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h2>
                <i className="fas fa-certificate"></i>
                {editingLicense ? "Edit License" : "Add New License"}
              </h2>
              <button className="close-btn" onClick={handleCloseModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-row">
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
                        {hunter.first_name} {hunter.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>License Type *</label>
                  <select
                    value={formData.license_type}
                    onChange={(e) =>
                      setFormData({ ...formData, license_type: e.target.value })
                    }
                    required
                  >
                    <option value="hunting">Hunting License</option>
                    <option value="firearms">Firearms Permit</option>
                    <option value="guide">Guide License</option>
                    <option value="special">Special Permit</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>License Number *</label>
                <input
                  type="text"
                  value={formData.license_number}
                  onChange={(e) =>
                    setFormData({ ...formData, license_number: e.target.value })
                  }
                  placeholder="Enter license number"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Issue Date *</label>
                  <input
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) =>
                      setFormData({ ...formData, issue_date: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Expiry Date *</label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) =>
                      setFormData({ ...formData, expiry_date: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Issuing Authority *</label>
                  <input
                    type="text"
                    value={formData.issuing_authority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        issuing_authority: e.target.value,
                      })
                    }
                    placeholder="Department of Wildlife"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Additional notes about this license..."
                  rows="3"
                ></textarea>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <i className="fas fa-save"></i>
                  {editingLicense ? "Update License" : "Add License"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Licenses;
