import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import '../assets/styles/medicamentos.css';

const MedicamentosTable = () => {
  const [medicamentos, setMedicamentos] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'medicamentos'), (snapshot) => {
      const datos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMedicamentos(datos);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="card">
      <div className="card-header">
        <h2><i className="fas fa-capsules"></i> Lista de Medicamentos</h2>
      </div>
      <div className="card-body">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Ingrediente</th>
              <th>Caducidad</th>
            </tr>
          </thead>
          <tbody>
            {medicamentos.map((med) => (
              <tr key={med.id}>
                <td>{med.id}</td>
                <td>{med.nombre}</td>
                <td>{med.ingrediente}</td>
                <td>{med.fechaCaducidad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MedicamentosTable;
