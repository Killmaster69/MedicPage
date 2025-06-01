// Login.jsx
import React from 'react';
import LoginForm from '../components/LoginForm';
import '../assets/styles/styles.css';

const Login = () => (
  <div className="login-page">
  <div className="medical-container">
    <div className="medical-header">
      <div className="medical-logo">
        <i className="fas fa-heartbeat"></i>
        <span>MediRecordatorio</span>
      </div>
      <p className="medical-subtitle">Portal para Médicos</p>
    </div>
    
    <LoginForm />
  </div>
  </div>
);

export default Login;
