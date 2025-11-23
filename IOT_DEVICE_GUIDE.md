# IoT Gun Registration Device Development Guide

## Overview

This guide explains how to develop IoT devices that can register shots fired by hunters and communicate with the IoT Dashboard backend system. The system tracks shots with sensor data including sound levels, vibration, GPS coordinates, and hunter identification.

## System Architecture

### Backend API

- **Base URL**: `http://your-domain.com/api/`
- **Authentication**: None required for shot recording (configure as needed)
- **Content-Type**: `application/json`
- **Method**: `POST`

### Shot Registration Endpoint

```
POST /api/hunters/shots/
```

## Data Structure

### Required Fields for Shot Registration

```json
{
  "hunter": 1, // Hunter ID (integer) - REQUIRED
  "location": "Forest Area A", // Location name (string) - REQUIRED
  "sound_level": 95.5, // Sound level in dB (float) - REQUIRED
  "vibration_level": 45.3, // Vibration level in Hz (float) - REQUIRED
  "latitude": 40.7128, // GPS latitude (float) - REQUIRED
  "longitude": -74.006, // GPS longitude (float) - REQUIRED
  "weapon_used": "rifle", // Weapon type (string) - REQUIRED
  "notes": "Morning hunt" // Optional notes (string) - OPTIONAL
}
```

### Field Specifications

| Field             | Type    | Range/Values                 | Description                              |
| ----------------- | ------- | ---------------------------- | ---------------------------------------- |
| `hunter`          | Integer | 1+                           | Database ID of the registered hunter     |
| `location`        | String  | 1-100 chars                  | Human-readable location name             |
| `sound_level`     | Float   | 0-200 dB                     | Sound intensity measured during shot     |
| `vibration_level` | Float   | 0-100 Hz                     | Vibration frequency measured during shot |
| `latitude`        | Float   | -90 to 90                    | GPS latitude coordinate                  |
| `longitude`       | Float   | -180 to 180                  | GPS longitude coordinate                 |
| `weapon_used`     | String  | rifle, shotgun, handgun, bow | Type of weapon fired                     |
| `notes`           | String  | 0-500 chars                  | Optional additional information          |

## IoT Device Requirements

### Hardware Components

1. **Microcontroller**: ESP32, Arduino, or Raspberry Pi
2. **Sensors**:
   - Sound sensor (e.g., MAX9814, KY-037)
   - Vibration sensor (e.g., SW-420, ADXL345 accelerometer)
   - GPS module (e.g., NEO-6M, NEO-8M)
3. **Connectivity**: WiFi or GSM module
4. **Power**: Battery pack with power management
5. **Housing**: Weatherproof enclosure for outdoor use

### Software Components

1. **Sensor Reading**: Libraries to read sound and vibration data
2. **GPS Tracking**: Libraries for GPS coordinate acquisition
3. **HTTP Client**: For API communication
4. **Hunter Identification**: RFID/NFC reader or manual input system

## Implementation Examples

### Arduino/ESP32 Example (C++)

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <SoftwareSerial.h>

// Configuration
const char* ssid = "your-wifi-ssid";
const char* password = "your-wifi-password";
const char* apiUrl = "http://your-domain.com/api/hunters/shots/";

// Pin definitions
#define SOUND_PIN A0
#define VIBRATION_PIN 2
#define GPS_RX 4
#define GPS_TX 3

// GPS Setup
SoftwareSerial gpsSerial(GPS_RX, GPS_TX);

struct ShotData {
  int hunterId;
  String location;
  float soundLevel;
  float vibrationLevel;
  float latitude;
  float longitude;
  String weaponUsed;
  String notes;
};

void setup() {
  Serial.begin(115200);
  gpsSerial.begin(9600);

  // Initialize WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("WiFi connected!");

  // Initialize sensors
  pinMode(SOUND_PIN, INPUT);
  pinMode(VIBRATION_PIN, INPUT);
}

void loop() {
  // Monitor for shot detection (implement your trigger logic)
  if (detectShot()) {
    ShotData shot = captureShotData();
    sendShotToAPI(shot);
    delay(5000); // Prevent duplicate shots
  }
  delay(100);
}

bool detectShot() {
  // Implement shot detection logic
  // Example: Combine sound threshold + vibration spike
  float currentSound = analogRead(SOUND_PIN) * (5.0/1023.0) * 50; // Convert to dB
  bool vibrationDetected = digitalRead(VIBRATION_PIN);

  return (currentSound > 80.0 && vibrationDetected); // Threshold values
}

