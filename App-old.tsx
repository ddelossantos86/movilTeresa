import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, RefreshControl, Modal, SafeAreaView } from 'react-native';
import { ApolloProvider, useMutation, useQuery } from '@apollo/client';
import { apolloClient } from './src/config/apollo';
import { LOGIN_TUTOR, GET_MENSAJES_TUTOR, GET_ALUMNOS_TUTOR } from './src/graphql/queries';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PushNotifications from './src/components/PushNotifications';

function LoginScreen({ onLogin }: any) {
  const [documento, setDocumento] = React.useState('');
  const [password, setPassword] = React.useState('');

  const [loginTutor, { loading }] = useMutation(LOGIN_TUTOR, {
    onCompleted: async (data: any) => {
      try {
        const { token, user, primerLogin } = data.loginTutorPassword;
        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem('tutorId', user.id);
        await AsyncStorage.setItem('tutorData', JSON.stringify(user));
        onLogin(user);
      } catch (error) {
        console.error('Error guardando datos:', error);
        Alert.alert('Error', 'No se pudieron guardar los datos del usuario');
      }
    },
    onError: (error: any) => {
      console.error('Error login:', error);
      Alert.alert('Error', 'Documento o contraseña incorrectos');
    },
  });

  const handleLogin = () => {
    if (!documento || !password) {
      Alert.alert('Error', 'Por favor ingrese documento y contraseña');
      return;
    }
    loginTutor({ 
      variables: { 
        input: {
          documento: documento.trim(),
          password: password.trim()
        }
      } 
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.loginCard}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>🏫</Text>
          <Text style={styles.brandName}>Teresa</Text>
          <Text style={styles.brandTagline}>Portal de Familias</Text>
        </View>
        
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Documento</Text>
            <TextInput
              style={styles.input}
              placeholder="Tu DNI"
              placeholderTextColor="#6b7280"
              value={documento}
              onChangeText={setDocumento}
              keyboardType="numeric"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#6b7280"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
              editable={!loading}
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Continuar →</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function HomeScreen() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mensajes, setMensajes] = useState<any[]>([]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Portal Teresa</Text>
      </View>

      {/* Componente de notificaciones - Deshabilitado temporalmente (requiere Development Build) */}
      {/* <PushNotifications mensajes={mensajes} /> */}

      <View style={styles.content}>
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'mensajes' && <MensajesTab onMensajesUpdate={setMensajes} />}
        {activeTab === 'asistencias' && <AsistenciasTab />}
        {activeTab === 'calificaciones' && <CalificacionesTab />}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('dashboard')}
        >
          <Text style={[styles.navIcon, activeTab === 'dashboard' && styles.navIconActive]}>🏠</Text>
          <Text style={[styles.navText, activeTab === 'dashboard' && styles.navTextActive]}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('mensajes')}
        >
          <Text style={[styles.navIcon, activeTab === 'mensajes' && styles.navIconActive]}>💬</Text>
          <Text style={[styles.navText, activeTab === 'mensajes' && styles.navTextActive]}>Mensajes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('asistencias')}
        >
          <Text style={[styles.navIcon, activeTab === 'asistencias' && styles.navIconActive]}>📅</Text>
          <Text style={[styles.navText, activeTab === 'asistencias' && styles.navTextActive]}>Asistencias</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('calificaciones')}
        >
          <Text style={[styles.navIcon, activeTab === 'calificaciones' && styles.navIconActive]}>📊</Text>
          <Text style={[styles.navText, activeTab === 'calificaciones' && styles.navTextActive]}>Calificaciones</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Tabs individuales (temporales, luego las haremos completas)
function DashboardTab() {
  return (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Bienvenido/a</Text>
      <Text style={styles.tabText}>Tutor</Text>
    </View>
  );
}

