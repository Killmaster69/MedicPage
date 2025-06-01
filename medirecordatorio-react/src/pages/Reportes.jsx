import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import '../assets/styles/reportes.css'; // Asegúrate de importar este archivo
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Reportes = () => {
  const [pacientes, setPacientes] = useState([]);
  const [busquedaPaciente, setBusquedaPaciente] = useState('');
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [signos, setSignos] = useState([]);
  const [medTomados, setMedTomados] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cargarPacientes = async () => {
      const snap = await getDocs(collection(db, 'pacientes'));
      setPacientes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    cargarPacientes();
  }, []);

  const seleccionarPaciente = (p) => {
    setPacienteSeleccionado(p);
    setBusquedaPaciente('');
    setSignos([]);
    setMedTomados([]);
  };

  const filtrarDatos = async () => {
    if (!pacienteSeleccionado || !fechaInicio || !fechaFin) {
      alert('Por favor seleccione un paciente y rango de fechas');
      return;
    }

    setLoading(true);

    try {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      fin.setHours(23, 59, 59, 999);

      const qSignos = query(collection(db, 'signosVitales'), where('pacienteId', '==', pacienteSeleccionado.id));
      const qTomas = query(collection(db, 'medtomados'), where('pacienteId', '==', pacienteSeleccionado.id));

      const [signosSnap, tomasSnap] = await Promise.all([getDocs(qSignos), getDocs(qTomas)]);

      const signosFiltrados = signosSnap.docs
        .map(doc => doc.data())
        .filter(d => {
          const f = new Date(d.fecha);
          return f >= inicio && f <= fin;
        })
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

      const tomasFiltradas = tomasSnap.docs
        .map(doc => doc.data())
        .filter(d => {
          const f = new Date(d.fecha);
          return f >= inicio && f <= fin;
        })
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

      setSignos(signosFiltrados);
      setMedTomados(tomasFiltradas);
    } catch (error) {
      console.error("Error al filtrar datos:", error);
      alert("Ocurrió un error al filtrar los datos");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (str) => {
    const d = new Date(str);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  const exportarPDF = () => {
    if (!pacienteSeleccionado) return;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFillColor(74, 144, 226);
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('REPORTE MÉDICO', 15, 15);
    doc.setFontSize(10);
    const today = new Date().toLocaleDateString();
    doc.text(`Fecha de emisión: ${today}`, pageWidth - 15, 15, { align: 'right' });

    doc.setTextColor(0, 0, 0);
    doc.setFillColor(240, 247, 255);
    doc.rect(10, 35, pageWidth - 20, 35, 'F');
    doc.setDrawColor(74, 144, 226);
    doc.setLineWidth(0.5);
    doc.rect(10, 35, pageWidth - 20, 35, 'S');
    doc.setFontSize(14);
    doc.text('Información del Paciente', 15, 45);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${pacienteSeleccionado.nombre || 'No especificado'}`, 15, 53);
    doc.text(`Correo: ${pacienteSeleccionado.correo || 'No especificado'}`, 15, 60);
    doc.text(`ID: ${pacienteSeleccionado.id || ''}`, 15, 67);

    let yPos = 80;
    if (fechaInicio && fechaFin) {
      doc.setFillColor(245, 245, 245);
      doc.rect(10, yPos, pageWidth - 20, 12, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Período del Reporte:', 15, yPos + 8);
      doc.setFont('helvetica', 'normal');
      const dateRange = `${new Date(fechaInicio).toLocaleDateString()} - ${new Date(fechaFin).toLocaleDateString()}`;
      doc.text(dateRange, 60, yPos + 8);
      yPos += 20;
    }

    doc.setFillColor(74, 144, 226);
    doc.rect(10, yPos, pageWidth - 20, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('SIGNOS VITALES', 15, yPos + 7);
    doc.setTextColor(0, 0, 0);
    yPos += 15;

    if (signos.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Signo', 'Valor', 'Fecha y Hora']],
        body: signos.map((s) => [s.signoTomado, s.valor, formatDate(s.fecha)]),
        theme: 'grid',
        headStyles: { fillColor: [230, 240, 255], textColor: [50, 50, 50], fontStyle: 'bold', halign: 'center' },
        styles: { fontSize: 10, cellPadding: 5, lineColor: [200, 200, 200] },
        columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 40, halign: 'center' }, 2: { cellWidth: 'auto' } },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 10, right: 10 },
      });
      yPos = doc.lastAutoTable.finalY + 15;
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.text('No hay registros de signos vitales en este rango de fechas.', 15, yPos);
      yPos += 15;
    }

    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(74, 144, 226);
    doc.rect(10, yPos, pageWidth - 20, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('MEDICAMENTOS TOMADOS', 15, yPos + 7);
    doc.setTextColor(0, 0, 0);
    yPos += 15;

    if (medTomados.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Medicamento', 'Fecha y Hora']],
        body: medTomados.map((m) => [m.medicamento, formatDate(m.fecha)]),
        theme: 'grid',
        headStyles: { fillColor: [230, 240, 255], textColor: [50, 50, 50], fontStyle: 'bold', halign: 'center' },
        styles: { fontSize: 10, cellPadding: 5, lineColor: [200, 200, 200] },
        columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 'auto' } },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 10, right: 10 },
      });
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.text('No hay registros de medicamentos tomados en este rango de fechas.', 15, yPos);
    }

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(10, pageHeight - 15, pageWidth - 10, pageHeight - 15);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Este reporte es generado automáticamente y es confidencial.', 15, pageHeight - 10);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - 15, pageHeight - 10, { align: 'right' });
    }

    doc.save(`Reporte_${pacienteSeleccionado.nombre || pacienteSeleccionado.id}.pdf`);
  };

  return (
    <div className="reportes-container">
      <div className="reportes-header">
        <h1>Reportes del Paciente</h1>
        <p className="subtitle">Consulta los signos vitales y medicamentos tomados por el paciente</p>
      </div>

      <div className="reportes-card">
        <div className="search-section">
          <h2>Seleccionar Paciente</h2>
          <div className="search-container">
            <i className="fas fa-search search-icon"></i>
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por nombre o ID"
              value={busquedaPaciente}
              onChange={(e) => setBusquedaPaciente(e.target.value)}
            />
            {busquedaPaciente && (
              <div className="search-results">
                {pacientes
                  .filter(p => p.nombre?.toLowerCase().includes(busquedaPaciente.toLowerCase()) || p.id.includes(busquedaPaciente))
                  .slice(0, 5) // Limit results
                  .map(p => (
                    <div key={p.id} className="search-item" onClick={() => seleccionarPaciente(p)}>
                      <div className="search-item-avatar">{p.nombre?.charAt(0) || '?'}</div>
                      <div className="search-item-info">
                        <div className="search-item-name">{p.nombre}</div>
                        <div className="search-item-id">{p.id}</div>
                      </div>
                    </div>
                  ))}
                {pacientes.filter(p => p.nombre?.toLowerCase().includes(busquedaPaciente.toLowerCase()) || p.id.includes(busquedaPaciente)).length === 0 && (
                  <div className="search-no-results">No se encontraron pacientes</div>
                )}
              </div>
            )}
          </div>
        </div>

        {pacienteSeleccionado && (
          <div className="patient-section">
            <div className="patient-info">
              <div className="patient-avatar">
                {pacienteSeleccionado.nombre?.charAt(0) || '?'}
              </div>
              <div className="patient-details">
                <h3>{pacienteSeleccionado.nombre}</h3>
                <p>{pacienteSeleccionado.correo}</p>
                <span className="patient-id">ID: {pacienteSeleccionado.id}</span>
              </div>
            </div>

            <div className="filter-section">
              <h2>Rango de Fechas</h2>
              <div className="date-filters">
                <div className="form-group">
                  <label>Fecha Inicio</label>
                  <input 
                    type="date" 
                    value={fechaInicio} 
                    onChange={(e) => setFechaInicio(e.target.value)} 
                    max={fechaFin || undefined}
                  />
                </div>
                <div className="form-group">
                  <label>Fecha Fin</label>
                  <input 
                    type="date" 
                    value={fechaFin} 
                    onChange={(e) => setFechaFin(e.target.value)} 
                    min={fechaInicio || undefined}
                  />
                </div>
                <button 
                  className="filter-button" 
                  onClick={filtrarDatos}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="loading-spinner-small"></span>
                  ) : (
                    <i className="fas fa-filter"></i>
                  )}
                  Filtrar Resultados
                </button>
              </div>
            </div>

            <div className="results-section">
              {/* Botón para exportar PDF, solo aparece si ya hay resultados filtrados */}
              {(signos.length > 0 || medTomados.length > 0) && (
                <div style={{ textAlign: 'right', marginBottom: 10 }}>
                  <button className="filter-button" onClick={exportarPDF}>
                    <i className="fas fa-file-pdf"></i> Exportar PDF
                  </button>
                </div>
              )}

              <div className="results-header">
                <h2>Resultados</h2>
                <div className="date-range-display">
                  {fechaInicio && fechaFin && (
                    <span>
                      <i className="fas fa-calendar-alt"></i>
                      {new Date(fechaInicio).toLocaleDateString()} - {new Date(fechaFin).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Signos vitales */}
              <div className="result-card">
                <div className="result-card-header">
                  <h3><i className="fas fa-heartbeat"></i> Signos Vitales</h3>
                  <span className="result-count">{signos.length} registros</span>
                </div>
                {signos.length > 0 ? (
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Signo</th>
                          <th>Valor</th>
                          <th>Fecha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {signos.map((s, i) => (
                          <tr key={i}>
                            <td>
                              <div className="signo-cell">
                                <span className="signo-icon">
                                  {s.signoTomado === 'Presión arterial' && <i className="fas fa-heart"></i>}
                                  {s.signoTomado === 'Glucosa' && <i className="fas fa-tint"></i>}
                                  {s.signoTomado === 'Oxígeno en sangre' && <i className="fas fa-lungs"></i>}
                                  {s.signoTomado === 'Temperatura corporal' && <i className="fas fa-thermometer-half"></i>}
                                  {s.signoTomado === 'Frecuencia cardiaca' && <i className="fas fa-heartbeat"></i>}
                                  {!['Presión arterial', 'Glucosa', 'Oxígeno en sangre', 'Temperatura corporal', 'Frecuencia cardiaca'].includes(s.signoTomado) && <i className="fas fa-notes-medical"></i>}
                                </span>
                                {s.signoTomado}
                              </div>
                            </td>
                            <td><span className="valor-badge">{s.valor}</span></td>
                            <td>{formatDate(s.fecha)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-results">
                    <i className="fas fa-info-circle"></i>
                    <p>No hay registros de signos vitales en este rango de fechas.</p>
                  </div>
                )}
              </div>

              {/* Medicamentos tomados */}
              <div className="result-card">
                <div className="result-card-header">
                  <h3><i className="fas fa-pills"></i> Medicamentos Tomados</h3>
                  <span className="result-count">{medTomados.length} registros</span>
                </div>
                {medTomados.length > 0 ? (
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Medicamento</th>
                          <th>Fecha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {medTomados.map((m, i) => (
                          <tr key={i}>
                            <td>
                              <div className="med-cell">
                                <span className="med-icon">
                                  <i className="fas fa-pills"></i>
                                </span>
                                {m.medicamento}
                              </div>
                            </td>
                            <td>{formatDate(m.fecha)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-results">
                    <i className="fas fa-info-circle"></i>
                    <p>No hay registros de medicamentos tomados en este rango de fechas.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!pacienteSeleccionado && (
          <div className="no-patient-selected">
            <i className="fas fa-user-plus"></i>
            <p>Seleccione un paciente para ver sus reportes</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reportes;