ShotData captureShotData() {
  ShotData shot;

  // Read sensors
  shot.soundLevel = analogRead(SOUND_PIN) * (5.0/1023.0) * 50; // Convert to dB
  shot.vibrationLevel = random(30, 80); // Replace with actual vibration reading

  // Get GPS coordinates
  getGPSCoordinates(&shot.latitude, &shot.longitude);

  // Set hunter data (implement your identification method)
  shot.hunterId = getHunterId(); // RFID, manual input, etc.
  shot.location = "Forest Area A"; // GPS-based or preset
  shot.weaponUsed = "rifle"; // From hunter profile or sensor detection
  shot.notes = "Auto-detected shot";

  return shot;
}

void sendShotToAPI(ShotData shot) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(apiUrl);
    http.addHeader("Content-Type", "application/json");

    // Create JSON payload
    DynamicJsonDocument doc(1024);
    doc["hunter"] = shot.hunterId;
    doc["location"] = shot.location;
    doc["sound_level"] = shot.soundLevel;
    doc["vibration_level"] = shot.vibrationLevel;
    doc["latitude"] = shot.latitude;
    doc["longitude"] = shot.longitude;
    doc["weapon_used"] = shot.weaponUsed;
    doc["notes"] = shot.notes;

    String jsonString;
    serializeJson(doc, jsonString);

    // Send POST request
    int httpResponseCode = http.POST(jsonString);

    if (httpResponseCode == 201) {
      Serial.println("Shot registered successfully!");
    } else {
      Serial.printf("Error: HTTP %d\\n", httpResponseCode);
      Serial.println(http.getString());
    }

    http.end();
  }
}

void getGPSCoordinates(float* lat, float* lng) {
  // Simplified GPS reading (implement proper NMEA parsing)
  *lat = 40.7128 + random(-100, 100) / 10000.0; // Mock data
  *lng = -74.0060 + random(-100, 100) / 10000.0; // Mock data
}

int getHunterId() {
  // Implement hunter identification
  // Options: RFID tag, manual input, app pairing
  return 1; // Default hunter for testing
}
```

### Python Example (Raspberry Pi)

```python
import requests
import json
import time
import random
from datetime import datetime
import board
import busio
import adafruit_gps

# Configuration
API_URL = "http://your-domain.com/api/hunters/shots/"
SOUND_THRESHOLD = 80.0  # dB
VIBRATION_THRESHOLD = 50.0  # Hz

class ShotDetector:
    def __init__(self):
        # Initialize GPS
        uart = busio.UART(board.TX, board.RX, baudrate=9600, timeout=10)
        self.gps = adafruit_gps.GPS(uart, debug=False)
        self.gps.send_command(b'PMTK314,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0')
        self.gps.send_command(b'PMTK220,1000')

    def detect_shot(self):
        """Detect if a shot was fired based on sensor readings"""
        sound_level = self.read_sound_sensor()
        vibration_level = self.read_vibration_sensor()

        return (sound_level > SOUND_THRESHOLD and
                vibration_level > VIBRATION_THRESHOLD)

    def read_sound_sensor(self):
        """Read sound level from sensor (implement actual sensor reading)"""
        # Replace with actual sensor reading code
        return random.uniform(70, 120)

    def read_vibration_sensor(self):
        """Read vibration level from sensor"""
        # Replace with actual sensor reading code
        return random.uniform(20, 80)

    def get_gps_coordinates(self):
        """Get current GPS coordinates"""
        self.gps.update()
        if self.gps.has_fix:
            return self.gps.latitude, self.gps.longitude
        else:
            # Return mock coordinates if no GPS fix
            return 40.7128, -74.0060

    def get_hunter_id(self):
        """Get hunter ID (implement identification method)"""
        # Options: RFID reader, manual input, mobile app pairing
        return 1  # Default for testing

    def capture_shot_data(self):
        """Capture all shot-related data"""
        lat, lng = self.get_gps_coordinates()

        shot_data = {
            "hunter": self.get_hunter_id(),
            "location": f"GPS: {lat:.4f}, {lng:.4f}",
            "sound_level": self.read_sound_sensor(),
            "vibration_level": self.read_vibration_sensor(),
            "latitude": lat,
            "longitude": lng,
            "weapon_used": "rifle",  # Detect or get from hunter profile
            "notes": f"Auto-detected at {datetime.now().strftime('%H:%M:%S')}"
        }

        return shot_data

    def send_shot_to_api(self, shot_data):
        """Send shot data to the backend API"""
        try:
            headers = {'Content-Type': 'application/json'}
            response = requests.post(API_URL,
                                   data=json.dumps(shot_data),
                                   headers=headers,
                                   timeout=10)

            if response.status_code == 201:
                print("✅ Shot registered successfully!")
                print(f"Response: {response.json()}")
            else:
                print(f"❌ Error: HTTP {response.status_code}")
                print(f"Response: {response.text}")

        except requests.exceptions.RequestException as e:
            print(f"❌ Network error: {e}")

    def run(self):
        """Main detection loop"""
        print("🎯 Shot detection system started...")

        while True:
            try:
                if self.detect_shot():
                    print("💥 Shot detected! Capturing data...")
                    shot_data = self.capture_shot_data()
                    self.send_shot_to_api(shot_data)

                    # Prevent duplicate detections
                    time.sleep(5)

                time.sleep(0.1)  # 100ms check interval

            except KeyboardInterrupt:
                print("\\n🛑 Shutting down...")
                break
            except Exception as e:
                print(f"❌ Error: {e}")
                time.sleep(1)

