import React, { useState, useEffect } from "react";
import { ammunitionAPI } from "../services/api";
import "./Ammunition.css";

const AmmunitionModal = ({ ammunition, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    ammo_type: "",
    caliber: "",
    brand: "",
    quantity: "",
    purchase_date: "",
    cost_per_round: "",
    supplier: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (ammunition) {
      setFormData({
        ammo_type: ammunition.ammo_type || "",
        caliber: ammunition.caliber || "",
        brand: ammunition.brand || "",
        quantity: ammunition.quantity || "",
        purchase_date: ammunition.purchase_date
          ? ammunition.purchase_date.split("T")[0]
          : "",
        cost_per_round: ammunition.cost_per_round || "",
        supplier: ammunition.supplier || "",
      });
      setIsEditing(true);
    } else {
      setFormData({
        ammo_type: "",
        caliber: "",
        brand: "",
        quantity: "",
        purchase_date: new Date().toISOString().split("T")[0],
        cost_per_round: "",
        supplier: "",
      });
      setIsEditing(false);
    }
  }, [ammunition]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await ammunitionAPI.update(ammunition.id, formData);
      } else {
        await ammunitionAPI.create(formData);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error("Failed to save ammunition:", error);
      alert("Failed to save ammunition");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <i className="fas fa-boxes"></i>
            {isEditing ? "Edit Ammunition" : "Add New Ammunition"}
          </h2>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label>Ammunition Type *</label>
              <select
                value={formData.ammo_type}
                onChange={(e) =>
                  setFormData({ ...formData, ammo_type: e.target.value })
                }
                required
              >
                <option value="">Select Type</option>
                <option value="Rifle">Rifle</option>
                <option value="Pistol">Pistol</option>
                <option value="Shotgun">Shotgun</option>
                <option value="Rimfire">Rimfire</option>
              </select>
            </div>
            <div className="form-group">
              <label>Caliber *</label>
              <input
                type="text"
                value={formData.caliber}
                onChange={(e) =>
                  setFormData({ ...formData, caliber: e.target.value })
                }
                placeholder="e.g., .308 Win, 9mm, 12 Gauge"
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Brand</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) =>
                  setFormData({ ...formData, brand: e.target.value })
                }
                placeholder="e.g., Federal, Winchester, Remington"
              />
            </div>
            <div className="form-group">
              <label>Quantity *</label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Purchase Date</label>
              <input
                type="date"
                value={formData.purchase_date}
                onChange={(e) =>
                  setFormData({ ...formData, purchase_date: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label>Cost per Round ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.cost_per_round}
                onChange={(e) =>
                  setFormData({ ...formData, cost_per_round: e.target.value })
                }
              />
            </div>
          </div>
          <div className="form-group">
            <label>Supplier</label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) =>
                setFormData({ ...formData, supplier: e.target.value })
              }
              placeholder="Store or supplier name"
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
              {isEditing ? "Update" : "Add"} Ammunition
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Ammunition = () => {
  const [ammunition, setAmmunition] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedAmmunition, setSelectedAmmunition] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchAmmunition();
  }, []);

  const fetchAmmunition = async () => {
    try {
      setLoading(true);
      const response = await ammunitionAPI.getInventory();
      setAmmunition(response.data.results || response.data);
    } catch (error) {
      console.error("Failed to fetch ammunition:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAmmunition = () => {
    setSelectedAmmunition(null);
    setShowModal(true);
  };

  const handleEditAmmunition = (ammo) => {
    setSelectedAmmunition(ammo);
    setShowModal(true);
  };

  const handleDeleteAmmunition = async (ammo) => {
    if (
      window.confirm(
        `Are you sure you want to delete ${ammo.quantity} rounds of ${ammo.caliber}?`
      )
    ) {
      try {
        await ammunitionAPI.delete(ammo.id);
        fetchAmmunition();
      } catch (error) {
        console.error("Failed to delete ammunition:", error);
        alert("Failed to delete ammunition");
      }
    }
  };

  const filteredAmmunition = ammunition.filter((ammo) => {
    const matchesSearch =
      ammo.caliber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ammo.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ammo.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || ammo.ammo_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getTotalValue = () => {
    return filteredAmmunition
      .reduce((total, ammo) => {
        return total + ammo.quantity * (ammo.cost_per_round || 0);
      }, 0)
      .toFixed(2);
  };

  const getTotalRounds = () => {
    return filteredAmmunition.reduce((total, ammo) => total + ammo.quantity, 0);
  };

  const getLowStockItems = () => {
    return ammunition.filter((ammo) => ammo.quantity < 50);
  };

  return (
    <div className="ammunition-page">
      <div className="page-header">
        <h1>
          <i className="fas fa-boxes"></i>
          Ammunition Inventory
        </h1>
        <p>Manage and track ammunition inventory</p>
      </div>

      <div className="inventory-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-bullseye"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {getTotalRounds().toLocaleString()}
            </div>
            <div className="stat-label">Total Rounds</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-dollar-sign"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">${getTotalValue()}</div>
            <div className="stat-label">Total Value</div>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{getLowStockItems().length}</div>
            <div className="stat-label">Low Stock Items</div>
          </div>
        </div>
      </div>

      <div className="page-controls">
        <div className="search-filters">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search ammunition..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="Rifle">Rifle</option>
            <option value="Pistol">Pistol</option>
            <option value="Shotgun">Shotgun</option>
            <option value="Rimfire">Rimfire</option>
          </select>
        </div>
        <button onClick={handleAddAmmunition} className="btn btn-primary">
          <i className="fas fa-plus"></i>
          Add Ammunition
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading ammunition inventory...</div>
      ) : (
        <div className="ammunition-grid">
          {filteredAmmunition.map((ammo) => (
            <div
              key={ammo.id}
              className={`ammunition-card ${
                ammo.quantity < 50 ? "low-stock" : ""
              }`}
            >
              <div className="ammo-header">
                <div className="ammo-type">
                  <i
                    className={`fas fa-${
                      ammo.ammo_type === "Rifle"
                        ? "crosshairs"
                        : ammo.ammo_type === "Pistol"
                        ? "gun"
                        : "bullseye"
                    }`}
                  ></i>
                  <span>{ammo.ammo_type}</span>
                </div>
                <div
                  className={`quantity ${
                    ammo.quantity < 50
                      ? "low"
                      : ammo.quantity < 20
                      ? "critical"
                      : ""
                  }`}
                >
                  {ammo.quantity} rounds
                </div>
              </div>

              <div className="ammo-details">
                <h3>{ammo.caliber}</h3>
                {ammo.brand && <div className="brand">{ammo.brand}</div>}

                <div className="ammo-info">
                  {ammo.purchase_date && (
                    <div className="info-item">
                      <i className="fas fa-calendar"></i>
                      <span>
                        {new Date(ammo.purchase_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {ammo.cost_per_round && (
                    <div className="info-item">
                      <i className="fas fa-dollar-sign"></i>
                      <span>${ammo.cost_per_round}/round</span>
                    </div>
                  )}
                  {ammo.supplier && (
                    <div className="info-item">
                      <i className="fas fa-store"></i>
                      <span>{ammo.supplier}</span>
                    </div>
                  )}
                </div>

                {ammo.cost_per_round && (
                  <div className="total-value">
                    Total Value: $
                    {(ammo.quantity * ammo.cost_per_round).toFixed(2)}
                  </div>
                )}
              </div>

              <div className="ammo-actions">
                <button
                  onClick={() => handleEditAmmunition(ammo)}
                  className="btn btn-warning btn-sm"
                >
                  <i className="fas fa-edit"></i>
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteAmmunition(ammo)}
                  className="btn btn-danger btn-sm"
                >
                  <i className="fas fa-trash"></i>
                  Delete
                </button>
              </div>

              {ammo.quantity < 50 && (
                <div className="stock-warning">
                  <i className="fas fa-exclamation-triangle"></i>
                  {ammo.quantity < 20 ? "Critical" : "Low"} Stock
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {filteredAmmunition.length === 0 && !loading && (
        <div className="no-data">
          <i className="fas fa-boxes"></i>
          <h3>No ammunition found</h3>
          <p>Start building your inventory by adding ammunition</p>
        </div>
      )}

      <AmmunitionModal
        ammunition={selectedAmmunition}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={fetchAmmunition}
      />
    </div>
  );
};

export default Ammunition;
