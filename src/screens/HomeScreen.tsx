import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useQuery } from '@apollo/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GET_MENSAJES } from '../graphql/queries';
import * as Notifications from 'expo-notifications';

// Configurar cómo se muestran las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function HomeScreen({ navigation }: any) {
  const [tutorData, setTutorData] = useState<any>(null);
  
  const { data, loading, refetch } = useQuery(GET_MENSAJES);

  useEffect(() => {
    loadTutorData();
    setupNotifications();
  }, []);

  const loadTutorData = async () => {
    try {
      const data = await AsyncStorage.getItem('tutorData');
      if (data) {
        setTutorData(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error cargando datos del tutor:', error);
    }
  };

  const setupNotifications = async () => {
    try {
      // Solicitar permisos
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert('Permisos', 'No se otorgaron permisos para notificaciones');
        return;
      }

      console.log('✅ Permisos de notificaciones otorgados');
    } catch (error) {
      console.error('Error configurando notificaciones:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      navigation.replace('Login');
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  };

  const getTipoEmoji = (tipo: string) => {
    const emojis: any = {
      ANUNCIO_GENERAL: '📢',
      RECORDATORIO: '⏰',
      NOTA_EXAMEN: '📝',
      ASISTENCIA: '👤',
      GALERIA: '📸',
      MENSAJE_PRIVADO: '💬',
      INFORME: '📋',
    };
    return emojis[tipo] || '📄';
  };

  const getTipoLabel = (tipo: string) => {
    const labels: any = {
      ANUNCIO_GENERAL: 'Anuncio general',
      RECORDATORIO: 'Recordatorio',
      NOTA_EXAMEN: 'Nota de examen',
      ASISTENCIA: 'Asistencia',
      GALERIA: 'Galería',
      MENSAJE_PRIVADO: 'Mensaje privado',
      INFORME: 'Informe',
    };
    return labels[tipo] || tipo;
  };

  const renderMensaje = ({ item }: any) => (
    <TouchableOpacity style={styles.mensajeCard}>
      <View style={styles.mensajeHeader}>
        <Text style={styles.emoji}>{getTipoEmoji(item.tipo)}</Text>
        <View style={styles.mensajeInfo}>
          <Text style={styles.mensajeTitulo}>{item.titulo}</Text>
          <Text style={styles.mensajeTipo}>{getTipoLabel(item.tipo)}</Text>
        </View>
      </View>
      <Text style={styles.mensajeContenido} numberOfLines={3}>
        {item.contenido}
      </Text>
      {item.fechaPublicacion && (
        <Text style={styles.mensajeFecha}>
          {new Date(item.fechaPublicacion).toLocaleDateString('es-AR')}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Teresa Informa</Text>
          <Text style={styles.headerSubtitle}>
            Hola, {tutorData?.nombre || 'Tutor'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data?.mensajesGenerales || []}
        renderItem={renderMensaje}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No hay mensajes</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2563eb',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#93c5fd',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#1e40af',
    padding: 10,
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  list: {
    padding: 15,
  },
  mensajeCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  mensajeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  emoji: {
    fontSize: 32,
    marginRight: 12,
  },
  mensajeInfo: {
    flex: 1,
  },
  mensajeTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 4,
  },
  mensajeTipo: {
    fontSize: 12,
    color: '#2563eb',
  },
  mensajeContenido: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  mensajeFecha: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
