import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../context/AuthContext';
import '../assets/styles/citas.css';

const Citas = () => {
  const { user } = useAuth();
  const [citasActivas, setCitasActivas] = useState([]);
  const [pacientes, setPacientes] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);

    // Obtener todos los pacientes al inicio
    const cargarPacientes = async () => {
      const snapshot = await getDocs(collection(db, 'pacientes'));
      const datos = {};
      snapshot.forEach(doc => {
        datos[doc.id] = doc.data();
      });
      setPacientes(datos);
    };

    cargarPacientes();

    // Escuchar citas activas del médico actual
    const q = query(collection(db, 'citas'), where('doctorId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = new Date();
      const activas = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(cita => {
          const citaDate = new Date(`${cita.fecha}T${cita.hora}`);
          return cita.estado !== 'Rechazada' && citaDate >= now;
        })
        .sort((a, b) => {
          const dateA = new Date(`${a.fecha}T${a.hora}`);
          const dateB = new Date(`${b.fecha}T${b.hora}`);
          return dateA - dateB;
        });
      setCitasActivas(activas);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const formatDate = (dateString) => {
    try {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="citas-container">
      <h1><i className="fas fa-calendar-alt"></i> Citas Médicas</h1>
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando citas...</p>
        </div>
      ) : citasActivas.length > 0 ? (
        <div className="citas-grid">
          {citasActivas.map(cita => {
            const paciente = pacientes[cita.pacienteId];
            return (
              <div key={cita.id} className="cita-card">
                <div className="appointment-icon">
                  <i className="fas fa-stethoscope"></i>
                </div>
                
                <div className="cita-card-header">
                  <div className="paciente-info">
                    <div className="paciente-avatar">
                      {paciente?.nombre ? paciente.nombre.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="paciente-details">
                      <h3>{paciente?.nombre || 'Paciente'}</h3>
                      <span className="especialidad">{cita.especialidad}</span>
                    </div>
                  </div>
                  {/* Estado removido */}
                </div>
                
                <div className="cita-card-body">
                  <div className="cita-info">
                    <div className="cita-info-item">
                      <i className="fas fa-calendar"></i>
                      <span>{formatDate(cita.fecha)}</span>
                    </div>
                    <div className="cita-info-item">
                      <i className="fas fa-clock"></i>
                      <span>{cita.hora}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="fas fa-calendar-times"></i>
          </div>
          <h2>No hay citas activas</h2>
          <p>No tienes citas programadas en este momento.</p>
        </div>
      )}
    </div>
  );
};

export default Citas;