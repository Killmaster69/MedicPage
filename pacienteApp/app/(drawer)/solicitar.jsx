import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { auth, db } from '../../service/firebase2';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

export default function SolicitarScreen() {
  const [doctores, setDoctores] = useState([]);
  const [doctorSeleccionado, setDoctorSeleccionado] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [fecha, setFecha] = useState(new Date());
  const [hora, setHora] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showHoraPicker, setShowHoraPicker] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const obtenerDoctores = async () => {
      try {
        const snapshot = await db.collection('medicos').get();
        const lista = snapshot.docs.map(doc => ({
          id: doc.id,
          nombre: doc.data().nombre,
          especialidad: doc.data().especialidad
        }));
        setDoctores(lista);
      } catch (error) {
        console.error("Error al obtener doctores:", error);
        Alert.alert("Error", "No se pudieron cargar los doctores");
      } finally {
        setLoading(false);
      }
    };

    obtenerDoctores();
  }, []);

  const handleFechaChange = (event, selectedDate) => {
    if (selectedDate) setFecha(selectedDate);
    setShowDatePicker(false);
  };

  const handleHoraChange = (event, selectedDate) => {
    if (selectedDate) {
      const horaSeleccionada = selectedDate.toTimeString().substring(0, 5);
      setHora(horaSeleccionada);
    }
    setShowHoraPicker(false);
  };

  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

 const handleSubmit = async () => {
  const user = auth.currentUser;
  if (!user || !doctorSeleccionado || !especialidad || !fecha || !hora) {
    Alert.alert('Error', 'Por favor completa todos los campos.');
    return;
  }

  try {
    setLoading(true);

    // Buscar UID del paciente desde Firestore
    const pacienteSnapshot = await db
      .collection('pacientes')
      .where('correo', '==', user.email)
      .limit(1)
      .get();

    if (pacienteSnapshot.empty) {
      Alert.alert('Error', 'No se encontró el paciente en la base de datos.');
      return;
    }

    const pacienteDoc = pacienteSnapshot.docs[0];
    const pacienteId = pacienteDoc.id;

    // Guardar la cita (sin diagnostico ni estado)
    await db.collection('citas').add({
      pacienteId,
      doctorId: doctorSeleccionado,
      especialidad,
      fecha: `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}-${fecha.getDate().toString().padStart(2, '0')}`,
      hora
    });

    Alert.alert('¡Éxito!', 'Tu cita médica ha sido solicitada correctamente.');
    setDoctorSeleccionado('');
    setEspecialidad('');
    setHora('');
    setFecha(new Date());
  } catch (error) {
    Alert.alert('Error', 'No se pudo registrar la cita. Inténtalo de nuevo.');
    console.error(error);
  } finally {
    setLoading(false);
  }
};

  const doctorSeleccionadoNombre = doctorSeleccionado 
    ? doctores.find(d => d.id === doctorSeleccionado)?.nombre 
    : '';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="calendar" size={30} color="#4a90e2" />
        <Text style={styles.title}>Solicitar Cita Médica</Text>
      </View>

      <View style={styles.card}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4a90e2" />
            <Text style={styles.loadingText}>Cargando...</Text>
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>
            <Ionicons name="person-circle-outline" size={18} color="#4a90e2" /> Doctor
          </Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={doctorSeleccionado}
              style={styles.picker}
              onValueChange={(itemValue) => {
                setDoctorSeleccionado(itemValue);
                const doc = doctores.find(d => d.id === itemValue);
                if (doc) setEspecialidad(doc.especialidad);
              }}
            >
              <Picker.Item label="Selecciona un doctor" value="" color="#888" />
              {doctores.map(doc => (
                <Picker.Item key={doc.id} label={doc.nombre} value={doc.id} />
              ))}
            </Picker>
          </View>
        </View>

        {doctorSeleccionado && (
          <View style={styles.selectedDoctor}>
            <Text style={styles.selectedDoctorText}>
              Doctor seleccionado: <Text style={styles.highlightText}>{doctorSeleccionadoNombre}</Text>
            </Text>
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>
            <Ionicons name="medical" size={18} color="#4a90e2" /> Especialidad
          </Text>
          <TextInput
            style={styles.input}
            value={especialidad}
            editable={false}
            placeholder="Se completará automáticamente"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>
            <Ionicons name="calendar-outline" size={18} color="#4a90e2" /> Fecha
          </Text>
          <TouchableOpacity 
            style={styles.dateButton} 
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {formatDate(fecha)}
            </Text>
            <Ionicons name="calendar" size={20} color="#4a90e2" />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={fecha}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleFechaChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>
            <Ionicons name="time-outline" size={18} color="#4a90e2" /> Hora
          </Text>
          <TouchableOpacity 
            style={styles.dateButton} 
            onPress={() => setShowHoraPicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {hora ? hora : 'Seleccionar hora'}
            </Text>
            <Ionicons name="time" size={20} color="#4a90e2" />
          </TouchableOpacity>
          {showHoraPicker && (
            <DateTimePicker
              value={fecha}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleHoraChange}
              minuteInterval={15}
            />
          )}
        </View>

        <TouchableOpacity 
          style={styles.submitButton} 
          onPress={handleSubmit}
          disabled={!doctorSeleccionado || !especialidad || !hora}
        >
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.submitButtonText}>Solicitar Cita</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f8fa',
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
  title: {
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
  },
  picker: {
    height: 60,
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
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4a90e2',
  },
  selectedDoctor: {
    backgroundColor: '#f0f7ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4a90e2',
  },
  selectedDoctorText: {
    fontSize: 15,
    color: '#333',
  },
  highlightText: {
    fontWeight: 'bold',
    color: '#4a90e2',
  },
});