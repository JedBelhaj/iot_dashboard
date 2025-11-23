// IoT Dashboard JavaScript with Django API Integration for Backend Data

// Configuration
const API_BASE_URL = "http://localhost:8000/api";

// Connection status
let isConnected = false;
let connectionAttempts = 0;
let maxConnectionAttempts = 3;
let refreshInterval = null;

// Data storage
let dashboardData = {
  hunters: [],
  shots: [],
  ammunition: [],
  activities: [],
  stats: {
    active_hunters: 0,
    total_shots: 0,
    total_bullets: 0,
  },
};

// Initialize dashboard when page loads
document.addEventListener("DOMContentLoaded", function () {
  updateTime();
  initializeAPI();
  setupFormHandlers();

  // Update time every second
  setInterval(updateTime, 1000);

  // Auto-refresh will be started after successful connection
});

// API Functions
async function initializeAPI() {
  try {
    connectionAttempts++;
    await fetchDashboardStats();
    await fetchHunters();
    await fetchGuns();
    await fetchRecentShots();
    await fetchAmmunition();
    await fetchRecentActivities();

    // Successfully connected
    isConnected = true;
    connectionAttempts = 0;
    updateConnectionStatus("Connected to backend server");
    startAutoRefresh();
  } catch (error) {
    console.error("Failed to initialize API:", error);
    isConnected = false;

    if (connectionAttempts <= maxConnectionAttempts) {
      updateConnectionStatus(
        `Connection failed (${connectionAttempts}/${maxConnectionAttempts}). Retrying...`
      );
      setTimeout(() => initializeAPI(), 5000); // Retry in 5 seconds
    } else {
      updateConnectionStatus(
        "Backend server offline. Working in offline mode."
      );
      stopAutoRefresh();
      loadOfflineData();
    }
  }
}

