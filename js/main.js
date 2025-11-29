// IoT Dashboard JavaScript with Django API Integration for Backend Data

// Configuration
const API_BASE_URL = "http://192.168.1.3:8000/api";
const WS_BASE_URL = "ws://192.168.1.3:8000/ws";

// Connection status
let isConnected = false;
let connectionAttempts = 0;
let maxConnectionAttempts = 3;
let refreshInterval = null;
let isInitializing = false;

// Simulation control
let simulationInterval = null;

// Data storage
let dashboardData = {
  hunters: [],
  guns: [],
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
}); // Show loading skeleton immediately
function showLoadingState() {
  // Update connection status
  updateConnectionStatus("Connecting to server...");

  // Update loading overlay text
  const loadingText = document.querySelector(".loading-text");
  if (loadingText) {
    loadingText.textContent = "Connecting to server...";
  }

  // Show skeleton for stats
  document.getElementById("hunters-count").textContent = "---";
  document.getElementById("shots-count").textContent = "---";
  document.getElementById("bullets-count").textContent = "---";

  // Show loading for lists
  document.getElementById("hunters-list").innerHTML =
    '<div class="loading-skeleton">Loading hunters...</div>';
  document.getElementById("ammo-inventory").innerHTML =
    '<div class="loading-skeleton">Loading inventory...</div>';
  document.getElementById("shots-list").innerHTML =
    '<tr><td colspan="7" class="loading-skeleton">Loading shots...</td></tr>';
  document.getElementById("activity-list").innerHTML =
    '<div class="activity-item"><span class="activity-time">--:--</span><span class="activity-desc loading-skeleton">Loading activities...</span></div>';
}

// Hide loading overlay when ready
function hideLoadingOverlay() {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) {
    overlay.classList.add("hidden");
    // Remove from DOM after transition
    setTimeout(() => {
      overlay.style.display = "none";
    }, 500);
  }
}

// API Functions
async function initializeAPI() {
  if (isInitializing) {
    console.log("API initialization already in progress...");
    return;
  }

  try {
    isInitializing = true;
    connectionAttempts++;
    console.log(`Initializing API (attempt ${connectionAttempts})...`);
    await fetchDashboardStats();
    await fetchHunters();
    await fetchGuns();
    await fetchRecentShots();
    await fetchAmmunition();
    await fetchRecentActivities();

    // Successfully connected
    isConnected = true;
    connectionAttempts = 0;
    isInitializing = false;
    updateConnectionStatus("Connected to backend server");
    startAutoRefresh();
  } catch (error) {
    console.error("Failed to initialize API:", error);
    isConnected = false;
    isInitializing = false;

    if (connectionAttempts <= maxConnectionAttempts) {
      updateConnectionStatus(
        `Connection failed (${connectionAttempts}/${maxConnectionAttempts}). Retrying...`
      );
      setTimeout(() => {
        if (!isConnected && !isInitializing) {
          initializeAPI();
        }
      }, 5000); // Retry in 5 seconds
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
      console.log("Fetched hunters:", dashboardData.hunters);
      updateHuntersList();
    } else {
      console.error(
        "Failed to fetch hunters:",
        response.status,
        response.statusText
      );
    }
  } catch (error) {
    console.error("Error fetching hunters:", error);
  }
}

async function fetchRecentShots() {
  try {
    const response = await fetch(`${API_BASE_URL}/hunters/shots/`);
    if (response.ok) {
      const data = await response.json();
      dashboardData.shots = data.results || data;
      // Initialize filtered shots with all shots
      filteredShots = [...dashboardData.shots];
      console.log("Fetched shots:", dashboardData.shots);
      updateShotsList();
    } else {
      console.error(
        "Failed to fetch shots:",
        response.status,
        response.statusText
      );
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
      console.log("Fetched ammunition:", dashboardData.ammunition);
      updateAmmunitionList();
    } else {
      console.error(
        "Failed to fetch ammunition:",
        response.status,
        response.statusText
      );
    }
  } catch (error) {
    console.error("Error fetching ammunition:", error);
  }
}

