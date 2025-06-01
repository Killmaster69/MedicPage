import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  Image, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { auth, db } from '../service/firebase2';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const LoginScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const handleAccess = async () => {
    if (!email || !password) {
      Alert.alert('Campos requeridos', 'Por favor ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);

    try {
      const snapshot = await db
        .collection('pacientes')
        .where('correo', '==', email)
        .get();

      if (snapshot.empty) {
        Alert.alert('Acceso denegado', 'Tu correo no está registrado como paciente.');
        setLoading(false);
        return;
      }

      try {
        await auth.signInWithEmailAndPassword(email, password);
        Alert.alert('Bienvenido', 'Has iniciado sesión correctamente.');
        router.replace('/(drawer)/citas');
      } catch (signInError) {
        if (
          typeof signInError === 'object' &&
          signInError !== null &&
          'code' in signInError &&
          ((signInError as any).code === 'auth/user-not-found' ||
          (signInError as any).code === 'auth/invalid-credential')
        ) {
          try {
            await auth.createUserWithEmailAndPassword(email, password);
            Alert.alert('Registrado', 'Cuenta creada exitosamente.');
            router.replace({ pathname: '/(drawer)/dashboard' });
          } catch (registerError) {
            Alert.alert(
              'Error al registrar',
              (typeof registerError === 'object' && registerError !== null && 'message' in registerError)
                ? (registerError as any).message
                : 'Error desconocido.'
            );
          }
        } else {
          Alert.alert(
            'Error de autenticación',
            (typeof signInError === 'object' && signInError !== null && 'message' in signInError)
              ? (signInError as any).message
              : 'Error desconocido.'
          );
        }
      }
    } catch (error) {
      Alert.alert('Error', (error instanceof Error && error.message) ? error.message : 'Error al verificar paciente.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSecureTextEntry = () => {
    setSecureTextEntry(!secureTextEntry);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="medical" size={60} color="#fff" />
          </View>
          <Text style={styles.appName}>MediApp</Text>
          <Text style={styles.appTagline}>Cuidando tu salud</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.title}>Acceso de Paciente</Text>
          
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={22} color="#4a90e2" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#999"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={22} color="#4a90e2" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secureTextEntry}
              placeholderTextColor="#999"
            />
            <TouchableOpacity onPress={toggleSecureTextEntry} style={styles.eyeIcon}>
              <Ionicons 
                name={secureTextEntry ? "eye-outline" : "eye-off-outline"} 
                size={22} 
                color="#999" 
              />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={handleAccess}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={22} color="#fff" />
                <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            Aplicación exclusiva para pacientes registrados
          </Text>
          <Text style={styles.footerSubText}>
            Si no tienes una cuenta, contacta a tu médico
          </Text>
        </View>

        <View style={styles.decorationCircle1} />
        <View style={styles.decorationCircle2} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f8fa',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    position: 'relative',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  appTagline: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 12,
    height: 56,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    height: '100%',
  },
  eyeIcon: {
    padding: 8,
  },
  loginButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 12,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#4a90e2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  footerSubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  decorationCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    top: -50,
    right: -50,
    zIndex: -1,
  },
  decorationCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(74, 144, 226, 0.08)',
    bottom: -30,
    left: -30,
    zIndex: -1,
  },
});