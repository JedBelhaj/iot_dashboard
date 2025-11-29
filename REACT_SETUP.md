# IoT Dashboard Frontend Setup

## Prerequisites

Make sure you have Node.js installed (version 14 or higher)

## Setup Commands

### 1. Navigate to frontend directory

```powershell
cd "C:\other disk\cv\projects\dashboard iot\frontend"
```

### 2. Install dependencies

```powershell
npm install
```

### 3. Start development server

```powershell
npm start
```

The React app will start at http://localhost:3000 and automatically proxy API requests to your Django backend at http://192.168.1.3:8000

## Features

✅ **Real-time Updates** - Polls for new data every 5 seconds without page reload
✅ **Smooth Animations** - New entries slide in with highlight animation
✅ **Modern UI** - Clean, responsive React interface
✅ **Live Stats** - Auto-updating statistics
✅ **Connection Status** - Shows real-time connection status
✅ **No Page Reloads** - Single Page Application (SPA)
✅ **Performance** - Only updates changed data
✅ **Mobile Responsive** - Works on all devices

## How it works

- **Initial Load**: Fetches all data on startup
- **Real-time Polling**: Checks for new shots every 5 seconds
- **Smart Updates**: Only adds new items, doesn't reload everything
- **Visual Feedback**: New items get animated highlighting
- **Connection Monitoring**: Shows connection status in header

The dashboard will automatically update when your IoT gun sensor creates new shot records!
