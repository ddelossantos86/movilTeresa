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
import { GET_ALUMNOS_TUTOR, GET_ASISTENCIAS } from '../graphql/queries';
import { Ionicons } from '@expo/vector-icons';

export default function AsistenciasScreen() {
  const [selectedAlumno, setSelectedAlumno] = useState<string | null>(null);

  const { data: alumnosData, loading: alumnosLoading } = useQuery(GET_ALUMNOS_TUTOR);
  const { data: asistenciasData, loading: asistenciasLoading, error: asistenciasError } = useQuery(GET_ASISTENCIAS, {
    variables: { alumnoId: selectedAlumno },
    skip: !selectedAlumno,
  });

  React.useEffect(() => {
    console.log('🎯 AsistenciasScreen - selectedAlumno cambió:', selectedAlumno);
  }, [selectedAlumno]);

  React.useEffect(() => {
    console.log('🎯 AsistenciasScreen - Query data cambió');
    console.log('   asistenciasLoading:', asistenciasLoading);
    console.log('   asistenciasError:', asistenciasError?.message);
    console.log('   asistenciasData:', asistenciasData);
  }, [asistenciasLoading, asistenciasData, asistenciasError]);

  const alumnos = alumnosData?.alumnosTutor || [];
  
  // Transformar asistencias: aplanar registros y mapear estado a presente/ausente
  const asistencias = React.useMemo(() => {
    const rawAsistencias = asistenciasData?.asistenciasTutor || [];
    console.log('📊 AsistenciasScreen - Datos crudos:', rawAsistencias.length);
    
    const result = rawAsistencias.flatMap((asistencia: any) => {
      const fecha = asistencia.fecha;
      return (asistencia.registros || []).map((registro: any) => {
        const esPresente = registro.estado === 'PRESENTE';
        console.log(`  - Registro: ${registro.alumnoId}, Estado: ${registro.estado}, Presente: ${esPresente}`);
        return {
          id: `${asistencia.id}-${registro.alumnoId}`,
          fecha,
          presente: esPresente,
          estado: registro.estado,
          observaciones: registro.observaciones,
          alumnoId: registro.alumnoId,
        };
      });
    });
    
    console.log('📊 AsistenciasScreen - Transformadas:', result.length);
    return result;
  }, [asistenciasData]);

  const renderAlumno = ({ item }: any) => {
    const isSelected = selectedAlumno === item.id;
    return (
      <TouchableOpacity
        style={[styles.alumnoItem, isSelected && styles.alumnoItemSelected]}
        onPress={() => {
          console.log('👆 Alumno seleccionado:', item.id, item.nombre);
          setSelectedAlumno(item.id);
        }}
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

  const renderAsistencia = ({ item }: any) => {
    const fecha = new Date(item.fecha);
    return (
      <View style={styles.asistenciaCard}>
        <View style={styles.asistenciaHeader}>
          <View style={styles.asistenciaFecha}>
            <Text style={styles.asistenciaDia}>{fecha.getDate()}</Text>
            <Text style={styles.asistenciaMes}>
              {fecha.toLocaleDateString('es-AR', { month: 'short' })}
            </Text>
          </View>
          <View style={styles.asistenciaContent}>
            <Text style={styles.asistenciaFechaCompleta}>
              {fecha.toLocaleDateString('es-AR', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
            <View style={styles.asistenciaEstado}>
              <Ionicons
                name={item.presente ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={item.presente ? '#10b981' : '#ef4444'}
              />
              <Text
                style={[
                  styles.asistenciaEstadoText,
                  { color: item.presente ? '#10b981' : '#ef4444' }
                ]}
              >
                {item.presente ? 'Presente' : 'Ausente'}
              </Text>
            </View>
            {item.observaciones && (
              <Text style={styles.asistenciaObs}>{item.observaciones}</Text>
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Asistencias</Text>
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

      {/* Lista de asistencias */}
      {selectedAlumno ? (
        asistenciasLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Cargando asistencias…</Text>
          </View>
        ) : asistenciasError ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
            <Text style={styles.emptyText}>Error: {asistenciasError.message}</Text>
          </View>
        ) : asistencias.length > 0 ? (
          <FlatList
            data={asistencias}
            renderItem={renderAsistencia}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No hay asistencias registradas</Text>
          </View>
        )
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Selecciona un alumno para ver sus asistencias</Text>
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
    backgroundColor: '#10b981',
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
  list: {
    padding: 15,
  },
  asistenciaCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  asistenciaHeader: {
    flexDirection: 'row',
  },
  asistenciaFecha: {
    backgroundColor: '#f3f4f6',
    width: 50,
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  asistenciaDia: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
  },
  asistenciaMes: {
    fontSize: 11,
    color: '#666',
    textTransform: 'uppercase',
  },
  asistenciaContent: {
    flex: 1,
  },
  asistenciaFechaCompleta: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  asistenciaEstado: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  asistenciaEstadoText: {
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  asistenciaObs: {
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
