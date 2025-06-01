import React, { useState } from 'react';
import '../assets/styles/medicamentos.css';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import toast from 'react-hot-toast';

const ModalMedicamento = ({ onClose }) => {
  const [form, setForm] = useState({
    nombre: '',
    ingrediente: '',
    fechaCaducidad: ''
  });

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.nombre || !form.ingrediente || !form.fechaCaducidad) {
      return toast.error('Completa todos los campos');
    }

    try {
      await addDoc(collection(db, 'medicamentos'), {
        ...form,
        creadoEn: serverTimestamp()
      });

      toast.success('Medicamento registrado correctamente');
      onClose();
    } catch (error) {
      console.error('Error al guardar medicamento:', error);
      toast.error('No se pudo guardar');
    }
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2><i className="fas fa-pills"></i> Registrar Medicamento</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre</label>
              <input type="text" name="nombre" value={form.nombre} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Ingrediente Activo</label>
              <input type="text" name="ingrediente" value={form.ingrediente} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Fecha de Caducidad</label>
              <input type="date" name="fechaCaducidad" value={form.fechaCaducidad} onChange={handleChange} required />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalMedicamento;
