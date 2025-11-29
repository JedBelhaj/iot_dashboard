#!/usr/bin/env python3
"""
IoT Gun Sensor Simulator for Raspberry Pi
Simulates gun sensor data and sends to the dashboard API
"""

import requests
import json
import time
import random
import threading
from datetime import datetime
import logging
import sys
import os

# Configuration
API_BASE_URL = "http://192.168.1.3:8000/api"  # Change to your server IP
DEVICE_ID = "IOT-GUN-PI-001"
GUN_ID = 1  # Will be set after registration
HUNTER_ID = 1  # Will be set after hunter registration

# Sensor simulation parameters
BATTERY_LEVEL = 100
FIRMWARE_VERSION = "1.0.0"
SHOT_PROBABILITY = 0.1  # 10% chance per check interval
CHECK_INTERVAL = 5  # Check every 5 seconds

# GPS coordinates (Forest area simulation)
BASE_LATITUDE = 40.7128
BASE_LONGITUDE = -74.0060
GPS_VARIANCE = 0.001  # Small variance for movement simulation

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('iot_gun_sensor.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class IoTGunSensor:
    def __init__(self):
        self.device_id = DEVICE_ID
        self.gun_id = GUN_ID
        self.hunter_id = HUNTER_ID
        self.battery_level = BATTERY_LEVEL
        self.firmware_version = FIRMWARE_VERSION
        self.is_running = False
        self.session = requests.Session()
        self.session.timeout = 10
        
    def get_current_location(self):
        """Simulate GPS movement within a small area"""
        lat = BASE_LATITUDE + random.uniform(-GPS_VARIANCE, GPS_VARIANCE)
        lng = BASE_LONGITUDE + random.uniform(-GPS_VARIANCE, GPS_VARIANCE)
        return lat, lng
    
    def simulate_sound_level(self):
        """Simulate gunshot sound level (130-160 dB)"""
        return random.uniform(130.0, 160.0)
    
    def simulate_vibration_level(self):
        """Simulate recoil vibration (15-35 Hz)"""
        return random.uniform(15.0, 35.0)
    
    def register_hunter_if_needed(self):
        """Register a test hunter if none exists"""
        try:
            response = self.session.get(f"{API_BASE_URL}/hunters/hunters/")
            if response.status_code == 200:
                hunters = response.json()
                if isinstance(hunters, dict) and 'results' in hunters:
                    hunters = hunters['results']
                
                if hunters:
                    self.hunter_id = hunters[0]['id']
                    logger.info(f"Using existing hunter ID: {self.hunter_id}")
                    return True
                    
            # Create new hunter
            hunter_data = {
                "name": "Pi IoT Hunter",
                "license_number": f"PI-LIC-{random.randint(1000, 9999)}",
                "current_location": "IoT Testing Zone",
                "latitude": BASE_LATITUDE,
                "longitude": BASE_LONGITUDE,
                "is_active": True
            }
            
            response = self.session.post(
                f"{API_BASE_URL}/hunters/hunters/",
                json=hunter_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 201:
                hunter = response.json()
                self.hunter_id = hunter['id']
                logger.info(f"Registered new hunter with ID: {self.hunter_id}")
                return True
            else:
                logger.error(f"Failed to register hunter: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Error registering hunter: {e}")
            return False
    
    def register_gun_if_needed(self):
        """Register the IoT gun device if not already registered"""
        try:
            # Check if gun already exists
            response = self.session.get(f"{API_BASE_URL}/hunters/guns/")
            if response.status_code == 200:
                guns = response.json()
                if isinstance(guns, dict) and 'results' in guns:
                    guns = guns['results']
                
                for gun in guns:
                    if gun.get('device_id') == self.device_id:
                        self.gun_id = gun['id']
                        logger.info(f"Using existing gun ID: {self.gun_id}")
                        return True
            
            # Register new gun
            gun_data = {
                "device_id": self.device_id,
                "serial_number": f"PI-SN-{random.randint(100000, 999999)}",
                "make": "Raspberry Pi",
                "model": "IoT Sensor Gun",
                "caliber": ".308",
                "weapon_type": "rifle",
                "owner": self.hunter_id,
                "battery_level": self.battery_level,
                "firmware_version": self.firmware_version,
                "status": "active",
                "notes": "IoT simulation device running on Raspberry Pi"
            }
            
            response = self.session.post(
                f"{API_BASE_URL}/hunters/guns/",
                json=gun_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 201:
                gun = response.json()
                self.gun_id = gun['id']
                logger.info(f"Registered new gun with ID: {self.gun_id}")
                return True
            else:
                logger.error(f"Failed to register gun: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Error registering gun: {e}")
            return False
    
    def record_shot(self):
        """Record a shot event with sensor data"""
        try:
            lat, lng = self.get_current_location()
            
            shot_data = {
                "gun": self.gun_id,
                "sound_level": self.simulate_sound_level(),
                "vibration_level": self.simulate_vibration_level(),
                "latitude": lat,
                "longitude": lng,
                "notes": f"Simulated shot from {self.device_id} at {datetime.now().isoformat()}"
            }
            
            response = self.session.post(
                f"{API_BASE_URL}/hunters/shots/",
                json=shot_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 201:
                shot = response.json()
                logger.info(f"Shot recorded successfully: ID {shot.get('id', 'unknown')}")
                logger.info(f"  Sound Level: {shot_data['sound_level']:.1f} dB")
                logger.info(f"  Vibration: {shot_data['vibration_level']:.1f} Hz")
                logger.info(f"  Location: {lat:.4f}, {lng:.4f}")
                return True
            else:
                logger.error(f"Failed to record shot: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Error recording shot: {e}")
            return False
    
    def update_device_status(self):
        """Update device battery and sync status"""
        try:
            # Simulate battery drain
            if self.battery_level > 5:
                self.battery_level -= random.uniform(0.1, 0.5)
            
            # Update gun status
            update_data = {
                "battery_level": int(self.battery_level),
                "last_sync": datetime.now().isoformat() + "Z"
            }
            
            response = self.session.patch(
                f"{API_BASE_URL}/hunters/guns/{self.gun_id}/",
                json=update_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                logger.debug(f"Device status updated - Battery: {self.battery_level:.1f}%")
                return True
            else:
                logger.warning(f"Failed to update device status: {response.status_code}")
                return False
                
        except Exception as e:
            logger.warning(f"Error updating device status: {e}")
            return False
    
    def check_server_connectivity(self):
        """Test connection to the dashboard server"""
        try:
            response = self.session.get(f"{API_BASE_URL}/dashboard-stats/")
            return response.status_code == 200
        except Exception:
            return False
    
    def sensor_loop(self):
        """Main sensor monitoring loop"""
        logger.info("Starting IoT gun sensor monitoring...")
        
        while self.is_running:
            try:
                # Check for shot event
                if random.random() < SHOT_PROBABILITY:
                    logger.info("Shot detected by sensors!")
                    if not self.record_shot():
                        logger.warning("Failed to record shot data")
                
                # Update device status periodically
                if random.random() < 0.2:  # 20% chance to update status
                    self.update_device_status()
                
                # Check battery level
                if self.battery_level < 20:
                    logger.warning(f"Low battery warning: {self.battery_level:.1f}%")
                
                time.sleep(CHECK_INTERVAL)
                
            except KeyboardInterrupt:
                logger.info("Received interrupt signal, shutting down...")
                self.is_running = False
                break
            except Exception as e:
                logger.error(f"Error in sensor loop: {e}")
                time.sleep(CHECK_INTERVAL)
    
    def start(self):
        """Start the IoT gun sensor"""
        logger.info(f"IoT Gun Sensor starting - Device ID: {self.device_id}")
        logger.info(f"Connecting to server: {API_BASE_URL}")
        
        # Check server connectivity
        if not self.check_server_connectivity():
            logger.error("Cannot connect to dashboard server. Please check the API_BASE_URL and server status.")
            return False
        
        logger.info("Server connection established")
        
        # Register hunter and gun
        if not self.register_hunter_if_needed():
            logger.error("Failed to register hunter")
            return False
            
        if not self.register_gun_if_needed():
            logger.error("Failed to register gun device")
            return False
        
        logger.info("Device registration completed successfully")
        logger.info(f"Hunter ID: {self.hunter_id}, Gun ID: {self.gun_id}")
        
        # Start sensor monitoring
        self.is_running = True
        sensor_thread = threading.Thread(target=self.sensor_loop, daemon=True)
        sensor_thread.start()
        
        logger.info("IoT Gun Sensor is now active and monitoring...")
        logger.info("Press Ctrl+C to stop")
        
        try:
            sensor_thread.join()
        except KeyboardInterrupt:
            logger.info("Shutting down IoT Gun Sensor...")
            self.is_running = False
            
        return True
    
    def stop(self):
        """Stop the IoT gun sensor"""
        self.is_running = False
        logger.info("IoT Gun Sensor stopped")

def main():
    """Main function"""
    print("=" * 60)
    print("IoT Gun Sensor Simulator for Raspberry Pi")
    print("Connects to Django Dashboard and simulates gun sensor data")
    print("=" * 60)
    
    # Check if running on Raspberry Pi
    try:
        with open('/proc/cpuinfo', 'r') as f:
            cpuinfo = f.read()
            if 'Raspberry Pi' in cpuinfo:
                print("✓ Running on Raspberry Pi detected")
            else:
                print("⚠ Not running on Raspberry Pi (simulation mode)")
    except:
        print("⚠ Could not detect Raspberry Pi (running anyway)")
    
    print(f"Server URL: {API_BASE_URL}")
    print(f"Device ID: {DEVICE_ID}")
    print(f"Check Interval: {CHECK_INTERVAL} seconds")
    print("-" * 60)
    
    # Create and start sensor
    sensor = IoTGunSensor()
    
    try:
        sensor.start()
    except Exception as e:
        logger.error(f"Failed to start IoT Gun Sensor: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)