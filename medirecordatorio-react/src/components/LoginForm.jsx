import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/firebase';
import {
  signInWithEmailAndPassword
} from 'firebase/auth';
import {
  doc,
  getDoc
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import '../assets/styles/styles.css';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Autenticación
      const cred = await signInWithEmailAndPassword(auth, email, password);

      // Obtener datos del médico desde Firestore
      const userDocRef = doc(db, 'medicos', cred.user.uid);
      const snapshot = await getDoc(userDocRef);

      if (!snapshot.exists()) {
        throw new Error('Usuario no registrado en la base de datos.');
      }

      const userData = snapshot.data();
      localStorage.setItem('medicoData', JSON.stringify(userData));
      toast.success('Inicio de sesión exitoso');
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="medical-form" onSubmit={handleLogin}>
      <div id="login-error" className="error-message" style={{ display: 'none' }}></div>

      <div className="form-group">
        <label htmlFor="email">Correo Electrónico</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          required
        />
      </div>

      <div className="form-group password-group">
        <label htmlFor="password">Contraseña</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
      </div>

      <button type="submit" className="medical-btn" disabled={loading}>
        {loading ? (
          <div className="spinner"><i className="fas fa-spinner fa-spin"></i></div>
        ) : (
          <span>Iniciar Sesión</span>
        )}
      </button>

      <div className="medical-footer">
        ¿No tiene una cuenta? <a href="/register">Registrarse</a>
      </div>
    </form>
  );
};

export default LoginForm;
