import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@apollo/client';
import { GET_ALUMNOS_TUTOR, GET_CALIFICACIONES } from '../graphql/queries';
import { Ionicons } from '@expo/vector-icons';

export default function CalificacionesScreen() {
  const [selectedAlumno, setSelectedAlumno] = useState<string | null>(null);

  const { data: alumnosData, loading: alumnosLoading } = useQuery(GET_ALUMNOS_TUTOR);
  const { data: calificacionesData, loading: calificacionesLoading } = useQuery(GET_CALIFICACIONES, {
    variables: { alumnoId: selectedAlumno },
    skip: !selectedAlumno,
  });

  const alumnos = alumnosData?.alumnosTutor || [];
  const calificaciones = calificacionesData?.calificacionesByAlumno || [];

  const getNotaColor = (nota: number) => {
    if (nota >= 7) return '#10b981'; // Verde
    if (nota >= 4) return '#f59e0b'; // Amarillo
    return '#ef4444'; // Rojo
  };

  const renderAlumno = ({ item }: any) => {
    const isSelected = selectedAlumno === item.id;
    return (
      <TouchableOpacity
        style={[styles.alumnoItem, isSelected && styles.alumnoItemSelected]}
        onPress={() => setSelectedAlumno(item.id)}
      >
        <View style={styles.alumnoInfo}>
          <Ionicons 
            name="person-circle" 
            size={32} 
            color={isSelected ? '#2563eb' : '#666'} 
          />
          <View style={styles.alumnoTexts}>
            <Text style={[styles.alumnoName, isSelected && styles.textSelected]}>
              {item.nombre} {item.apellido}
            </Text>
            {item.inscripciones && item.inscripciones[0] && (
              <Text style={[styles.alumnoDivision, isSelected && styles.textSelected]}>
                {item.inscripciones[0].division.grado.nombre} - {item.inscripciones[0].division.nombre}
              </Text>
            )}
          </View>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color="#2563eb" />
        )}
      </TouchableOpacity>
    );
  };

  const renderCalificacion = ({ item }: any) => {
    const fecha = new Date(item.fecha);
    const notaColor = getNotaColor(item.nota);

    return (
      <View style={styles.calificacionCard}>
        <View style={styles.calificacionHeader}>
          <View style={[styles.notaBadge, { backgroundColor: notaColor }]}>
            <Text style={styles.notaText}>{item.nota}</Text>
          </View>
          <View style={styles.calificacionContent}>
            <Text style={styles.campoFormativo}>{item.campoFormativo.nombre}</Text>
            <Text style={styles.fecha}>
              {fecha.toLocaleDateString('es-AR', { 
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </Text>
            {item.observaciones && (
              <Text style={styles.observaciones}>{item.observaciones}</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (alumnosLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  // Calcular promedio
  const promedio = calificaciones.length > 0
    ? (calificaciones.reduce((sum: number, cal: any) => sum + cal.nota, 0) / calificaciones.length).toFixed(2)
    : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calificaciones</Text>
      </View>

      {/* Selector de alumno */}
      <View style={styles.alumnosContainer}>
        <Text style={styles.sectionTitle}>Selecciona un alumno</Text>
        <FlatList
          horizontal
          data={alumnos}
          renderItem={renderAlumno}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.alumnosList}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {/* Promedio */}
      {selectedAlumno && promedio && (
        <View style={styles.promedioContainer}>
          <Text style={styles.promedioLabel}>Promedio General</Text>
          <View style={[styles.promedioBadge, { backgroundColor: getNotaColor(parseFloat(promedio)) }]}>
            <Text style={styles.promedioText}>{promedio}</Text>
          </View>
        </View>
      )}

      {/* Lista de calificaciones */}
      {selectedAlumno ? (
        calificacionesLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : calificaciones.length > 0 ? (
          <FlatList
            data={calificaciones}
            renderItem={renderCalificacion}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="school-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No hay calificaciones registradas</Text>
          </View>
        )
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Selecciona un alumno para ver sus calificaciones</Text>
        </View>
      )}
    </View>
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
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#f59e0b',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  alumnosContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  alumnosList: {
    paddingVertical: 5,
  },
  alumnoItem: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
  },
  alumnoItemSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  alumnoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alumnoTexts: {
    marginLeft: 10,
  },
  alumnoName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111',
  },
  alumnoDivision: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  textSelected: {
    color: '#2563eb',
  },
  promedioContainer: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  promedioLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
  },
  promedioBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promedioText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  list: {
    padding: 15,
  },
  calificacionCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  calificacionHeader: {
    flexDirection: 'row',
  },
  notaBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notaText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  calificacionContent: {
    flex: 1,
    justifyContent: 'center',
  },
  campoFormativo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 4,
  },
  fecha: {
    fontSize: 13,
    color: '#666',
    textTransform: 'capitalize',
  },
  observaciones: {
    fontSize: 13,
    color: '#666',
    marginTop: 6,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});
