import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../../service/firebase2';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function InicioScreen() {
  const [pacienteId, setPacienteId] = useState(null);
  const [pacienteNombre, setPacienteNombre] = useState('');

  useEffect(() => {
    const getPacienteInfo = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const snap = await getDocs(query(collection(db, 'pacientes'), where('correo', '==', user.email)));
      if (!snap.empty) {
        const doc = snap.docs[0];
        setPacienteId(doc.id);
        setPacienteNombre(doc.data().nombre);
      }
    };

    const setup = async () => {
      await registerForPushNotifications();
      await getPacienteInfo();
    };

    setup();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (pacienteId) {
        programarCitas();
        programarRecetas();
      }
    }, [pacienteId])
  );

  const registerForPushNotifications = async () => {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert('Permiso denegado para notificaciones');
      }
    } else {
      Alert.alert('Debe usar un dispositivo físico para notificaciones');
    }
  };

  const programarCitas = async () => {
    const citasSnap = await getDocs(query(collection(db, 'citas'), where('pacienteId', '==', pacienteId)));

    for (const doc of citasSnap.docs) {
      const cita = doc.data();
      const id = doc.id;
      const fechaHora = new Date(`${cita.fecha}T${cita.hora}`);

      const yaProgramada = await AsyncStorage.getItem(`cita_${id}`);
      if (yaProgramada) continue;

      const dosHorasAntes = new Date(fechaHora);
      dosHorasAntes.setHours(dosHorasAntes.getHours() - 2);

      const unaHoraAntes = new Date(fechaHora);
      unaHoraAntes.setHours(unaHoraAntes.getHours() - 1);

      if (dosHorasAntes > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Cita médica',
            body: `Tienes una cita a las ${cita.hora}`,
          },
          trigger: dosHorasAntes,
        });
      }

      if (unaHoraAntes > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Cita médica',
            body: `Tu cita está por comenzar a las ${cita.hora}`,
          },
          trigger: unaHoraAntes,
        });
      }

      await AsyncStorage.setItem(`cita_${id}`, 'true');
    }
  };

  const programarRecetas = async () => {
    const recetasSnap = await getDocs(query(collection(db, 'recetas'), where('pacienteId', '==', pacienteId)));

    for (const docReceta of recetasSnap.docs) {
      const receta = docReceta.data();
      const id = docReceta.id;
      const yaProgramada = await AsyncStorage.getItem(`receta_${id}`);
      if (yaProgramada) continue;

      const duracion = parseInt(receta.duracion);
      const horaParts = receta.horaToma.split(':');
      const fechaInicio = new Date(receta.fechaInicio);
      const hora = parseInt(horaParts[0]);
      const minuto = parseInt(horaParts[1]);

      const medSnap = await getDoc(doc(db, 'medicamentos', receta.medicamentoId));
      const nombreMed = medSnap.exists() ? medSnap.data().nombre : 'medicamento';

      for (let i = 0; i < duracion; i++) {
        const fechaNoti = new Date(fechaInicio);
        fechaNoti.setDate(fechaNoti.getDate() + i);
        fechaNoti.setHours(hora);
        fechaNoti.setMinutes(minuto - 10); 

        if (fechaNoti > new Date()) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Recordatorio de Medicamento',
              body: `En 10 minutos debes tomar: ${nombreMed} a las ${receta.horaToma}`,
            },
            trigger: fechaNoti,
          });
        }
      }

      await AsyncStorage.setItem(`receta_${id}`, 'true');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 10 }}>
        ¡Hola, {pacienteNombre || 'Paciente'}!
      </Text>
      <Text style={{ textAlign: 'center' }}>
        Bienvenido al panel. Tus notificaciones serán programadas automáticamente.
      </Text>
    </View>
  );
}
