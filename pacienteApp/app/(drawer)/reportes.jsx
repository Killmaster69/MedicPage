"use client"

import { useEffect, useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  SafeAreaView,
  Platform,
} from "react-native"
import { auth, db } from "../../service/firebase2"
import { collection, query, where, getDocs } from "firebase/firestore"
import DateTimePicker from "@react-native-community/datetimepicker"
import * as Print from "expo-print"
import * as Sharing from "expo-sharing"
import { Feather, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons"

const ReportesScreen = () => {
  const [pacienteId, setPacienteId] = useState(null)
  const [pacienteInfo, setPacienteInfo] = useState(null)
  const [signos, setSignos] = useState([])
  const [medTomados, setMedTomados] = useState([])
  const [fechaInicio, setFechaInicio] = useState(null)
  const [fechaFin, setFechaFin] = useState(null)
  const [showInicio, setShowInicio] = useState(false)
  const [showFin, setShowFin] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const obtenerPaciente = async () => {
      const user = auth.currentUser
      if (!user) return

      const snap = await getDocs(query(collection(db, "pacientes"), where("correo", "==", user.email)))
      if (!snap.empty) {
        const doc = snap.docs[0]
        setPacienteId(doc.id)
        setPacienteInfo(doc.data())
      }
    }
    obtenerPaciente()
  }, [])

  const filtrarDatos = async () => {
    if (!fechaInicio || !fechaFin || !pacienteId) {
      Alert.alert("Faltan datos", "Selecciona ambas fechas")
      return
    }

    setLoading(true)
    try {
      const inicio = new Date(fechaInicio)
      const fin = new Date(fechaFin)
      fin.setHours(23, 59, 59, 999)

      const qSignos = query(collection(db, "signosVitales"), where("pacienteId", "==", pacienteId))
      const qTomas = query(collection(db, "medtomados"), where("pacienteId", "==", pacienteId))

      const [signosSnap, tomasSnap] = await Promise.all([getDocs(qSignos), getDocs(qTomas)])

      const signosFiltrados = signosSnap.docs
        .map((doc) => doc.data())
        .filter((d) => {
          const f = new Date(d.fecha)
          return f >= inicio && f <= fin
        })

      const tomasFiltradas = tomasSnap.docs
        .map((doc) => doc.data())
        .filter((d) => {
          const f = new Date(d.fecha)
          return f >= inicio && f <= fin
        })

      setSignos(signosFiltrados)
      setMedTomados(tomasFiltradas)
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (str) => {
    const d = new Date(str)
    return d.toLocaleDateString() + " " + d.toLocaleTimeString()
  }

  const getSignoIcon = (signoTomado) => {
    switch (signoTomado) {
      case "Presión arterial":
        return "heart"
      case "Glucosa":
        return "droplet"
      case "Oxígeno en sangre":
        return "wind"
      case "Temperatura corporal":
        return "thermometer"
      case "Frecuencia cardiaca":
        return "activity"
      default:
        return "activity"
    }
  }

  const getMedIcon = (tipo) => {
    switch (tipo) {
      case "Pastilla":
        return "pills"
      case "Jarabe":
        return "prescription-bottle"
      case "Inyección":
        return "syringe"
      case "Gotas":
        return "eye-dropper"
      case "Inhalador":
        return "wind"
      default:
        return "capsules"
    }
  }

  const exportarPDF = async () => {
    if (!pacienteInfo) return

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reporte Médico</title>
        <style>
          body {
            font-family: 'Helvetica', Arial, sans-serif;
            margin: 0;
            padding: 0;
            color: #333;
          }
          .header {
            background-color: #4a90e2;
            color: white;
            padding: 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .date {
            font-size: 12px;
            margin-top: 5px;
          }
          .patient-info {
            background-color: #f0f7ff;
            border: 1px solid #d0e3ff;
            border-radius: 5px;
            margin: 20px;
            padding: 15px;
          }
          .patient-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .patient-email {
            color: #666;
            margin-bottom: 5px;
          }
          .patient-id {
            font-size: 12px;
            color: #888;
          }
          .date-range {
            background-color: #f5f5f5;
            margin: 0 20px;
            padding: 10px;
            border-radius: 5px;
            font-size: 14px;
          }
          .section {
            margin: 20px;
          }
          .section-header {
            background-color: #4a90e2;
            color: white;
            padding: 10px;
            border-radius: 5px 5px 0 0;
            font-size: 16px;
          }
          .section-content {
            border: 1px solid #e0e0e0;
            border-top: none;
            border-radius: 0 0 5px 5px;
            padding: 15px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th {
            background-color: #f0f7ff;
            text-align: left;
            padding: 8px;
            border-bottom: 1px solid #ddd;
          }
          td {
            padding: 8px;
            border-bottom: 1px solid #eee;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .empty-message {
            color: #888;
            font-style: italic;
            text-align: center;
            padding: 20px;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #888;
            border-top: 1px solid #eee;
            padding-top: 10px;
          }
          .icon {
            display: inline-block;
            width: 20px;
            height: 20px;
            background-color: #e6f0ff;
            color: #4a90e2;
            border-radius: 50%;
            text-align: center;
            line-height: 20px;
            margin-right: 5px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>REPORTE MÉDICO</h1>
          <div class="date">Fecha de emisión: ${new Date().toLocaleDateString()}</div>
        </div>
        
        <div class="patient-info">
          <div class="patient-name">${pacienteInfo.nombre || "Paciente"}</div>
          <div class="patient-email">${pacienteInfo.correo || ""}</div>
          <div class="patient-id">ID: ${pacienteId || ""}</div>
        </div>
        
        <div class="date-range">
          <strong>Período del reporte:</strong> ${fechaInicio?.toLocaleDateString() || ""} - ${fechaFin?.toLocaleDateString() || ""}
        </div>
        
        <div class="section">
          <div class="section-header">
            SIGNOS VITALES
          </div>
          <div class="section-content">
            ${
              signos.length > 0
                ? `<table>
                    <thead>
                      <tr>
                        <th>Signo</th>
                        <th>Valor</th>
                        <th>Fecha y Hora</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${signos
                        .map(
                          (s) => `
                        <tr>
                          <td>${s.signoTomado}</td>
                          <td><strong>${s.valor}</strong></td>
                          <td>${formatDate(s.fecha)}</td>
                        </tr>
                      `,
                        )
                        .join("")}
                    </tbody>
                  </table>`
                : '<div class="empty-message">No hay registros de signos vitales en este período.</div>'
            }
          </div>
        </div>
        
        <div class="section">
          <div class="section-header">
            MEDICAMENTOS TOMADOS
          </div>
          <div class="section-content">
            ${
              medTomados.length > 0
                ? `<table>
                    <thead>
                      <tr>
                        <th>Medicamento</th>
                        <th>Fecha y Hora</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${medTomados
                        .map(
                          (m) => `
                        <tr>
                          <td>${m.medicamento}</td>
                          <td>${formatDate(m.fecha)}</td>
                        </tr>
                      `,
                        )
                        .join("")}
                    </tbody>
                  </table>`
                : '<div class="empty-message">No hay registros de medicamentos tomados en este período.</div>'
            }
          </div>
        </div>
        
        <div class="footer">
          Este reporte es generado automáticamente y es confidencial.<br>
          © ${new Date().getFullYear()} Sistema de Seguimiento Médico
        </div>
      </body>
      </html>
    `

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent })
      await Sharing.shareAsync(uri)
    } catch (error) {
      console.error("Error al generar el PDF:", error)
      Alert.alert("Error", "No se pudo generar el PDF.")
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Reportes Médicos</Text>
            <Text style={styles.headerSubtitle}>Historial de signos vitales y medicamentos</Text>
          </View>
        </View>

        {/* Patient Info Card */}
        {pacienteInfo && (
          <View style={styles.patientCard}>
            <View style={styles.patientAvatar}>
              <Text style={styles.avatarText}>
                {pacienteInfo.nombre ? pacienteInfo.nombre.charAt(0).toUpperCase() : "?"}
              </Text>
            </View>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{pacienteInfo.nombre || "Paciente"}</Text>
              <Text style={styles.patientEmail}>{pacienteInfo.correo || ""}</Text>
              <View style={styles.patientIdContainer}>
                <Text style={styles.patientId}>ID: {pacienteId || ""}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Date Selection */}
        <View style={styles.dateSelectionCard}>
          <Text style={styles.sectionTitle}>Seleccionar Período</Text>

          {/* Fecha Inicio */}
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>Fecha Inicio</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowInicio(true)}>
              <Feather name="calendar" size={16} color="#4a90e2" style={styles.dateIcon} />
              <Text style={styles.dateText}>{fechaInicio ? fechaInicio.toLocaleDateString() : "Seleccionar"}</Text>
            </TouchableOpacity>
          </View>

          {/* Fecha Fin */}
          <View style={[styles.dateField, { marginTop: 12 }]}>
            <Text style={styles.dateLabel}>Fecha Fin</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowFin(true)}>
              <Feather name="calendar" size={16} color="#4a90e2" style={styles.dateIcon} />
              <Text style={styles.dateText}>{fechaFin ? fechaFin.toLocaleDateString() : "Seleccionar"}</Text>
            </TouchableOpacity>
          </View>

          {/* Date Pickers */}
          {showInicio && (
            <DateTimePicker
              value={fechaInicio || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(e, date) => {
                setShowInicio(false)
                if (date) setFechaInicio(date)
              }}
            />
          )}

          {showFin && (
            <DateTimePicker
              value={fechaFin || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(e, date) => {
                setShowFin(false)
                if (date) setFechaFin(date)
              }}
            />
          )}
          <Text style={styles.dateLabel}> </Text>
          {/* Filter Button */}
          <TouchableOpacity
            style={[styles.filterButton, (!fechaInicio || !fechaFin || loading) && styles.filterButtonDisabled]}
            onPress={filtrarDatos}
            disabled={!fechaInicio || !fechaFin || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Feather name="filter" size={16} color="#fff" style={styles.filterIcon} />
                <Text style={styles.filterText}>Filtrar Resultados</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Results Section */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4a90e2" />
            <Text style={styles.loadingText}>Cargando datos...</Text>
          </View>
        ) : (
          <>
            {/* Vital Signs Results */}
            {signos.length > 0 && (
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Feather name="activity" size={18} color="#4a90e2" />
                  <Text style={styles.resultTitle}>Signos Vitales</Text>
                  <View style={styles.resultCount}>
                    <Text style={styles.resultCountText}>{signos.length}</Text>
                  </View>
                </View>

                <View style={styles.resultContent}>
                  {signos.map((s, i) => (
                    <View key={i} style={styles.resultItem}>
                      <View style={styles.resultIconContainer}>
                        <Feather name={getSignoIcon(s.signoTomado)} size={16} color="#4a90e2" />
                      </View>
                      <View style={styles.resultItemContent}>
                        <View style={styles.resultItemHeader}>
                          <Text style={styles.resultItemTitle}>{s.signoTomado}</Text>
                          <View style={styles.valorBadge}>
                            <Text style={styles.valorText}>{s.valor}</Text>
                          </View>
                        </View>
                        <Text style={styles.resultItemDate}>{formatDate(s.fecha)}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Medications Results */}
            {medTomados.length > 0 && (
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <FontAwesome5 name="pills" size={16} color="#4a90e2" />
                  <Text style={styles.resultTitle}>Medicamentos Tomados</Text>
                  <View style={styles.resultCount}>
                    <Text style={styles.resultCountText}>{medTomados.length}</Text>
                  </View>
                </View>

                <View style={styles.resultContent}>
                  {medTomados.map((m, i) => (
                    <View key={i} style={styles.resultItem}>
                      <View style={styles.resultIconContainer}>
                        <FontAwesome5 name={getMedIcon(m.tipo)} size={16} color="#4a90e2" />
                      </View>
                      <View style={styles.resultItemContent}>
                        <View style={styles.resultItemHeader}>
                          <Text style={styles.resultItemTitle}>{m.medicamento}</Text>
                        </View>
                        <Text style={styles.resultItemDate}>{formatDate(m.fecha)}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Empty State */}
            {signos.length === 0 && medTomados.length === 0 && fechaInicio && fechaFin && (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="file-search-outline" size={60} color="#ccc" />
                <Text style={styles.emptyTitle}>No hay datos</Text>
                <Text style={styles.emptyText}>No se encontraron registros en el período seleccionado.</Text>
              </View>
            )}

            {/* Export PDF Button */}
            {(signos.length > 0 || medTomados.length > 0) && (
              <TouchableOpacity style={styles.pdfButton} onPress={exportarPDF}>
                <Feather name="file-text" size={18} color="#fff" style={styles.pdfIcon} />
                <Text style={styles.pdfText}>Exportar PDF</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  container: {
    padding: 16,
  },
  headerContainer: {
    backgroundColor: "#4a90e2",
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
    textAlign: "center",
  },
  patientCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  patientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#4a90e2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  patientEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  patientIdContainer: {
    alignSelf: "flex-start",
  },
  patientId: {
    fontSize: 12,
    color: "#888",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dateSelectionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  dateField: {
    flex: 1,
    marginHorizontal: 4,
  },
  dateLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e1e8ed",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#f9fbfd",
  },
  dateIcon: {
    marginRight: 8,
  },
  dateText: {
    fontSize: 14,
    color: "#333",
  },
  filterButton: {
    backgroundColor: "#4a90e2",
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  filterButtonDisabled: {
    backgroundColor: "#a0c4f0",
  },
  filterIcon: {
    marginRight: 8,
  },
  filterText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 14,
  },
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#f9fbfd",
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
    flex: 1,
  },
  resultCount: {
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  resultCountText: {
    fontSize: 12,
    color: "#666",
  },
  resultContent: {
    padding: 8,
  },
  resultItem: {
    flexDirection: "row",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  resultIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f7ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  resultItemContent: {
    flex: 1,
  },
  resultItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  resultItemTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
    flex: 1,
  },
  valorBadge: {
    backgroundColor: "#f0f7ff",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  valorText: {
    fontSize: 13,
    color: "#4a90e2",
    fontWeight: "500",
  },
  tipoBadge: {
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tipoText: {
    fontSize: 12,
    color: "#666",
  },
  resultItemDate: {
    fontSize: 12,
    color: "#888",
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
  },
  pdfButton: {
    backgroundColor: "#4a90e2",
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  pdfIcon: {
    marginRight: 8,
  },
  pdfText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
})

export default ReportesScreen
