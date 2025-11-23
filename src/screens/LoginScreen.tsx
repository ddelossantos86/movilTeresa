import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useMutation } from '@apollo/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { LOGIN_TUTOR } from '../graphql/queries';

export default function LoginScreen({ navigation }: any) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  
  const [loginTutor, { loading }] = useMutation(LOGIN_TUTOR, {
    onCompleted: async (data: any) => {
      try {
        // Guardar token y datos del tutor
        await AsyncStorage.setItem('authToken', data.loginTutor.token);
        await AsyncStorage.setItem('tutorId', data.loginTutor.tutor.id);
        await AsyncStorage.setItem('tutorData', JSON.stringify(data.loginTutor.tutor));
        
        // Navegar al home
        navigation.replace('Home');
      } catch (error) {
        console.error('Error guardando datos:', error);
        Alert.alert('Error', 'No se pudieron guardar los datos del usuario');
      }
    },
    onError: (error: any) => {
      console.error('Error login:', error);
      Alert.alert('Error', 'Usuario o contraseña incorrectos');
    },
  });

  const handleLogin = () => {
    if (!usuario || !password) {
      Alert.alert('Error', 'Por favor ingrese usuario y contraseña');
      return;
    }
    
    loginTutor({
      variables: { usuario, password },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dhora</Text>
        <Text style={styles.subtitle}>Portal de Familias</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Usuario"
          value={usuario}
          onChangeText={setUsuario}
          autoCapitalize="none"
          editable={true}
        />

        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true}
          editable={true}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={false}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Ingresar</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.versionText}>
          Versión {Constants.expoConfig?.version || '1.0.0'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#93c5fd',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
  },
  versionText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
