import React, { useState, createContext, useContext, useEffect, useRef } from 'react';
import { View, ScrollView, RefreshControl, SafeAreaView, Platform } from 'react-native';
import { ApplicationProvider, Layout, Text, Input, Button, Card, Spinner, Modal, Divider, Icon, TopNavigation, TopNavigationAction } from '@ui-kitten/components';
import * as eva from '@eva-design/eva';
import { ApolloProvider, useMutation, useQuery } from '@apollo/client';
import { apolloClient } from './src/config/apollo';
import { LOGIN_TUTOR, GET_MENSAJES_TUTOR, GET_ALUMNOS_TUTOR } from './src/graphql/queries';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🎨 Context para el tema
type Theme = 'light' | 'dark';
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: typeof lightColors;
}

const lightColors = {
  background: '#f8f9fa',
  card: '#ffffff',
  text: '#1a1a1a',
  textSecondary: '#6b7280',
  border: 'rgba(0, 0, 0, 0.08)',
  primary: '#7c3aed', // Purple vibrante
  primaryLight: 'rgba(124, 58, 237, 0.1)',
  secondary: '#ec4899', // Pink
  accent: '#06b6d4', // Cyan
  success: '#10b981',
  danger: '#ef4444',
  input: '#f9fafb',
  modalOverlay: 'rgba(0, 0, 0, 0.5)',
};

const darkColors = {
  background: '#0a0a0f', // Más oscuro
  card: '#131318', // Más oscuro
  text: '#ffffff',
  textSecondary: '#8b8b9f',
  border: 'rgba(255, 255, 255, 0.06)',
  primary: '#7c3aed', // Purple vibrante
  primaryLight: 'rgba(124, 58, 237, 0.15)',
  secondary: '#ec4899', // Pink
  accent: '#06b6d4', // Cyan
  success: '#10b981',
  danger: '#ef4444',
  input: '#0a0a0f',
  modalOverlay: 'rgba(0, 0, 0, 0.85)',
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  colors: darkColors,
});

export const useTheme = () => useContext(ThemeContext);

// 🎭 ThemeProvider con persistencia
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    // Cargar tema guardado
    AsyncStorage.getItem('theme').then((savedTheme) => {
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme);
      }
    });
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    await AsyncStorage.setItem('theme', newTheme);
  };

  const colors = theme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

function LoginScreen({ onLogin }: any) {
  const { colors } = useTheme();
  const [documento, setDocumento] = React.useState('');
  const [password, setPassword] = React.useState('');

  const [loginTutor, { loading }] = useMutation(LOGIN_TUTOR, {
    onCompleted: async (data: any) => {
      try {
        const { token, user } = data.loginTutorPassword;
        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem('tutorId', user.id);
        await AsyncStorage.setItem('tutorData', JSON.stringify(user));
        onLogin(user);
      } catch (error) {
        Alert.alert('Error', 'No se pudieron guardar los datos');
      }
    },
    onError: () => {
      Alert.alert('Error', 'Documento o contraseña incorrectos');
    },
  });

  const handleLogin = () => {
    if (!documento || !password) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }
    loginTutor({
      variables: {
        input: { documento: documento.trim(), password: password.trim() }
      }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.loginCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>🏫</Text>
          <Text style={[styles.brandName, { color: colors.text }]}>Teresa</Text>
          <Text style={[styles.brandTagline, { color: colors.textSecondary }]}>Portal de Familias</Text>
        </View>
        
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Documento</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
              placeholder="Tu DNI"
              placeholderTextColor={colors.textSecondary}
              value={documento}
              onChangeText={setDocumento}
              keyboardType="numeric"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Contraseña</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
              placeholder="••••••••"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
              editable={!loading}
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled, { backgroundColor: colors.primary }]} 
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
  const { colors, theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<string>('mensajes');
  const [mensajes, setMensajes] = useState<any[]>([]);

  return (
    <SafeAreaView style={[styles.homeContainer, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Teresa</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Portal de Familias</Text>
        </View>
        <TouchableOpacity 
          style={[styles.themeToggle, { backgroundColor: colors.primaryLight, borderColor: colors.border }]}
          onPress={toggleTheme}
          activeOpacity={0.7}
        >
          <Text style={styles.themeIcon}>{theme === 'dark' ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'mensajes' && <MensajesTab onMensajesUpdate={setMensajes} />}
        {activeTab === 'asistencias' && <AsistenciasTab />}
        {activeTab === 'calificaciones' && <CalificacionesTab />}
      </View>

      <View style={[styles.bottomNav, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'dashboard' && { backgroundColor: colors.primaryLight }]}
          onPress={() => setActiveTab('dashboard')}
          activeOpacity={0.7}
        >
          <Text style={[styles.navIcon, activeTab === 'dashboard' && styles.navIconActive]}>🏠</Text>
          <Text style={[styles.navText, { color: activeTab === 'dashboard' ? colors.primary : colors.textSecondary }]}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'mensajes' && { backgroundColor: colors.primaryLight }]}
          onPress={() => setActiveTab('mensajes')}
          activeOpacity={0.7}
        >
          <Text style={[styles.navIcon, activeTab === 'mensajes' && styles.navIconActive]}>💬</Text>
          <Text style={[styles.navText, { color: activeTab === 'mensajes' ? colors.primary : colors.textSecondary }]}>Mensajes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'asistencias' && { backgroundColor: colors.primaryLight }]}
          onPress={() => setActiveTab('asistencias')}
          activeOpacity={0.7}
        >
          <Text style={[styles.navIcon, activeTab === 'asistencias' && styles.navIconActive]}>📅</Text>
          <Text style={[styles.navText, { color: activeTab === 'asistencias' ? colors.primary : colors.textSecondary }]}>Asistencia</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'calificaciones' && { backgroundColor: colors.primaryLight }]}
          onPress={() => setActiveTab('calificaciones')}
          activeOpacity={0.7}
        >
          <Text style={[styles.navIcon, activeTab === 'calificaciones' && styles.navIconActive]}>📊</Text>
          <Text style={[styles.navText, { color: activeTab === 'calificaciones' ? colors.primary : colors.textSecondary }]}>Notas</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function DashboardTab() {
  return (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Bienvenido/a</Text>
      <Text style={styles.tabText}>Explora las secciones desde el menú inferior</Text>
    </View>
  );
}