if __name__ == "__main__":
    detector = ShotDetector()
    detector.run()
```

## API Response Examples

### Successful Shot Registration (201 Created)

```json
{
  "id": 123,
  "hunter": 1,
  "hunter_name": "John Smith",
  "timestamp": "2025-11-23T14:30:45.123456Z",
  "location": "Forest Area A",
  "sound_level": 95.5,
  "vibration_level": 45.3,
  "latitude": 40.7128,
  "longitude": -74.006,
  "weapon_used": "rifle",
  "notes": "Morning hunt"
}
```

### Error Response (400 Bad Request)

```json
{
  "hunter": ["This field is required."],
  "sound_level": ["A valid number is required."],
  "latitude": ["Ensure this value is greater than or equal to -90."]
}
```

## Testing Your Device

### 1. Test API Connectivity

```bash
curl -X POST http://localhost:8000/api/hunters/shots/ \\
  -H "Content-Type: application/json" \\
  -d '{
    "hunter": 1,
    "location": "Test Location",
    "sound_level": 95.5,
    "vibration_level": 45.3,
    "latitude": 40.7128,
    "longitude": -74.0060,
    "weapon_used": "rifle",
    "notes": "API Test"
  }'
```

### 2. Verify Data in Dashboard

- Open dashboard: `http://localhost:8000`
- Check "Shot Records" table for your test data
- Use filters to find specific shots

## Hunter Management

### Getting Hunter List

```bash
curl http://localhost:8000/api/hunters/hunters/
```

### Creating New Hunter

```bash
curl -X POST http://localhost:8000/api/hunters/hunters/ \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Test Hunter",
    "license_number": "H999",
    "weapon_type": "rifle",
    "current_location": "Test Area",
    "latitude": 40.7128,
    "longitude": -74.0060
  }'
```

## Deployment Considerations

### Security

- Implement device authentication (API keys, certificates)
- Use HTTPS in production
- Encrypt sensitive data transmission
- Validate all input data

### Power Management

- Implement sleep modes between detections
- Use low-power sensors when possible
- Monitor battery levels and send alerts

### Connectivity

- Handle network disconnections gracefully
- Queue shots offline and sync when connected
- Implement retry logic for failed API calls

### Calibration

- Calibrate sensors for accurate readings
- Account for different weapon types and ammunition
- Test in various environmental conditions

## Troubleshooting

### Common Issues

1. **High false positives**: Adjust sensor thresholds
2. **Missing GPS**: Ensure clear sky view, add external antenna
3. **Network timeouts**: Implement retry logic and offline storage
4. **Battery drain**: Optimize sleep cycles and sensor polling

### Debug Tools

- Serial monitor for real-time sensor readings
- API response logging
- GPS fix status monitoring
- Network connectivity checks

## Additional Features

### Advanced Detection

- Machine learning for shot pattern recognition
- Multiple sensor fusion for accuracy
- Environmental condition compensation

### Hunter Identification

- RFID/NFC tag integration
- Smartphone app pairing via Bluetooth
- Biometric sensors (fingerprint, etc.)

### Data Enhancement

- Weather condition recording
- Target type identification
- Ammunition counting integration

---

## Quick Start Checklist

- [ ] Set up hardware components
- [ ] Install required libraries
- [ ] Configure WiFi credentials
- [ ] Set API endpoint URL
- [ ] Calibrate sensors
- [ ] Test API connectivity
- [ ] Implement hunter identification
- [ ] Deploy and test in field conditions
- [ ] Monitor dashboard for data verification

## Support

For technical support or questions about the API:

1. Check the Swagger documentation: `http://localhost:8000/api/docs/`
2. Review API responses for error details
3. Test with curl commands before implementing in device code
4. Monitor Django logs for server-side issues

---

_This guide provides a foundation for developing IoT devices that integrate with the Gun Control IoT Dashboard. Customize the implementation based on your specific hardware and requirements._
