import React, { useEffect, useState } from 'react';
import {
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  Platform,
  ActivityIndicator
} from 'react-native';
import { auth, db } from '../../service/firebase2';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

export default function SignosScreen() {
  const [signo, setSigno] = useState('');
  const [valor, setValor] = useState('');
  const [desde, setDesde] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1))); // Default to 1 month ago
  const [hasta, setHasta] = useState(new Date());
  const [showDesdePicker, setShowDesdePicker] = useState(false);
  const [showHastaPicker, setShowHastaPicker] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [pacienteId, setPacienteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registroHora, setRegistroHora] = useState(new Date());

  const signosPredefinidos = [
    { nombre: 'Presión   arterial', icon: 'heart' },
    { nombre: 'Glucosa', icon: 'water' },
    { nombre: 'Oxígeno en sangre', icon: 'pulse' },
    { nombre: 'Temperatura corporal', icon: 'thermometer' },
    { nombre: 'Frecuencia cardiaca', icon: 'heart-circle' }
  ];

  useEffect(() => {
    const obtenerPacienteId = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setLoading(false);
          return;
        }

        const snapshot = await db
          .collection('pacientes')
          .where('correo', '==', user.email)
          .limit(1)
          .get();

        if (!snapshot.empty) {
          setPacienteId(snapshot.docs[0].id);
          // Cargar historial inicial
          filtrarHistorial(snapshot.docs[0].id);
        } else {
          Alert.alert('Error', 'No se encontró al paciente en la base de datos.');
        }
      } catch (error) {
        console.error("Error al obtener paciente:", error);
      } finally {
        setLoading(false);
      }
    };

    obtenerPacienteId();
  }, []);

  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (date) => {
    return date.toTimeString().substring(0, 5);
  };

  const handleRegistrar = async () => {
    if (!pacienteId || !signo || !valor) {
      Alert.alert('Error', 'Por favor completa todos los campos.');
      return;
    }

    try {
      setLoading(true);
      
      // Crear fecha y hora combinadas
      const fechaHora = new Date(
        registroHora.getFullYear(),
        registroHora.getMonth(),
        registroHora.getDate(),
        registroHora.getHours(),
        registroHora.getMinutes()
      );
      
      await db.collection('signosVitales').add({
        pacienteId,
        signoTomado: signo,
        valor,
        fecha: fechaHora.toISOString(),
        hora: formatTime(registroHora)
      });
      
      Alert.alert('¡Éxito!', 'Signo vital registrado correctamente.');
      setSigno('');
      setValor('');
      
      // Actualizar historial
      filtrarHistorial(pacienteId);
    } catch (error) {
      Alert.alert('Error', 'No se pudo registrar el signo vital.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filtrarHistorial = async (id = pacienteId) => {
    if (!id) return;

    try {
      setLoading(true);
      
      const snapshot = await db
        .collection('signosVitales')
        .where('pacienteId', '==', id)
        .get();

      // Ajustar las fechas para incluir todo el día
      const desdeAjustado = new Date(desde);
      desdeAjustado.setHours(0, 0, 0, 0);
      
      const hastaAjustado = new Date(hasta);
      hastaAjustado.setHours(23, 59, 59, 999);

      const resultados = snapshot.docs
        .map(doc => ({...doc.data(), id: doc.id}))
        .filter(item => {
          const fecha = new Date(item.fecha);
          return fecha >= desdeAjustado && fecha <= hastaAjustado;
        })
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

      setHistorial(resultados);
    } catch (error) {
      console.error('Error al filtrar historial:', error);
      Alert.alert('Error', 'No se pudo cargar el historial.');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    if (selectedTime) {
      setRegistroHora(selectedTime);
    }
    setShowTimePicker(false);
  };

  const getSignoIcon = (nombreSigno) => {
    const signo = signosPredefinidos.find(s => s.nombre === nombreSigno);
    return signo ? signo.icon : 'medical';
  };

  return (
    <ScrollView style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4a90e2" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      )}

      <View style={styles.header}>
        <Ionicons name="fitness" size={30} color="#4a90e2" />
        <Text style={styles.headerTitle}>Registrar Signos Vitales</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Nuevo Registro</Text>
        
        <Text style={styles.label}>Selecciona un signo vital:</Text>
        <View style={styles.signosGrid}>
          {signosPredefinidos.map((s, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.signoButton,
                signo === s.nombre && styles.signoButtonActive
              ]}
              onPress={() => setSigno(s.nombre)}
            >
              <Ionicons 
                name={s.icon} 
                size={24} 
                color={signo === s.nombre ? "#fff" : "#4a90e2"} 
              />
              <Text 
                style={[
                  styles.signoButtonText,
                  signo === s.nombre && styles.signoButtonTextActive
                ]}
              >
                {s.nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>
            <Ionicons name="analytics-outline" size={18} color="#4a90e2" /> Valor:
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 120/80 o 98.6"
            value={valor}
            onChangeText={setValor}
            keyboardType="default"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>
            <Ionicons name="time-outline" size={18} color="#4a90e2" /> Hora del registro:
          </Text>
          <View style={styles.dateButton}>
            <Text style={styles.dateButtonText}>
              {formatTime(registroHora)}
            </Text>
            <Ionicons name="time" size={20} color="#4a90e2" />
          </View>
        </View>

        <TouchableOpacity 
          style={styles.submitButton} 
          onPress={handleRegistrar}
          disabled={!signo || !valor}
        >
          <Ionicons name="save-outline" size={20} color="#fff" />
          <Text style={styles.submitButtonText}>Registrar Signo Vital</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Historial de Signos Vitales</Text>
        
        <View style={styles.filterContainer}>
          <View style={styles.dateFilterGroup}>
            <Text style={styles.label}>
              <Ionicons name="calendar-outline" size={18} color="#4a90e2" /> Desde:
            </Text>
            <TouchableOpacity 
              style={styles.dateButton} 
              onPress={() => setShowDesdePicker(true)}
            >
              <Text style={styles.dateButtonText}>{formatDate(desde)}</Text>
              <Ionicons name="calendar" size={20} color="#4a90e2" />
            </TouchableOpacity>
            {showDesdePicker && (
              <DateTimePicker
                value={desde}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(e, date) => {
                  if (date) setDesde(date);
                  setShowDesdePicker(false);
                }}
              />
            )}
          </View>

          <View style={styles.dateFilterGroup}>
            <Text style={styles.label}>
              <Ionicons name="calendar-outline" size={18} color="#4a90e2" /> Hasta:
            </Text>
            <TouchableOpacity 
              style={styles.dateButton} 
              onPress={() => setShowHastaPicker(true)}
            >
              <Text style={styles.dateButtonText}>{formatDate(hasta)}</Text>
              <Ionicons name="calendar" size={20} color="#4a90e2" />
            </TouchableOpacity>
            {showHastaPicker && (
              <DateTimePicker
                value={hasta}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(e, date) => {
                  if (date) setHasta(date);
                  setShowHastaPicker(false);
                }}
              />
            )}
          </View>
        </View>

        <TouchableOpacity 
          style={styles.filterButton} 
          onPress={() => filtrarHistorial()}
        >
          <Ionicons name="search" size={20} color="#fff" />
          <Text style={styles.filterButtonText}>Filtrar Historial</Text>
        </TouchableOpacity>

        {historial.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>No hay registros en este rango de fechas</Text>
          </View>
        ) : (
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Signo Vital</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Valor</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Fecha y Hora</Text>
            </View>
            
            {historial.map((item, idx) => {
              const fecha = new Date(item.fecha);
              return (
                <View key={idx} style={[
                  styles.tableRow,
                  idx % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd
                ]}>
                  <View style={[styles.tableCell, { flex: 1.5 }]}>
                    <Ionicons 
                      name={getSignoIcon(item.signoTomado)} 
                      size={20} 
                      color="#4a90e2" 
                      style={styles.tableCellIcon}
                    />
                    <Text style={styles.tableCellText}>{item.signoTomado}</Text>
                  </View>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{item.valor}</Text>
                  <Text style={[styles.tableCell, { flex: 1.5 }]}>
                    {formatDate(fecha)} {item.hora || formatTime(fecha)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <Ionicons name="information-circle" size={24} color="#4a90e2" />
          <Text style={styles.infoTitle}>Información</Text>
        </View>
        <Text style={styles.infoText}>
          • Registra tus signos vitales regularmente para un mejor seguimiento médico.
        </Text>
        <Text style={styles.infoText}>
          • Consulta con tu médico si notas valores anormales.
        </Text>
        <Text style={styles.infoText}>
          • Los datos se guardan de forma segura y solo son accesibles por ti y tu médico.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f8fa',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4a90e2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#4a90e2',
    paddingLeft: 10,
  },
  signosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  signoButton: {
    width: '48%',
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  signoButtonActive: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
  },
  signoButtonText: {
    color: '#333',
    fontWeight: '500',
    marginLeft: 8,
    fontSize: 14,
  },
  signoButtonTextActive: {
    color: '#fff',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dateFilterGroup: {
    width: '48%',
  },
  filterButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  tableContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#4a90e2',
    padding: 12,
  },
  tableHeaderCell: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
    padding: 12,
  },
  tableRowEven: {
    backgroundColor: '#fff',
  },
  tableRowOdd: {
    backgroundColor: '#f9f9f9',
  },
  tableCell: {
    fontSize: 14,
    color: '#333',
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableCellIcon: {
    marginRight: 5,
  },
  tableCellText: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    marginTop: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
    lineHeight: 20,
  },
});