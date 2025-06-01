import { useEffect } from 'react';
import { auth } from '../../service/firebase2'; // Asegúrate de que esta ruta esté bien
import { signOut } from 'firebase/auth';
import { router } from 'expo-router';
import { Alert } from 'react-native';

export default function LogoutScreen() {
  useEffect(() => {
    const cerrarSesion = async () => {
      try {
        await signOut(auth);
        router.replace('/'); // o la ruta de login
      } catch (error) {
        Alert.alert('Error', 'No se pudo cerrar sesión');
      }
    };

    cerrarSesion();
  }, []);

  return null; // no renderiza nada
}