function MensajesTab({ onMensajesUpdate }: { onMensajesUpdate: (mensajes: any[]) => void }) {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMensaje, setSelectedMensaje] = useState<any>(null);
  const { data, loading, refetch } = useQuery(GET_MENSAJES_TUTOR);

  const mensajes = data?.mensajesTutor || [];

  useEffect(() => {
    if (mensajes.length > 0) {
      onMensajesUpdate(mensajes);
    }
  }, [mensajes.length]); // Sólo cuando cambia la cantidad de mensajes

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={[styles.mensajesContainer, { backgroundColor: colors.background }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {mensajes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyIcon, { color: colors.textSecondary }]}>�</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No hay mensajes</Text>
          </View>
        ) : (
          mensajes.map((mensaje: any) => (
            <TouchableOpacity
              key={mensaje.id}
              style={[styles.mensajeCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: !mensaje.leido ? colors.primary : colors.border }]}
              onPress={() => setSelectedMensaje(mensaje)}
              activeOpacity={0.7}
            >
              <View style={styles.mensajeHeader}>
                <Text style={[styles.mensajeTitulo, { color: colors.text }]}>{mensaje.asunto}</Text>
                <Text style={[styles.mensajeFecha, { color: colors.textSecondary }]}>{formatDate(mensaje.createdAt)}</Text>
              </View>
              <Text style={[styles.mensajeRemitente, { color: colors.textSecondary }]}>
                De: {mensaje.remitente?.nombre || 'Colegio'}
              </Text>
              <Text style={[styles.mensajePreview, { color: colors.textSecondary }]} numberOfLines={2}>
                {mensaje.contenido}
              </Text>
              {!mensaje.leido && (
                <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.unreadText}>Nuevo</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal
        visible={!!selectedMensaje}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedMensaje(null)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitulo, { color: colors.text }]}>
                {selectedMensaje?.asunto}
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedMensaje(null)}
                style={[styles.closeButton, { backgroundColor: colors.primaryLight }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.closeButtonText, { color: colors.primary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={[styles.modalInfo, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>De:</Text>
                <Text style={[styles.modalValue, { color: colors.text }]}>
                  {selectedMensaje?.remitente?.nombre || 'Colegio'}
                </Text>
              </View>
              <View style={[styles.modalInfo, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Fecha:</Text>
                <Text style={[styles.modalValue, { color: colors.text }]}>
                  {selectedMensaje && new Date(selectedMensaje.createdAt).toLocaleString('es-AR')}
                </Text>
              </View>
              <View style={styles.modalContenido}>
                <Text style={[styles.modalContenidoText, { color: colors.text }]}>
                  {selectedMensaje?.contenido}
                </Text>
              </View>
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
      <Text style={styles.tabText}>Próximamente</Text>
    </View>
  );
}

function CalificacionesTab() {
  return (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Calificaciones</Text>
      <Text style={styles.tabText}>Próximamente</Text>
    </View>
  );
}

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  React.useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      setIsLoggedIn(true);
    }
  };

  return isLoggedIn ? <HomeScreen /> : <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
}

export default function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ApolloProvider>
  );
}