async function fetchRecentActivities() {
  try {
    const response = await fetch(`${API_BASE_URL}/activities/activities/`);
    if (response.ok) {
      const data = await response.json();
      dashboardData.activities = data.results || data;
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
      console.log("Fetched guns:", dashboardData.guns);
      updateGunsList();
    } else {
      console.error(
        "Failed to fetch guns:",
        response.status,
        response.statusText
      );
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
  const huntersEl = document.getElementById("hunters-count");
  const shotsEl = document.getElementById("shots-count");
  const bulletsEl = document.getElementById("bullets-count");

  huntersEl.textContent = stats.active_hunters || 0;

  // Use live shot count from our data array
  shotsEl.textContent = dashboardData.shots
    ? dashboardData.shots.length
    : stats.total_shots || 0;

  bulletsEl.textContent = (stats.total_bullets || 0).toLocaleString();
}

function updateHuntersList() {
  const huntersList = document.getElementById("hunters-list");

  if (dashboardData.hunters.length === 0) {
    huntersList.innerHTML = '<div class="loading">No hunters registered</div>';
    return;
  }

  const huntersHTML = dashboardData.hunters
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

function updateGunsList() {
  const gunsList = document.getElementById("guns-list");

  if (dashboardData.guns.length === 0) {
    gunsList.innerHTML = '<div class="loading">No guns registered</div>';
    return;
  }

  const gunsHTML = dashboardData.guns
    .map(
      (gun) => `
    <div class="gun-item">
      <h4>${gun.make} ${gun.model}</h4>
      <div class="item-details">
        Device ID: ${gun.device_id}<br>
        Owner: ${gun.owner_name || "Unknown"}<br>
        Type: ${gun.weapon_type}<br>
        Battery: ${gun.battery_level}%
        ${
          gun.battery_level < 20
            ? ' <span style="color: #ff6b6b;">⚠️</span>'
            : ""
        }
      </div>
      <span class="item-status ${
        gun.status === "active"
          ? "status-active"
          : gun.status === "maintenance"
          ? "status-inactive"
          : "status-low"
      }">
        ${gun.status.charAt(0).toUpperCase() + gun.status.slice(1)}
      </span>
    </div>
  `
    )
    .join("");

  gunsList.innerHTML = gunsHTML;
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

  if (!activityList) {
    console.log("Activity list element not found");
    return;
  }

  if (!dashboardData.activities || dashboardData.activities.length === 0) {
    activityList.innerHTML =
      '<div class="activity-item"><span class="activity-time">--</span><span class="activity-desc">No recent activity</span></div>';
    return;
  }

  const activitiesHTML = dashboardData.activities
    .map(
      (activity) => `
    <div class="activity-item">
      <span class="activity-time">${
        activity.timestamp ? timeAgo(activity.timestamp) : "--"
      }</span>
      <span class="activity-desc">${
        activity.description || "Unknown activity"
      }</span>
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

function showAddGun() {
  // Populate owner dropdown
  const ownerSelect = document.getElementById("gunOwner");
  ownerSelect.innerHTML =
    '<option value="">Select owner</option>' +
    dashboardData.hunters
      .map((hunter) => `<option value="${hunter.id}">${hunter.name}</option>`)
      .join("");

  document.getElementById("addGunModal").style.display = "block";
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

  // Use cached data if available, otherwise fetch
  let guns = dashboardData.guns;
  if (guns.length === 0) {
    try {
      const response = await fetch(`${API_BASE_URL}/hunters/guns/`);
      if (response.ok) {
        const data = await response.json();
        guns = data.results || data;
      }
    } catch (error) {
      console.error("Error fetching guns:", error);
      return;
    }
  }

  guns.forEach((gun) => {
    if (gun.status === "active") {
      const option = document.createElement("option");
      option.value = gun.id;
      option.textContent = `${gun.owner_name || gun.owner}: ${gun.make} ${
        gun.model
      } (${gun.device_id})`;
      gunSelect.appendChild(option);
    }
  });
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

  document.getElementById("ammoForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const ammoData = Object.fromEntries(formData);

    try {
      const response = await fetch(`${API_BASE_URL}/ammunition/inventory/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ammoData),
      });

      if (response.ok) {
        closeModal("addAmmoModal");
        showSuccess("Ammunition added successfully!");
        await fetchAmmunition();
        document.getElementById("ammoForm").reset();
      } else {
        const error = await response.json();
        showError(`Error: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      showError("Failed to add ammunition. Please try again.");
    }
  });

  document.getElementById("gunForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const gunData = Object.fromEntries(formData);

    try {
      const response = await fetch(`${API_BASE_URL}/hunters/guns/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gunData),
      });

      if (response.ok) {
        closeModal("addGunModal");
        showSuccess("Gun registered successfully!");
        await fetchGuns();
        document.getElementById("gunForm").reset();
      } else {
        const error = await response.json();
        showError(`Error: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      showError("Failed to register gun. Please try again.");
    }
  });
}

// Connection Management
function startAutoRefresh() {
  // Always clear existing interval first
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }

  if (isConnected && !refreshInterval) {
    console.log("Starting auto-refresh (5 minute interval)");
    refreshInterval = setInterval(() => {
      if (isConnected && !isInitializing) {
        console.log("Auto-refreshing data...");
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

function loadOfflineData() {
  // Load mock data when offline
  dashboardData.hunters = [
    {
      id: 1,
      name: "Mock Hunter",
      license_number: "MOCK-001",
      current_location: "Offline Mode",
      is_active: true,
      total_guns: 1,
    },
  ];

  dashboardData.guns = [
    {
      id: 1,
      device_id: "MOCK-GUN-001",
      make: "Mock",
      model: "Offline Gun",
      weapon_type: "rifle",
      battery_level: 85,
      status: "active",
      owner_name: "Mock Hunter",
    },
  ];

  dashboardData.shots = [];
  dashboardData.ammunition = [];
  dashboardData.activities = [];

  dashboardData.stats = {
    active_hunters: 1,
    total_shots: 0,
    total_bullets: 0,
  };

  // Update displays
  updateStatsDisplay();
  updateHuntersList();
  updateGunsList();
  updateShotsList();
  updateAmmunitionList();
  updateActivityList();
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

// WebSocket Functions
function connectWebSocket() {
  // Don't create multiple connections
  if (
    shotSocket &&
    (shotSocket.readyState === WebSocket.CONNECTING ||
      shotSocket.readyState === WebSocket.OPEN)
  ) {
    console.log("WebSocket already connected or connecting");
    return;
  }

  try {
    console.log("Connecting to WebSocket...");
    shotSocket = new WebSocket(`${WS_BASE_URL}/shots/`);

    shotSocket.onopen = function (event) {
      console.log("🔗 WebSocket connected for real-time shots");
      isWebSocketConnected = true;
      updateConnectionStatus("Connected to server with real-time updates");
    };

    shotSocket.onmessage = function (event) {
      const data = JSON.parse(event.data);

      if (data.type === "new_shot") {
        handleNewShot(data.shot);
      }
    };

    shotSocket.onclose = function (event) {
      console.log("🔌 WebSocket disconnected");
      isWebSocketConnected = false;
      updateConnectionStatus("Real-time updates disconnected");

      // Attempt to reconnect after 5 seconds
      setTimeout(connectWebSocket, 5000);
    };

    shotSocket.onerror = function (error) {
      console.error("❌ WebSocket error:", error);
    };
  } catch (error) {
    console.error("Failed to connect WebSocket:", error);
  }
}

function handleNewShot(shot) {
  console.log("🎯 New shot received:", shot);

  // Add to shots array at the beginning (newest first)
  dashboardData.shots.unshift(shot);

  // Also add to filtered shots if it matches current filters
  if (shotMatchesCurrentFilters(shot)) {
    filteredShots.unshift(shot);
  }

  // Update displays
  renderShotsTable();
  updateStatsDisplay();

  // Show notification
  showSuccess(`New shot recorded: ${shot.hunter_name} (${shot.weapon_used})`);

  // Flash the new row
  setTimeout(() => {
    const rows = document.querySelectorAll(".shot-row");
    if (rows.length > 0) {
      rows[0].style.backgroundColor = "#e8f5e8";
      setTimeout(() => {
        rows[0].style.backgroundColor = "";
      }, 2000);
    }
  }, 100);
}

function shotMatchesCurrentFilters(shot) {
  const hunterFilter = document.getElementById("hunterFilter").value;
  const weaponFilter = document.getElementById("weaponFilter").value;
  const locationFilter = document.getElementById("locationFilter").value;
  const dateFilter = document.getElementById("dateFilter").value;

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
}

function loadOfflineData() {
  // Display placeholder/offline data
  dashboardData.stats = { active_hunters: 0, total_shots: 0, total_bullets: 0 };
  updateStatsDisplay();

  document.getElementById("hunters-list").innerHTML =
    '<div class="loading">Server offline - No data available</div>';
  document.getElementById("guns-list").innerHTML =
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
    // Refresh all data to ensure consistency
    console.log("Auto-refreshing dashboard data...");
    fetchDashboardStats();
    fetchHunters();
    fetchGuns();
    fetchRecentShots();
    fetchAmmunition();
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
  if (isInitializing) {
    console.log("Connection attempt already in progress");
    return;
  }

  connectionAttempts = 0;
  isInitializing = false;
  stopAutoRefresh();
  updateConnectionStatus("Retrying connection...");
  initializeAPI();
}

// Simulation control
let simulationActive = false;

function toggleSimulation() {
  const btn = document.getElementById("simulationBtn");
  const text = document.getElementById("simulationText");
  const icon = btn.querySelector("i");

  if (simulationActive) {
    // Stop simulation
    stopSimulation();
  } else {
    // Start simulation
    startSimulation();
  }
}

function startSimulation() {
  const btn = document.getElementById("simulationBtn");
  const text = document.getElementById("simulationText");
  const icon = btn.querySelector("i");

  simulationActive = true;
  text.textContent = "Stop Simulation";
  icon.className = "fas fa-stop";
  btn.style.backgroundColor = "#f44336";
  showSuccess("Shot simulation started - New shots every 10 seconds!");

  // Start the simulation loop
  simulateShot();
}

function stopSimulation() {
  const btn = document.getElementById("simulationBtn");
  const text = document.getElementById("simulationText");
  const icon = btn.querySelector("i");

  simulationActive = false;
  text.textContent = "Start Simulation";
  icon.className = "fas fa-play";
  btn.style.backgroundColor = "#4CAF50";
  showSuccess("Shot simulation stopped");
}

async function simulateShot() {
  if (!simulationActive) return;

  try {
    // Create a simulated shot via API
    const response = await fetch(`${API_BASE_URL}/hunters/shots/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(await generateRandomShotData()),
    });

    if (response.ok) {
      const newShot = await response.json();
      console.log("🎯 Simulated shot created:", newShot);

      // Add to local data and update display
      dashboardData.shots.unshift(newShot);
      if (shotMatchesCurrentFilters(newShot)) {
        filteredShots.unshift(newShot);
      }

      // Update displays
      renderShotsTable();
      updateStatsDisplay();

      // Flash the new row
      setTimeout(() => {
        const rows = document.querySelectorAll(".shot-row");
        if (rows.length > 0) {
          rows[0].style.backgroundColor = "#e8f5e8";
          setTimeout(() => {
            rows[0].style.backgroundColor = "";
          }, 2000);
        }
      }, 100);
    }
  } catch (error) {
    console.error("Failed to create simulated shot:", error);
  }

  // Schedule next shot if simulation is still active
  if (simulationActive) {
    setTimeout(simulateShot, 10000); // 10 seconds
  }
}

