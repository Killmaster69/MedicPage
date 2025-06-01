import React, { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import toast from 'react-hot-toast';
import '../assets/styles/pacientes.css';

const Pacientes = () => {
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    domicilio: '',
    correo: ''
  });

  const [pacientes, setPacientes] = useState([]);

  const pacientesRef = collection(db, 'pacientes');

  useEffect(() => {
    const unsubscribe = onSnapshot(pacientesRef, (snapshot) => {
      const pacientesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setPacientes(pacientesData);
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Validar campos obligatorios
      const { nombre, telefono, domicilio, correo } = form;
      if (!nombre || !telefono || !domicilio) {
        toast.error('Por favor completa todos los campos obligatorios');
        return;
      }

      // Verificar si el correo ya está registrado
      if (correo) {
        const q = query(pacientesRef, where('correo', '==', correo));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          toast.error('Este correo ya está registrado');
          return;
        }
      }

      // Registrar en Firestore
      await addDoc(pacientesRef, {
        ...form,
        fechaRegistro: serverTimestamp()
      });

      toast.success('Paciente registrado correctamente');

      setForm({
        nombre: '',
        telefono: '',
        domicilio: '',
        correo: ''
      });
    } catch (error) {
      console.error('Error al registrar paciente:', error);
      toast.error('Error al registrar paciente');
    }
  };

  const eliminarPaciente = async (id) => {
    if (confirm('¿Deseas eliminar este paciente?')) {
      try {
        await deleteDoc(doc(db, 'pacientes', id));
        toast.success('Paciente eliminado');
      } catch (error) {
        console.error('Error al eliminar paciente:', error);
        toast.error('Error al eliminar paciente');
      }
    }
  };

  return (
    <div className="patients-main-container">
      <div className="patients-header">
        <div className="patients-logo">
          <i className="fas fa-user-md"></i>
          <span>MediRecordatorio</span>
        </div>
        <div className="patients-subtitle">Registro de Pacientes</div>
      </div>

      <div className="patients-content">
        <div className="patients-form-section">
          <h3 className="patients-section-title">Datos del Paciente</h3>
          <form onSubmit={handleSubmit}>
            <div className="patients-form-group">
              <label htmlFor="nombre" className="patients-label">Nombre completo</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                className="patients-input"
                value={form.nombre}
                onChange={handleChange}
                required
              />
            </div>

            <div className="patients-form-group">
              <label htmlFor="telefono" className="patients-label">Teléfono</label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                className="patients-input"
                value={form.telefono}
                onChange={handleChange}
                required
              />
            </div>

            <div className="patients-form-group">
              <label htmlFor="domicilio" className="patients-label">Domicilio</label>
              <input
                type="text"
                id="domicilio"
                name="domicilio"
                className="patients-input"
                value={form.domicilio}
                onChange={handleChange}
                required
              />
            </div>

            <div className="patients-form-group">
              <label htmlFor="correo" className="patients-label">Correo electrónico</label>
              <input
                type="email"
                id="correo"
                name="correo"
                className="patients-input"
                value={form.correo}
                onChange={handleChange}
              />
            </div>

            <div className="patients-action-buttons">
              <button type="reset" className="patients-btn patients-btn-danger">
                <i className="fas fa-times"></i> Cancelar
              </button>
              <button type="submit" className="patients-btn patients-btn-primary">
                <i className="fas fa-save"></i> Registrar Paciente
              </button>
            </div>
          </form>
        </div>

        <div className="patients-table-container">
          <h3 className="patients-section-title">Pacientes Registrados</h3>
          <table className="patients-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Domicilio</th>
                <th>Correo</th>
              </tr>
            </thead>
            <tbody>
              {pacientes.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'gray' }}>
                    No hay pacientes registrados
                  </td>
                </tr>
              ) : (
                pacientes.map((paciente) => (
                  <tr key={paciente.id}>
                    <td>{paciente.nombre}</td>
                    <td>{paciente.telefono}</td>
                    <td>{paciente.domicilio}</td>
                    <td>{paciente.correo || 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Pacientes;
