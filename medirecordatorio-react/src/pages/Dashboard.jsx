import React from 'react';
import '../assets/styles/dashboard.css';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="welcome-message">
      <h1>Bienvenido de nuevo, <span>Dr. {user?.nombre || '...'}</span></h1>
      <p>Seleccione una opción del menú para comenzar</p>
    </div>
  );
};

export default Dashboard;