function MensajesTab({ onMensajesUpdate }: { onMensajesUpdate: (mensajes: any[]) => void }) {
  const { data, loading, refetch } = useQuery(GET_MENSAJES_TUTOR);
  const [refreshing, setRefreshing] = React.useState(false);
  const [mensajeSeleccionado, setMensajeSeleccionado] = React.useState<any>(null);

  // Actualizar mensajes cuando cambien
  React.useEffect(() => {
    if (data?.mensajesTutor) {
      onMensajesUpdate(data.mensajesTutor);
    }
  }, [data, onMensajesUpdate]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (loading && !refreshing) {
    return (
      <View style={styles.tabContent}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.tabText}>Cargando mensajes...</Text>
      </View>
    );
  }

  const mensajes = data?.mensajesTutor || [];

  const getEmojiTipo = (tipo: string) => {
    const emojis: any = {
      'ANUNCIO_GENERAL': '📢',
      'RECORDATORIO': '⏰',
      'NOTA_EXAMEN': '📝',
      'ASISTENCIA': '📅',
      'GALERIA': '📸',
      'MENSAJE_PRIVADO': '💌',
      'INFORME': '📊',
    };
    return emojis[tipo] || '📄';
  };

  const getTipoLabel = (tipo: string) => {
    const labels: any = {
      'ANUNCIO_GENERAL': 'Anuncio',
      'RECORDATORIO': 'Recordatorio',
      'NOTA_EXAMEN': 'Calificación',
      'ASISTENCIA': 'Asistencia',
      'GALERIA': 'Galería',
      'MENSAJE_PRIVADO': 'Mensaje Privado',
      'INFORME': 'Informe',
    };
    return labels[tipo] || tipo;
  };

  const getAlcanceLabel = (alcance: string) => {
    const labels: any = {
      'COLEGIO': 'Todo el colegio',
      'GRADO': 'Grado',
      'DIVISION': 'División',
      'ALUMNO': 'Personal',
    };
    return labels[alcance] || alcance;
  };

  return (
    <>
      <ScrollView 
        style={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {mensajes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No hay mensajes</Text>
          </View>
        ) : (
          mensajes.map((mensaje: any) => (
            <TouchableOpacity 
              key={mensaje.id} 
              style={[styles.mensajeCard, !mensaje.leido && styles.mensajeNoLeido]}
              onPress={() => setMensajeSeleccionado(mensaje)}
            >
              <View style={styles.mensajeHeader}>
                <Text style={styles.mensajeEmoji}>{getEmojiTipo(mensaje.tipo)}</Text>
                <View style={styles.mensajeInfo}>
                  <Text style={styles.mensajeTitulo}>{mensaje.titulo || 'Sin título'}</Text>
                  <Text style={styles.mensajeAutor}>{mensaje.autorNombre || 'Colegio'}</Text>
                </View>
                {!mensaje.leido && <View style={styles.badgeNoLeido} />}
              </View>
              <Text style={styles.mensajeContenido} numberOfLines={3}>
                {mensaje.contenido}
              </Text>
              <Text style={styles.mensajeFecha}>
                {new Date(mensaje.creadoEn).toLocaleDateString('es-AR')}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Modal detalle mensaje */}
      <Modal
        visible={mensajeSeleccionado !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMensajeSeleccionado(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalEmoji}>
                {mensajeSeleccionado && getEmojiTipo(mensajeSeleccionado.tipo)}
              </Text>
              <TouchableOpacity 
                onPress={() => setMensajeSeleccionado(null)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalTitulo}>
                {mensajeSeleccionado?.titulo || 'Sin título'}
              </Text>

              <View style={styles.modalMeta}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Tipo:</Text>
                  <Text style={styles.metaValue}>
                    {mensajeSeleccionado && getTipoLabel(mensajeSeleccionado.tipo)}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Alcance:</Text>
                  <Text style={styles.metaValue}>
                    {mensajeSeleccionado && getAlcanceLabel(mensajeSeleccionado.alcance)}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Autor:</Text>
                  <Text style={styles.metaValue}>
                    {mensajeSeleccionado?.autorNombre || 'Colegio'}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Fecha:</Text>
                  <Text style={styles.metaValue}>
                    {mensajeSeleccionado && new Date(mensajeSeleccionado.creadoEn).toLocaleString('es-AR')}
                  </Text>
                </View>
              </View>

              <View style={styles.modalDivider} />

              <Text style={styles.modalContenido}>
                {mensajeSeleccionado?.contenido}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

function AsistenciasTab() {
  return (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Asistencias</Text>
      <Text style={styles.tabText}>Aquí verás las asistencias de tus hijos</Text>
    </View>
  );
}

function CalificacionesTab() {
  return (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Calificaciones</Text>
      <Text style={styles.tabText}>Aquí verás las notas de tus hijos</Text>
    </View>
  );
}

function AppContent() {
  const [tutor, setTutor] = React.useState(null);

  return tutor ? (
    <HomeScreen tutor={tutor} onLogout={() => setTutor(null)} />
  ) : (
    <LoginScreen onLogin={setTutor} />
  );
}

export default function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <AppContent />
    </ApolloProvider>
  );
}

const styles = StyleSheet.create({
  // 🎨 LOGIN SCREEN - Futurista Dark Mode
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#00ff88',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 255, 136, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 48,
    textAlign: 'center',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.2)',
  },
  button: {
    backgroundColor: '#00ff88',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#0a0a0a',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // 🎨 HOME SCREEN
  homeContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 255, 136, 0.3)',
  },
  headerTitle: {
    fontSize: 24,
    color: '#00ff88',
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 255, 136, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    letterSpacing: 1,
  },

  // 🎨 BOTTOM NAV
  content: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 255, 136, 0.3)',
    paddingBottom: 10,
    paddingTop: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 8,
  },
  navIcon: {
    fontSize: 26,
    marginBottom: 4,
    opacity: 0.4,
  },
  navIconActive: {
    opacity: 1,
    textShadowColor: '#00ff88',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  navText: {
    fontSize: 10,
    color: '#555',
    fontWeight: '600',
  },
  navTextActive: {
    color: '#00ff88',
    fontWeight: '900',
  },

  // 🎨 TAB CONTENT
  tabContent: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a0a',
  },
  tabTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#00ff88',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 255, 136, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  tabText: {
    fontSize: 16,
    color: '#888',
    marginBottom: 8,
  },

  // 🎨 MENSAJES
  scrollContent: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingTop: 12,
  },
  mensajeCard: {
    backgroundColor: 'rgba(20, 20, 20, 0.8)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  mensajeNoLeido: {
    backgroundColor: 'rgba(0, 255, 136, 0.08)',
    borderColor: '#00ff88',
    borderLeftWidth: 4,
    shadowColor: '#00ff88',
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  mensajeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  mensajeEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  mensajeInfo: {
    flex: 1,
  },
  mensajeTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  mensajeAutor: {
    fontSize: 13,
    color: '#00ff88',
    fontWeight: '600',
  },
  mensajeTexto: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 12,
    lineHeight: 20,
  },
  mensajeFecha: {
    fontSize: 11,
    color: '#666',
    marginTop: 12,
  },
  badgeNoLeido: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00ff88',
    shadowColor: '#00ff88',
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },

  // 🎨 EMPTY STATE
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
    opacity: 0.3,
  },
  emptyText: {
    fontSize: 16,
    color: '#555',
    fontWeight: '600',
  },

  // 🎨 MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'rgba(20, 20, 20, 0.98)',
    borderRadius: 24,
    padding: 28,
    marginHorizontal: 20,
    maxWidth: 500,
    width: '90%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 255, 136, 0.2)',
  },
  modalEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  modalTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#888',
    fontWeight: '900',
  },
  modalScroll: {
    maxHeight: 450,
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  modalMeta: {
    backgroundColor: 'rgba(0, 255, 136, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.2)',
  },
  mensajeContenido: {
    fontSize: 14,
    color: '#bbb',
    lineHeight: 20,
  },
  metaRow: {
  modalClose: {
    padding: 8,
  },
  closeText: {
    fontSize: 28,
    color: '#666',
  },
  modalBody: {
    maxHeight: 400,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: 13,
    color: '#00ff88',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 13,
    color: '#ccc',
    fontWeight: '600',
  },
  modalDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    marginVertical: 20,
  },
  modalContenido: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 26,
    marginBottom: 30,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 255, 136, 0.2)',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
    marginLeft: 12,
  },
  modalButtonPrimary: {
    backgroundColor: '#00ff88',
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  modalButtonText: {
    color: '#0a0a0a',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  logoutButton: {
    backgroundColor: '#ff0044',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#ff0044',
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
});