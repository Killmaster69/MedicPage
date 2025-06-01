import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert
} from 'react-native';
import { auth, db } from '../../service/firebase2';
import { Ionicons } from '@expo/vector-icons';

export default function CitasScreen() {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [doctoresMap, setDoctoresMap] = useState({});
  const [activeFilter, setActiveFilter] = useState('todas');

  useEffect(() => {
    let unsubscribe;
    const fetchRealtimeCitas = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      const pacienteSnapshot = await db
        .collection('pacientes')
        .where('correo', '==', user.email)
        .limit(1)
        .get();

      if (pacienteSnapshot.empty) {
        setLoading(false);
        return;
      }

      const pacienteId = pacienteSnapshot.docs[0].id;

      unsubscribe = db
        .collection('citas')
        .where('pacienteId', '==', pacienteId)
        .onSnapshot(async (citasSnapshot) => {
          const citasData = citasSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          citasData.sort((a, b) => {
            const dateA = new Date(a.fecha + 'T' + (a.hora || '00:00'));
            const dateB = new Date(b.fecha + 'T' + (b.hora || '00:00'));
            return dateB - dateA;
          });

          // Cargar doctores solo una vez
          const doctoresSnapshot = await db.collection('medicos').get();
          const map = {};
          doctoresSnapshot.docs.forEach(doc => {
            map[doc.id] = {
              nombre: doc.data().nombre,
              especialidad: doc.data().especialidad
            };
          });

          setDoctoresMap(map);
          setCitas(citasData);
          setLoading(false);
          setRefreshing(false);
        });
    };

    fetchRealtimeCitas();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCitas();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const cancelarCita = async (citaId) => {
    Alert.alert(
      'Cancelar cita',
      '¿Estás seguro de que deseas cancelar esta cita?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.collection('citas').doc(citaId).delete();
              Alert.alert('Cancelada', 'La cita ha sido eliminada.');
              fetchCitas();
            } catch (error) {
              console.error('Error al eliminar cita:', error);
              Alert.alert('Error', 'No se pudo cancelar la cita.');
            }
          }
        }
      ]
    );
  };

  const filteredCitas = () => {
    const now = new Date();
    return citas.filter(cita => {
      const citaDate = new Date(cita.fecha + 'T' + (cita.hora || '00:00'));
      if (activeFilter === 'pendiente') return citaDate > now;
      if (activeFilter === 'completada') return citaDate <= now;
      return true;
    });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Image
        source={{ uri: 'https://cdn-icons-png.flaticon.com/512/6134/6134065.png' }}
        style={styles.emptyImage}
      />
      <Text style={styles.emptyTitle}>No tienes citas médicas</Text>
      <Text style={styles.emptyText}>
        Cuando agendes una cita médica, aparecerá aquí para que puedas hacer seguimiento.
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Ionicons name="calendar" size={30} color="#4a90e2" />
      <Text style={styles.headerTitle}>Mis Citas Médicas</Text>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      {['todas', 'pendiente', 'completada'].map(f => (
        <TouchableOpacity
          key={f}
          style={[styles.filterButton, activeFilter === f && styles.filterButtonActive]}
          onPress={() => setActiveFilter(f)}
        >
          <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text style={styles.loadingText}>Cargando tus citas médicas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderFilters()}
      <FlatList
        data={filteredCitas()}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4a90e2"]} />
        }
        ListEmptyComponent={renderEmptyState}
        renderItem={({ item }) => {
          const doctor = doctoresMap[item.doctorId] || { nombre: 'Médico no disponible', especialidad: 'No especificada' };
          const citaDate = new Date(item.fecha + 'T' + (item.hora || '00:00'));
          const estado = citaDate > new Date() ? 'pendiente' : 'completada';

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.doctorInfo}>
                  <View style={styles.doctorAvatar}>
                    <Text style={styles.doctorInitial}>{doctor.nombre.charAt(0)}</Text>
                  </View>
                  <View>
                    <Text style={styles.doctorName}>{doctor.nombre}</Text>
                    <Text style={styles.especialidad}>{item.especialidad || doctor.especialidad}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: estado === 'pendiente' ? '#FF9800' : '#4CAF50' }]}>
                  <Ionicons name={estado === 'pendiente' ? 'time' : 'checkmark-circle'} size={14} color="#fff" />
                  <Text style={styles.statusText}>{estado.charAt(0).toUpperCase() + estado.slice(1)}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Ionicons name="calendar-outline" size={20} color="#4a90e2" />
                    <Text style={styles.infoLabel}>Fecha</Text>
                    <Text style={styles.infoValue}>{formatDate(item.fecha)}</Text>
                  </View>

                  <View style={styles.infoItem}>
                    <Ionicons name="time-outline" size={20} color="#4a90e2" />
                    <Text style={styles.infoLabel}>Hora</Text>
                    <Text style={styles.infoValue}>{item.hora || 'No especificada'}</Text>
                  </View>
                </View>
              </View>

              {estado === 'pendiente' && (
                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => cancelarCita(item.id)}
                  >
                    <Ionicons name="close-circle-outline" size={16} color="#F44336" />
                    <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f8fa' 
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
  filtersContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f0f2f5',
  },
  filterButtonActive: {
    backgroundColor: '#4a90e2',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  doctorInitial: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  especialidad: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#e1e8ed',
  },
  cardBody: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  diagnosticoContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  diagnosticoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  diagnosticoText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
    padding: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f0f7ff',
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#4a90e2',
    fontWeight: '500',
    marginLeft: 6,
  },
  cancelButton: {
    backgroundColor: '#ffebee',
  },
  cancelButtonText: {
    color: '#F44336',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});