async function fetchDashboardStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard-stats/`);
    if (response.ok) {
      dashboardData.stats = await response.json();
      updateStatsDisplay();
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
  }
}

async function fetchHunters() {
  try {
    const response = await fetch(`${API_BASE_URL}/hunters/hunters/`);
    if (response.ok) {
      const data = await response.json();
      dashboardData.hunters = data.results || data;
      updateHuntersList();
    }
  } catch (error) {
    console.error("Error fetching hunters:", error);
  }
}

async function fetchRecentShots() {
  try {
    const response = await fetch(`${API_BASE_URL}/hunters/shots/recent/`);
    if (response.ok) {
      dashboardData.shots = await response.json();
      // Initialize filtered shots with all shots
      filteredShots = [...dashboardData.shots];
      updateShotsList();
    }
  } catch (error) {
    console.error("Error fetching shots:", error);
  }
}

async function fetchAmmunition() {
  try {
    const response = await fetch(`${API_BASE_URL}/ammunition/inventory/`);
    if (response.ok) {
      const data = await response.json();
      dashboardData.ammunition = data.results || data;
      updateAmmunitionList();
    }
  } catch (error) {
    console.error("Error fetching ammunition:", error);
  }
}

async function fetchRecentActivities() {
  try {
    const response = await fetch(
      `${API_BASE_URL}/activities/activities/recent/`
    );
    if (response.ok) {
      dashboardData.activities = await response.json();
      updateActivityList();
    }
  } catch (error) {
    console.error("Error fetching activities:", error);
  }
}

async function fetchGuns() {
  try {
    const response = await fetch(`${API_BASE_URL}/hunters/guns/`);
    if (response.ok) {
      const data = await response.json();
      dashboardData.guns = data.results || data;
    }
  } catch (error) {
    console.error("Error fetching guns:", error);
  }
}

// Update Display Functions
function updateTime() {
  const now = new Date();
  document.getElementById("current-time").textContent =
    now.toLocaleTimeString();
}

function updateStatsDisplay() {
  const stats = dashboardData.stats;
  document.getElementById("hunters-count").textContent =
    stats.active_hunters || 0;
  document.getElementById("shots-count").textContent = stats.total_shots || 0;
  document.getElementById("bullets-count").textContent = (
    stats.total_bullets || 0
  ).toLocaleString();
}

function updateHuntersList() {
  const huntersList = document.getElementById("hunters-list");

  if (dashboardData.hunters.length === 0) {
    huntersList.innerHTML = '<div class="loading">No hunters registered</div>';
    return;
  }

  const huntersHTML = dashboardData.hunters
    .slice(0, 5)
    .map(
      (hunter) => `
    <div class="hunter-item">
      <h4>${hunter.name}</h4>
      <div class="item-details">
        License: ${hunter.license_number}<br>
        Guns: ${hunter.total_guns || 0}<br>
        Location: ${hunter.current_location}
      </div>
      <span class="item-status ${
        hunter.is_active ? "status-active" : "status-inactive"
      }">
        ${hunter.is_active ? "Active" : "Inactive"}
      </span>
    </div>
  `
    )
    .join("");

  huntersList.innerHTML = huntersHTML;
}

// Global variables for filtering and sorting
let filteredShots = [];
let currentSort = { field: null, direction: "asc" };

function updateShotsList() {
  if (dashboardData.shots.length === 0) {
    document.getElementById("shots-list").innerHTML =
      '<tr><td colspan="7" class="no-data">No recent shots</td></tr>';
    document.getElementById("shots-count").textContent = "0 shots";
    return;
  }

  // Update filter options
  updateFilterOptions();

  // Apply current filters
  filterShots();
}

function updateFilterOptions() {
  // Update hunter filter
  const hunterFilter = document.getElementById("hunterFilter");
  const hunters = [
    ...new Set(
      dashboardData.shots.map((shot) => shot.hunter_name).filter(Boolean)
    ),
  ];
  hunterFilter.innerHTML =
    '<option value="">All Hunters</option>' +
    hunters
      .map((hunter) => `<option value="${hunter}">${hunter}</option>`)
      .join("");

  // Update location filter
  const locationFilter = document.getElementById("locationFilter");
  const locations = [
    ...new Set(
      dashboardData.shots.map((shot) => shot.location).filter(Boolean)
    ),
  ];
  locationFilter.innerHTML =
    '<option value="">All Locations</option>' +
    locations
      .map((location) => `<option value="${location}">${location}</option>`)
      .join("");
}

function filterShots() {
  const hunterFilter = document.getElementById("hunterFilter").value;
  const weaponFilter = document.getElementById("weaponFilter").value;
  const locationFilter = document.getElementById("locationFilter").value;
  const dateFilter = document.getElementById("dateFilter").value;

  filteredShots = dashboardData.shots.filter((shot) => {
    // Hunter filter
    if (hunterFilter && shot.hunter_name !== hunterFilter) return false;

    // Weapon filter
    if (weaponFilter && shot.weapon_used !== weaponFilter) return false;

    // Location filter
    if (locationFilter && shot.location !== locationFilter) return false;

    // Date filter
    if (dateFilter) {
      const shotDate = new Date(shot.timestamp).toISOString().split("T")[0];
      if (shotDate !== dateFilter) return false;
    }

    return true;
  });

  // Apply current sorting
  if (currentSort.field) {
    sortShotsArray(currentSort.field, currentSort.direction);
  }

  renderShotsTable();
}

function renderShotsTable() {
  const shotsList = document.getElementById("shots-list");
  const shotsCount = document.getElementById("shots-count");

  if (filteredShots.length === 0) {
    shotsList.innerHTML =
      '<tr><td colspan="7" class="no-data">No shots match the current filters</td></tr>';
    shotsCount.textContent = "0 shots";
    return;
  }

  const shotsHTML = filteredShots
    .map(
      (shot) => `
      <tr class="shot-row">
        <td class="hunter-name">${shot.hunter_name || "Unknown Hunter"}</td>
        <td class="timestamp">${new Date(shot.timestamp).toLocaleString()}</td>
        <td class="location">${shot.location}</td>
        <td class="weapon">${shot.weapon_used}</td>
        <td class="sound-level">${
          shot.sound_level ? Math.round(shot.sound_level) + "dB" : "N/A"
        }</td>
        <td class="vibration-level">${
          shot.vibration_level ? Math.round(shot.vibration_level) + "Hz" : "N/A"
        }</td>
        <td class="notes">${shot.notes || "-"}</td>
      </tr>
    `
    )
    .join("");

  shotsList.innerHTML = shotsHTML;
  shotsCount.textContent = `${filteredShots.length} shot${
    filteredShots.length !== 1 ? "s" : ""
  }`;
}

function sortTable(field) {
  // Toggle sort direction if same field, otherwise default to ascending
  if (currentSort.field === field) {
    currentSort.direction = currentSort.direction === "asc" ? "desc" : "asc";
  } else {
    currentSort.field = field;
    currentSort.direction = "asc";
  }

  // Update sort arrows
  document.querySelectorAll(".sort-arrow").forEach((arrow) => {
    arrow.innerHTML = "";
    arrow.parentElement.classList.remove("sorted-asc", "sorted-desc");
  });

  const arrow = document.getElementById(`sort-${field}`);
  arrow.innerHTML = currentSort.direction === "asc" ? "▲" : "▼";
  arrow.parentElement.classList.add(`sorted-${currentSort.direction}`);

  // Sort and render
  sortShotsArray(field, currentSort.direction);
  renderShotsTable();
}

function sortShotsArray(field, direction) {
  filteredShots.sort((a, b) => {
    let valueA, valueB;

    switch (field) {
      case "hunter":
        valueA = (a.hunter_name || "").toLowerCase();
        valueB = (b.hunter_name || "").toLowerCase();
        break;
      case "timestamp":
        valueA = new Date(a.timestamp);
        valueB = new Date(b.timestamp);
        break;
      case "location":
        valueA = (a.location || "").toLowerCase();
        valueB = (b.location || "").toLowerCase();
        break;
      case "weapon":
        valueA = (a.weapon_used || "").toLowerCase();
        valueB = (b.weapon_used || "").toLowerCase();
        break;
      case "sound":
        valueA = parseFloat(a.sound_level) || 0;
        valueB = parseFloat(b.sound_level) || 0;
        break;
      case "vibration":
        valueA = parseFloat(a.vibration_level) || 0;
        valueB = parseFloat(b.vibration_level) || 0;
        break;
      default:
        return 0;
    }

    if (valueA < valueB) return direction === "asc" ? -1 : 1;
    if (valueA > valueB) return direction === "asc" ? 1 : -1;
    return 0;
  });
}

function clearFilters() {
  document.getElementById("hunterFilter").value = "";
  document.getElementById("weaponFilter").value = "";
  document.getElementById("locationFilter").value = "";
  document.getElementById("dateFilter").value = "";

  // Clear sorting
  currentSort = { field: null, direction: "asc" };
  document.querySelectorAll(".sort-arrow").forEach((arrow) => {
    arrow.innerHTML = "";
    arrow.parentElement.classList.remove("sorted-asc", "sorted-desc");
  });

  filterShots();
}

function updateAmmunitionList() {
  const ammoList = document.getElementById("ammo-inventory");

  if (dashboardData.ammunition.length === 0) {
    ammoList.innerHTML =
      '<div class="loading">No ammunition in inventory</div>';
    return;
  }

  const ammoHTML = dashboardData.ammunition
    .map(
      (ammo) => `
    <div class="ammo-item">
      <h4>${ammo.ammo_type_display || ammo.ammo_type}</h4>
      <div class="item-details">
        Quantity: ${ammo.quantity} rounds<br>
        Location: ${ammo.location}<br>
        ${ammo.cost_per_unit ? `Cost: $${ammo.cost_per_unit}/unit` : ""}
      </div>
      <span class="item-status ${
        ammo.is_low_stock ? "status-low" : "status-active"
      }">
        ${ammo.is_low_stock ? "Low Stock" : "In Stock"}
      </span>
    </div>
  `
    )
    .join("");

  ammoList.innerHTML = ammoHTML;
}

function updateActivityList() {
  const activityList = document.getElementById("activity-list");

  if (dashboardData.activities.length === 0) {
    activityList.innerHTML =
      '<div class="activity-item"><span class="activity-time">--</span><span class="activity-desc">No recent activity</span></div>';
    return;
  }

  const activitiesHTML = dashboardData.activities
    .slice(0, 5)
    .map(
      (activity) => `
    <div class="activity-item">
      <span class="activity-time">${timeAgo(activity.timestamp)}</span>
      <span class="activity-desc">${activity.description}</span>
    </div>
  `
    )
    .join("");

  activityList.innerHTML = activitiesHTML;
}

// Modal Functions
function showAddHunter() {
  document.getElementById("addHunterModal").style.display = "block";
}

function showRecordShot() {
  loadHuntersForShotForm();
  document.getElementById("recordShotModal").style.display = "block";
}

function showAddAmmo() {
  document.getElementById("addAmmoModal").style.display = "block";
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
  const form = document.querySelector(`#${modalId} form`);
  if (form) form.reset();
}

