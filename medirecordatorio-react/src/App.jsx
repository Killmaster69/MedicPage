import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Pacientes from './pages/Pacientes';
import Medicamentos from './pages/Medicamentos';
import Citas from './pages/Citas';
import Reportes from './pages/Reportes';
import MainLayout from './components/DashboardLayout';

import { Toaster } from 'react-hot-toast'; // ✅ Importante
import './assets/styles/styles.css';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" /> {/* ✅ Necesario para mostrar toasts */}
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pacientes" element={<Pacientes />} />
            <Route path="/medicamentos" element={<Medicamentos />} />
            <Route path="/citas" element={<Citas />} />
            <Route path="/reportes" element={<Reportes />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
