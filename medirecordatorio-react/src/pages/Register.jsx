import React from 'react';
import RegisterForm from '../components/RegisterForm';
import '../assets/styles/styles.css';

const Register = () => {
  return (
    <div className="register-page">
      <div className="medical-container">
        <div className="medical-header">
          <div className="medical-logo">
            <i className="fas fa-heartbeat"></i>
            <span>MediRecordatorio</span>
          </div>
          <p className="medical-subtitle">Registro de Médico</p>
        </div>

        <RegisterForm />
      </div>
    </div>
  );
};

export default Register;
