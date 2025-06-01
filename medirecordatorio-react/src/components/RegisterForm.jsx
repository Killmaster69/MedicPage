import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/firebase';
import toast from 'react-hot-toast';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const RegisterForm = () => {
  const [form, setForm] = useState({
    name: '',
    specialty: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, specialty, phone, email, password, confirmPassword } = form;

    if (!name || !specialty || !phone || !email || !password || !confirmPassword) {
      return toast.error('Todos los campos son obligatorios');
    }

    if (password !== confirmPassword) {
      return toast.error('Las contraseñas no coinciden');
    }

    try {
      setLoading(true);

      // Verificar si ya está registrado en Firestore
      const q = query(collection(db, 'medicos'), where('email', '==', email));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        throw new Error('Este correo ya está registrado.');
      }

      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const medico = {
        uid: user.uid,
        nombre: name,
        especialidad: specialty,
        telefono: phone,
        email,
        activo: true,
        fechaRegistro: new Date()
      };

      // Registrar en Firestore
      await setDoc(doc(db, 'medicos', user.uid), medico);

      toast.success('Registro exitoso. Redirigiendo...');
      navigate('/');
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="medical-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="name">Nombre Completo</label>
        <input type="text" id="name" name="name" value={form.name} onChange={handleChange} required />
      </div>

      <div className="form-group">
        <label htmlFor="specialty">Especialidad</label>
        <input type="text" id="specialty" name="specialty" value={form.specialty} onChange={handleChange} required />
      </div>

      <div className="form-group">
        <label htmlFor="phone">Teléfono</label>
        <input type="tel" id="phone" name="phone" value={form.phone} onChange={handleChange} required />
      </div>

      <div className="form-group">
        <label htmlFor="email">Correo Electrónico</label>
        <input type="email" id="email" name="email" value={form.email} onChange={handleChange} required />
      </div>

      <div className="form-group password-group">
        <label htmlFor="password">Contraseña</label>
        <input type="password" id="password" name="password" value={form.password} onChange={handleChange} required />
      </div>

      <div className="form-group password-group">
        <label htmlFor="confirmPassword">Confirmar Contraseña</label>
        <input type="password" id="confirmPassword" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required />
      </div>

      <button type="submit" className="medical-btn" disabled={loading}>
        {loading ? (
          <div className="spinner"><i className="fas fa-spinner fa-spin"></i></div>
        ) : (
          <span>Registrarse</span>
        )}
      </button>

      <div className="medical-footer">
        ¿Ya tienes una cuenta? <a href="/">Iniciar Sesión</a>
      </div>
    </form>
  );
};

export default RegisterForm;
