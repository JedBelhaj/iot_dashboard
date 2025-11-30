import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Hunters from "./pages/Hunters";
import Guns from "./pages/Guns";
import Shots from "./pages/Shots";
import Ammunition from "./pages/Ammunition";
import Compliance from "./pages/Compliance";
import Activities from "./pages/Activities";
import Zones from "./pages/Zones";
import Licenses from "./pages/Licenses";
import "./index.css";
import "./App.css";

function App() {
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [currentTime, setCurrentTime] = useState("");

  // Time Update
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString());
    };

    updateTime();
    const timeInterval = setInterval(updateTime, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  // Connection Status Check
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch(
          "http://192.168.1.3:8000/api/dashboard-stats/"
        );
        if (response.ok) {
          setConnectionStatus("connected");
        } else {
          setConnectionStatus("disconnected");
        }
      } catch (error) {
        setConnectionStatus("disconnected");
      }
    };

    checkConnection();
    const connectionInterval = setInterval(checkConnection, 10000); // Check every 10 seconds
    return () => clearInterval(connectionInterval);
  }, []);

  return (
    <Router>
      <div className="app">
        <Navbar connectionStatus={connectionStatus} currentTime={currentTime} />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/hunters" element={<Hunters />} />
            <Route path="/guns" element={<Guns />} />
            <Route path="/shots" element={<Shots />} />
            <Route path="/ammunition" element={<Ammunition />} />
            <Route path="/compliance" element={<Compliance />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/zones" element={<Zones />} />
            <Route path="/licenses" element={<Licenses />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
