# IoT Gun Control & Hunting Management System

A comprehensive full-stack IoT dashboard for monitoring gun control and hunting activities using real-time sensor data, built with Django backend and vanilla JavaScript frontend.

## 🏗️ Architecture

### Backend (Django)

- **Django REST Framework** - RESTful API endpoints
- **Django Channels** - WebSocket support for real-time data
- **SQLite Database** - Development database (easily switchable to PostgreSQL)
- **Redis** - Channel layer for WebSocket connections

### Frontend

- **Vanilla JavaScript** - No frameworks, pure JS
- **WebSocket Client** - Real-time sensor data updates
- **REST API Integration** - CRUD operations
- **Responsive Design** - Mobile-friendly interface

### IoT Simulation

- **Sensor Data Generation** - Sound, vibration, and GPS sensors
- **Real-time Streaming** - WebSocket-based live updates
- **Activity Logging** - Comprehensive system event tracking

## 📁 Project Structure

```
dashboard iot/
├── index.html              # Frontend dashboard
├── css/style.css          # Styling
├── js/main.js            # Frontend logic with API integration
├── README.md             # This file
└── backend/              # Django backend
    ├── manage.py
    ├── requirements.txt
    ├── .env
    ├── iot_dashboard/    # Main Django project
    │   ├── settings.py
    │   ├── urls.py
    │   ├── asgi.py       # WebSocket configuration
    │   ├── views.py      # Main API views
    │   └── management/   # Custom commands
    ├── hunters/          # Hunter management app
    │   ├── models.py     # Hunter, Shot models
    │   ├── views.py      # API views
    │   ├── serializers.py
    │   └── urls.py
    ├── sensors/          # IoT sensor data app
    │   ├── models.py     # SensorReading, SensorDevice models
    │   ├── views.py      # Sensor API views
    │   ├── consumers.py  # WebSocket consumers
    │   └── routing.py    # WebSocket routing
    ├── ammunition/       # Ammunition inventory app
    │   ├── models.py     # Ammunition, Transaction models
    │   └── views.py      # Inventory API views
    └── activities/       # Activity logging app
        ├── models.py     # Activity, Alert models
        └── views.py      # Activity API views
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Node.js (for frontend development server, optional)
- Redis (for WebSocket support)

### Backend Setup

1. **Navigate to backend directory:**

   ```bash
   cd "backend"
   ```

2. **Create virtual environment:**

   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   # source venv/bin/activate  # Linux/Mac
   ```

3. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

4. **Run migrations:**

   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Create superuser (optional):**

   ```bash
   python manage.py createsuperuser
   ```

6. **Populate with mock data:**

   ```bash
   python manage.py populate_mock_data --hunters 15 --shots 100 --sensors 200
   ```

7. **Start Redis server (required for WebSocket):**

   ```bash
   redis-server
   ```

8. **Run Django development server:**
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. **Open the dashboard:**

   - Open `index.html` directly in a web browser, or
   - Serve via local server: `python -m http.server 8080` (from project root)

2. **Access the application:**
   - Frontend: `http://localhost:8080` or file://path/to/index.html
   - Backend API: `http://localhost:8000/api/`
   - Django Admin: `http://localhost:8000/admin/`

## 📊 Features

### Real-time Monitoring

- **Live Sensor Data**: Sound, vibration, and GPS tracking via WebSocket
- **Dashboard Statistics**: Active hunters, total shots, ammunition inventory
- **Activity Feed**: Real-time system events and alerts

### Hunter Management

- **Registration System**: Add new hunters with licenses and weapon types
- **Shot Tracking**: Automatic and manual shot recording with sensor data
- **Location Monitoring**: GPS-based hunter location tracking

### Ammunition Control

- **Inventory Management**: Track ammunition by type and location
- **Purchase Recording**: Log ammunition purchases and transactions
- **Low Stock Alerts**: Automatic notifications for inventory thresholds

### Sensor Integration

- **Multiple Sensor Types**: Sound level, vibration, GPS, temperature, humidity
- **Device Management**: Monitor sensor device status and battery levels
- **Anomaly Detection**: Flag unusual readings for investigation

### Activity Logging

- **Comprehensive Logging**: All system events tracked with timestamps
- **Alert System**: Critical notifications with acknowledgment workflow
- **Historical Data**: Complete audit trail of all activities

## 🔧 API Endpoints

### Dashboard Statistics

- `GET /api/dashboard-stats/` - Overall dashboard statistics
- `GET /api/system-status/` - System status and latest sensor readings

### Hunters

- `GET /api/hunters/hunters/` - List all hunters
- `POST /api/hunters/hunters/` - Register new hunter
- `GET /api/hunters/hunters/active/` - List active hunters
- `GET /api/hunters/hunters/statistics/` - Hunter statistics
- `POST /api/hunters/hunters/{id}/record_shot/` - Record shot for hunter

### Shots

- `GET /api/hunters/shots/` - List all shots
- `POST /api/hunters/shots/` - Record new shot
- `GET /api/hunters/shots/recent/` - Recent shots (24 hours)