const styles = StyleSheet.create({
  // 🎨 LOGIN - Premium & Clean
  container: {
    flex: 1,
    backgroundColor: '#0f1419',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#131318',
    borderRadius: 32, // Más redondeado
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 30 }, // Sombra más dramática
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoEmoji: {
    fontSize: 72, // Más grande
    marginBottom: 16,
  },
  brandName: {
    fontSize: 48, // Más grande y bold
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: -2,
  },
  brandTagline: {
    fontSize: 16,
    color: '#8b8b9f',
    fontWeight: '500',
  },
  formContainer: {
    gap: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8b8b9f',
    marginBottom: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#0a0a0f',
    padding: 18,
    borderRadius: 16, // Más redondeado
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 2,
    borderColor: 'rgba(124, 58, 237, 0.3)', // Borde purple
  },
  button: {
    backgroundColor: '#7c3aed', // Purple
    padding: 18,
    borderRadius: 16, // Más redondeado
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#7c3aed', // Sombra purple
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900', // Más bold
    letterSpacing: 1,
  },

  // 🎨 HOME - Modern & Spacious
  homeContainer: {
    flex: 1,
    backgroundColor: '#0f1419',
  },
  header: {
    backgroundColor: '#1a1f26',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeIcon: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginTop: 4,
  },

  // 🎨 NAVIGATION - Floating Bottom Bar
  content: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#131318',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  navItemActive: {
    backgroundColor: '#7c3aed', // Purple sólido
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  navIcon: {
    fontSize: 26, // Más grande
    marginBottom: 4,
    opacity: 0.5,
  },
  navIconActive: {
    opacity: 1,
  },
  navText: {
    fontSize: 10,
    color: '#8b8b9f',
    fontWeight: '800', // Más bold
    letterSpacing: 0.5,
  },
  navTextActive: {
    color: '#ffffff',
  },

  // 🎨 TAB CONTENT
  tabContent: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  tabText: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 6,
  },

  // 🎨 MENSAJES - Card Design
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f1419',
  },
  mensajesContainer: {
    flex: 1,
    backgroundColor: '#0f1419',
  },
  scrollContent: {
    flex: 1,
    backgroundColor: '#0f1419',
    paddingTop: 16,
  },
  mensajeCard: {
    backgroundColor: '#131318',
    borderRadius: 24, // Más redondeado
    padding: 20,
    marginBottom: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  mensajeNoLeido: {
    backgroundColor: 'rgba(124, 58, 237, 0.1)', // Purple tint
    borderColor: 'rgba(124, 58, 237, 0.4)',
    borderLeftColor: '#7c3aed',
    borderLeftWidth: 4,
  },
  mensajeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  mensajeTitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: -0.3,
    flex: 1,
  },
  mensajeFecha: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 12,
  },
  mensajeRemitente: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 8,
  },
  mensajePreview: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
  },
  unreadBadge: {
    position: 'absolute',
    top: 18,
    right: 18,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unreadText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  mensajeEmoji: {
    fontSize: 28,
    marginRight: 14,
  },
  mensajeInfo: {
    flex: 1,
  },
  mensajeAutor: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '500',
  },
  mensajeTexto: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
    marginTop: 8,
  },
  badgeNoLeido: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3b82f6',
  },

  // 🎨 EMPTY STATE
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  emptyIcon: {
    fontSize: 72,
    marginBottom: 16,
    opacity: 0.3,
  },
  emptyText: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },

  // 🎨 MODAL - Slide Up
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1f26',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    marginTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  modalTitulo: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalInfo: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  modalLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  modalValue: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '500',
  },
  modalContenido: {
    paddingTop: 16,
  },
  modalContenidoText: {
    fontSize: 15,
    color: '#d1d5db',
    lineHeight: 24,
  },
  modalEmoji: {
    fontSize: 36,
    marginRight: 14,
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: '600',
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalMeta: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.15)',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '500',
  },
});