async function loadHuntersForShotForm() {
  const gunSelect = document.getElementById("shotGun");
  gunSelect.innerHTML = '<option value="">Select gun</option>';

  try {
    const response = await fetch(`${API_BASE_URL}/hunters/guns/`);
    if (response.ok) {
      const data = await response.json();
      const guns = data.results || data;

      guns.forEach((gun) => {
        if (gun.status === "active") {
          const option = document.createElement("option");
          option.value = gun.id;
          option.textContent = `${gun.owner_name}: ${gun.make} ${gun.model} (${gun.device_id})`;
          gunSelect.appendChild(option);
        }
      });
    }
  } catch (error) {
    console.error("Error fetching guns:", error);
  }
}

// Form Handlers
function setupFormHandlers() {
  document
    .getElementById("hunterForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const hunterData = Object.fromEntries(formData);

      try {
        const response = await fetch(`${API_BASE_URL}/hunters/hunters/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(hunterData),
        });

        if (response.ok) {
          closeModal("addHunterModal");
          showSuccess("Hunter added successfully!");
          await fetchHunters();
        } else {
          const error = await response.json();
          showError(`Error: ${JSON.stringify(error)}`);
        }
      } catch (error) {
        showError("Failed to add hunter. Please try again.");
      }
    });

  document.getElementById("shotForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const shotData = Object.fromEntries(formData);

    try {
      const response = await fetch(`${API_BASE_URL}/hunters/shots/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(shotData),
      });

      if (response.ok) {
        closeModal("recordShotModal");
        showSuccess("Shot recorded successfully!");
        await fetchRecentShots();
      } else {
        const error = await response.json();
        showError(`Error: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      showError("Failed to record shot. Please try again.");
    }
  });
}

// Connection Management
function startAutoRefresh() {
  if (refreshInterval) clearInterval(refreshInterval);
  if (isConnected) {
    refreshInterval = setInterval(() => {
      if (isConnected) {
        refreshData();
      }
    }, 300000); // Refresh every 5 minutes
  }
}

function stopAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

function updateConnectionStatus(message) {
  console.log(message);
  // You can add a status indicator to the UI here
  const statusElement = document.querySelector(".connection-status");
  if (statusElement) {
    statusElement.textContent = message;
    statusElement.className = `connection-status ${
      isConnected ? "connected" : "disconnected"
    }`;
  }
}

function updateLastRefreshTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString();
  console.log(`Last refresh: ${timeString}`);
}

function loadOfflineData() {
  // Display placeholder/offline data
  dashboardData.stats = { active_hunters: 0, total_shots: 0, total_bullets: 0 };
  updateStatsDisplay();

  document.getElementById("hunters-list").innerHTML =
    '<div class="loading">Server offline - No data available</div>';
  document.getElementById("shots-list").innerHTML =
    '<div class="loading">Server offline - No data available</div>';
  document.getElementById("ammo-inventory").innerHTML =
    '<div class="loading">Server offline - No data available</div>';
  document.getElementById("activity-list").innerHTML =
    '<div class="activity-item"><span class="activity-time">--</span><span class="activity-desc">Server offline</span></div>';
}

// Utility Functions
function refreshData() {
  if (isConnected) {
    // Only refresh key data, not full initialization
    console.log("Auto-refreshing dashboard data...");
    fetchDashboardStats();
    fetchRecentShots();
    fetchRecentActivities();
    updateLastRefreshTime();
  }
}

function timeAgo(timestamp) {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now - time) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  } else if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}m ago`;
  } else if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}h ago`;
  } else {
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }
}

function showSuccess(message) {
  alert(` ${message}`);
}

function showError(message) {
  alert(` ${message}`);
}

window.onclick = function (event) {
  if (event.target.classList.contains("modal")) {
    event.target.style.display = "none";
  }
};

function retryConnection() {
  connectionAttempts = 0;
  updateConnectionStatus("Retrying connection...");
  initializeAPI();
}

window.showAddHunter = showAddHunter;
window.showRecordShot = showRecordShot;
window.showAddAmmo = showAddAmmo;
window.closeModal = closeModal;
window.refreshData = refreshData;
window.retryConnection = retryConnection;
