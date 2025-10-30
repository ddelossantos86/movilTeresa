import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@apollo/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GET_TUTOR_INFO, GET_ALUMNOS_TUTOR } from '../graphql/queries';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen({ navigation }: any) {
  const [tutorData, setTutorData] = useState<any>(null);
  
  const { data: userData, loading: userLoading } = useQuery(GET_TUTOR_INFO);
  const { data: alumnosData, loading: alumnosLoading } = useQuery(GET_ALUMNOS_TUTOR);

  useEffect(() => {
    loadTutorData();
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

  const alumnos = alumnosData?.alumnosTutor || [];

  const MenuCard = ({ icon, title, subtitle, onPress, color }: any) => (
    <TouchableOpacity
      style={[styles.menuCard, { borderLeftColor: color }]}
      onPress={onPress}
    >
      <View style={styles.menuIconContainer}>
        <Ionicons name={icon} size={32} color={color} />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#999" />
    </TouchableOpacity>
  );

  if (userLoading || alumnosLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola,</Text>
          <Text style={styles.userName}>
            {tutorData?.nombre || 'Tutor'} {tutorData?.apellido || ''}
          </Text>
        </View>
      </View>

      {/* Tarjeta de hijos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mis Hijos</Text>
        {alumnos.length > 0 ? (
          alumnos.map((alumno: any) => (
            <View key={alumno.id} style={styles.alumnoCard}>
              <View style={styles.alumnoHeader}>
                <Ionicons name="person-circle" size={40} color="#2563eb" />
                <View style={styles.alumnoInfo}>
                  <Text style={styles.alumnoNombre}>
                    {alumno.nombre} {alumno.apellido}
                  </Text>
                  {alumno.inscripciones && alumno.inscripciones[0] && (
                    <Text style={styles.alumnoDivision}>
                      {alumno.inscripciones[0].division.grado.nombre} - {alumno.inscripciones[0].division.nombre}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noData}>No hay alumnos registrados</Text>
        )}
      </View>

      {/* Menú principal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accesos Rápidos</Text>
        
        <MenuCard
          icon="chatbubbles"
          title="Mensajes"
          subtitle="Ver comunicados del colegio"
          color="#2563eb"
          onPress={() => navigation.navigate('Mensajes')}
        />

        <MenuCard
          icon="calendar"
          title="Asistencias"
          subtitle="Consultar asistencias"
          color="#10b981"
          onPress={() => navigation.navigate('Asistencias')}
        />

        <MenuCard
          icon="school"
          title="Calificaciones"
          subtitle="Ver notas y evaluaciones"
          color="#f59e0b"
          onPress={() => navigation.navigate('Calificaciones')}
        />

        <MenuCard
          icon="mail"
          title="Conversaciones"
          subtitle="Comunicarse con docentes"
          color="#8b5cf6"
          onPress={() => navigation.navigate('Conversaciones')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#2563eb',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: '#93c5fd',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 15,
  },
  alumnoCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  alumnoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alumnoInfo: {
    marginLeft: 12,
    flex: 1,
  },
  alumnoNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
  },
  alumnoDivision: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  noData: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    padding: 20,
  },
  menuCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    marginRight: 15,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#666',
  },
});