### Sensors

- `GET /api/sensors/readings/` - List sensor readings
- `GET /api/sensors/readings/latest/` - Latest readings by type
- `GET /api/sensors/readings/statistics/` - Sensor statistics
- `GET /api/sensors/devices/` - List sensor devices
- `POST /api/sensors/devices/{id}/update_status/` - Update device status

### Ammunition

- `GET /api/ammunition/inventory/` - Ammunition inventory
- `POST /api/ammunition/inventory/` - Add ammunition
- `GET /api/ammunition/inventory/inventory_summary/` - Inventory summary
- `POST /api/ammunition/inventory/{id}/add_stock/` - Add stock

### Activities

- `GET /api/activities/activities/` - List activities
- `GET /api/activities/activities/recent/` - Recent activities
- `POST /api/activities/activities/mark_all_read/` - Mark all as read
- `GET /api/activities/alerts/` - System alerts
- `GET /api/activities/alerts/active/` - Active alerts

### WebSocket

- `ws://localhost:8000/ws/sensors/` - Real-time sensor data stream

## 🛠️ Configuration

### Environment Variables (.env)

```env
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0
DATABASE_URL=sqlite:///db.sqlite3
REDIS_URL=redis://localhost:6379/0
CORS_ALLOW_ALL_ORIGINS=True
```

### Database Models

#### Hunter Model

- Personal information (name, license)
- Weapon type and location
- Activity tracking
- GPS coordinates

#### Shot Model

- Hunter reference
- Timestamp and location
- Sensor data (sound/vibration levels)
- Weapon used and notes

#### SensorReading Model

- Sensor type and value
- Device information
- Location data
- Quality indicators

#### Ammunition Model

- Type and quantity
- Purchase information
- Inventory management
- Stock level tracking

### WebSocket Integration

The system uses Django Channels for real-time communication:

1. **Connection**: Frontend connects to WebSocket on page load
2. **Data Stream**: Server sends sensor updates every 3 seconds
3. **Shot Detection**: High sound/vibration triggers shot events
4. **Fallback**: Polls REST API if WebSocket fails

## 🔍 Development

### Adding New Sensor Types

1. **Update Model**: Add to `SensorReading.SENSOR_TYPES`
2. **Update Consumer**: Add logic in `sensors/consumers.py`
3. **Update Frontend**: Handle new sensor type in JavaScript
4. **Migration**: Run `python manage.py makemigrations`

### Custom Management Commands

```bash
# Populate mock data
python manage.py populate_mock_data --hunters 20 --shots 150

# Custom commands can be added in:
# iot_dashboard/management/commands/
```

### Testing

```bash
# Run Django tests
python manage.py test

# Test API endpoints
curl http://localhost:8000/api/dashboard-stats/

# Test WebSocket (using wscat)
wscat -c ws://localhost:8000/ws/sensors/
```

## 📱 Mobile Support

The dashboard is fully responsive and works on:

- Desktop browsers
- Tablets
- Mobile phones
- Touch interfaces

## 🔐 Security Considerations

For production deployment:

1. **Environment Variables**: Use proper secret management
2. **CORS Configuration**: Restrict allowed origins
3. **Database**: Use PostgreSQL instead of SQLite
4. **HTTPS**: Enable SSL certificates
5. **Authentication**: Add user authentication system
6. **Rate Limiting**: Implement API rate limiting

## 📈 Performance

### Optimization Features

- **Database Indexing**: Optimized queries on frequently accessed fields
- **API Pagination**: Large datasets split into pages
- **WebSocket Efficiency**: Only sends updates when data changes
- **Frontend Caching**: Minimal API calls with smart caching

### Scaling Considerations

- **Database**: Switch to PostgreSQL for production
- **Redis**: Use Redis Cluster for multiple servers
- **Load Balancing**: Use nginx for static files
- **Monitoring**: Add logging and monitoring tools

## 🐛 Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**

   - Ensure Redis is running
   - Check firewall settings
   - Verify WebSocket URL in frontend

2. **API Errors**

   - Check Django server is running
   - Verify CORS settings
   - Check browser console for errors

3. **Database Issues**
   - Run migrations: `python manage.py migrate`
   - Check database permissions
   - Reset DB: `python manage.py flush`

### Logs

- Django logs: `backend/django.log`
- Browser console: F12 Developer Tools
- Redis logs: Check Redis server output

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎯 Future Enhancements

- [ ] Machine learning for shot pattern analysis
- [ ] Mobile app with React Native
- [ ] Advanced analytics dashboard
- [ ] Integration with actual IoT sensors
- [ ] Multi-location support
- [ ] Advanced user roles and permissions
- [ ] Automated reporting system
- [ ] Integration with external databases

---

**Note**: This system includes both simulated data for demonstration and real API integration. The WebSocket connection provides real-time updates, while the REST API handles all CRUD operations. The system gracefully falls back to simulated data if the backend is unavailable.
