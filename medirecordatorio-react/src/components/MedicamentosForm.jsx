import React, { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import toast from 'react-hot-toast';
import '../assets/styles/medicamentos.css';

const MedicamentosForm = () => {
  const [form, setForm] = useState({
    pacienteId: '',
    medicamentoId: '',
    fechaInicio: '',
    duracion: '',
    horaToma: ''
  });

  const [pacientes, setPacientes] = useState([]);
  const [medicamentos, setMedicamentos] = useState([]);
  const [busquedaPaciente, setBusquedaPaciente] = useState('');
  const [busquedaMedicamento, setBusquedaMedicamento] = useState('');
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [medicamentoSeleccionado, setMedicamentoSeleccionado] = useState(null);
  const [recetas, setRecetas] = useState([]);

  useEffect(() => {
    const obtenerDatos = async () => {
      const pacientesSnap = await getDocs(collection(db, 'pacientes'));
      const medicamentosSnap = await getDocs(collection(db, 'medicamentos'));

      setPacientes(pacientesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setMedicamentos(medicamentosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    obtenerDatos();
  }, []);

  const seleccionarPaciente = (paciente) => {
    setForm(prev => ({ ...prev, pacienteId: paciente.id }));
    setPacienteSeleccionado(paciente);
    setBusquedaPaciente('');
  };

  const seleccionarMedicamento = (med) => {
    setForm(prev => ({ ...prev, medicamentoId: med.id }));
    setMedicamentoSeleccionado(med);
    setBusquedaMedicamento('');
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const agregarMedicamentoAlPlan = () => {
    if (!medicamentoSeleccionado || !form.fechaInicio || !form.duracion || !form.horaToma) {
      toast.error('Complete todos los campos antes de agregar');
      return;
    }

    setRecetas(prev => [
      ...prev,
      {
        id: medicamentoSeleccionado.id,
        nombre: medicamentoSeleccionado.nombre,
        fechaInicio: form.fechaInicio,
        duracion: form.duracion,
        horaToma: form.horaToma,
      }
    ]);

    setForm(prev => ({
      ...prev,
      medicamentoId: '',
      fechaInicio: '',
      duracion: '',
      horaToma: ''
    }));
    setMedicamentoSeleccionado(null);
  };

  const quitarMedicamento = (index) => {
    setRecetas(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!pacienteSeleccionado || recetas.length === 0) {
      toast.error('Debe seleccionar un paciente y agregar al menos un medicamento');
      return;
    }

    try {
      const batch = recetas.map((receta) => {
        // Sumar un día a la fecha seleccionada antes de enviarla a Firebase
        const fecha = new Date(`${receta.fechaInicio}T00:00:00`);
        fecha.setDate(fecha.getDate() + 1);
        const fechaInicio = fecha.toISOString().slice(0, 10);

        return addDoc(collection(db, 'recetas'), {
          pacienteId: pacienteSeleccionado.id,
          medicamentoId: receta.id,
          fechaInicio,
          duracion: receta.duracion,
          horaToma: receta.horaToma,
          fechaRegistro: serverTimestamp(),
        });
      });

      await Promise.all(batch);
      toast.success('Recetas guardadas exitosamente');

      setRecetas([]);
      setForm({
        pacienteId: '',
        medicamentoId: '',
        fechaInicio: '',
        duracion: '',
        horaToma: ''
      });
      setPacienteSeleccionado(null);
      setMedicamentoSeleccionado(null);
    } catch (error) {
      console.error(error);
      toast.error('Error al guardar las recetas');
    }
  };

  return (
    <div className="card-body">
      {/* Paciente */}
      <div className="form-section">
        <h3>Información del Paciente</h3>
        <div className="form-group full-width">
          <label>Buscar Paciente</label>
          <input
            type="text"
            placeholder="Buscar por nombre o ID"
            value={busquedaPaciente}
            onChange={(e) => setBusquedaPaciente(e.target.value)}
          />
          {busquedaPaciente && (
            <div className="search-results">
              {pacientes
                .filter((p) =>
                  (p.nombre && p.nombre.toLowerCase().includes(busquedaPaciente.toLowerCase())) ||
                  p.id.includes(busquedaPaciente)
                )
                .length === 0 ? (
                  <div className="search-item">No se encontraron pacientes.</div>
                ) : (
                  pacientes
                    .filter((p) =>
                      (p.nombre && p.nombre.toLowerCase().includes(busquedaPaciente.toLowerCase())) ||
                      p.id.includes(busquedaPaciente)
                    )
                    .map((p) => (
                      <div key={p.id} className="search-item" onClick={() => seleccionarPaciente(p)}>
                        {p.nombre} ({p.id})
                      </div>
                    ))
                )}
            </div>
          )}
        </div>

        {pacienteSeleccionado && (
          <div className="form-row">
            <div className="form-group">
              <label>ID del Paciente</label>
              <input type="text" value={pacienteSeleccionado.id} readOnly />
            </div>
            <div className="form-group">
              <label>Nombre</label>
              <input type="text" value={pacienteSeleccionado.nombre} readOnly />
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input type="text" value={pacienteSeleccionado.telefono} readOnly />
            </div>
          </div>
        )}
      </div>

      <div className="form-section">
        <h3>Información del Medicamento</h3>
        <div className="form-group full-width">
          <label>Buscar Medicamento</label>
          <input
            type="text"
            placeholder="Buscar por nombre"
            value={busquedaMedicamento}
            onChange={(e) => setBusquedaMedicamento(e.target.value)}
          />
          {busquedaMedicamento && (
            <div className="search-results">
              {medicamentos
                .filter((m) =>
                  m.nombre && m.nombre.toLowerCase().includes(busquedaMedicamento.toLowerCase())
                )
                .length === 0 ? (
                  <div className="search-item">No se encontraron medicamentos.</div>
                ) : (
                  medicamentos
                    .filter((m) =>
                      m.nombre && m.nombre.toLowerCase().includes(busquedaMedicamento.toLowerCase())
                    )
                    .map((m) => (
                      <div key={m.id} className="search-item" onClick={() => seleccionarMedicamento(m)}>
                        {m.nombre} ({m.id})
                      </div>
                    ))
                )}
            </div>
          )}
        </div>

        {medicamentoSeleccionado && (
          <div className="form-row">
            <div className="form-group">
              <label>ID del Medicamento</label>
              <input type="text" value={medicamentoSeleccionado.id} readOnly />
            </div>
            <div className="form-group">
              <label>Nombre</label>
              <input type="text" value={medicamentoSeleccionado.nombre} readOnly />
            </div>
            <div className="form-group">
              <label>Ingrediente</label>
              <input type="text" value={medicamentoSeleccionado.ingrediente} readOnly />
            </div>
            <div className="form-group">
              <label>Fecha de Caducidad</label>
              <input type="date" value={medicamentoSeleccionado.fechaCaducidad} readOnly />
            </div>
          </div>
        )}
      </div>

      {/* Dosificación */}
      <div className="form-section">
        <h3>Instrucciones de Dosificación</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Fecha de Inicio</label>
            <input type="date" name="fechaInicio" value={form.fechaInicio} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Duración (días)</label>
            <input type="number" name="duracion" value={form.duracion} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Hora de Toma</label>
            <input type="time" name="horaToma" value={form.horaToma} onChange={handleChange} />
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={agregarMedicamentoAlPlan}>
            Agregar al Plan
          </button>
        </div>
      </div>

      {/* Lista de Medicamentos Agregados */}
      {recetas.length > 0 && (
        <div className="med-list-preview">
          <h4>Medicamentos Agregados al Plan</h4>
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Fecha Inicio</th>
                <th>Duración</th>
                <th>Hora Toma</th>
                <th>Quitar</th>
              </tr>
            </thead>
            <tbody>
              {recetas.map((r, i) => (
                <tr key={i}>
                  <td>{r.nombre}</td>
                  <td>{r.fechaInicio}</td>
                  <td>{r.duracion} días</td>
                  <td>{r.horaToma}</td>
                  <td>
                    <button type="button" onClick={() => quitarMedicamento(i)} className="btn btn-danger btn-sm">
                      ❌
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={() => setRecetas([])}>Cancelar</button>
        <button type="button" className="btn btn-primary" onClick={handleSubmit}>Guardar Recetas</button>
      </div>
    </div>
  );
};

export default MedicamentosForm;
