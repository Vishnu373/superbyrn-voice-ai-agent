import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import VoiceAgent from './components/UserMode/VoiceAgent';
import AdminDashboard from './components/AdminMode/AdminDashboard';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-content">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/patient" element={<VoiceAgent />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