async function generateRandomShotData() {
  // Get available guns
  try {
    const response = await fetch(`${API_BASE_URL}/hunters/guns/`);
    const data = await response.json();
    const guns = data.results || data;
    const activeGuns = guns.filter((gun) => gun.status === "active");

    if (activeGuns.length === 0) {
      throw new Error("No active guns available for simulation");
    }

    const randomGun = activeGuns[Math.floor(Math.random() * activeGuns.length)];

    return {
      gun: randomGun.id,
      sound_level: 85 + Math.random() * 35, // 85-120 dB
      vibration_level: 40 + Math.random() * 40, // 40-80 Hz
      latitude: 40.7128 + (Math.random() - 0.5) * 0.02,
      longitude: -74.006 + (Math.random() - 0.5) * 0.02,
      notes: "Auto-simulated shot",
    };
  } catch (error) {
    console.error("Error generating shot data:", error);
    return null;
  }
}

window.showAddHunter = showAddHunter;
window.showAddGun = showAddGun;
window.showRecordShot = showRecordShot;
window.showAddAmmo = showAddAmmo;
window.closeModal = closeModal;
window.refreshData = refreshData;
window.retryConnection = retryConnection;
window.toggleSimulation = toggleSimulation;
window.filterShots = filterShots;
window.clearFilters = clearFilters;
window.sortTable = sortTable;
