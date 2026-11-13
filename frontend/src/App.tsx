import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import DoctorSearch from './pages/DoctorSearch';
import ConsultationDashboard from './pages/ConsultationDashboard';
import Chat from './pages/Chat';
import AdminDashboard from './pages/AdminDashboard';
import UserDirectory from './pages/UserDirectory';
import DirectChat from './pages/DirectChat';
import DoctorProfile from './pages/DoctorProfile';
import HealthRecords from './pages/HealthRecords';

// A simple auth context could be wrapped here
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/doctors" element={<DoctorSearch />} />
        <Route path="/dashboard" element={<ConsultationDashboard />} />
        <Route path="/doctor-profile" element={<DoctorProfile />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/users" element={<UserDirectory />} />
        <Route path="/health-records" element={<HealthRecords />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/chat/:consultationId" element={<Chat />} />
        <Route path="/direct-chat/:recipientId" element={<Chat />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
