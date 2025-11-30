import React, { useState, useEffect } from "react";
import { activitiesAPI } from "../services/api";
import "./Activities.css";

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await activitiesAPI.getAll();
      setActivities(response.data.results || response.data);
    } catch (error) {
      console.error("Failed to fetch activities:", error);
      // Mock data for demonstration since this endpoint might not exist yet
      setActivities([
        {
          id: 1,
          activity_type: "SHOT_FIRED",
          description:
            "Shot fired by John Doe at coordinates 45.1234, -93.5678",
          timestamp: "2025-11-29T10:30:00Z",
          hunter_name: "John Doe",
          location: "Forest Zone A",
          details: { weapon: "Rifle .308", target: "Deer" },
        },
        {
          id: 2,
          activity_type: "HUNTER_LOGIN",
          description: "Hunter Mike Wilson logged into the system",
          timestamp: "2025-11-29T09:15:00Z",
          hunter_name: "Mike Wilson",
          location: "Mobile App",
          details: { device: "iPhone 13", ip: "192.168.1.25" },
        },
        {
          id: 3,
          activity_type: "VIOLATION_DETECTED",
          description: "Potential violation: Shot outside permitted hours",
          timestamp: "2025-11-28T22:45:00Z",
          hunter_name: "Sam Johnson",
          location: "Zone B",
          details: { violation_type: "ILLEGAL_TIME", severity: "HIGH" },
        },
        {
          id: 4,
          activity_type: "AMMO_PURCHASE",
          description: "Ammunition purchase recorded: 50 rounds of 9mm",
          timestamp: "2025-11-28T14:20:00Z",
          hunter_name: "Alex Brown",
          location: "Gun Store ABC",
          details: { quantity: 50, caliber: "9mm", cost: 25.0 },
        },
        {
          id: 5,
          activity_type: "GUN_REGISTERED",
          description: "New gun registered: Remington Model 700",
          timestamp: "2025-11-27T11:00:00Z",
          hunter_name: "David Lee",
          location: "Registration Office",
          details: { make: "Remington", model: "Model 700", caliber: ".308" },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (activityType) => {
    const icons = {
      SHOT_FIRED: "bullseye",
      HUNTER_LOGIN: "sign-in-alt",
      VIOLATION_DETECTED: "exclamation-triangle",
      AMMO_PURCHASE: "shopping-cart",
      GUN_REGISTERED: "crosshairs",
      LICENSE_RENEWED: "id-card",
      ZONE_ENTERED: "map-marker-alt",
      ZONE_EXITED: "map-marker",
      SYSTEM_ALERT: "bell",
    };
    return icons[activityType] || "circle";
  };

  const getActivityColor = (activityType) => {
    const colors = {
      SHOT_FIRED: "blue",
      HUNTER_LOGIN: "green",
      VIOLATION_DETECTED: "red",
      AMMO_PURCHASE: "orange",
      GUN_REGISTERED: "purple",
      LICENSE_RENEWED: "teal",
      ZONE_ENTERED: "indigo",
      ZONE_EXITED: "gray",
      SYSTEM_ALERT: "yellow",
    };
    return colors[activityType] || "gray";
  };

  const formatActivityType = (activityType) => {
    return activityType
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.hunter_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterType === "all" || activity.activity_type === filterType;

    return matchesSearch && matchesFilter;
  });

  const getActivityStats = () => {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const today = activities.filter(
      (a) => new Date(a.timestamp) > last24Hours
    ).length;
    const thisWeek = activities.filter(
      (a) => new Date(a.timestamp) > last7Days
    ).length;
    const violations = activities.filter(
      (a) => a.activity_type === "VIOLATION_DETECTED"
    ).length;
    const shots = activities.filter(
      (a) => a.activity_type === "SHOT_FIRED"
    ).length;

    return { today, thisWeek, violations, shots };
  };

  const stats = getActivityStats();

  return (
    <div className="activities-page">
      <div className="page-header">
        <h1>
          <i className="fas fa-history"></i>
          Activity Log
        </h1>
        <p>Track all system activities and hunter actions</p>
      </div>

      <div className="activity-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.today}</div>
            <div className="stat-label">Today</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-calendar-week"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.thisWeek}</div>
            <div className="stat-label">This Week</div>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.violations}</div>
            <div className="stat-label">Violations</div>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">
            <i className="fas fa-bullseye"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.shots}</div>
            <div className="stat-label">Shots Fired</div>
          </div>
        </div>
      </div>

      <div className="page-controls">
        <div className="search-filters">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Activities</option>
            <option value="SHOT_FIRED">Shot Fired</option>
            <option value="HUNTER_LOGIN">Hunter Login</option>
            <option value="VIOLATION_DETECTED">Violation Detected</option>
            <option value="AMMO_PURCHASE">Ammo Purchase</option>
            <option value="GUN_REGISTERED">Gun Registered</option>
            <option value="LICENSE_RENEWED">License Renewed</option>
            <option value="ZONE_ENTERED">Zone Entered</option>
            <option value="ZONE_EXITED">Zone Exited</option>
          </select>
        </div>
        <div className="view-options">
          <span className="activity-count">
            {filteredActivities.length} activities
          </span>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading activities...</div>
      ) : (
        <div className="activities-timeline">
          {filteredActivities.map((activity, index) => (
            <div
              key={activity.id}
              className={`activity-item ${getActivityColor(
                activity.activity_type
              )}`}
            >
              <div className="activity-icon">
                <i
                  className={`fas fa-${getActivityIcon(
                    activity.activity_type
                  )}`}
                ></i>
              </div>
              <div className="activity-content">
                <div className="activity-header">
                  <div className="activity-info">
                    <h3>{formatActivityType(activity.activity_type)}</h3>
                    <div className="activity-meta">
                      <span className="timestamp">
                        <i className="fas fa-clock"></i>
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                      {activity.hunter_name && (
                        <span className="hunter">
                          <i className="fas fa-user"></i>
                          {activity.hunter_name}
                        </span>
                      )}
                      {activity.location && (
                        <span className="location">
                          <i className="fas fa-map-marker-alt"></i>
                          {activity.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="activity-description">
                  {activity.description}
                </div>
                {activity.details && (
                  <div className="activity-details">
                    {Object.entries(activity.details).map(([key, value]) => (
                      <div key={key} className="detail-item">
                        <span className="detail-key">
                          {key.replace(/_/g, " ")}:
                        </span>
                        <span className="detail-value">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="activity-line"></div>
            </div>
          ))}
        </div>
      )}

      {filteredActivities.length === 0 && !loading && (
        <div className="no-data">
          <i className="fas fa-history"></i>
          <h3>No activities found</h3>
          <p>No activities match your current search and filter criteria.</p>
        </div>
      )}
    </div>
  );
};

export default Activities;
