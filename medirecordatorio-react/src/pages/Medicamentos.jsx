import React, { useState } from 'react';
import MedicamentosForm from '../components/MedicamentosForm';
import ModalMedicamento from '../components/ModalMedicamento';
import MedicamentosTable from '../components/MedicamentosTable';
import '../assets/styles/medicamentos.css';

const Medicamentos = () => {
  const [mostrarModal, setMostrarModal] = useState(false);

  const abrirModal = () => setMostrarModal(true);
  const cerrarModal = () => {
    setMostrarModal(false);
    window.location.reload(); // Recarga la página al cerrar el modal
  };

  return (
    <div className="medicamentos-container">
      <header className="medicamentos-header">
        <h1><i className="fas fa-pills"></i> Gestión de Medicamentos</h1>
        <button className="btn-primary" onClick={abrirModal}>
          <i className="fas fa-plus"></i> Nuevo Medicamento
        </button>
      </header>

      <div className="card">
        <div className="card-header">
          <h2><i className="fas fa-prescription"></i> Recetar Medicamento</h2>
        </div>
        <div className="card-body">
          <MedicamentosForm />
        </div>
      </div>

      <MedicamentosTable />

      {mostrarModal && <ModalMedicamento onClose={cerrarModal} />}
    </div>
  );
};

export default Medicamentos;
