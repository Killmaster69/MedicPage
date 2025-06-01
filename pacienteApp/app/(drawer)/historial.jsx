import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  Image, 
  RefreshControl
} from 'react-native';
import { auth, db } from '../../service/firebase2';
import { Ionicons } from '@expo/vector-icons';

export default function MedicacionScreen() {
  const [recetas, setRecetas] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pacienteId, setPacienteId] = useState(null);
  const [activeTab, setActiveTab] = useState('activas');

  useEffect(() => {
    let recetasUnsub, historialUnsub;
    
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const snap = await db.collection('pacientes').where('correo', '==', user.email).get();
        if (snap.empty) {
          setLoading(false);
          return;
        }

        const pid = snap.docs[0].id;
        setPacienteId(pid);

        // Recetas en tiempo real
        recetasUnsub = db.collection('recetas')
          .where('pacienteId', '==', pid)
          .onSnapshot(async snapshot => {
            const today = new Date();
            const data = await Promise.all(snapshot.docs.map(async (doc) => {
              const receta = doc.data();
              const fechaInicio = new Date(receta.fechaInicio);
              const duracionDias = parseInt(receta.duracion);
              const fechaFin = new Date(fechaInicio);
              fechaFin.setDate(fechaInicio.getDate() + duracionDias);

              if (today > fechaFin) return null;

              const medSnap = await db.collection('medicamentos').doc(receta.medicamentoId).get();
              const medicamento = medSnap.exists ? medSnap.data() : { nombre: 'Desconocido' };

              return {
                id: doc.id,
                ...receta,
                nombreMedicamento: medicamento.nombre,
                instrucciones: medicamento.instrucciones || 'Tomar según indicaciones',
              };
            }));

            const filteredData = data.filter(Boolean);
            filteredData.sort((a, b) => {
              const timeA = a.horaToma ? a.horaToma.replace(':', '') : '0000';
              const timeB = b.horaToma ? b.horaToma.replace(':', '') : '0000';
              return timeA - timeB;
            });

            setRecetas(filteredData);
          });

        // Historial en tiempo real
        historialUnsub = db.collection('medtomados')
          .where('pacienteId', '==', pid)
          .onSnapshot(snap => {
            let data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            data = data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            setHistorial(data);
          });

      } catch (error) {
        console.error('Error al obtener datos:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    fetchData();

    return () => {
      if (recetasUnsub) recetasUnsub();
      if (historialUnsub) historialUnsub();
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const confirmarToma = async (receta) => {
    try {
      const fecha = new Date().toISOString();
      await db.collection('medtomados').add({
        pacienteId,
        medicamento: receta.nombreMedicamento,
        recetaId: receta.id,
        fecha
      });

      Alert.alert(
        '✅ Medicamento registrado', 
        `Has registrado correctamente la toma de ${receta.nombreMedicamento}.`
      );
    } catch (error) {
      console.error('Error al registrar la toma:', error);
      Alert.alert('Error', 'No se pudo registrar la toma del medicamento');
    }
  };

  const puedeConfirmar = (receta) => {
    const today = new Date().toDateString();
    const tomadoHoy = historial.some(h =>
      h.recetaId === receta.id && new Date(h.fecha).toDateString() === today
    );
    
    if (tomadoHoy) return false;

    const ahora = new Date();
    const [h, m] = receta.horaToma.split(':');
    const horaToma = new Date();
    horaToma.setHours(parseInt(h), parseInt(m), 0);

    return ahora >= horaToma;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Fecha no disponible';

    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';

    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const renderEmptyMedication = () => (
    <View style={styles.emptyContainer}>
      <Image 
        source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3588/3588658.png' }}
        style={styles.emptyImage}
      />
      <Text style={styles.emptyTitle}>No tienes medicamentos activos</Text>
      <Text style={styles.emptyText}>
        Cuando tu médico te recete medicamentos, aparecerán aquí para que puedas hacer seguimiento.
      </Text>
    </View>
  );

  const renderEmptyHistory = () => (
    <View style={styles.emptyContainer}>
      <Image 
        source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2972/2972153.png' }}
        style={styles.emptyImage}
      />
      <Text style={styles.emptyTitle}>No hay historial de tomas</Text>
      <Text style={styles.emptyText}>
        Cuando registres la toma de un medicamento, aparecerá en tu historial.
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Ionicons name="medkit" size={30} color="#4a90e2" />
      <Text style={styles.headerTitle}>Mi Medicación</Text>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'activas' && styles.activeTab]}
        onPress={() => setActiveTab('activas')}
      >
        <Ionicons 
          name="medical" 
          size={20} 
          color={activeTab === 'activas' ? "#4a90e2" : "#888"} 
        />
        <Text style={[styles.tabText, activeTab === 'activas' && styles.activeTabText]}>
          Medicación Activa
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'historial' && styles.activeTab]}
        onPress={() => setActiveTab('historial')}
      >
        <Ionicons 
          name="time" 
          size={20} 
          color={activeTab === 'historial' ? "#4a90e2" : "#888"} 
        />
        <Text style={[styles.tabText, activeTab === 'historial' && styles.activeTabText]}>
          Historial
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderTabs()}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4a90e2"]}
          />
        }
      >
        {activeTab === 'activas' ? (
          recetas.length === 0 ? renderEmptyMedication() : (
            recetas.map((receta) => {
              const canConfirm = puedeConfirmar(receta);

              return (
                <View key={receta.id} style={styles.medicationCard}>
                  <View style={styles.medicationHeader}>
                    <View style={styles.medicationIconContainer}>
                      <Ionicons name="medical-outline" size={24} color="#fff" />
                    </View>
                    <View style={styles.medicationInfo}>
                      <Text style={styles.medicationName}>{receta.nombreMedicamento}</Text>
                    </View>
                    <View style={styles.timeContainer}>
                      <Ionicons name="time-outline" size={18} color="#4a90e2" />
                      <Text style={styles.timeText}>{receta.horaToma || 'No especificado'}</Text>
                    </View>
                  </View>

                  <View style={styles.medicationBody}>
                    {receta.instrucciones && (
                      <>
                        <Text style={styles.instructionsLabel}>Instrucciones:</Text>
                        <Text style={styles.instructions}>{receta.instrucciones}</Text>
                      </>
                    )}

                    {receta.fechaInicio && (
                      <View style={styles.dateInfoContainer}>
                        <View style={styles.dateInfo}>
                          <Text style={styles.dateLabel}>Inicio:</Text>
                          <Text style={styles.dateValue}>{formatDate(receta.fechaInicio)}</Text>
                        </View>
                        {receta.duracion && (
                          <View style={styles.dateInfo}>
                            <Text style={styles.dateLabel}>Duración:</Text>
                            <Text style={styles.dateValue}>{receta.duracion} días</Text>
                          </View>
                        )}
                      </View>
                    )}

                    {!canConfirm && (
                      <View style={styles.alreadyTakenContainer}>
                        <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                        <Text style={styles.alreadyTakenText}>Ya tomado hoy o aún no es hora</Text>
                      </View>
                    )}
                  </View>

                  {canConfirm && (
                    <TouchableOpacity 
                      style={styles.confirmButton} 
                      onPress={() => confirmarToma(receta)}
                    >
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.confirmButtonText}>Confirmar toma</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )
        ) : (
          <>
            <Text style={styles.sectionTitle}>Registro de medicamentos tomados</Text>

            {historial.length === 0 ? renderEmptyHistory() : (
              <View style={styles.timelineContainer}>
                {historial.map((item, index) => (
                  <View key={index} style={styles.timelineItem}>
                    <View style={styles.timelineLine} />
                    <View style={styles.timelineDot}>
                      <Ionicons name="medical-outline" size={16} color="#fff" />
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineMedication}>{item.medicamento}</Text>
                      <Text style={styles.timelineDate}>{formatDateTime(item.fecha)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f8fa',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4a90e2',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#888',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#4a90e2',
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#f5f8fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
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
  medicationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    overflow: 'hidden',
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  medicationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  medicationType: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  timeText: {
    fontSize: 14,
    color: '#4a90e2',
    fontWeight: '500',
    marginLeft: 4,
  },
  medicationBody: {
    padding: 16,
  },
  instructionsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  instructions: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 12,
  },
  dateInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 12,
  },
  dateInfo: {
    backgroundColor: '#f9f9f9',
    padding: 8,
    borderRadius: 8,
    flex: 0.48,
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  dosisContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
  },
  dosisLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 5,
  },
  dosis: {
    fontSize: 14,
    color: '#555',
  },
  alreadyTakenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  alreadyTakenText: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 8,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4a90e2',
    padding: 14,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  nextDoseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
  },
  nextDoseText: {
    color: '#666',
    fontSize: 14,
    marginLeft: 8,
  },
  timelineContainer: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 15,
    top: 30,
    bottom: -10,
    width: 2,
    backgroundColor: '#e1e8ed',
    zIndex: 1,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    zIndex: 2,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  timelineMedication: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 10,
  },
  emptyImage: {
    width: 100,
    height: 100,
    marginBottom: 20,
    opacity: 0.8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});