// Simple IoT Dashboard JavaScript

// Data
let data = {
  hunters: 8,
  shots: 47,
  bullets: 1250,
  sound: 85,
  vibration: 42,
  lat: 40.7128,
  lng: -74.006,
};

// Initialize dashboard when page loads
document.addEventListener("DOMContentLoaded", function () {
  updateTime();
  updateStats();
  updateSensors();

  // Update time every second
  setInterval(updateTime, 1000);

  // Update sensors every 3 seconds
  setInterval(updateSensors, 3000);
});

// Update current time
function updateTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString();
  document.getElementById("current-time").textContent = timeString;
}

// Update statistics
function updateStats() {
  document.getElementById("hunters-count").textContent = data.hunters;
  document.getElementById("shots-count").textContent = data.shots;
  document.getElementById("bullets-count").textContent =
    data.bullets.toLocaleString();
}

// Update sensor data
function updateSensors() {
  // Simulate sensor fluctuations
  data.sound = Math.max(
    30,
    Math.min(120, data.sound + (Math.random() - 0.5) * 10)
  );
  data.vibration = Math.max(
    0,
    Math.min(100, data.vibration + (Math.random() - 0.5) * 8)
  );

  // Small GPS drift
  data.lat += (Math.random() - 0.5) * 0.0001;
  data.lng += (Math.random() - 0.5) * 0.0001;

  // Update display
  document.getElementById("sound-level").textContent = Math.round(data.sound);
  document.getElementById("vibration-level").textContent = Math.round(
    data.vibration
  );
  document.getElementById("lat-coord").textContent = data.lat.toFixed(4);
  document.getElementById("lng-coord").textContent = data.lng.toFixed(4);

  // Update sensor bars
  updateSensorBars();

  // Occasionally simulate shot
  if (Math.random() < 0.15) {
    simulateShot();
  }
}

// Update sensor progress bars
function updateSensorBars() {
  const soundBar = document.getElementById("sound-bar");
  const vibrationBar = document.getElementById("vibration-bar");

  if (soundBar) {
    soundBar.style.width = (data.sound / 120) * 100 + "%";
  }

  if (vibrationBar) {
    vibrationBar.style.width = (data.vibration / 100) * 100 + "%";
  }
}

// Simulate shot detection
function simulateShot() {
  // Increase sound and vibration
  data.sound = Math.min(120, data.sound + Math.random() * 30 + 20);
  data.vibration = Math.min(100, data.vibration + Math.random() * 40 + 30);

  // Increase shot count
  data.shots++;
  document.getElementById("shots-count").textContent = data.shots;

  // Add to activity log
  addActivity("Shot detected - Zone A");

  // Flash the shots counter
  const shotsElement = document.getElementById("shots-count");
  shotsElement.classList.add("pulse");
  setTimeout(() => shotsElement.classList.remove("pulse"), 1000);
}

// Add activity to the log
function addActivity(description) {
  const activityList = document.getElementById("activity-list");
  const newActivity = document.createElement("div");
  newActivity.className = "activity-item";

  const now = new Date();
  const timeAgo = "Just now";

  newActivity.innerHTML = `
        <span class="activity-time">${timeAgo}</span>
        <span class="activity-desc">${description}</span>
    `;

  // Add to top of list
  activityList.insertBefore(newActivity, activityList.firstChild);

  // Remove excess items (keep only 5)
  while (activityList.children.length > 5) {
    activityList.removeChild(activityList.lastChild);
  }
}

// Button actions
function registerShot() {
  data.shots++;
  document.getElementById("shots-count").textContent = data.shots;
  addActivity("Manual shot registered");

  // Simulate sensor spike
  data.sound = Math.min(120, data.sound + 25);
  data.vibration = Math.min(100, data.vibration + 35);
}

function addBullets() {
  const amount = 50;
  data.bullets += amount;
  document.getElementById("bullets-count").textContent =
    data.bullets.toLocaleString();
  addActivity(`${amount} bullets added to inventory`);
}

function toggleAlert() {
  const alertBtn = event.target;
  const isActive = alertBtn.classList.contains("alert-active");

  if (isActive) {
    alertBtn.classList.remove("alert-active");
    alertBtn.style.background = "#ff6b6b";
    addActivity("Alert deactivated");
  } else {
    alertBtn.classList.add("alert-active");
    alertBtn.style.background = "#ffe66d";
    alertBtn.style.color = "#1a1a2e";
    addActivity("Security alert activated");
  }
}

// Show notification
function showNotification(message) {
  // Create simple alert for now
  alert(message);
}

// Make functions available globally
window.registerShot = registerShot;
window.addBullets = addBullets;
window.toggleAlert = toggleAlert;
