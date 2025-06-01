// src/components/PatientList.jsx
const PatientList = ({ pacientes, onDelete }) => {
  return (
    <div className="patients-table-container">
      <table className="patients-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Teléfono</th>
            <th>Domicilio</th>
            <th>Correo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pacientes.length > 0 ? (
            pacientes.map(p => (
              <tr key={p.id}>
                <td>{p.nombre}</td>
                <td>{p.telefono}</td>
                <td>{p.domicilio}</td>
                <td>{p.correo || 'N/A'}</td>
                <td>
                  <button className="patients-action-btn patients-delete-btn" onClick={() => onDelete(p.id)}>
                    <i className="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center' }}>No hay pacientes registrados</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PatientList;
