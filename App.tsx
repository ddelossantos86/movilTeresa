import { BlurView } from 'expo-blur';
import React, { useState, useEffect, useRef } from 'react';
import { View, SafeAreaView, ScrollView, RefreshControl, StatusBar, Modal, TouchableOpacity, Animated, Easing, Platform, LogBox, Alert, Image, Dimensions, FlatList } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ApplicationProvider, Layout, Text, Input, Button, Card, Spinner, Divider, Icon, TopNavigation, TopNavigationAction, IconRegistry, Datepicker, Select, SelectItem, IndexPath } from '@ui-kitten/components';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import * as eva from '@eva-design/eva';
import { ApolloProvider, useMutation, useQuery, gql } from '@apollo/client';
import { apolloClient } from './src/config/apollo';
import ImageViewing from 'react-native-image-viewing';
import { LOGIN_TUTOR, GET_MENSAJES_TUTOR, MARCAR_MENSAJE_LEIDO, GET_ALUMNOS_TUTOR, GET_ASISTENCIAS, GET_CALIFICACIONES, GET_OBSERVACIONES_INICIAL, GET_SEGUIMIENTO_DIARIO, UPDATE_TUTOR_PROFILE, UPDATE_ALUMNO_CONDICIONES, GET_TUTOR_INFO, UPDATE_PUSH_TOKEN } from './src/graphql/queries';
import { useApolloCache } from './src/hooks/useApolloCache';
// DISABLED: Hook depends on broken GET_REACCIONES_MENSAJE query
// import { useMensajeReaccion } from './src/hooks/useMensajeReaccion';
import { PostCard } from './src/components/PostCard';
import { MensajeDetailCarousel } from './src/components/MensajeDetailCarousel';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import TeresaLogo from './assets/DhoraLogo';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import DHIcon from './assets/DHIcon';
import DHIconV2 from './assets/DHIconV2';
import DHLogo from './assets/DHLogo';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';

// Suprimir warnings conocidos de UI Kitten y React Native
LogBox.ignoreLogs([
  'Support for defaultProps',
  'MeasureElement: Support for defaultProps',
  'Text: unsupported configuration',
  'unsupported configuration',
  'Cannot connect to Metro',
]);

// Ignorar todos los warnings de console.warn relacionados con UI Kitten y Metro
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Support for defaultProps') ||
     args[0].includes('unsupported configuration') ||
     args[0].includes('MeasureElement') ||
     args[0].includes('Cannot connect to Metro') ||
     args[0].includes('cache.diff') ||
     args[0].includes('canonizeResults') ||
     args[0].includes('Apollo') ||
     args[0].includes('Error cargando reacciones') ||
     args[0].includes('reacciones (ignorado)'))
  ) {
    return;
  }
  originalWarn(...args);
};

// 🔔 CONFIGURACIÓN DE NOTIFICACIONES
// Configurar cómo se manejan las notificaciones cuando la app está en foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// 🎨 TEMA CLARO VIBRANTE - Colores alegres y modernos
const customTheme = {
  ...eva.light,
  // PRIMARY - PÚRPURA (Headers, botones principales, elementos clave)
  'color-primary-100': '#F5E6FB',
  'color-primary-200': '#E8C8F8',
  'color-primary-300': '#D4B5E0',
  'color-primary-400': '#C293D8',
  'color-primary-500': '#B084CC',
  'color-primary-600': '#9D7FDB',
  'color-primary-700': '#764BA2', // Púrpura del logo (DOMINANTE PRINCIPAL)
  'color-primary-800': '#6A4293',
  'color-primary-900': '#5C3A7F',
  
  // Fondos súper claros y limpios
  'color-basic-100': '#FFFFFF',
  'color-basic-200': '#F8FAFB',
  'color-basic-300': '#EFF3F6',
  'color-basic-400': '#E6EBF0',
  'color-basic-500': '#C5CEE0',
  'color-basic-600': '#8F9BB3',

  // DUAL STRATEGY: Púrpura + Rosa estratégicamente distribuidos
  // SUCCESS = Rosa (confirmaciones, accents, elementos secundarios vibrantes)
  'color-success-100': '#FEE6F8',
  'color-success-500': '#F093FB', // Rosa del logo (ACCENT VIBRANTE)
  'color-success-700': '#E670F0',
  
  // WARNING = Rosa-púrpura mix (para diferenciar de danger)
  'color-warning-100': '#EFE0F0',
  'color-warning-500': '#D8A3D8', // Rosa-púrpura mix (advertencias)
  'color-warning-700': '#C291C2',
  
  // DANGER = Púrpura oscuro (errores graves)
  'color-danger-100': '#E8DFF5',
  'color-danger-500': '#A6708B', // Púrpura apagado (errores)
  'color-danger-700': '#8B5A7A',
  
  // INFO = Púrpura claro (información)
  'color-info-100': '#E8DFF5',
  'color-info-500': '#9D7FDB', // Púrpura claro (info)
  'color-info-700': '#764BA2',
};

// 🌙 TEMA OSCURO - Colores oscuros con púrpura-rosa
const darkTheme = {
  ...eva.dark,
  
  // === BACKGROUNDS (Jerarquía de profundidad) ===
  'color-basic-100': '#0F0F1E', // App background (más oscuro)
  'color-basic-200': '#1A1A2E', // Primary background
  'color-basic-300': '#222841', // Cards, sections
  'color-basic-400': '#2A3154', // Overlay, elevated
  'color-basic-500': '#323C67', // Inputs, fields
  'color-basic-600': '#3A3F5F', // Borders, dividers
  'color-basic-700': '#4A4F6F', // Borders light

  // === PRIMARY - PÚRPURA (Headers, botones principales) ===
  'color-primary-100': '#5C3A7F',
  'color-primary-200': '#6A4293',
  'color-primary-300': '#764BA2', // Púrpura del logo
  'color-primary-400': '#8B5AA3',
  'color-primary-500': '#9D7FDB',
  'color-primary-600': '#B8A3FF',
  'color-primary-700': '#764BA2', // Púrpura del logo
  'color-primary-800': '#CDB5FF',
  'color-primary-900': '#E8D7FF',

  // === SUCCESS - ROSA (Acentos, badges) ===
  'color-success-100': '#4D2B4D',
  'color-success-200': '#7A4D8A',
  'color-success-500': '#F093FB', // Rosa vibrante en oscuro
  'color-success-700': '#FF6FFF',
  'color-success-800': '#FF85FF',

  // === WARNING ===
  'color-warning-100': '#5C3A4D',
  'color-warning-500': '#D8A3D8',
  'color-warning-700': '#E8B3E8',

  // === DANGER ===
  'color-danger-100': '#4D2B3D',
  'color-danger-500': '#C291C2',
  'color-danger-700': '#D8A3D8',

  // === INFO ===
  'color-info-100': '#3D2B5C',
  'color-info-500': '#B8A3FF',
  'color-info-700': '#D4C8FF',
};

// 🎨 CONSTANTES DE COLORES PARA MODO OSCURO (Usado en todos los componentes)
const DARK_COLORS = {
  // Backgrounds - Jerarquía
  bg_app: '#0F0F1E',
  bg_primary: '#1A1A2E',
  bg_secondary: '#222841',
  bg_tertiary: '#2A3154',
  bg_input: '#323C67',
  
  // Text - Legibilidad
  text_primary: '#FFFFFF',
  text_secondary: '#D0D0D0',
  text_tertiary: '#A0A0B0',
  text_disabled: '#808090',
  text_hint: '#606070',
  
  // Borders - Separación
  border_subtle: '#3A3F5F',
  border_medium: '#404560',
  border_light: '#4A4F6F',
  
  // Accents - Énfasis
  accent_primary: '#764BA2',
  accent_rose: '#F093FB',
  accent_purple: '#9D7FDB',
  accent_purple_light: '#B8A3FF',
};

// 🎨 CONSTANTES DE COLORES PARA MODO CLARO (Usado en todos los componentes)
const LIGHT_COLORS = {
  // Backgrounds
  bg_app: '#FFFFFF',
  bg_primary: '#F8FAFB',
  bg_secondary: '#EFF3F6',
  bg_tertiary: '#E8EEF3',
  bg_input: '#FFFFFF',
  
  // Text
  text_primary: '#1A1F36',
  text_secondary: '#666666',
  text_tertiary: '#999999',
  text_disabled: '#CCCCCC',
  text_hint: '#999999',
  
  // Borders
  border_subtle: '#e5e7eb',
  border_medium: '#d0d5dd',
  border_light: '#c9cdd4',
  
  // Accents
  accent_primary: '#764BA2',
  accent_rose: '#F093FB',
  accent_purple: '#9D7FDB',
  accent_purple_light: '#B8A3FF',
};

// Función para obtener colores según modo oscuro
const getColors = (isDarkMode: boolean) => isDarkMode ? DARK_COLORS : LIGHT_COLORS;

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [documento, setDocumento] = useState('');
  const [password, setPassword] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [loginTutor, { loading }] = useMutation(LOGIN_TUTOR);

  // Verificar si hay biometría disponible al cargar
  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const isAvailable = compatible && enrolled;
      setBiometricAvailable(isAvailable);
      
      if (isAvailable) {
        const enabled = await SecureStore.getItemAsync('biometricEnabled');
        setBiometricEnabled(enabled === 'true');
        
        // Si está habilitada, intentar login automático
        if (enabled === 'true') {
          await authenticateWithBiometrics();
        }
      }
    } catch (error) {
      console.error('Error verificando biometría:', error);
    }
  };

  const authenticateWithBiometrics = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autenticar con huella digital o Face ID',
        fallbackLabel: 'Usar contraseña',
        cancelLabel: 'Cancelar',
      });

      if (result.success) {
        // Obtener credenciales guardadas
        const savedDocumento = await SecureStore.getItemAsync('userDocumento');
        const savedPassword = await SecureStore.getItemAsync('userPassword');
        
        if (savedDocumento && savedPassword) {
          // Hacer login automático
          await performLogin(savedDocumento, savedPassword);
        }
      }
    } catch (error) {
      console.error('Error en autenticación biométrica:', error);
    }
  };

  const performLogin = async (doc: string, pass: string) => {
    try {
      const { data } = await loginTutor({ 
        variables: { 
          input: { 
            documento: doc, 
            password: pass 
          } 
        } 
      });
      if (data?.loginTutorPassword?.token) {
        await AsyncStorage.setItem('authToken', data.loginTutorPassword.token);
        console.log('🔐 Login Response User:', data.loginTutorPassword.user);
        if (data.loginTutorPassword.user) {
          await AsyncStorage.setItem('tutorData', JSON.stringify(data.loginTutorPassword.user));
        }
        // Limpiar el cache de Apollo para que cargue datos frescos
        await apolloClient.cache.reset();
        console.log('🧹 Apollo cache limpiado después del login');
        onLogin();
      }
    } catch (error: any) {
      alert(error.message || 'Error en el login');
    }
  };

  const handleLogin = async () => {
    await performLogin(documento, password);
    
    // Si el login fue exitoso y hay biometría disponible, preguntar si quiere habilitarla
    if (biometricAvailable && !biometricEnabled) {
      Alert.alert(
        'Autenticación Biométrica',
        '¿Deseas habilitar la autenticación con huella digital o Face ID para futuros accesos?',
        [
          {
            text: 'No',
            style: 'cancel'
          },
          {
            text: 'Sí, habilitar',
            onPress: async () => {
              await SecureStore.setItemAsync('userDocumento', documento);
              await SecureStore.setItemAsync('userPassword', password);
              await SecureStore.setItemAsync('biometricEnabled', 'true');
              setBiometricEnabled(true);
            }
          }
        ]
      );
    }
  };

  const PersonIcon = (props: any) => <Icon {...props} name="person-outline" />;
  const LockIcon = (props: any) => <Icon {...props} name="lock-outline" />;
  const FingerprintIcon = (props: any) => <Icon {...props} name="npm-outline" />;

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Layout style={{ flex: 1, paddingTop: StatusBar.currentHeight || 44 }}>
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo DH - Texto DHORA en violeta */}
          <View style={{ alignItems: 'center', marginBottom: 48 }}>
            <Text style={{
              fontSize: 48,
              fontWeight: '300',
              color: '#764BA2',
              letterSpacing: 16,
              fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-light',
              textTransform: 'uppercase',
            }}>
              DHORA
            </Text>
            <Text style={{
              marginTop: 8,
              fontSize: 12,
              fontWeight: '300',
              color: '#764BA2',
              letterSpacing: 2,
              fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-light',
              opacity: 0.8
            }}>
              Conexión Familiar
            </Text>
          </View>

          {/* Inputs de login */}
          <Input
            placeholder="Documento"
            value={documento}
            onChangeText={setDocumento}
            accessoryLeft={PersonIcon}
            keyboardType="numeric"
            autoCapitalize="none"
            autoCorrect={false}
            size="large"
            style={{ marginBottom: 16, borderRadius: 12 }}
          />

          <Input
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            accessoryLeft={LockIcon}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            size="large"
            style={{ marginBottom: 24, borderRadius: 12 }}
          />

          <Button 
            onPress={handleLogin} 
            disabled={loading || !documento || !password} 
            size="large"
            style={{ borderRadius: 12, marginBottom: 12 }}
            accessoryRight={loading ? (props) => <Spinner {...props} size="small" status="basic" /> : undefined}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </Button>

          {biometricAvailable && biometricEnabled && (
            <Button 
              onPress={authenticateWithBiometrics} 
              appearance="ghost"
              size="large"
              accessoryLeft={FingerprintIcon}
              style={{ borderRadius: 12 }}
            >
              Usar Huella/Face ID
            </Button>
          )}
        </ScrollView>
      </Layout>
    </>
  );
}

// 🏠 HOME
function HomeScreen({ onLogout, isDarkMode, toggleDarkMode }: { onLogout: () => void; isDarkMode: boolean; toggleDarkMode: () => Promise<void> }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [tutorNombre, setTutorNombre] = useState<string>('');
  const mensajesNoLeidos = mensajes.filter((m: any) => !m.leido).length;
  
  // Obtener colores según modo oscuro
  const colors = getColors(isDarkMode);
  
  // Cargar nombre del tutor
  useEffect(() => {
    const loadTutorData = async () => {
      const tutorDataStr = await AsyncStorage.getItem('tutorData');
      console.log('📦 Tutor Data String:', tutorDataStr);
      if (tutorDataStr) {
        const tutorData = JSON.parse(tutorDataStr);
        console.log('📦 Tutor Data Parsed:', tutorData);
        const nombre = tutorData.nombre || '';
        const apellido = tutorData.apellido || '';
        setTutorNombre(`${nombre} ${apellido}`.trim());
        console.log('👤 Nombre final:', `${nombre} ${apellido}`.trim());
      }
    };
    loadTutorData();
  }, []);
  
  // Obtener alumnos para verificar si hay alguno de nivel MATERNAL
  const { data: alumnosData } = useQuery(GET_ALUMNOS_TUTOR);
  const alumnos = alumnosData?.alumnosTutor || [];
  const tieneMaternalAlumno = alumnos.some((a: any) => a.nivel === 'MATERNAL');
  
  // Estado global para filtro de alumno (compartido entre todas las secciones)
  const [selectedAlumnoId, setSelectedAlumnoId] = useState<string | null>(null);
  
  // DEBUG: Ver niveles de alumnos
  console.log('🔍 DEBUG Alumnos:', alumnos.map((a: any) => ({ nombre: a.nombre, nivel: a.nivel, grado: a.grado, division: a.division })));
  console.log('🔍 DEBUG Tiene MATERNAL?', tieneMaternalAlumno);
  
  // Animaciones para efecto blur
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const blurOpacity = useRef(new Animated.Value(0)).current;

  const handleTabChange = (newTab: string) => {
    if (newTab === activeTab) return;
    
    setIsTransitioning(true);
    setShowLoadingOverlay(true);
    
    // Mostrar blur con fade suave
    Animated.timing(blurOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start(() => {
      // Cambiar tab mientras está borroso
      setActiveTab(newTab);
      
      // Quitar blur después de un pequeño delay para dar tiempo a que cargue el contenido
      // Dashboard necesita mucho más tiempo para evitar que se vea contenido parcial
      const loadingDelay = newTab === 'dashboard' ? 800 : 250;
      
      setTimeout(() => {
        setShowLoadingOverlay(false);
        Animated.timing(blurOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }).start(() => {
          setIsTransitioning(false);
        });
      }, loadingDelay);
    });
  };
  
  // Función para obtener el título según la pestaña activa
  const getTituloActivo = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Inicio';
      case 'mensajes':
        return mensajesNoLeidos > 0 ? `Mensajes (${mensajesNoLeidos})` : 'Mensajes';
      case 'asistencias':
        return 'Asistencias';
      case 'evaluaciones':
        return 'Evaluaciones';
      case 'seguimiento':
        return 'Seguimiento';
      case 'configuraciones':
        return 'Configuraciones';
      default:
        return 'Teresa App';
    }
  };

  const LogoutIcon = (props: any) => <Icon {...props} name="log-out-outline" />;

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.accent_primary} />
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg_app }}>
        {/* Header personalizado - Compacto */}
        <View style={{ 
          backgroundColor: colors.accent_primary,
          paddingTop: 15,
          paddingBottom: 15,
          paddingHorizontal: 16
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Izquierda - Sección y Usuario */}
              <View style={{ flex: 1 }}>
                <Text category="s1" style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>
                  {getTituloActivo()}
                </Text>
                {tutorNombre && (
                  <Text category="c1" style={{ color: '#FFFFFF', fontSize: 10, marginTop: 2, opacity: 0.9 }}>
                    {tutorNombre}
                  </Text>
                )}
              </View>
              
              {/* Centro - DHORA */}
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '300',
                  color: '#FFFFFF',
                  letterSpacing: 4,
                  fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-light',
                  textTransform: 'uppercase',
                  marginBottom: 2,
                }}>
                  DHORA
                </Text>
                <Text style={{
                  fontSize: 10,
                  fontWeight: '300',
                  color: '#FFFFFF',
                  letterSpacing: 0.5,
                  fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-light',
                  opacity: 0.85,
                }}>
                  Colegio Millaray
                </Text>
              </View>
              
              {/* Derecha - Acciones */}
              <View style={{ flex: 1, alignItems: 'flex-end', flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
                {activeTab !== 'configuraciones' && (
                  <>
                    {/* Botón de modo oscuro */}
                    {/* TODO: Mejorar funcionalidad de modo oscuro
                    <TouchableOpacity 
                      onPress={toggleDarkMode}
                      style={{ 
                        width: 36, 
                        height: 36, 
                        borderRadius: 18, 
                        backgroundColor: 'rgba(255,255,255,0.25)',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                      <Icon 
                        name={isDarkMode ? 'sun' : 'moon'}
                        fill="#FFFFFF" 
                        style={{ width: 22, height: 22 }} 
                      />
                    </TouchableOpacity>
                    */}

                    {/* Botón de configuraciones */}
                    <TouchableOpacity 
                      onPress={() => handleTabChange('configuraciones')}
                      style={{ 
                        width: 36, 
                        height: 36, 
                        borderRadius: 18, 
                        backgroundColor: 'rgba(255,255,255,0.25)',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                      <Icon 
                        name="settings-outline" 
                        fill="#FFFFFF" 
                        style={{ width: 22, height: 22 }} 
                      />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
        </View>

      <View style={{ flex: 1, position: 'relative', backgroundColor: colors.bg_primary }}>
        {activeTab === 'mensajes' && (
          <MensajesTab 
            onMensajesUpdate={setMensajes} 
            alumnoId={selectedAlumnoId}
            alumnos={alumnos}
            selectedAlumnoId={selectedAlumnoId}
            setSelectedAlumnoId={setSelectedAlumnoId}
            isDarkMode={isDarkMode}
          />
        )}
        {activeTab === 'dashboard' && (
          <DashboardTab 
            alumnos={alumnos}
            selectedAlumnoId={selectedAlumnoId}
            setSelectedAlumnoId={setSelectedAlumnoId}
            setActiveTab={setActiveTab}
            isDarkMode={isDarkMode}
          />
        )}
        {activeTab === 'asistencias' && (
          <AsistenciasTab 
            alumnos={alumnos}
            selectedAlumnoId={selectedAlumnoId}
            setSelectedAlumnoId={setSelectedAlumnoId}
            isDarkMode={isDarkMode}
          />
        )}
        {activeTab === 'evaluaciones' && (
          <EvaluacionesTab 
            alumnos={alumnos}
            selectedAlumnoId={selectedAlumnoId}
            setSelectedAlumnoId={setSelectedAlumnoId}
            isDarkMode={isDarkMode}
          />
        )}
        {activeTab === 'seguimiento' && tieneMaternalAlumno && (
          <SeguimientoTab 
            alumnos={alumnos}
            selectedAlumnoId={selectedAlumnoId}
            setSelectedAlumnoId={setSelectedAlumnoId}
            isDarkMode={isDarkMode}
          />
        )}
        {activeTab === 'configuraciones' && <ConfiguracionesTab onLogout={onLogout} isDarkMode={isDarkMode} />}
        
        {/* Blur overlay durante transición - Fondo opaco */}
        {isTransitioning && Platform.OS === 'ios' && (
          <View style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
            backgroundColor: colors.bg_primary
          }}>
            <Animated.View style={{ 
              flex: 1,
              opacity: blurOpacity
            }}>
              <BlurView
                style={{ flex: 1 }}
                intensity={10}
                tint="light"
              />
            </Animated.View>
          </View>
        )}
        
        {/* Fallback para Android - overlay opaco */}
        {isTransitioning && Platform.OS === 'android' && (
          <Animated.View style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
            backgroundColor: colors.bg_primary,
            opacity: blurOpacity
          }} />
        )}
        
        {/* Loading spinner durante transición */}
        {showLoadingOverlay && (
          <View style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <Spinner size="large" status="primary" style={{ borderColor: '#764BA2' }} />
          </View>
        )}

        {/* TAB BAR FLOTANTE CON INICIO EN EL MEDIO */}
        <View style={{ 
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          borderTopWidth: 1,
          borderTopColor: isDarkMode ? colors.border_subtle : colors.border_subtle,
          flexDirection: 'row',
          paddingVertical: 12,
          paddingHorizontal: 10,
          paddingBottom: Platform.OS === 'ios' ? 20 : 12,
          alignItems: 'center'
        }}>
          {/* LADO IZQUIERDO */}
          <View style={{ flex: 1, flexDirection: 'row', gap: 8 }}>
            <Button
              appearance={activeTab === 'mensajes' ? 'filled' : 'ghost'}
              accessoryLeft={(props) => <Icon {...props} name="email-outline" width={26} height={26} />}
              onPress={() => handleTabChange('mensajes')}
              style={{ flex: 1, borderRadius: 3 }}
              size="small"
            />
            
            <Button
              appearance={activeTab === 'asistencias' ? 'filled' : 'ghost'}
              accessoryLeft={(props) => <Icon {...props} name="calendar-outline" width={26} height={26} />}
              onPress={() => handleTabChange('asistencias')}
              style={{ flex: 1, borderRadius: 3 }}
              size="small"
            />
          </View>

          {/* CENTRO - INICIO CON MAYOR DESTAQUE */}
          <View style={{ 
            marginHorizontal: 8,
            shadowColor: '#764BA2',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
            elevation: 5
          }}>
            <Button
              appearance={activeTab === 'dashboard' ? 'filled' : 'ghost'}
              accessoryLeft={(props) => <Icon {...props} name="home-outline" width={32} height={32} />}
              onPress={() => handleTabChange('dashboard')}
              style={{ 
                minHeight: 48,
                minWidth: 48,
                borderRadius: 50,
              }}
              size="small"
            />
          </View>

          {/* LADO DERECHO */}
          <View style={{ flex: 1, flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
            <Button
              appearance={activeTab === 'evaluaciones' ? 'filled' : 'ghost'}
              accessoryLeft={(props) => <Icon {...props} name="bar-chart-outline" width={26} height={26} />}
              onPress={() => handleTabChange('evaluaciones')}
              style={{ flex: 1, borderRadius: 3 }}
              size="small"
            />
            
            {/* Tab Seguimiento - Solo visible si hay alumnos de nivel MATERNAL */}
            {tieneMaternalAlumno && (
              <Button
                appearance={activeTab === 'seguimiento' ? 'filled' : 'ghost'}
                accessoryLeft={(props) => <Icon {...props} name="activity-outline" width={26} height={26} />}
                onPress={() => handleTabChange('seguimiento')}
                style={{ flex: 1, borderRadius: 3 }}
                size="small"
              />
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
    </>
  );
}

// 🎯 COMPONENTE REUTILIZABLE: Filtro de Alumnos
function FiltroAlumnos({ 
  alumnos, 
  selectedAlumnoId, 
  setSelectedAlumnoId,
  isDarkMode = false
}: { 
  alumnos: any[]; 
  selectedAlumnoId: string | null; 
  setSelectedAlumnoId: (id: string | null) => void;
  isDarkMode?: boolean;
}) {
  const colors = getColors(isDarkMode);
  
  if (alumnos.length <= 1) return null;
  
  return (
    <View style={{ padding: 16, paddingBottom: 0, backgroundColor: colors.bg_primary }}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 8 }}
      >
        <Button
          size="small"
          appearance={selectedAlumnoId === null ? 'filled' : 'outline'}
          onPress={() => setSelectedAlumnoId(null)}
          style={{ marginRight: 8, borderRadius: 20 }}
        >
          Todos
        </Button>
        {alumnos.map((alumno: any) => (
          <Button
            key={alumno.id}
            size="small"
            appearance={selectedAlumnoId === alumno.id ? 'filled' : 'outline'}
            onPress={() => setSelectedAlumnoId(alumno.id)}
            style={{ marginRight: 8, borderRadius: 20 }}
          >
            {`${alumno.nombre} ${alumno.apellido}`}
          </Button>
        ))}
      </ScrollView>
      <Divider style={{ marginTop: 8, backgroundColor: colors.border_subtle }} />
    </View>
  );
}

// 📧 MENSAJES
function MensajesTab({ 
  onMensajesUpdate, 
  alumnoId, 
  alumnos, 
  selectedAlumnoId, 
  setSelectedAlumnoId,
  isDarkMode = false
}: { 
  onMensajesUpdate: (mensajes: any[]) => void; 
  alumnoId?: string;
  alumnos: any[];
  selectedAlumnoId: string | null;
  setSelectedAlumnoId: (id: string | null) => void;
  isDarkMode?: boolean;
}) {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMensaje, setSelectedMensaje] = useState<any>(null);
  const [showNuevoMensaje, setShowNuevoMensaje] = useState(false);
  const [responderA, setResponderA] = useState<any>(null);
  const [imageViewingIndex, setImageViewingIndex] = useState(0);
  const [showImageViewing, setShowImageViewing] = useState(false);
  
  // Obtener colores según modo oscuro
  const colors = getColors(isDarkMode);
  
  console.log('📨 [MensajesTab] selectedAlumnoId:', selectedAlumnoId, 'variables.alumnoId será:', selectedAlumnoId || undefined);
  
  const { data, loading, error, refetch } = useQuery(GET_MENSAJES_TUTOR, {
    variables: { alumnoId: selectedAlumnoId || undefined },
    fetchPolicy: 'network-only', // 🔄 Siempre traer datos frescos del servidor, no usar cache
  });
  const [marcarLeido] = useMutation(MARCAR_MENSAJE_LEIDO);

  const mensajes = data?.mensajesTutor || [];
  
  // Logs para debugging
  useEffect(() => {
    console.log('📨 [MensajesTab] Query data:', data);
    console.log('📨 [MensajesTab] Query loading:', loading);
    if (error) {
      console.error('❌ [MensajesTab] Query error:', error);
    }
    console.log('📨 [MensajesTab] Mensajes encontrados:', mensajes.length);
    if (mensajes.length > 0) {
      console.log('📨 [MensajesTab] Primer mensaje:', mensajes[0]);
      console.log('🎯 [MensajesTab] gradoNombre:', mensajes[0].gradoNombre, 'divisionNombre:', mensajes[0].divisionNombre, 'alcance:', mensajes[0].alcance);
      console.log('🖼️  [MensajesTab] Imagen del primer mensaje:', mensajes[0].imagen ? `Presente (${(mensajes[0].imagen.length / 1024).toFixed(2)} KB)` : 'No existe');
      if (mensajes[0].imagen) {
        console.log('🖼️  [MensajesTab] Primeros 100 caracteres de imagen:', mensajes[0].imagen.substring(0, 100));
      }
    }
  }, [data, loading, error, mensajes.length]);
  
  // Función para obtener los alumnos por destinatarioIds
  const getAlumnosByDestinatarioIds = (destinatarioIds: string[]) => {
    if (!destinatarioIds || destinatarioIds.length === 0) {
      console.log('❌ No hay destinatarioIds');
      return [];
    }
    
    console.log('🔍 Buscando alumnos con destinatarioIds:', destinatarioIds);
    console.log('📋 Alumnos disponibles:', alumnos.map((a: any) => ({ id: a.id, nombre: `${a.nombre} ${a.apellido}` })));
    
    // Buscar todos los alumnos que coincidan con los destinatarioIds
    const alumnosEncontrados = alumnos.filter((alumno: any) => 
      destinatarioIds.includes(alumno.id)
    );
    
    console.log('✅ Alumnos encontrados:', alumnosEncontrados.length);
    if (alumnosEncontrados.length > 0) {
      console.log('   Nombres:', alumnosEncontrados.map((a: any) => `${a.nombre} ${a.apellido}`).join(', '));
    }
    
    return alumnosEncontrados;
  };
  
  // Función helper para obtener el primer alumno (para mostrar en la UI)
  const getAlumnoByDestinatarioId = (mensaje: any) => {
    const alumnosDelMensaje = getAlumnosByDestinatarioIds(mensaje.destinatarioIds || []);
    return alumnosDelMensaje.length > 0 ? alumnosDelMensaje[0] : null;
  };
  
  // Obtener el alumno seleccionado
  const alumnoSeleccionado = selectedAlumnoId 
    ? alumnos.find((a: any) => a.id === selectedAlumnoId) 
    : null;

  useEffect(() => {
    if (mensajes.length > 0) {
      onMensajesUpdate(mensajes);
    }
  }, [mensajes.length]);

  const handleAbrirMensaje = async (mensaje: any) => {
    setSelectedMensaje(mensaje);
    
    // Si el mensaje no está leído, marcarlo como leído
    if (!mensaje.leido) {
      try {
        await marcarLeido({
          variables: { mensajeId: mensaje.id },
          // Actualizar el cache para reflejar el cambio inmediatamente
          update: (cache, { data }) => {
            if (data?.marcarMensajeComoLeido) {
              cache.modify({
                fields: {
                  mensajesTutor(existingMensajes = []) {
                    return existingMensajes.map((mensajeRef: any) => {
                      if (mensajeRef.__ref === `MensajeGeneral:${mensaje.id}`) {
                        return { ...mensajeRef, leido: true };
                      }
                      return mensajeRef;
                    });
                  }
                }
              });
            }
          }
        });
        // Refrescar la lista
        await refetch();
      } catch (error) {
        console.error('Error al marcar mensaje como leído:', error);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Sin fecha';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (error) {
      return 'Error en fecha';
    }
  };

  const formatTipo = (tipo: string, autorNombre?: string) => {
    if (!tipo) return '';
    if (tipo === 'CONSULTA_TUTOR') {
      // Extraer solo el nombre sin "(Tutor)"
      const nombre = autorNombre ? autorNombre.replace(' (Tutor)', '') : 'Tutor';
      return `📨 Msj de Tutor ${nombre}`;
    }
    return tipo.replace(/_/g, ' ');
  };

  const downloadImage = async (imageUri: string, messageTitle: string) => {
    try {
      if (!imageUri) {
        Alert.alert('Error', 'No hay imagen para descargar');
        return;
      }

      // Solicitar permisos para acceder a la galería
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la galería de fotos para descargar las imágenes.');
        return;
      }

      console.log('📥 Iniciando descarga de imagen...');

      // Si es base64, intentar guardar directamente
      if (imageUri.startsWith('data:image')) {
        console.log('📸 Detectado: imagen base64, intentando guardar directamente...');
        try {
          // Intentar crear asset directamente del data URI
          const asset = await MediaLibrary.createAssetAsync(imageUri);
          const album = await MediaLibrary.getAlbumAsync('Dhora');
          
          if (album == null) {
            await MediaLibrary.createAlbumAsync('Dhora', asset, false);
          } else {
            await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
          }

          Alert.alert('✓ Descargado', `Imagen guardada en Galería\nÁlbum: Dhora`, [
            { text: 'OK', style: 'default' }
          ]);
          return;
        } catch (error: any) {
          console.log('⚠️ No se pudo guardar directamente el base64. Error:', error.message);
          Alert.alert('Información', 'Para usar la descarga de imágenes base64, crea un build de desarrollo (EAS Build). En Expo Go, solo funcionan URLs remotas.');
          return;
        }
      }

      // Para URLs remotas
      console.log('🌐 Detectado: URL remota');
      try {
        const asset = await MediaLibrary.createAssetAsync(imageUri);
        const album = await MediaLibrary.getAlbumAsync('Dhora');
        
        if (album == null) {
          await MediaLibrary.createAlbumAsync('Dhora', asset, false);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }

        Alert.alert('✓ Descargado', `Imagen guardada en Galería\nÁlbum: Dhora`, [
          { text: 'OK', style: 'default' }
        ]);
      } catch (remoteError: any) {
        console.error('❌ Error con URL remota:', remoteError);
        Alert.alert('Error', `No se pudo descargar la imagen:\n${remoteError.message}`);
      }
    } catch (error: any) {
      console.error('❌ Error descargando imagen:', error);
      Alert.alert('Error', `Error inesperado:\n${error.message || 'Error desconocido'}`);
    }
  };

  // Ya no mostramos loading aquí, lo maneja la transición de tabs

  return (
    <>
      <Layout style={{ flex: 1, backgroundColor: colors.bg_primary }}>
        {/* Selector de alumno */}
        <FiltroAlumnos 
          alumnos={alumnos}
          selectedAlumnoId={selectedAlumnoId}
          setSelectedAlumnoId={setSelectedAlumnoId}
          isDarkMode={isDarkMode}
        />
        
        <ScrollView
          style={{ flex: 1, backgroundColor: colors.bg_primary }}
          contentContainerStyle={{ padding: 16, paddingBottom: 100, backgroundColor: colors.bg_primary }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {loading && !refreshing ? (
            // Skeleton loading mientras cargan los mensajes
            <>
              {[1, 2, 3].map((i) => (
                <Card
                  key={i}
                  disabled
                  style={{ 
                    marginBottom: 16, 
                    borderRadius: 16, 
                    backgroundColor: isDarkMode ? colors.bg_secondary : '#F8FAFB',
                    borderWidth: 1,
                    borderColor: isDarkMode ? colors.border_subtle : '#E6EBF0'
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                    <View style={{ flex: 1, gap: 8 }}>
                      <View style={{ width: '70%', height: 16, backgroundColor: isDarkMode ? colors.border_subtle : '#E6EBF0', borderRadius: 4 }} />
                      <View style={{ width: '40%', height: 12, backgroundColor: isDarkMode ? colors.border_subtle : '#E6EBF0', borderRadius: 4 }} />
                    </View>
                    <View style={{ width: 60, height: 20, backgroundColor: isDarkMode ? colors.border_subtle : '#E6EBF0', borderRadius: 8 }} />
                  </View>
                  <View style={{ width: '100%', height: 14, backgroundColor: isDarkMode ? colors.border_subtle : '#E6EBF0', borderRadius: 4, marginBottom: 6 }} />
                  <View style={{ width: '85%', height: 14, backgroundColor: isDarkMode ? colors.border_subtle : '#E6EBF0', borderRadius: 4 }} />
                </Card>
              ))}
            </>
          ) : mensajes.length === 0 ? (
            <Card disabled style={{ borderRadius: 20, backgroundColor: isDarkMode ? colors.bg_secondary : '#FFFFFF', borderWidth: 1, borderColor: colors.border_subtle }}>
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <View style={{ 
                  width: 100, 
                  height: 100, 
                  borderRadius: 50, 
                  backgroundColor: isDarkMode ? colors.bg_tertiary : '#F0E6F7', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  marginBottom: 20
                }}>
                  <Icon name="email-outline" style={{ width: 50, height: 50 }} fill={colors.accent_purple} />
                </View>
                <Text category="h6" style={{ marginBottom: 8, color: colors.accent_primary }}>No hay mensajes</Text>
                <Text appearance="hint" style={{ color: colors.text_tertiary }}>
                  {selectedAlumnoId ? 'No hay mensajes para este alumno' : 'Los mensajes aparecerán aquí'}
                </Text>
              </View>
            </Card>
          ) : (
          mensajes.map((mensaje: any, index: number) => {
            const alumnoDelMensaje = getAlumnoByDestinatarioId(mensaje);
            
            // Debug: Verificar si hay imagen
            const imagenURL = mensaje.imagenes && mensaje.imagenes.length > 0 ? mensaje.imagenes[0] : mensaje.imagen;
            if (imagenURL) {
              console.log(`📸 [Mensaje ${mensaje.id}] Tiene imagen: ${(imagenURL.length / 1024).toFixed(2)} KB`);
            }
            
            return (
            <Card
              key={mensaje.id || index}
              style={{ 
                marginBottom: 16, 
                borderRadius: 16, 
                backgroundColor: isDarkMode ? colors.bg_secondary : '#FFFFFF',
                borderWidth: 1,
                borderColor: mensaje.leido ? colors.border_subtle : colors.accent_primary,
                shadowColor: '#764BA2',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: mensaje.leido ? 0 : 0.1,
                shadowRadius: 8,
                elevation: mensaje.leido ? 1 : 3
              }}
              onPress={() => handleAbrirMensaje(mensaje)}
            >
              {/* Encabezado: Tipo/Alcance y Fecha */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  {mensaje.tipo && (
                    <View style={{ 
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      backgroundColor: isDarkMode
                        ? (mensaje.tipo === 'GENERAL' ? '#1a3a4d' :
                           mensaje.tipo === 'ACADEMICO' ? '#2d1a4d' :
                           mensaje.tipo === 'ADMINISTRATIVO' ? '#4d1a1a' :
                           mensaje.tipo === 'EVENTO' ? '#1a4d2f' :
                           mensaje.tipo === 'CONSULTA_TUTOR' ? '#4d2e1a' :
                           '#4d4d1a')
                        : (mensaje.tipo === 'GENERAL' ? '#E6F7FF' :
                           mensaje.tipo === 'ACADEMICO' ? '#F0E6FF' :
                           mensaje.tipo === 'ADMINISTRATIVO' ? '#FFE6E6' :
                           mensaje.tipo === 'EVENTO' ? '#E6FFE6' :
                           mensaje.tipo === 'CONSULTA_TUTOR' ? '#FFF3E6' :
                           '#FFF9E6'),
                      borderRadius: 8
                    }}>
                      <Text style={{ 
                        color: isDarkMode
                          ? (mensaje.tipo === 'GENERAL' ? '#80d4ff' :
                             mensaje.tipo === 'ACADEMICO' ? '#d4a0ff' :
                             mensaje.tipo === 'ADMINISTRATIVO' ? '#ff8080' :
                             mensaje.tipo === 'EVENTO' ? '#80ff99' :
                             mensaje.tipo === 'CONSULTA_TUTOR' ? '#ffc080' :
                             '#ffff80')
                          : (mensaje.tipo === 'GENERAL' ? '#0369A1' :
                             mensaje.tipo === 'ACADEMICO' ? '#6D28D9' :
                             mensaje.tipo === 'ADMINISTRATIVO' ? '#B91C1C' :
                             mensaje.tipo === 'EVENTO' ? '#764BA2' :
                             mensaje.tipo === 'CONSULTA_TUTOR' ? '#EA580C' :
                             '#A67C00'),
                        fontWeight: '600', 
                        fontSize: 9 
                      }}>
                        {formatTipo(mensaje.tipo, mensaje.autorNombre)}
                      </Text>
                    </View>
                  )}
                  {mensaje.alcance && (
                    <View style={{ 
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      backgroundColor: isDarkMode ? colors.bg_tertiary : colors.bg_secondary,
                      borderRadius: 8
                    }}>
                      <Text style={{ 
                        color: colors.text_secondary,
                        fontWeight: '500', 
                        fontSize: 9 
                      }}>
                        {mensaje.alcance}
                      </Text>
                    </View>
                  )}
                </View>
                <Text category="c1" appearance="hint" style={{ fontSize: 9, color: colors.text_tertiary, marginLeft: 8 }}>
                  {formatDate(mensaje.publicadoEn || mensaje.creadoEn)}
                </Text>
              </View>

              {/* Título */}
              <Text category="s2" numberOfLines={1} style={{ color: colors.text_primary, fontWeight: '700', marginBottom: 8 }}>
                {mensaje.titulo || 'Sin título'}
              </Text>
              
              {/* Indicador del destinatario */}
              <Text category="c1" style={{ color: colors.accent_primary, fontWeight: '600', marginBottom: 8 }}>
                Para: {alumnoDelMensaje 
                  ? `${alumnoDelMensaje.nombre} ${alumnoDelMensaje.apellido}` 
                  : mensaje.divisionNombre && mensaje.gradoNombre
                    ? `${mensaje.gradoNombre} - ${mensaje.divisionNombre}`
                    : mensaje.gradoNombre
                      ? mensaje.gradoNombre
                      : mensaje.alcance || 'Destinatarios...'}
              </Text>
              
              {/* Indicadores adicionales: NUEVO */}
              {!mensaje.leido && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: 4,
                    backgroundColor: colors.accent_rose, 
                    marginRight: 4 
                  }} />
                  <Text category="c2" style={{ color: colors.accent_rose, fontWeight: 'bold', fontSize: 10 }}>
                    NUEVO
                  </Text>
                </View>
              )}
              {/* Miniatura de imagen si existe */}
              {/* NO mostrar imagen en la lista - solo icono */}
              <Text numberOfLines={2} appearance="hint" category="p2" style={{ lineHeight: 20, color: colors.text_secondary, marginBottom: 12 }}>
                {mensaje.contenido || 'Sin contenido'}
              </Text>
              
              {/* Indicador de adjunto en la esquina inferior derecha */}
              {(mensaje.imagenes && mensaje.imagenes.length > 0) || mensaje.imagen ? (
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 14, color: colors.accent_primary }}>
                    📎
                  </Text>
                </View>
              ) : null}
            </Card>
            );
          })
        )}
        </ScrollView>
        
        {/* Botón flotante para nuevo mensaje - Estilo moderno */}
        <TouchableOpacity
          style={{
            position: 'absolute',
            bottom: 100,
            right: 20,
            backgroundColor: colors.accent_primary,
            borderRadius: 12,
            width: 48,
            height: 48,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: colors.accent_primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
            elevation: 6
          }}
          onPress={() => {
            setResponderA(null);
            setShowNuevoMensaje(true);
          }}
        >
          <Icon name="plus-outline" style={{ width: 24, height: 24 }} fill="#FFFFFF" />
        </TouchableOpacity>
      </Layout>

      {selectedMensaje && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedMensaje(null)}
        >
          <View 
            style={{ 
              flex: 1, 
              backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)', 
              justifyContent: 'center', 
              alignItems: 'center',
              padding: 20
            }}
          >
            <TouchableOpacity 
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              activeOpacity={1}
              onPress={() => setSelectedMensaje(null)}
            />
            
            <View style={{ width: '100%', maxWidth: 1000, zIndex: 1 }}>
              <Card 
                disabled 
                style={{ 
                  borderRadius: 24,
                  backgroundColor: '#FFFFFF',
                  shadowColor: '#1A1A2E',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 12,
                  elevation: 8
                }}
              >
                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  style={{ maxHeight: 750 }}
                  contentContainerStyle={{ padding: 2 }}
                  nestedScrollEnabled={true}
                >
                  <View style={{ marginBottom: 16 }}>
                    {(() => {
                      const alumnoDelMensajeModal = getAlumnoByDestinatarioId(selectedMensaje);
                      return alumnoDelMensajeModal && (
                        <View style={{ 
                          flexDirection: 'row', 
                          alignItems: 'center', 
                          marginBottom: 12,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          backgroundColor: '#F0E6F7',
                          borderRadius: 10,
                          borderLeftWidth: 3,
                          borderLeftColor: '#764BA2'
                        }}>
                          <Icon name="person-outline" style={{ width: 18, height: 18, marginRight: 8 }} fill="#764BA2" />
                          <Text style={{ color: '#764BA2', fontWeight: '700', fontSize: 14 }}>
                            Para: {alumnoDelMensajeModal.nombre} {alumnoDelMensajeModal.apellido}
                          </Text>
                        </View>
                      );
                    })()}
                    
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12, gap: 8 }}>
                      {selectedMensaje.tipo && (
                        <View style={{ 
                          flexDirection: 'row', 
                          alignItems: 'center',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          backgroundColor: 
                            selectedMensaje.tipo === 'GENERAL' ? '#E6F7FF' :
                            selectedMensaje.tipo === 'ACADEMICO' ? '#F0E6FF' :
                            selectedMensaje.tipo === 'ADMINISTRATIVO' ? '#FFE6E6' :
                            selectedMensaje.tipo === 'EVENTO' ? '#E6FFE6' :
                            selectedMensaje.tipo === 'CONSULTA_TUTOR' ? '#FFF3E6' :
                            '#FFF9E6',
                          borderRadius: 10,
                          alignSelf: 'flex-start'
                        }}>
                          <Icon 
                            name={
                              selectedMensaje.tipo === 'GENERAL' ? 'bell-outline' :
                              selectedMensaje.tipo === 'ACADEMICO' ? 'book-outline' :
                              selectedMensaje.tipo === 'ADMINISTRATIVO' ? 'file-text-outline' :
                              selectedMensaje.tipo === 'EVENTO' ? 'calendar-outline' :
                              selectedMensaje.tipo === 'CONSULTA_TUTOR' ? 'message-circle-outline' :
                              'info-outline'
                            }
                            style={{ width: 14, height: 14, marginRight: 6 }} 
                            fill={
                              selectedMensaje.tipo === 'GENERAL' ? '#0095FF' :
                              selectedMensaje.tipo === 'ACADEMICO' ? '#8B5CF6' :
                              selectedMensaje.tipo === 'ADMINISTRATIVO' ? '#EF4444' :
                              selectedMensaje.tipo === 'EVENTO' ? '#764BA2' :
                              selectedMensaje.tipo === 'CONSULTA_TUTOR' ? '#EA580C' :
                              '#FFB020'
                            }
                          />
                          <Text style={{ 
                            color: 
                              selectedMensaje.tipo === 'GENERAL' ? '#0369A1' :
                              selectedMensaje.tipo === 'ACADEMICO' ? '#6D28D9' :
                              selectedMensaje.tipo === 'ADMINISTRATIVO' ? '#B91C1C' :
                              selectedMensaje.tipo === 'EVENTO' ? '#764BA2' :
                              selectedMensaje.tipo === 'CONSULTA_TUTOR' ? '#EA580C' :
                              '#A67C00',
                            fontWeight: '600', 
                            fontSize: 11 
                          }}>
                            {formatTipo(selectedMensaje.tipo, selectedMensaje.autorNombre)}
                          </Text>
                        </View>
                      )}
                      
                      {selectedMensaje.autorNombre && (
                        <View style={{ 
                          flexDirection: 'row', 
                          alignItems: 'center',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          backgroundColor: '#FFF9E6',
                          borderRadius: 10,
                          alignSelf: 'flex-start'
                        }}>
                          <Icon name="person-outline" style={{ width: 14, height: 14, marginRight: 6 }} fill="#FFB020" />
                          <Text style={{ color: '#A67C00', fontWeight: '600', fontSize: 11 }}>
                            {selectedMensaje.autorNombre}
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center',
                      backgroundColor: '#F8FAFB',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 12,
                      alignSelf: 'flex-start',
                      marginBottom: 12
                    }}>
                      <Icon name="calendar-outline" style={{ width: 16, height: 16, marginRight: 8 }} fill="#764BA2" />
                      <Text style={{ color: '#764BA2', fontWeight: '600', fontSize: 12 }}>
                        {selectedMensaje.publicadoEn || selectedMensaje.creadoEn ? formatDate(selectedMensaje.publicadoEn || selectedMensaje.creadoEn) : 'Sin fecha'}
                      </Text>
                    </View>
                    
                    {/* Título pequeño después de la fecha */}
                    <Text 
                      style={{ 
                        fontSize: 17, 
                        fontWeight: '700', 
                        color: '#1A1F36',
                        lineHeight: 22,
                        marginBottom: 8
                      }}
                    >
                      {selectedMensaje.titulo || 'Sin título'}
                    </Text>
                  </View>
                  
                  <Divider style={{ marginVertical: 8, backgroundColor: '#E6EBF0' }} />
                  
                  <View style={{ marginBottom: 20 }}>
                    <Text 
                      style={{ 
                        lineHeight: 24, 
                        color: '#2D3748', 
                        fontSize: 15,
                        textAlign: 'justify'
                      }}
                    >
                      {selectedMensaje.contenido || 'Sin contenido'}
                    </Text>
                  </View>
                  
                  {/* Mostrar imágenes si existen */}
                  {(selectedMensaje.imagenes && selectedMensaje.imagenes.length > 0) || selectedMensaje.imagen ? (
                    <View style={{ marginBottom: 20 }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: '#764BA2', marginBottom: 12 }}>
                        📎 ARCHIVOS ADJUNTOS ({(selectedMensaje.imagenes && selectedMensaje.imagenes.length > 0 ? selectedMensaje.imagenes.length : 1)})
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                        {(selectedMensaje.imagenes && selectedMensaje.imagenes.length > 0 ? selectedMensaje.imagenes : [selectedMensaje.imagen]).map((img: string, idx: number) => (
                          <TouchableOpacity
                            key={idx}
                            activeOpacity={0.7}
                            onPress={() => {
                              setImageViewingIndex(idx);
                              setShowImageViewing(true);
                            }}
                            style={{ marginRight: 12, borderRadius: 12, overflow: 'hidden' }}
                          >
                            <Image
                              source={{ uri: img }}
                              style={{
                                width: 280,
                                height: 280,
                                borderRadius: 12,
                              }}
                              onError={(error) => {
                                console.warn('🖼️❌ Error loading image for mensaje:', selectedMensaje.id);
                              }}
                            />
                            <View
                              style={{
                                position: 'absolute',
                                top: 8,
                                left: 8,
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                borderRadius: 8,
                                padding: 8,
                              }}
                            >
                              <Icon name="expand-outline" style={{ width: 24, height: 24 }} fill="#FFFFFF" />
                            </View>
                            <TouchableOpacity
                              style={{
                                position: 'absolute',
                                bottom: 8,
                                right: 8,
                                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                borderRadius: 8,
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                                flexDirection: 'row',
                                alignItems: 'center',
                              }}
                              onPress={() => downloadImage(img, selectedMensaje.titulo || 'Descarga')}
                            >
                              <Icon name="download-outline" style={{ width: 14, height: 14, marginRight: 6 }} fill="#FFFFFF" />
                              <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 11 }}>Descargar</Text>
                            </TouchableOpacity>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  ) : null}
                  
                  <View style={{ 
                    flexDirection: 'row', 
                    gap: 8,
                    paddingTop: 16,
                    marginTop: 16,
                    borderTopWidth: 1,
                    borderTopColor: '#E6EBF0',
                    justifyContent: 'flex-end'
                  }}>
                    {/* Solo mostrar botón Responder si el alcance es ALUMNO */}
                    {selectedMensaje.alcance === 'ALUMNO' && (
                      <Button 
                        style={{ 
                          borderRadius: 10,
                          minHeight: 32,
                          paddingHorizontal: 12
                        }} 
                        appearance="outline"
                        size="small"
                        onPress={() => {
                          setResponderA(selectedMensaje);
                          setSelectedMensaje(null);
                          setShowNuevoMensaje(true);
                        }}
                        accessoryLeft={(props) => <Icon {...props} name="corner-up-left-outline" style={{ width: 14, height: 14 }} />}
                      >
                        Responder
                      </Button>
                    )}
                    <Button 
                      style={{ 
                        borderRadius: 10,
                        minHeight: 32,
                        paddingHorizontal: 12
                      }} 
                      size="small"
                      onPress={() => setSelectedMensaje(null)}
                    >
                      Cerrar
                    </Button>
                  </View>
                </ScrollView>
              </Card>
            </View>
          </View>
        </Modal>
      )}
      
      {/* ImageViewing - Expandir imágenes con zoom */}
      {selectedMensaje && (
        <ImageViewing
          images={(selectedMensaje.imagenes && selectedMensaje.imagenes.length > 0 ? selectedMensaje.imagenes : [selectedMensaje.imagen]).map((img: string) => ({ uri: img }))}
          imageIndex={imageViewingIndex}
          visible={showImageViewing}
          onRequestClose={() => setShowImageViewing(false)}
          swipeToCloseEnabled={true}
          doubleTapToZoomEnabled={true}
          delayLongPress={100}
        />
      )}
      
      {/* Modal para nuevo mensaje o responder */}
      {showNuevoMensaje && (
        <NuevoMensajeModal
          visible={showNuevoMensaje}
          onClose={() => {
            setShowNuevoMensaje(false);
            setResponderA(null);
          }}
          responderA={responderA}
          onEnviado={async () => {
            setShowNuevoMensaje(false);
            setResponderA(null);
            await refetch();
          }}
        />
      )}
    </>
  );
}

// 📝 NUEVO MENSAJE MODAL
function NuevoMensajeModal({ visible, onClose, responderA, onEnviado }: { 
  visible: boolean; 
  onClose: () => void; 
  responderA?: any;
  onEnviado: () => Promise<void> | void;
}) {
  const { data: alumnosData } = useQuery(GET_ALUMNOS_TUTOR);
  const [enviarMensaje, { loading }] = useMutation(gql`
    mutation EnviarMensajeTutor(
      $alumnoId: ID!
      $titulo: String!
      $contenido: String!
      $mensajeOriginalId: ID
    ) {
      enviarMensajeTutor(
        alumnoId: $alumnoId
        titulo: $titulo
        contenido: $contenido
        mensajeOriginalId: $mensajeOriginalId
      ) {
        id
        titulo
        contenido
        tipo
        alcance
        estado
        autorNombre
        publicadoEn
        creadoEn
        leido
        leidoPorTutorIds
        destinatarioIds
        imagen
        imagenes
      }
    }
  `);
  
  const alumnos = alumnosData?.alumnosTutor || [];
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<string>(
    responderA?.destinatarioIds?.[0] || (alumnos.length > 0 ? alumnos[0]?.id : '')
  );
  const [asunto, setAsunto] = useState(responderA ? `RE: ${responderA.titulo}` : '');
  const [mensaje, setMensaje] = useState('');

  // Actualizar alumnoSeleccionado cuando los alumnos se cargan
  useEffect(() => {
    if (alumnos.length > 0 && !alumnoSeleccionado) {
      setAlumnoSeleccionado(alumnos[0].id);
    }
  }, [alumnos]);

  const handleEnviar = async () => {
    console.log('📤 Enviando mensaje...', { alumnoSeleccionado, asunto, mensaje });
    
    if (!alumnoSeleccionado || !asunto.trim() || !mensaje.trim()) {
      Alert.alert('Error', 'Por favor completá todos los campos');
      return;
    }

    try {
      console.log('🔄 Llamando mutation...', {
        alumnoId: alumnoSeleccionado,
        titulo: asunto.trim(),
        contenido: mensaje.trim(),
        mensajeOriginalId: responderA?.id || null
      });
      
      const result = await enviarMensaje({
        variables: {
          alumnoId: alumnoSeleccionado,
          titulo: asunto.trim(),
          contenido: mensaje.trim(),
          mensajeOriginalId: responderA?.id || null
        },
        refetchQueries: [
          { 
            query: GET_MENSAJES_TUTOR,
            variables: { alumnoId: alumnoSeleccionado }
          }
        ]
      });
      
      console.log('✅ Mensaje enviado:', result);
      Alert.alert('Éxito', 'Mensaje enviado correctamente');
      await onEnviado();
    } catch (error: any) {
      console.error('❌ Error al enviar mensaje:', error);
      console.error('   Error completo:', JSON.stringify(error, null, 2));
      
      // Extraer mensaje de error más específico
      let errorMsg = 'No se pudo enviar el mensaje';
      
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        errorMsg = error.graphQLErrors[0].message;
      } else if (error.networkError) {
        errorMsg = 'Error de red: ' + error.networkError.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      console.error('   Mensaje de error:', errorMsg);
      Alert.alert('Error', errorMsg);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' }}>
        <TouchableOpacity 
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <View style={{ 
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingTop: 8,
          maxHeight: '90%',
          shadowColor: '#1A1A2E',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 8
        }}>
          {/* Handle bar */}
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <View style={{ 
              width: 40, 
              height: 4, 
              backgroundColor: '#E6EBF0', 
              borderRadius: 2 
            }} />
          </View>
          
          <ScrollView
            style={{ maxHeight: 600 }}
            contentContainerStyle={{ padding: 20 }}
            keyboardShouldPersistTaps="handled"
          >
            <Text category="h5" style={{ marginBottom: 4, color: '#1A1F36', fontWeight: '700' }}>
              {responderA ? 'Responder mensaje' : 'Nuevo mensaje'}
            </Text>
            <Text category="p2" appearance="hint" style={{ marginBottom: 20 }}>
              Enviá un mensaje al responsable de la división
            </Text>
            
            {responderA && (
              <View style={{ 
                backgroundColor: '#F8FAFB',
                padding: 12,
                borderRadius: 12,
                marginBottom: 16,
                borderLeftWidth: 3,
                borderLeftColor: '#764BA2'
              }}>
                <Text category="c1" appearance="hint" style={{ marginBottom: 4 }}>
                  Respondiendo a:
                </Text>
                <Text category="s2" style={{ fontWeight: '600' }}>
                  {responderA.titulo}
                </Text>
              </View>
            )}
            
            {alumnos.length > 1 && (
              <View style={{ marginBottom: 16 }}>
                <Text category="label" style={{ marginBottom: 8, fontWeight: '600', color: '#2D3748' }}>
                  Alumno
                </Text>
                <Select
                  value={(() => {
                    const alumno = alumnos.find((a: any) => a.id === alumnoSeleccionado);
                    return alumno ? `${alumno.nombre} ${alumno.apellido}` : 'Seleccionar alumno';
                  })()}
                  onSelect={(index: any) => {
                    const selectedIndex = typeof index === 'number' ? index : index.row;
                    const selected = alumnos[selectedIndex];
                    console.log('🔄 Alumno seleccionado:', selected);
                    if (selected) {
                      setAlumnoSeleccionado(selected.id);
                    }
                  }}
                  style={{ borderRadius: 12 }}
                >
                  {alumnos.map((alumno: any) => (
                    <SelectItem 
                      key={alumno.id} 
                      title={`${alumno.nombre} ${alumno.apellido}`}
                    />
                  ))}
                </Select>
              </View>
            )}
            
            {alumnos.length === 1 && (
              <View style={{ marginBottom: 16 }}>
                <Text category="label" style={{ marginBottom: 8, fontWeight: '600', color: '#2D3748' }}>
                  Para
                </Text>
                <View style={{ 
                  padding: 12, 
                  backgroundColor: '#F8FAFB', 
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#E6EBF0'
                }}>
                  <Text category="p1" style={{ color: '#2D3748' }}>
                    {alumnos[0].nombre} {alumnos[0].apellido}
                  </Text>
                </View>
              </View>
            )}
            
            <View style={{ marginBottom: 16 }}>
              <Text category="label" style={{ marginBottom: 8, fontWeight: '600', color: '#2D3748' }}>
                Asunto
              </Text>
              <Input
                value={asunto}
                onChangeText={setAsunto}
                placeholder="Ingresá el asunto del mensaje"
                style={{ borderRadius: 12 }}
              />
            </View>
            
            <View style={{ marginBottom: 20 }}>
              <Text category="label" style={{ marginBottom: 8, fontWeight: '600', color: '#2D3748' }}>
                Mensaje
              </Text>
              <Input
                value={mensaje}
                onChangeText={setMensaje}
                placeholder="Escribí tu mensaje aquí"
                multiline
                textStyle={{ minHeight: 120 }}
                style={{ borderRadius: 12 }}
              />
            </View>
            
            {/* Debug info - Quitar después */}
            {/* <View style={{ 
              marginBottom: 16, 
              padding: 8, 
              backgroundColor: '#F0F0F0', 
              borderRadius: 8 
            }}>
              <Text category="c1" style={{ fontSize: 10 }}>
                Debug: Alumno={alumnoSeleccionado ? 'OK' : 'NO'}, 
                Asunto={asunto.trim() ? 'OK' : 'NO'}, 
                Mensaje={mensaje.trim() ? 'OK' : 'NO'}
              </Text>
            </View> */}
            
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Button
                style={{ flex: 1, borderRadius: 12 }}
                appearance="outline"
                onPress={onClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                style={{ flex: 1, borderRadius: 12 }}
                onPress={handleEnviar}
                disabled={loading || !alumnoSeleccionado || !asunto.trim() || !mensaje.trim()}
              >
                {loading ? 'Enviando...' : 'Enviar'}
              </Button>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// 📊 CALIFICACIONES TAB
function CalificacionesTab({ alumnoId }: { alumnoId?: string }) {
  const { data: alumnosData, loading: loadingAlumnos } = useQuery(GET_ALUMNOS_TUTOR);
  const [selectedAlumno, setSelectedAlumno] = useState<string | null>(alumnoId || null);
  const [expandedMaterias, setExpandedMaterias] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  
  const alumnos = alumnosData?.alumnosTutor || [];
  
  // Sincronizar con el prop cuando cambia
  useEffect(() => {
    if (alumnoId) {
      setSelectedAlumno(alumnoId);
    }
  }, [alumnoId]);
  
  // NO seleccionar automáticamente - mantener en "TODOS" (null) por defecto
  
  // Query para obtener calificaciones - Ejecutar siempre (alumnoId puede ser null para "TODOS")
  const { data: calificacionesData, loading: loadingCalificaciones, refetch: refetchCalificaciones } = useQuery(GET_CALIFICACIONES, {
    variables: { alumnoId: selectedAlumno }
  });
  
  const materias = calificacionesData?.calificacionesTutor || [];
  
  // Función para refrescar datos
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchCalificaciones();
    } catch (error) {
      console.error('Error al refrescar calificaciones:', error);
    }
    setRefreshing(false);
  }, [refetchCalificaciones]);
  
  // Toggle expansión de materia
  const toggleMateria = (materiaId: string) => {
    setExpandedMaterias(prev => {
      const next = new Set(prev);
      if (next.has(materiaId)) {
        next.delete(materiaId);
      } else {
        next.add(materiaId);
      }
      return next;
    });
  };
  
  // Calcular promedio de una materia
  const calcularPromedioMateria = (evaluaciones: any[]) => {
    const notasValidas = evaluaciones.flatMap(ev => 
      ev.notas
        .filter((n: any) => !selectedAlumno || n.alumnoId === selectedAlumno)
        .map((n: any) => n.nota)
    ).filter((nota: number) => nota > 0);
    
    if (notasValidas.length === 0) return 0;
    const suma = notasValidas.reduce((acc: number, nota: number) => acc + nota, 0);
    return Math.round((suma / notasValidas.length) * 10) / 10;
  };

  if (loadingAlumnos) {
    return (
      <Layout style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Spinner size="large" status="primary" style={{ borderColor: '#764BA2' }} />
        <Text category="s1" style={{ marginTop: 16, color: '#764BA2' }}>Cargando...</Text>
      </Layout>
    );
  }

  if (alumnos.length === 0) {
    return (
      <Layout style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Icon name="bar-chart-outline" style={{ width: 80, height: 80 }} fill="#8F9BB3" />
        <Text category="h6" style={{ marginTop: 16, textAlign: 'center' }}>
          No hay alumnos asignados
        </Text>
      </Layout>
    );
  }

  return (
    <Layout style={{ flex: 1 }}>
      {/* Selector de alumno - siempre visible para permitir ver "TODOS" */}
      {alumnos.length > 0 && (
        <View style={{ padding: 16, backgroundColor: '#F8FAFB', borderBottomWidth: 1, borderBottomColor: '#E6EBF0' }}>
          <Text category="s2" style={{ marginBottom: 8, fontWeight: 'bold' }}>
            Filtrar por alumno:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button
                size="small"
                appearance={!selectedAlumno ? 'filled' : 'outline'}
                onPress={() => setSelectedAlumno(null)}
                style={{ borderRadius: 12 }}
              >
                Todos
              </Button>
              {alumnos.map((alumno: any) => (
                <Button
                  key={alumno.id}
                  size="small"
                  appearance={selectedAlumno === alumno.id ? 'filled' : 'outline'}
                  onPress={() => setSelectedAlumno(alumno.id)}
                  style={{ borderRadius: 12 }}
                >
                  {alumno.nombre}
                </Button>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      <ScrollView 
        style={{ flex: 1, padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#764BA2']}
            tintColor="#764BA2"
          />
        }
      >
        {loadingCalificaciones ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Spinner size="large" status="primary" style={{ borderColor: '#764BA2' }} />
            <Text appearance="hint" style={{ marginTop: 12, color: '#764BA2' }}>Cargando calificaciones...</Text>
          </View>
        ) : materias.length === 0 ? (
          <View style={{ 
            padding: 40, 
            alignItems: 'center',
            backgroundColor: '#F8FAFB',
            borderRadius: 20,
            marginTop: 20
          }}>
            <Icon name="bar-chart-outline" style={{ width: 60, height: 60, marginBottom: 12 }} fill="#8F9BB3" />
            <Text category="h6" style={{ marginBottom: 8, textAlign: 'center' }}>
              Sin calificaciones
            </Text>
            <Text appearance="hint" style={{ textAlign: 'center' }}>
              No hay calificaciones disponibles {selectedAlumno ? 'para este alumno' : 'aún'}
            </Text>
          </View>
        ) : (
          materias.map((materia: any) => {
            const promedio = calcularPromedioMateria(materia.evaluaciones);
            const isExpanded = expandedMaterias.has(materia.id);
            
            return (
              <Card key={materia.id} style={{ marginBottom: 16, borderRadius: 12 }}>
                {/* Header de la materia */}
                <TouchableOpacity onPress={() => toggleMateria(materia.id)}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text category="h6" style={{ color: '#4A90E2', fontWeight: 'bold' }}>
                        {materia.nombre}
                      </Text>
                      <Text appearance="hint" category="c1" style={{ marginTop: 2 }}>
                        {materia.evaluaciones.length} evaluación{materia.evaluaciones.length !== 1 ? 'es' : ''}
                      </Text>
                    </View>
                    
                    {/* Promedio */}
                    <View style={{ alignItems: 'center', marginRight: 12 }}>
                      <Text category="h4" style={{ 
                        color: promedio >= 7 ? '#764BA2' : promedio >= 4 ? '#FFB020' : '#FF6B6B',
                        fontWeight: 'bold'
                      }}>
                        {promedio > 0 ? promedio.toFixed(1) : '-'}
                      </Text>
                      <Text appearance="hint" category="c1">Promedio</Text>
                    </View>
                    
                    {/* Icono expandir/contraer */}
                    <Icon 
                      name={isExpanded ? 'chevron-up-outline' : 'chevron-down-outline'} 
                      style={{ width: 24, height: 24 }}
                      fill="#8F9BB3"
                    />
                  </View>
                </TouchableOpacity>

                {/* Lista de evaluaciones (expandible) */}
                {isExpanded && (
                  <View style={{ marginTop: 16 }}>
                    <Divider style={{ marginBottom: 12 }} />
                    {materia.evaluaciones.map((evaluacion: any) => {
                      // Filtrar notas del alumno seleccionado
                      const notasAlumno = selectedAlumno 
                        ? evaluacion.notas.filter((n: any) => n.alumnoId === selectedAlumno)
                        : evaluacion.notas;
                      
                      if (notasAlumno.length === 0) return null;
                      
                      return (
                        <View key={evaluacion.id} style={{ marginBottom: 12 }}>
                          <View style={{ 
                            flexDirection: 'row', 
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            backgroundColor: evaluacion.esRecuperatorio ? '#FFF9E6' : '#F8FAFB',
                            padding: 12,
                            borderRadius: 10
                          }}>
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                {evaluacion.esRecuperatorio && (
                                  <View style={{ 
                                    backgroundColor: '#FFB020',
                                    paddingHorizontal: 6,
                                    paddingVertical: 2,
                                    borderRadius: 6,
                                    marginRight: 8
                                  }}>
                                    <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>
                                      RECUP.
                                    </Text>
                                  </View>
                                )}
                                <Text category="s2" style={{ fontWeight: 'bold' }}>
                                  {evaluacion.nombre}
                                </Text>
                              </View>
                              
                              {evaluacion.descripcion && (
                                <Text appearance="hint" category="c1" style={{ marginBottom: 4 }}>
                                  {evaluacion.descripcion}
                                </Text>
                              )}
                              
                              <Text appearance="hint" category="c1">
                                {new Date(evaluacion.fecha).toLocaleDateString('es-AR', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </Text>
                            </View>
                            
                            {/* Notas */}
                            <View style={{ marginLeft: 12 }}>
                              {notasAlumno.map((nota: any) => (
                                <View key={nota.id} style={{ alignItems: 'center', marginBottom: 4 }}>
                                  <Text category="h4" style={{ 
                                    fontWeight: 'bold',
                                    color: nota.nota >= 7 ? '#764BA2' : nota.nota >= 4 ? '#FFB020' : '#FF6B6B'
                                  }}>
                                    {nota.nota > 0 ? nota.nota : '-'}
                                  </Text>
                                  {nota.observaciones && (
                                    <Text appearance="hint" category="c2" style={{ fontSize: 9, textAlign: 'center' }}>
                                      {nota.observaciones}
                                    </Text>
                                  )}
                                </View>
                              ))}
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </Card>
            );
          })
        )}
      </ScrollView>
    </Layout>
  );
}

// 📊 EVALUACIONES TAB (Universal: Notas o Campos Formativos según nivel)
function EvaluacionesTab({ 
  alumnos, 
  selectedAlumnoId, 
  setSelectedAlumnoId,
  isDarkMode = false
}: { 
  alumnos: any[]; 
  selectedAlumnoId: string | null;
  setSelectedAlumnoId: (id: string | null) => void;
  isDarkMode?: boolean;
}) {
  const [selectedMateriaIndex, setSelectedMateriaIndex] = useState<IndexPath>(new IndexPath(0));
  const [refreshing, setRefreshing] = useState(false);
  
  // Obtener colores según modo oscuro
  const colors = getColors(isDarkMode);
  
  // NO auto-seleccionar alumno - mantener en "TODOS" (null) por defecto
  
  // Obtener alumno seleccionado y su nivel
  const alumnoActual = alumnos.find((a: any) => a.id === selectedAlumnoId);
  const nivelAlumno = alumnoActual?.nivel || 'PRIMARIO';
  
  // Cuando hay selección de alumno, usar su nivel
  // Cuando es "TODO" (selectedAlumnoId = null), mostrar ambos (campos formativos + evaluaciones)
  const esNivelInicial = selectedAlumnoId ? (nivelAlumno === 'MATERNAL' || nivelAlumno === 'INICIAL') : false;
  const esTodo = !selectedAlumnoId;
  
  // Lógica de skip NUNCA skipear si es "TODO" - queremos ambas
  // Si alumno seleccionado:
  //   - Si es nivel inicial, skipear calificaciones
  //   - Si NO es nivel inicial, skipear observaciones
  const shouldSkipCalificaciones = selectedAlumnoId ? (alumnos.length === 0 || esNivelInicial) : false;
  const shouldSkipObservaciones = selectedAlumnoId ? (alumnos.length === 0 || !esNivelInicial) : false;
  
  // Query para calificaciones (Primario/Secundario)
  // Si selectedAlumnoId existe, filtrar por alumno; si es null, traer todos
  const { data: calificacionesData, loading: loadingCalificaciones, error: errorCalificaciones, refetch: refetchCalificaciones } = useQuery(GET_CALIFICACIONES, {
    variables: selectedAlumnoId ? { alumnoId: selectedAlumnoId } : {},
    skip: shouldSkipCalificaciones
  });
  
  // Query para observaciones iniciales (Maternal/Inicial)
  // Cuando es "TODO" (!selectedAlumnoId), esta query TAMBIÉN corre
  const { data: observacionesData, loading: loadingObservaciones, error: errorObservaciones, refetch: refetchObservaciones } = useQuery(GET_OBSERVACIONES_INICIAL, {
    variables: selectedAlumnoId ? { alumnoId: selectedAlumnoId } : {},
    skip: shouldSkipObservaciones
  });
  
  // Función para refrescar datos
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      if (selectedAlumnoId && esNivelInicial) {
        // Alumno seleccionado de nivel inicial - solo observaciones
        await refetchObservaciones();
      } else if (selectedAlumnoId && !esNivelInicial) {
        // Alumno seleccionado de nivel superior - solo calificaciones
        await refetchCalificaciones();
      } else if (!selectedAlumnoId) {
        // TODO - traer ambas
        await refetchCalificaciones();
        await refetchObservaciones();
      }
    } catch (error) {
      console.error('Error al refrescar:', error);
    }
    setRefreshing(false);
  }, [selectedAlumnoId, esNivelInicial, refetchCalificaciones, refetchObservaciones]);
  
  const materias = calificacionesData?.calificacionesTutor || [];
  const observacionesRaw = observacionesData?.observacionesInicialesTutor || [];
  
  // Agregar alumnoId a las observaciones si es "TODO"
  const observaciones = React.useMemo(() => {
    if (selectedAlumnoId) {
      // Si hay alumno seleccionado, solo agregar su ID
      return observacionesRaw.map((obs: any) => ({
        ...obs,
        alumnoId: selectedAlumnoId
      }));
    } else {
      // Si es "TODO", mantener las observaciones como están (ya deberían tener alumnoId del backend)
      return observacionesRaw;
    }
  }, [observacionesRaw, selectedAlumnoId]);
  
  // Preparar lista de evaluaciones cronológicas
  const evaluacionesCronologicas = React.useMemo(() => {
    const lista: any[] = [];
    
    materias.forEach((materia: any) => {
      if (materia.evaluaciones && materia.evaluaciones.length > 0) {
        materia.evaluaciones.forEach((evaluacion: any) => {
          if (selectedAlumnoId) {
            // Si hay un alumno seleccionado, filtrar solo sus notas
            const notaAlumno = evaluacion.notas?.find((n: any) => n.alumnoId === selectedAlumnoId);
            if (notaAlumno || evaluacion.notas?.length === 0) {
              lista.push({
                ...evaluacion,
                materiaNombre: materia.nombre,
                materiaId: materia.id,
                notaAlumno,
                alumnoId: selectedAlumnoId
              });
            }
          } else {
            // Si NO hay alumno seleccionado (mostrar TODO), agregar TODAS las notas PERO SOLO de alumnos del tutor
            if (evaluacion.notas && evaluacion.notas.length > 0) {
              evaluacion.notas.forEach((notaAlumno: any) => {
                // Verificar que el alumno pertenece al tutor
                const alumnoExiste = alumnos.some((a: any) => a.id === notaAlumno.alumnoId);
                if (alumnoExiste) {
                  lista.push({
                    ...evaluacion,
                    materiaNombre: materia.nombre,
                    materiaId: materia.id,
                    notaAlumno,
                    alumnoId: notaAlumno.alumnoId
                  });
                }
              });
            }
          }
        });
      }
    });
    
    // Ordenar por fecha descendente (más reciente primero)
    return lista.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [materias, selectedAlumnoId]);
  
  // Lista de materias únicas para el selector
  const materiasUnicas = React.useMemo(() => {
    const map = new Map();
    materias.forEach((m: any) => {
      if (m.evaluaciones && m.evaluaciones.length > 0) {
        map.set(m.id, m.nombre);
      }
    });
    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [materias]);
  
  // Obtener materia seleccionada basado en el índice
  const selectedMateria = React.useMemo(() => {
    if (selectedMateriaIndex.row === 0) return 'todas';
    return materiasUnicas[selectedMateriaIndex.row - 1]?.id || 'todas';
  }, [selectedMateriaIndex, materiasUnicas]);
  
  // Filtrar por materia seleccionada
  const evaluacionesFiltradas = React.useMemo(() => {
    if (selectedMateria === 'todas') {
      return evaluacionesCronologicas;
    }
    return evaluacionesCronologicas.filter(e => e.materiaId === selectedMateria);
  }, [evaluacionesCronologicas, selectedMateria]);
  
  // Valor del select para mostrar
  const selectDisplayValue = React.useMemo(() => {
    if (selectedMateriaIndex.row === 0) return 'Todas las materias';
    return materiasUnicas[selectedMateriaIndex.row - 1]?.nombre || 'Todas las materias';
  }, [selectedMateriaIndex, materiasUnicas]);
  
  return (
    <Layout style={{ flex: 1, backgroundColor: isDarkMode ? colors.bg_primary : '#FFFFFF' }} level="2">
      {/* Selector de alumno */}
      <FiltroAlumnos 
        alumnos={alumnos}
        selectedAlumnoId={selectedAlumnoId}
        setSelectedAlumnoId={setSelectedAlumnoId}
        isDarkMode={isDarkMode}
      />
      
      {/* Indicador de nivel */}
      {!esTodo && (
        <View style={{ backgroundColor: isDarkMode ? colors.bg_secondary : (esNivelInicial ? '#F0E6F7' : '#E3F2FD'), padding: 12 }}>
          <Text appearance="hint" category="c1" style={{ textAlign: 'center', color: isDarkMode ? colors.text_tertiary : (esNivelInicial ? '#764BA2' : '#2196F3') }}>
            {nivelAlumno ? `Nivel ${nivelAlumno.charAt(0) + nivelAlumno.slice(1).toLowerCase()} - ${esNivelInicial ? 'Campos Formativos' : 'Evaluaciones'}` : 'Cargando...'}
          </Text>
        </View>
      )}
      
      <ScrollView 
        style={{ flex: 1, backgroundColor: isDarkMode ? colors.bg_primary : '#FFFFFF' }}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#764BA2']}
            tintColor="#764BA2"
          />
        }
      >
        {(loadingCalificaciones || loadingObservaciones) && !refreshing ? (
          // Skeleton loading
          <>
            {[1, 2, 3].map((i) => (
              <Card
                key={i}
                disabled
                style={{ 
                  marginBottom: 16, 
                  borderRadius: 16, 
                  backgroundColor: isDarkMode ? colors.bg_secondary : '#F8FAFB',
                  borderWidth: 1,
                  borderColor: isDarkMode ? colors.border_subtle : '#E6EBF0'
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <View style={{ flex: 1, gap: 8 }}>
                    <View style={{ width: '70%', height: 16, backgroundColor: isDarkMode ? colors.border_subtle : '#E6EBF0', borderRadius: 4 }} />
                    <View style={{ width: '40%', height: 12, backgroundColor: isDarkMode ? colors.border_subtle : '#E6EBF0', borderRadius: 4 }} />
                  </View>
                  <View style={{ width: 60, height: 20, backgroundColor: isDarkMode ? colors.border_subtle : '#E6EBF0', borderRadius: 8 }} />
                </View>
                <View style={{ width: '100%', height: 14, backgroundColor: isDarkMode ? colors.border_subtle : '#E6EBF0', borderRadius: 4, marginBottom: 6 }} />
                <View style={{ width: '85%', height: 14, backgroundColor: isDarkMode ? colors.border_subtle : '#E6EBF0', borderRadius: 4 }} />
              </Card>
            ))}
          </>
        ) : !selectedAlumnoId ? (
          // VISTA PARA "TODO" - Agrupar por alumno
          <>
            {/* Agrupar alumnos con sus evaluaciones */}
            {alumnos.length > 0 && alumnos.map((alumno: any, alumnoIndex: number) => {
              // Obtener observaciones del alumno
              const obsAlumno = observaciones.filter((o: any) => o.alumnoId === alumno.id);
              // Obtener evaluaciones del alumno
              const evalAlumno = evaluacionesFiltradas.filter((e: any) => e.alumnoId === alumno.id);
              
              // Ordenar observaciones por período (más reciente primero: Diciembre -> Enero)
              const mesesOrden = ['diciembre', 'noviembre', 'octubre', 'septiembre', 'agosto', 'julio', 'junio', 'mayo', 'abril', 'marzo', 'febrero', 'enero'];
              const obsOrdenadas = [...obsAlumno].sort((a, b) => {
                const mesA = mesesOrden.findIndex(m => a.periodo?.toLowerCase().includes(m));
                const mesB = mesesOrden.findIndex(m => b.periodo?.toLowerCase().includes(m));
                return (mesA === -1 ? 999 : mesA) - (mesB === -1 ? 999 : mesB);
              });
              
              // Ordenar evaluaciones por fecha (más reciente primero)
              const evalOrdenadas = [...evalAlumno].sort((a, b) => {
                const fechaA = new Date(a.fecha).getTime();
                const fechaB = new Date(b.fecha).getTime();
                return fechaB - fechaA; // Descendente
              });
              
              // Si no tiene ni observaciones ni evaluaciones, saltarlo
              if (obsOrdenadas.length === 0 && evalOrdenadas.length === 0) return null;
              
              const tieneObservaciones = obsOrdenadas.length > 0;
              const tieneEvaluaciones = evalOrdenadas.length > 0;
              
              // Colores pasteles para distinguir alumnos
              const coloresPastel = [
                '#E8F5E9', // Verde suave
                '#E3F2FD', // Azul suave
                '#FFF3E0', // Naranja suave
                '#F3E5F5', // Púrpura suave
                '#FCE4EC', // Rosa suave
                '#E0F7FA', // Cyan suave
                '#FFF9C4', // Amarillo suave
                '#F1F8E9', // Lima suave
              ];
              const colorHeader = coloresPastel[alumnoIndex % coloresPastel.length];
              
              return (
                <View key={alumno.id} style={{ marginBottom: 24 }}>
                  {/* Card contenedora del alumno */}
                  <View style={{ maxWidth: '100%' }}>
                    {/* Header con nombre del alumno - Estilo INICIO */}
                    <View style={{ 
                      backgroundColor: colorHeader,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderTopLeftRadius: 16,
                      borderTopRightRadius: 16,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <Text style={{ 
                        fontWeight: '600',
                        fontSize: 14,
                        color: isDarkMode ? colors.text_primary : '#1A1A2E'
                      }}>
                        {alumno.nombre} {alumno.apellido}
                      </Text>
                      {(alumno.grado || alumno.division) && (
                        <Text style={{ 
                          fontWeight: '600',
                          fontSize: 14,
                          color: isDarkMode ? colors.text_secondary : '#4A5568'
                        }}>
                          {alumno.grado}{alumno.division ? ` - ${alumno.division}` : ''}
                        </Text>
                      )}
                    </View>
                    
                    {/* Card contenedora */}
                    <Card style={{ 
                      borderRadius: 0,
                      borderBottomLeftRadius: 16,
                      borderBottomRightRadius: 16,
                      backgroundColor: isDarkMode ? colors.bg_secondary : '#FFFFFF',
                      borderWidth: 1,
                      borderColor: isDarkMode ? colors.border_subtle : '#E4E9F2',
                      borderTopWidth: 0,
                      padding: 0,
                      overflow: 'hidden'
                    }}>
                    {/* Contenido: Cards de evaluaciones */}
                    <View style={{ padding: 0 }}>
                      {/* Campos Formativos del alumno */}
                      {tieneObservaciones && (
                        <>
                          {obsOrdenadas.map((obs: any) => (
                            <View key={obs.id} style={{ marginBottom: 16 }}>
                              {/* Sub-header del período/mes */}
                              <View style={{ 
                                backgroundColor: isDarkMode ? colors.bg_tertiary : '#F8FAFB',
                                paddingVertical: 10,
                                paddingHorizontal: 0,
                                borderBottomWidth: 1,
                                borderBottomColor: isDarkMode ? colors.border_subtle : '#E4E9F2',
                                marginBottom: 12
                              }}>
                                <Text style={{ 
                                  color: isDarkMode ? colors.text_primary : '#1A1A2E',
                                  fontWeight: '700', 
                                  fontSize: 13,
                                  textAlign: 'center'
                                }}>
                                  {obs.periodo}
                                </Text>
                              </View>
                              
                              {/* Campos Formativos */}
                              <View style={{ paddingHorizontal: 0 }}>
                              {obs.camposFormativos?.map((campo: any, idx: number) => {
                                const tieneLogros = campo.logrosAlcanzados && campo.logrosAlcanzados.length > 0;
                                const tieneEnDesarrollo = campo.enDesarrollo && campo.enDesarrollo.length > 0;
                                const tieneEnRevision = campo.enRevision && campo.enRevision.length > 0;
                                
                                let colorIndicador = '#8F9BB3';
                                if (tieneEnRevision) colorIndicador = '#FFB020';
                                else if (tieneEnDesarrollo) colorIndicador = '#4A90E2';
                                else if (tieneLogros) colorIndicador = '#764BA2';
                                
                                return (
                                  <View 
                                    key={idx} 
                                    style={{ 
                                      marginBottom: 10, 
                                      borderRadius: 12, 
                                      backgroundColor: isDarkMode ? colors.bg_tertiary : '#FFFFFF',
                                      borderWidth: 1,
                                      borderColor: isDarkMode ? colors.border_subtle : '#E6EBF0',
                                      padding: 14,
                                      shadowColor: '#000',
                                      shadowOffset: { width: 0, height: 1 },
                                      shadowOpacity: 0.05,
                                      shadowRadius: 3,
                                      elevation: 1
                                    }}
                                  >
                                    <Text style={{ 
                                      color: isDarkMode ? colors.text_primary : '#1A1A2E',
                                      fontWeight: '700',
                                      fontSize: 14,
                                      marginBottom: 10,
                                      letterSpacing: 0.3
                                    }}>
                                      {campo.campoFormativoNombre}
                                    </Text>
                                    
                                    {tieneLogros && (
                                      <View style={{ 
                                        marginBottom: 8,
                                        backgroundColor: isDarkMode ? colors.bg_secondary : '#F0FFF4',
                                        padding: 10,
                                        borderRadius: 8
                                      }}>
                                        <View style={{
                                          flexDirection: 'row',
                                          alignItems: 'center',
                                          marginBottom: 8,
                                          paddingBottom: 6,
                                          borderBottomWidth: 1,
                                          borderBottomColor: '#9AE6B4'
                                        }}>
                                          <View style={{
                                            width: 18,
                                            height: 18,
                                            borderRadius: 9,
                                            backgroundColor: '#48BB78',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            marginRight: 6
                                          }}>
                                            <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>✓</Text>
                                          </View>
                                          <Text style={{ 
                                            color: '#2F855A', 
                                            fontSize: 12, 
                                            fontWeight: '700',
                                            textTransform: 'uppercase',
                                            letterSpacing: 0.5
                                          }}>
                                            Logros alcanzados
                                          </Text>
                                        </View>
                                        {campo.logrosAlcanzados.map((logro: string, i: number) => (
                                          <Text key={i} style={{ 
                                            color: isDarkMode ? colors.text_secondary : '#2D3748',
                                            fontSize: 11,
                                            marginBottom: 3,
                                            paddingLeft: 8,
                                            lineHeight: 16
                                          }}>
                                            • {logro}
                                          </Text>
                                        ))}
                                      </View>
                                    )}
                                    
                                    {tieneEnDesarrollo && (
                                      <View style={{ 
                                        marginBottom: 8,
                                        backgroundColor: isDarkMode ? colors.bg_secondary : '#EBF8FF',
                                        padding: 10,
                                        borderRadius: 8
                                      }}>
                                        <View style={{
                                          flexDirection: 'row',
                                          alignItems: 'center',
                                          marginBottom: 8,
                                          paddingBottom: 6,
                                          borderBottomWidth: 1,
                                          borderBottomColor: '#90CDF4'
                                        }}>
                                          <View style={{
                                            width: 18,
                                            height: 18,
                                            borderRadius: 9,
                                            backgroundColor: '#4299E1',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            marginRight: 6
                                          }}>
                                            <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>⟳</Text>
                                          </View>
                                          <Text style={{ 
                                            color: '#2C5282', 
                                            fontSize: 12, 
                                            fontWeight: '700',
                                            textTransform: 'uppercase',
                                            letterSpacing: 0.5
                                          }}>
                                            En desarrollo
                                          </Text>
                                        </View>
                                        {campo.enDesarrollo.map((item: string, i: number) => (
                                          <Text key={i} style={{ 
                                            color: isDarkMode ? colors.text_secondary : '#2D3748',
                                            fontSize: 11,
                                            marginBottom: 3,
                                            paddingLeft: 8,
                                            lineHeight: 16
                                          }}>
                                            • {item}
                                          </Text>
                                        ))}
                                      </View>
                                    )}
                                    
                                    {tieneEnRevision && (
                                      <View style={{ 
                                        marginBottom: 8,
                                        backgroundColor: isDarkMode ? colors.bg_secondary : '#FFFAF0',
                                        padding: 10,
                                        borderRadius: 8
                                      }}>
                                        <View style={{
                                          flexDirection: 'row',
                                          alignItems: 'center',
                                          marginBottom: 8,
                                          paddingBottom: 6,
                                          borderBottomWidth: 1,
                                          borderBottomColor: '#F6AD55'
                                        }}>
                                          <View style={{
                                            width: 18,
                                            height: 18,
                                            borderRadius: 9,
                                            backgroundColor: '#ED8936',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            marginRight: 6
                                          }}>
                                            <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>!</Text>
                                          </View>
                                          <Text style={{ 
                                            color: '#C05621', 
                                            fontSize: 12, 
                                            fontWeight: '700',
                                            textTransform: 'uppercase',
                                            letterSpacing: 0.5
                                          }}>
                                            En revisión
                                          </Text>
                                        </View>
                                        {campo.enRevision.map((item: string, i: number) => (
                                          <Text key={i} style={{ 
                                            color: isDarkMode ? colors.text_secondary : '#2D3748',
                                            fontSize: 11,
                                            marginBottom: 3,
                                            paddingLeft: 8,
                                            lineHeight: 16
                                          }}>
                                            • {item}
                                          </Text>
                                        ))}
                                      </View>
                                    )}
                                    
                                    {campo.observaciones && (
                                      <View style={{ 
                                        marginTop: 4,
                                        backgroundColor: isDarkMode ? colors.bg_secondary : '#F7FAFC',
                                        padding: 10,
                                        borderRadius: 8,
                                       
                                      }}>
                                        <Text style={{ 
                                          color: isDarkMode ? colors.text_tertiary : '#4A5568',
                                          fontStyle: 'italic',
                                          fontSize: 11,
                                          lineHeight: 16
                                        }}>
                                          {campo.observaciones}
                                        </Text>
                                      </View>
                                    )}
                                  </View>
                                );
                              })}
                              
                              {obs.observacionesGenerales && (
                                <View style={{ 
                                  marginTop: 4,
                                  borderRadius: 10,
                                  backgroundColor: isDarkMode ? colors.bg_tertiary : '#FFF8E1',
                                  borderWidth: 1,
                                  borderColor: isDarkMode ? colors.border_medium : '#FFE082',
                                  borderLeftWidth: 3,
                                  borderLeftColor: '#FFB020',
                                  padding: 10
                                }}>
                                  <Text style={{ 
                                    marginBottom: 4, 
                                    color: isDarkMode ? colors.text_primary : '#1A1A2E',
                                    fontWeight: '600',
                                    fontSize: 12
                                  }}>
                                    Observaciones Generales
                                  </Text>
                                  <Text style={{ 
                                    color: isDarkMode ? colors.text_tertiary : '#666',
                                    fontSize: 11,
                                    lineHeight: 16
                                  }}>
                                    {obs.observacionesGenerales}
                                  </Text>
                                </View>
                              )}
                              </View>
                            </View>
                          ))}
                        </>
                      )}
                      
                      {/* Evaluaciones del alumno */}
                      {tieneEvaluaciones && (
                        <View style={{ paddingHorizontal: 4 }}>
                          {evalOrdenadas.map((evaluacion: any, idx: number) => {
                            const calificacion = evaluacion.notaAlumno?.calificacion;
                            
                            let valorMostrar = 'S/N';
                            let badgeBgColor = '#F8FAFB';
                            let badgeTextColor = '#8F9BB3';
                            
                            if (calificacion) {
                              if (calificacion.tipo === 'NUMERICA' && calificacion.valorNumerico != null) {
                                valorMostrar = calificacion.valorNumerico.toFixed(2);
                                if (calificacion.valorNumerico >= 7) {
                                  badgeBgColor = '#E8F5E9';
                                  badgeTextColor = '#2E7D32';
                                } else if (calificacion.valorNumerico >= 4) {
                                  badgeBgColor = '#FFF3E0';
                                  badgeTextColor = '#E65100';
                                } else {
                                  badgeBgColor = '#FFEBEE';
                                  badgeTextColor = '#C62828';
                                }
                              } else if (calificacion.tipo === 'CONCEPTUAL' && calificacion.valorConceptual) {
                                valorMostrar = calificacion.valorConceptual;
                                if (calificacion.aprobado) {
                                  badgeBgColor = '#E8F5E9';
                                  badgeTextColor = '#2E7D32';
                                } else {
                                  badgeBgColor = '#FFEBEE';
                                  badgeTextColor = '#C62828';
                                }
                              }
                            }
                            
                            return (
                              <View 
                                key={`${evaluacion._id}-${idx}`} 
                                style={{ 
                                  marginBottom: 10, 
                                  borderRadius: 12, 
                                  backgroundColor: isDarkMode ? colors.bg_tertiary : '#FAFBFC',
                                  borderWidth: 1,
                                  borderColor: isDarkMode ? colors.border_subtle : '#E6EBF0',
                                  padding: 14
                                }}
                              >
                                {/* Header: badges y fecha */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                  <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap', flex: 1 }}>
                                    <View style={{ 
                                      paddingHorizontal: 8,
                                      paddingVertical: 3,
                                      backgroundColor: badgeBgColor,
                                      borderRadius: 6
                                    }}>
                                      <Text style={{ 
                                        color: badgeTextColor, 
                                        fontWeight: '700', 
                                        fontSize: 11
                                      }}>
                                        {valorMostrar}
                                      </Text>
                                    </View>
                                    
                                    {evaluacion.tipo && (
                                      <View style={{ 
                                        paddingHorizontal: 6,
                                        paddingVertical: 3,
                                        backgroundColor: isDarkMode ? colors.bg_secondary : '#F0E6F7',
                                        borderRadius: 6
                                      }}>
                                        <Text style={{ 
                                          color: '#764BA2', 
                                          fontWeight: '600', 
                                          fontSize: 8,
                                          textTransform: 'uppercase'
                                        }}>
                                          {evaluacion.tipo}
                                        </Text>
                                      </View>
                                    )}
                                    
                                    {evaluacion.esRecuperatorio && (
                                      <View style={{ 
                                        paddingHorizontal: 6,
                                        paddingVertical: 3,
                                        backgroundColor: '#FFF3E0',
                                        borderRadius: 6
                                      }}>
                                        <Text style={{ 
                                          color: '#E65100', 
                                          fontWeight: '600', 
                                          fontSize: 8
                                        }}>
                                          🔄
                                        </Text>
                                      </View>
                                    )}
                                  </View>
                                  
                                  <Text style={{ 
                                    fontSize: 9, 
                                    color: isDarkMode ? colors.text_tertiary : '#8F9BB3',
                                    marginLeft: 6
                                  }}>
                                    {new Date(evaluacion.fecha).toLocaleDateString('es-AR', { 
                                      day: 'numeric', 
                                      month: 'short'
                                    })}
                                  </Text>
                                </View>
                                
                                {/* Materia */}
                                <Text style={{ 
                                  color: isDarkMode ? colors.text_primary : '#1A1A2E', 
                                  fontWeight: '600',
                                  fontSize: 13,
                                  marginBottom: 4
                                }}>
                                  {evaluacion.materiaNombre}
                                </Text>
                                
                                {/* Tema */}
                                {evaluacion.tema && (
                                  <Text 
                                    numberOfLines={2}
                                    style={{ 
                                      color: isDarkMode ? colors.text_secondary : '#3D3D5C',
                                      fontSize: 11,
                                      marginBottom: 6,
                                      lineHeight: 15
                                    }}
                                  >
                                    {evaluacion.tema}
                                  </Text>
                                )}
                                
                                {/* Observaciones */}
                                {evaluacion.notaAlumno?.observaciones && (
                                  <Text style={{ 
                                    color: isDarkMode ? colors.text_tertiary : '#666', 
                                    fontSize: 11,
                                    fontStyle: 'italic',
                                    lineHeight: 15
                                  }}>
                                    "{evaluacion.notaAlumno.observaciones}"
                                  </Text>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                    </Card>
                  </View>
                </View>
              );
            })}
            
            {/* Si no hay nada, mostrar mensaje */}
            {(() => {
              const alumnosConDatos = alumnos.filter((a: any) => {
                const obs = observaciones.filter((o: any) => o.alumnoId === a.id);
                const evaluacion = evaluacionesFiltradas.filter((e: any) => e.alumnoId === a.id);
                return obs.length > 0 || evaluacion.length > 0;
              });
              return alumnosConDatos.length === 0;
            })() && (
              <Card disabled style={{ borderRadius: 16, backgroundColor: isDarkMode ? colors.bg_secondary : '#F8FAFB', borderWidth: 1, borderColor: isDarkMode ? colors.border_subtle : '#E6EBF0' }}>
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Icon name="book-outline" style={{ width: 60, height: 60, marginBottom: 16 }} fill="#764BA2" />
                  <Text category="h6" style={{ marginBottom: 8, color: '#764BA2' }}>Sin datos</Text>
                  <Text appearance="hint" style={{ color: isDarkMode ? colors.text_tertiary : '#666' }}>No hay evaluaciones ni observaciones registradas</Text>
                </View>
              </Card>
            )}
          </>
        ) : esNivelInicial ? (
          // VISTA PARA MATERNAL/INICIAL - Campos Formativos (ALUMNO SELECCIONADO)
          observaciones.length === 0 ? (
            <Card disabled style={{ borderRadius: 16, backgroundColor: isDarkMode ? colors.bg_secondary : '#F8FAFB', borderWidth: 1, borderColor: isDarkMode ? colors.border_subtle : '#E6EBF0' }}>
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Icon name="book-outline" style={{ width: 60, height: 60, marginBottom: 16 }} fill="#764BA2" />
                <Text category="h6" style={{ marginBottom: 8, color: '#764BA2' }}>Sin observaciones</Text>
                <Text appearance="hint">No hay observaciones registradas aún</Text>
              </View>
            </Card>
          ) : (
            observaciones.map((obs: any) => (
              <View key={obs.id} style={{ marginBottom: 16 }}>
                {/* Header del período - Centrado y sin icono */}
                <View style={{ 
                  backgroundColor: isDarkMode ? colors.bg_secondary : '#F8F4FF',
                  paddingVertical: 10,
                  borderRadius: 8,
                  marginBottom: 12,
                  alignItems: 'center'
                }}>
                  <Text style={{ 
                    color: isDarkMode ? colors.text_primary : '#764BA2',
                    fontWeight: '700',
                    fontSize: 13,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5
                  }}>
                    {obs.periodo}
                  </Text>
                </View>
                
                {/* Campos Formativos */}
                <View style={{ paddingHorizontal: 0 }}>
                {obs.camposFormativos?.map((campo: any, idx: number) => {
                  const tieneLogros = campo.logrosAlcanzados && campo.logrosAlcanzados.length > 0;
                  const tieneEnDesarrollo = campo.enDesarrollo && campo.enDesarrollo.length > 0;
                  const tieneEnRevision = campo.enRevision && campo.enRevision.length > 0;
                  
                  let colorIndicador = '#8F9BB3';
                  if (tieneEnRevision) colorIndicador = '#FFB020';
                  else if (tieneEnDesarrollo) colorIndicador = '#4A90E2';
                  else if (tieneLogros) colorIndicador = '#764BA2';
                  
                  return (
                    <View 
                      key={idx} 
                      style={{ 
                        marginBottom: 10, 
                        borderRadius: 12, 
                        backgroundColor: isDarkMode ? colors.bg_tertiary : '#FFFFFF',
                        borderWidth: 1,
                        borderColor: isDarkMode ? colors.border_subtle : '#E6EBF0',
                        padding: 14,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 3,
                        elevation: 1
                      }}
                    >
                      <Text style={{ 
                        color: isDarkMode ? colors.text_primary : '#1A1A2E',
                        fontWeight: '700',
                        fontSize: 14,
                        marginBottom: 10,
                        letterSpacing: 0.3
                      }}>
                        {campo.campoFormativoNombre}
                      </Text>
                      
                      {tieneLogros && (
                        <View style={{ 
                          marginBottom: 8,
                          backgroundColor: isDarkMode ? colors.bg_secondary : '#F0FFF4',
                          padding: 10,
                          borderRadius: 8
                        }}>
                          <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: 8,
                            paddingBottom: 6,
                            borderBottomWidth: 1,
                            borderBottomColor: '#9AE6B4'
                          }}>
                            <View style={{
                              width: 18,
                              height: 18,
                              borderRadius: 9,
                              backgroundColor: '#48BB78',
                              justifyContent: 'center',
                              alignItems: 'center',
                              marginRight: 6
                            }}>
                              <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>✓</Text>
                            </View>
                            <Text style={{ 
                              color: '#2F855A', 
                              fontSize: 12, 
                              fontWeight: '700',
                              textTransform: 'uppercase',
                              letterSpacing: 0.5
                            }}>
                              Logros alcanzados
                            </Text>
                          </View>
                          {campo.logrosAlcanzados.map((logro: string, i: number) => (
                            <Text key={i} style={{ 
                              color: isDarkMode ? colors.text_secondary : '#2D3748',
                              fontSize: 11,
                              marginBottom: 3,
                              paddingLeft: 8,
                              lineHeight: 16
                            }}>
                              • {logro}
                            </Text>
                          ))}
                        </View>
                      )}
                      
                      {tieneEnDesarrollo && (
                        <View style={{ 
                          marginBottom: 8,
                          backgroundColor: isDarkMode ? colors.bg_secondary : '#EBF8FF',
                          padding: 10,
                          borderRadius: 8
                        }}>
                          <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: 8,
                            paddingBottom: 6,
                            borderBottomWidth: 1,
                            borderBottomColor: '#90CDF4'
                          }}>
                            <View style={{
                              width: 18,
                              height: 18,
                              borderRadius: 9,
                              backgroundColor: '#4299E1',
                              justifyContent: 'center',
                              alignItems: 'center',
                              marginRight: 6
                            }}>
                              <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>⟳</Text>
                            </View>
                            <Text style={{ 
                              color: '#2C5282', 
                              fontSize: 12, 
                              fontWeight: '700',
                              textTransform: 'uppercase',
                              letterSpacing: 0.5
                            }}>
                              En desarrollo
                            </Text>
                          </View>
                          {campo.enDesarrollo.map((item: string, i: number) => (
                            <Text key={i} style={{ 
                              color: isDarkMode ? colors.text_secondary : '#2D3748',
                              fontSize: 11,
                              marginBottom: 3,
                              paddingLeft: 8,
                              lineHeight: 16
                            }}>
                              • {item}
                            </Text>
                          ))}
                        </View>
                      )}
                      
                      {tieneEnRevision && (
                        <View style={{ 
                          marginBottom: 8,
                          backgroundColor: isDarkMode ? colors.bg_secondary : '#FFFAF0',
                          padding: 10,
                          borderRadius: 8
                        }}>
                          <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: 8,
                            paddingBottom: 6,
                            borderBottomWidth: 1,
                            borderBottomColor: '#F6AD55'
                          }}>
                            <View style={{
                              width: 18,
                              height: 18,
                              borderRadius: 9,
                              backgroundColor: '#ED8936',
                              justifyContent: 'center',
                              alignItems: 'center',
                              marginRight: 6
                            }}>
                              <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>!</Text>
                            </View>
                            <Text style={{ 
                              color: '#C05621', 
                              fontSize: 12, 
                              fontWeight: '700',
                              textTransform: 'uppercase',
                              letterSpacing: 0.5
                            }}>
                              En revisión
                            </Text>
                          </View>
                          {campo.enRevision.map((item: string, i: number) => (
                            <Text key={i} style={{ 
                              color: isDarkMode ? colors.text_secondary : '#2D3748',
                              fontSize: 11,
                              marginBottom: 3,
                              paddingLeft: 8,
                              lineHeight: 16
                            }}>
                              • {item}
                            </Text>
                          ))}
                        </View>
                      )}
                      
                      {campo.observaciones && (
                        <View style={{ 
                          marginTop: 4,
                          backgroundColor: isDarkMode ? colors.bg_secondary : '#F7FAFC',
                          padding: 10,
                          borderRadius: 8
                        }}>
                          <Text style={{ 
                            color: isDarkMode ? colors.text_tertiary : '#4A5568',
                            fontStyle: 'italic',
                            fontSize: 11,
                            lineHeight: 16
                          }}>
                            {campo.observaciones}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
                </View>
                
                {/* Observaciones generales */}
                {obs.observacionesGenerales && (
                  <View style={{ 
                    marginTop: 8,
                    borderRadius: 12,
                    backgroundColor: isDarkMode ? colors.bg_tertiary : '#FAFBFC',
                    borderWidth: 1,
                    borderColor: isDarkMode ? colors.border_medium : '#E6EBF0',
                    padding: 12
                  }}>
                    <Text style={{ 
                      color: isDarkMode ? colors.text_secondary : '#666',
                      fontWeight: '600',
                      fontSize: 12
                    }}>
                      Observaciones Generales
                    </Text>
                    <Text style={{ 
                      color: isDarkMode ? colors.text_tertiary : '#666',
                      fontSize: 11,
                      lineHeight: 16
                    }}>
                      {obs.observacionesGenerales}
                    </Text>
                  </View>
                )}
              </View>
            ))
          )
        ) : (
          // VISTA PARA PRIMARIO/SECUNDARIO - Notas Cronológicas
          <>
            {/* Filtro por materia con Select dropdown */}
            {materiasUnicas.length > 0 && (
              <Card style={{ marginBottom: 16, borderRadius: 12, backgroundColor: isDarkMode ? colors.bg_tertiary : '#FFFFFF', borderWidth: 1, borderColor: isDarkMode ? colors.border_medium : '#E6EBF0' }}>
                <Text category="label" appearance="hint" style={{ marginBottom: 8, color: isDarkMode ? colors.text_primary : '#666' }}>
                  Filtrar por materia:
                </Text>
                <CustomSelect
                  items={[
                    { key: 0, title: 'Todas las materias' },
                    ...materiasUnicas.map((m: any, index: number) => ({
                      key: index + 1,
                      title: m.nombre
                    }))
                  ]}
                  selectedKey={selectedMateriaIndex.row}
                  onSelect={(key) => setSelectedMateriaIndex(new IndexPath(key as number))}
                  placeholder="Seleccionar materia"
                  isDarkMode={isDarkMode}
                />
                
                {/* Contador de evaluaciones */}
                <View style={{ marginTop: 12 }}>
                  <Text appearance="hint" category="c1">
                    {evaluacionesFiltradas.length} {evaluacionesFiltradas.length === 1 ? 'evaluación' : 'evaluaciones'} encontradas
                  </Text>
                </View>
              </Card>
            )}
            
            {/* Lista cronológica de evaluaciones */}
            {evaluacionesFiltradas.length === 0 ? (
              <Card disabled style={{ borderRadius: 16, backgroundColor: isDarkMode ? colors.bg_secondary : '#F8FAFB', borderWidth: 1, borderColor: isDarkMode ? colors.border_subtle : '#E6EBF0' }}>
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Text category="h6" style={{ marginBottom: 8, color: '#2196F3' }}>Sin evaluaciones</Text>
                  <Text appearance="hint" style={{ color: isDarkMode ? colors.text_tertiary : '#666' }}>
                    {selectedMateria === 'todas' 
                      ? 'No hay evaluaciones registradas aún'
                      : 'No hay evaluaciones para esta materia'}
                  </Text>
                </View>
              </Card>
            ) : (
              <View style={{ paddingHorizontal: 4 }}>
                {evaluacionesFiltradas.map((evaluacion: any, idx: number) => {
                  const calificacion = evaluacion.notaAlumno?.calificacion;
                  
                  let valorMostrar = 'S/N';
                  let badgeBgColor = '#F8FAFB';
                  let badgeTextColor = '#8F9BB3';
                  
                  if (calificacion) {
                    if (calificacion.tipo === 'NUMERICA' && calificacion.valorNumerico != null) {
                      valorMostrar = calificacion.valorNumerico.toFixed(2);
                      if (calificacion.valorNumerico >= 7) {
                        badgeBgColor = '#E8F5E9';
                        badgeTextColor = '#2E7D32';
                      } else if (calificacion.valorNumerico >= 4) {
                        badgeBgColor = '#FFF3E0';
                        badgeTextColor = '#E65100';
                      } else {
                        badgeBgColor = '#FFEBEE';
                        badgeTextColor = '#C62828';
                      }
                    } else if (calificacion.tipo === 'CONCEPTUAL' && calificacion.valorConceptual) {
                      valorMostrar = calificacion.valorConceptual;
                      if (calificacion.aprobado) {
                        badgeBgColor = '#E8F5E9';
                        badgeTextColor = '#2E7D32';
                      } else {
                        badgeBgColor = '#FFEBEE';
                        badgeTextColor = '#C62828';
                      }
                    }
                  }
                  
                  return (
                    <View 
                      key={`${evaluacion._id}-${idx}`} 
                      style={{ 
                        marginBottom: 10, 
                        borderRadius: 12, 
                        backgroundColor: isDarkMode ? colors.bg_tertiary : '#FAFBFC',
                        borderWidth: 1,
                        borderColor: isDarkMode ? colors.border_subtle : '#E6EBF0',
                        padding: 14
                      }}
                    >
                      {/* Header: badges y fecha */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap', flex: 1 }}>
                          <View style={{ 
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            backgroundColor: badgeBgColor,
                            borderRadius: 6
                          }}>
                            <Text style={{ 
                              color: badgeTextColor, 
                              fontWeight: '700', 
                              fontSize: 11
                            }}>
                              {valorMostrar}
                            </Text>
                          </View>
                          
                          {evaluacion.tipo && (
                            <View style={{ 
                              paddingHorizontal: 6,
                              paddingVertical: 3,
                              backgroundColor: isDarkMode ? colors.bg_secondary : '#F0E6F7',
                              borderRadius: 6
                            }}>
                              <Text style={{ 
                                color: '#764BA2', 
                                fontWeight: '600', 
                                fontSize: 8,
                                textTransform: 'uppercase'
                              }}>
                                {evaluacion.tipo}
                              </Text>
                            </View>
                          )}
                          
                          {evaluacion.esRecuperatorio && (
                            <View style={{ 
                              paddingHorizontal: 6,
                              paddingVertical: 3,
                              backgroundColor: '#FFF3E0',
                              borderRadius: 6
                            }}>
                              <Text style={{ 
                                color: '#FF9800', 
                                fontWeight: '600', 
                                fontSize: 8,
                                textTransform: 'uppercase'
                              }}>
                                RECUPERATORIO
                              </Text>
                            </View>
                          )}
                        </View>
                        
                        <Text style={{ 
                          color: isDarkMode ? colors.text_tertiary : '#8F9BB3', 
                          fontSize: 10,
                          marginLeft: 8
                        }}>
                          {new Date(evaluacion.fecha).toLocaleDateString('es-AR', { 
                            day: '2-digit',
                            month: '2-digit'
                          })}
                        </Text>
                      </View>
                      
                      {/* Materia */}
                      <Text style={{ 
                        color: '#2196F3', 
                        fontWeight: '600',
                        fontSize: 13,
                        marginBottom: 4
                      }}>
                        {evaluacion.materiaNombre}
                      </Text>
                      
                      {/* Tema */}
                      <Text style={{ 
                        color: isDarkMode ? colors.text_primary : '#1A1A2E',
                        fontSize: 12,
                        marginBottom: 8
                      }}>
                        {evaluacion.tema || evaluacion.tipo}
                      </Text>
                      
                      {/* Observaciones */}
                      {evaluacion.notaAlumno?.observaciones && (
                        <View style={{ 
                          backgroundColor: isDarkMode ? colors.bg_secondary : '#F7F9FC',
                          padding: 8,
                          borderRadius: 6,
                          marginTop: 4
                        }}>
                          <Text style={{ 
                            color: isDarkMode ? colors.text_secondary : '#666',
                            fontSize: 11,
                            lineHeight: 16
                          }}>
                            {evaluacion.notaAlumno.observaciones}
                          </Text>
                        </View>
                      )}
                      
                      {evaluacion.observaciones && !evaluacion.notaAlumno?.observaciones && (
                        <Text style={{ 
                          color: isDarkMode ? colors.text_tertiary : '#8F9BB3',
                          fontSize: 11,
                          fontStyle: 'italic',
                          marginTop: 4
                        }}>
                          {evaluacion.observaciones}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </Layout>
  );
}

// 📅 ASISTENCIAS TAB
function AsistenciasTab({ 
  alumnos, 
  selectedAlumnoId, 
  setSelectedAlumnoId,
  isDarkMode = false
}: { 
  alumnos: any[]; 
  selectedAlumnoId: string | null;
  setSelectedAlumnoId: (id: string | null) => void;
  isDarkMode?: boolean;
}) {
  // Obtener colores según modo oscuro
  const colors = getColors(isDarkMode);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [viewMode, setViewMode] = useState<'ultimos' | 'dia' | 'semana' | 'mes'>('ultimos');
  const [asistenciasPorAlumno, setAsistenciasPorAlumno] = useState<any>({});
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);
  
  // Filtrar alumnos si se proporciona selectedAlumnoId
  const alumnosFiltrados = selectedAlumnoId 
    ? alumnos.filter((a: any) => a.id === selectedAlumnoId)
    : alumnos;
  
  // Calcular rango de fechas según el modo de vista - MEMOIZADO
  const { desde, hasta } = React.useMemo(() => {
    const hoy = new Date();
    let desde: Date;
    let hasta: Date = selectedDate || hoy;
    
    switch (viewMode) {
      case 'dia':
        desde = selectedDate || hoy;
        hasta = selectedDate || hoy;
        break;
        
      case 'semana':
        const diaSeleccionado = selectedDate || hoy;
        const diaSemana = diaSeleccionado.getDay();
        const diasHastaLunes = diaSemana === 0 ? 6 : diaSemana - 1;
        desde = new Date(diaSeleccionado);
        desde.setDate(desde.getDate() - diasHastaLunes);
        hasta = new Date(desde);
        hasta.setDate(hasta.getDate() + 6);
        break;
        
      case 'mes':
        const mesSeleccionado = selectedDate || hoy;
        desde = new Date(mesSeleccionado.getFullYear(), mesSeleccionado.getMonth(), 1);
        hasta = new Date(mesSeleccionado.getFullYear(), mesSeleccionado.getMonth() + 1, 0);
        break;
        
      case 'ultimos':
      default:
        desde = new Date(hasta);
        desde.setDate(desde.getDate() - 30);
        break;
    }
    
    const formatoLocal = (fecha: Date) => {
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    return {
      desde: formatoLocal(desde),
      hasta: formatoLocal(hasta)
    };
  }, [viewMode, selectedDate]);
  
  // Query para obtener asistencias
  const { data: asistenciasData, loading: loadingAsistencias, refetch: refetchAsistencias } = useQuery(GET_ASISTENCIAS, {
    variables: { desde, hasta }
  });

  // Función para refrescar datos
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchAsistencias();
    } catch (error) {
      console.error('Error al refrescar asistencias:', error);
    }
    setRefreshing(false);
  }, [refetchAsistencias]);

  // Procesar asistencias cuando cambian
  useEffect(() => {
    if (asistenciasData?.asistenciasTutor) {
      const asistencias = asistenciasData.asistenciasTutor;
      
      // Agrupar por alumno
      const porAlumno: any = {};
      
      asistencias.forEach((asistencia: any) => {
        asistencia.registros.forEach((registro: any) => {
          if (!porAlumno[registro.alumnoId]) {
            porAlumno[registro.alumnoId] = [];
          }
          porAlumno[registro.alumnoId].push({
            id: asistencia.id,
            fecha: asistencia.fecha,
            presente: registro.estado === 'PRESENTE' || registro.estado === 'TARDE',
            observaciones: registro.observaciones,
            estado: registro.estado
          });
        });
      });
      
      // Si es modo "ultimos", limitar a 10 registros por alumno
      if (viewMode === 'ultimos') {
        Object.keys(porAlumno).forEach(alumnoId => {
          porAlumno[alumnoId] = porAlumno[alumnoId]
            .sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
            .slice(0, 10);
        });
      }
      
      setAsistenciasPorAlumno(porAlumno);
    }
  }, [asistenciasData, viewMode]); // REMOVIDO 'alumnos' que causaba el loop

  const handleDateSearch = () => {
    setShowDatePicker(true);
  };

  const handleDateSelect = (date: Date, mode: 'dia' | 'semana' | 'mes') => {
    setSelectedDate(date);
    setViewMode(mode);
    setShowDatePicker(false);
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
    setViewMode('ultimos');
  };
  
  // Función para obtener el título del botón según el modo
  const getTituloBoton = () => {
    if (!selectedDate) return 'Últimos 10 registros';
    
    const fecha = selectedDate;
    switch (viewMode) {
      case 'dia':
        return fecha.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
      case 'semana':
        return `Semana del ${fecha.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}`;
      case 'mes':
        return fecha.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
      default:
        return 'Últimos 10 registros';
    }
  };

  if (alumnos.length === 0) {
    return (
      <Layout style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Icon name="calendar-outline" style={{ width: 80, height: 80 }} fill="#8F9BB3" />
        <Text category="h6" style={{ marginTop: 16, textAlign: 'center' }}>
          No hay alumnos asignados
        </Text>
      </Layout>
    );
  }

  return (
    <Layout style={{ flex: 1, backgroundColor: isDarkMode ? colors.bg_primary : '#FFFFFF' }}>
      {/* Filtro de alumnos */}
      <FiltroAlumnos 
        alumnos={alumnos}
        selectedAlumnoId={selectedAlumnoId}
        setSelectedAlumnoId={setSelectedAlumnoId}
        isDarkMode={isDarkMode}
      />
      
      {/* Barra de búsqueda por fecha */}
      <View style={{ padding: 16, backgroundColor: isDarkMode ? colors.bg_secondary : '#F8FAFB', borderBottomWidth: 1, borderBottomColor: isDarkMode ? colors.border_medium : '#E6EBF0' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Button
            size="small"
            appearance="outline"
            accessoryLeft={(props) => <Icon {...props} name="calendar-outline" />}
            onPress={handleDateSearch}
            style={{ flex: 1, borderRadius: 12 }}
          >
            {getTituloBoton()}
          </Button>
          {viewMode !== 'ultimos' && (
            <Button
              size="small"
              appearance="ghost"
              status="danger"
              accessoryLeft={(props) => <Icon {...props} name="close-outline" />}
              onPress={clearDateFilter}
              style={{ borderRadius: 12 }}
            >
              Limpiar
            </Button>
          )}
        </View>
        {viewMode !== 'ultimos' && (
          <Text appearance="hint" category="c1" style={{ marginTop: 4, textAlign: 'center', color: isDarkMode ? colors.text_tertiary : '#666' }}>
            {viewMode === 'dia' ? 'Mostrando asistencias del día seleccionado' :
             viewMode === 'semana' ? 'Mostrando asistencias de la semana' :
             'Mostrando asistencias del mes'}
          </Text>
        )}
      </View>

      <ScrollView 
        style={{ flex: 1, padding: 16, backgroundColor: isDarkMode ? colors.bg_primary : '#FFFFFF' }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#764BA2']}
            tintColor="#764BA2"
          />
        }
      >
        {loadingAsistencias && !refreshing ? (
          // Skeleton loading
          <>
            {[1, 2, 3].map((i) => (
              <Card
                key={i}
                disabled
                style={{ 
                  marginBottom: 16, 
                  borderRadius: 16, 
                  backgroundColor: isDarkMode ? colors.bg_secondary : '#F8FAFB',
                  borderWidth: 1,
                  borderColor: isDarkMode ? colors.border_subtle : '#E6EBF0'
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <View style={{ flex: 1, gap: 8 }}>
                    <View style={{ width: '70%', height: 16, backgroundColor: isDarkMode ? colors.border_subtle : '#E6EBF0', borderRadius: 4 }} />
                    <View style={{ width: '40%', height: 12, backgroundColor: isDarkMode ? colors.border_subtle : '#E6EBF0', borderRadius: 4 }} />
                  </View>
                  <View style={{ width: 60, height: 20, backgroundColor: isDarkMode ? colors.border_subtle : '#E6EBF0', borderRadius: 8 }} />
                </View>
                <View style={{ width: '100%', height: 14, backgroundColor: isDarkMode ? colors.border_subtle : '#E6EBF0', borderRadius: 4, marginBottom: 6 }} />
                <View style={{ width: '85%', height: 14, backgroundColor: isDarkMode ? colors.border_subtle : '#E6EBF0', borderRadius: 4 }} />
              </Card>
            ))}
          </>
        ) : (
          alumnosFiltrados.map((alumno: any) => {
            const asistencias = asistenciasPorAlumno[alumno.id] || [];
            const presente = asistencias.filter((a: any) => a.presente).length;
            const ausente = asistencias.filter((a: any) => !a.presente).length;
            const porcentaje = asistencias.length > 0 
              ? Math.round((presente / asistencias.length) * 100) 
              : 0;
            
            // Para modo "día", no mostrar estadísticas si solo hay 1 registro
            const mostrarEstadisticas = viewMode !== 'dia' || asistencias.length > 1;

            return (
              <Card key={alumno.id} style={{ marginBottom: 16, borderRadius: 16, backgroundColor: isDarkMode ? colors.bg_secondary : '#FFFFFF', borderWidth: 1, borderColor: isDarkMode ? colors.border_subtle : '#E6EBF0' }}>
                {/* Header con nombre del alumno */}
                <View style={{ marginBottom: 12 }}>
                  <Text category="h6" style={{ color: '#764BA2', fontWeight: 'bold' }}>
                    {alumno.nombre} {alumno.apellido}
                  </Text>
                </View>

                <Divider style={{ marginBottom: 12, backgroundColor: isDarkMode ? colors.border_medium : '#E6EBF0' }} />

                {/* Estadísticas */}
                {asistencias.length === 0 ? (
                  <View style={{ 
                    padding: 20, 
                    alignItems: 'center',
                    backgroundColor: isDarkMode ? colors.bg_secondary : '#F8FAFB',
                    borderRadius: 10
                  }}>
                    <Icon name="calendar-outline" style={{ width: 40, height: 40, marginBottom: 8 }} fill={isDarkMode ? colors.text_disabled : '#8F9BB3'} />
                    <Text appearance="hint" style={{ textAlign: 'center', color: isDarkMode ? colors.text_tertiary : '#666' }}>
                      Sin registros de asistencia en el período seleccionado
                    </Text>
                  </View>
                ) : (
                  <>
                    {mostrarEstadisticas && (
                      <>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 }}>
                          <View style={{ alignItems: 'center' }}>
                            <Text category="h6" style={{ color: '#764BA2', fontWeight: 'bold' }}>
                              {presente}
                            </Text>
                            <Text appearance="hint" category="c1">Presentes</Text>
                          </View>
                          <View style={{ alignItems: 'center' }}>
                            <Text category="h6" style={{ color: '#FF6B6B', fontWeight: 'bold' }}>
                              {ausente}
                            </Text>
                            <Text appearance="hint" category="c1">Ausentes</Text>
                          </View>
                          <View style={{ alignItems: 'center' }}>
                            <Text category="h6" style={{ color: '#4A90E2', fontWeight: 'bold' }}>
                              {porcentaje}%
                            </Text>
                            <Text appearance="hint" category="c1">Asistencia</Text>
                          </View>
                        </View>

                        <Divider style={{ marginBottom: 12, backgroundColor: isDarkMode ? colors.border_medium : '#E6EBF0' }} />
                      </>
                    )}

                    {/* Lista de asistencias */}
                    <Text category="s2" style={{ marginBottom: 8, fontWeight: 'bold', color: isDarkMode ? colors.text_primary : '#1A1A2E' }}>
                      {viewMode === 'dia' ? 'Registro del día' : 
                       viewMode === 'semana' ? 'Registros de la semana' :
                       viewMode === 'mes' ? 'Registros del mes' :
                       'Últimos 10 registros'}
                    </Text>
                    {asistencias.map((asistencia: any, index: number) => (
                      <View key={`${asistencia.id}-${index}`}>
                        <View 
                          style={{ 
                            flexDirection: 'row', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            marginBottom: 6,
                            backgroundColor: asistencia.presente 
                              ? isDarkMode ? 'rgba(0, 191, 165, 0.15)' : '#E8F8F5'
                              : isDarkMode ? 'rgba(255, 107, 107, 0.15)' : '#FFE8E8',
                            borderRadius: 8
                          }}
                        >
                          <Text category="p2" style={{ color: isDarkMode ? colors.text_primary : '#1A1A2E' }}>
                            {(() => {
                              const fechaString = asistencia.fecha.split('T')[0];
                              const [year, month, day] = fechaString.split('-');
                              const fecha = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                              
                              return fecha.toLocaleDateString('es-AR', { 
                                day: '2-digit', 
                                month: 'short',
                                year: 'numeric'
                              });
                            })()}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Icon 
                              name={asistencia.presente ? 'checkmark-circle-2' : 'close-circle'} 
                              style={{ width: 20, height: 20, marginRight: 6 }}
                              fill={asistencia.presente ? '#764BA2' : '#FF6B6B'}
                            />
                            <Text 
                              category="p2" 
                              style={{ 
                                fontWeight: 'bold',
                                color: asistencia.presente ? '#764BA2' : '#FF6B6B'
                              }}
                            >
                              {asistencia.estado === 'TARDE' ? 'Tarde' : asistencia.presente ? 'Presente' : 'Ausente'}
                            </Text>
                          </View>
                        </View>
                        {asistencia.observaciones && (
                          <Text appearance="hint" category="c1" style={{ marginTop: -2, marginBottom: 6, marginLeft: 12, fontStyle: 'italic', color: isDarkMode ? colors.text_tertiary : '#666' }}>
                            {asistencia.observaciones}
                          </Text>
                        )}
                      </View>
                    ))}
                  </>
                )}
              </Card>
            );
          })
        )}
        {/* Spacer para contenido visible sobre la barra */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Date Picker Modal con opciones */}
      {showDatePicker && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View 
            style={{ 
              flex: 1, 
              backgroundColor: 'rgba(0, 0, 0, 0.5)', 
              justifyContent: 'center', 
              alignItems: 'center',
              padding: 20
            }}
          >
            <TouchableOpacity 
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              activeOpacity={1}
              onPress={() => setShowDatePicker(false)}
            />
            
            <ScrollView 
              style={{ width: '100%', maxWidth: 400 }}
              contentContainerStyle={{ zIndex: 1 }}
              showsVerticalScrollIndicator={false}
            >
              <Card disabled style={{ borderRadius: 20 }}>
                <Text category="h6" style={{ marginBottom: 16, textAlign: 'center' }}>
                  Seleccionar período
                </Text>
                
                {/* Opciones de vista */}
                <View style={{ marginBottom: 16 }}>
                  <Text category="s2" style={{ marginBottom: 8, fontWeight: 'bold' }}>
                    📅 Seleccionar fecha personalizada
                  </Text>
                  
                  {/* DatePicker de UI Kitten */}
                  <Datepicker
                    date={tempDate}
                    onSelect={(date) => setTempDate(date)}
                    filter={(date) => {
                      // Deshabilitar sábados (6) y domingos (0)
                      const diaSemana = date.getDay();
                      return diaSemana !== 0 && diaSemana !== 6;
                    }}
                    style={{ marginBottom: 8 }}
                  />
                  
                  {/* Botones para elegir cómo ver la fecha seleccionada */}
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                    <Button
                      size="tiny"
                      appearance="filled"
                      onPress={() => handleDateSelect(tempDate, 'dia')}
                      style={{ flex: 1, borderRadius: 10 }}
                    >
                      Ver día
                    </Button>
                    <Button
                      size="tiny"
                      appearance="filled"
                      status="info"
                      onPress={() => handleDateSelect(tempDate, 'semana')}
                      style={{ flex: 1, borderRadius: 10 }}
                    >
                      Ver semana
                    </Button>
                    <Button
                      size="tiny"
                      appearance="filled"
                      status="success"
                      onPress={() => handleDateSelect(tempDate, 'mes')}
                      style={{ flex: 1, borderRadius: 10 }}
                    >
                      Ver mes
                    </Button>
                  </View>
                  
                  <Divider style={{ marginVertical: 12 }} />
                  
                  <Text category="s2" style={{ marginBottom: 8, fontWeight: 'bold' }}>
                    ⚡ Accesos rápidos
                  </Text>
                  
                  {/* Botones rápidos para última semana */}
                  <View style={{ marginBottom: 8 }}>
                    <Text category="c1" appearance="hint" style={{ marginBottom: 4 }}>
                      Últimos días:
                    </Text>
                    {(() => {
                      const diasHabiles = [];
                      let diaActual = new Date();
                      let contador = 0;
                      
                      // Obtener los últimos 5 días hábiles (lunes a viernes)
                      while (diasHabiles.length < 5 && contador < 14) {
                        const diaSemana = diaActual.getDay(); // 0 = domingo, 6 = sábado
                        if (diaSemana !== 0 && diaSemana !== 6) {
                          diasHabiles.push(new Date(diaActual));
                        }
                        diaActual.setDate(diaActual.getDate() - 1);
                        contador++;
                      }
                      
                      return diasHabiles.map((date, index) => (
                        <Button
                          key={`dia-${index}`}
                          size="small"
                          appearance="outline"
                          onPress={() => handleDateSelect(date, 'dia')}
                          style={{ marginBottom: 4, borderRadius: 10 }}
                          accessoryLeft={(props) => <Icon {...props} name="calendar-outline" />}
                        >
                          {date.toLocaleDateString('es-AR', { 
                            weekday: 'short',
                            day: '2-digit', 
                            month: 'short'
                          })}
                        </Button>
                      ));
                    })()}
                  </View>
                  
                  <Divider style={{ marginVertical: 8 }} />
                  
                  {/* Botones rápidos de semana */}
                  <View style={{ marginBottom: 8 }}>
                    <Text category="c1" appearance="hint" style={{ marginBottom: 4 }}>
                      Por semana:
                    </Text>
                    <Button
                      size="small"
                      appearance="outline"
                      status="info"
                      onPress={() => handleDateSelect(new Date(), 'semana')}
                      style={{ marginBottom: 4, borderRadius: 10 }}
                      accessoryLeft={(props) => <Icon {...props} name="calendar-outline" />}
                    >
                      Semana actual
                    </Button>
                    <Button
                      size="small"
                      appearance="outline"
                      onPress={() => {
                        const semanaAnterior = new Date();
                        semanaAnterior.setDate(semanaAnterior.getDate() - 7);
                        handleDateSelect(semanaAnterior, 'semana');
                      }}
                      style={{ marginBottom: 4, borderRadius: 10 }}
                      accessoryLeft={(props) => <Icon {...props} name="calendar-outline" />}
                    >
                      Semana pasada
                    </Button>
                  </View>
                  
                  <Divider style={{ marginVertical: 8 }} />
                  
                  {/* Botones rápidos de mes */}
                  <View style={{ marginBottom: 8 }}>
                    <Text category="c1" appearance="hint" style={{ marginBottom: 4 }}>
                      Por mes:
                    </Text>
                    <Button
                      size="small"
                      appearance="outline"
                      status="success"
                      onPress={() => handleDateSelect(new Date(), 'mes')}
                      style={{ marginBottom: 4, borderRadius: 10 }}
                      accessoryLeft={(props) => <Icon {...props} name="calendar-outline" />}
                    >
                      Mes actual
                    </Button>
                    <Button
                      size="small"
                      appearance="outline"
                      onPress={() => {
                        const mesAnterior = new Date();
                        mesAnterior.setMonth(mesAnterior.getMonth() - 1);
                        handleDateSelect(mesAnterior, 'mes');
                      }}
                      style={{ marginBottom: 4, borderRadius: 10 }}
                      accessoryLeft={(props) => <Icon {...props} name="calendar-outline" />}
                    >
                      Mes pasado
                    </Button>
                  </View>
                </View>
                
                <Button 
                  appearance="ghost"
                  onPress={() => setShowDatePicker(false)}
                  style={{ borderRadius: 12 }}
                >
                  Cancelar
                </Button>
              </Card>
            </ScrollView>
          </View>
        </Modal>
      )}
    </Layout>
  );
}

// 📋 SEGUIMIENTO DIARIO TAB (Solo para nivel MATERNAL)
function SeguimientoTab({ 
  alumnos, 
  selectedAlumnoId, 
  setSelectedAlumnoId,
  isDarkMode = false
}: { 
  alumnos: any[]; 
  selectedAlumnoId: string | null;
  setSelectedAlumnoId: (id: string | null) => void;
  isDarkMode?: boolean;
}) {
  // Obtener colores según modo oscuro
  const colors = getColors(isDarkMode);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [fechaDesde, setFechaDesde] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)); // Últimos 7 días
  const [fechaHasta, setFechaHasta] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'desde' | 'hasta'>('desde');
  
  const alumnosMaternalOnly = alumnos.filter((a: any) => a.nivel === 'MATERNAL');
  
  // Si hay alumnos MATERNAL pero no hay seleccionado, seleccionar el primero automáticamente
  useEffect(() => {
    if (alumnosMaternalOnly.length > 0 && !selectedAlumnoId) {
      setSelectedAlumnoId(alumnosMaternalOnly[0].id);
    }
  }, [alumnosMaternalOnly.length]);
  
  const shouldSkip = !selectedAlumnoId;
  
  const { data, loading, refetch } = useQuery(GET_SEGUIMIENTO_DIARIO, {
    variables: {
      alumnoId: selectedAlumnoId,
      limit: 7
    },
    skip: shouldSkip
  });
  
  const seguimientos = data?.seguimientosDiariosPorAlumnoTutor || [];
  
  // DEBUG: Ver datos de seguimiento
  console.log('🔍 DEBUG Seguimiento - Variables:', {
    alumnoId: selectedAlumnoId,
    fechaInicio: fechaDesde.toISOString(),
    fechaFin: fechaHasta.toISOString()
  });
  console.log('🔍 DEBUG Seguimiento - Data:', data);
  console.log('🔍 DEBUG Seguimiento - Registros:', seguimientos);
  
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);
  
  if (alumnosMaternalOnly.length === 0) {
    return (
      <Layout style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Icon name="alert-circle-outline" style={{ width: 60, height: 60 }} fill="#FFB020" />
        <Text category="h6" style={{ marginTop: 16, textAlign: 'center' }}>
          No hay alumnos de nivel Maternal
        </Text>
        <Text appearance="hint" style={{ textAlign: 'center', marginTop: 8 }}>
          El seguimiento diario solo está disponible para alumnos de nivel Maternal
        </Text>
      </Layout>
    );
  }
  
  return (
    <Layout style={{ flex: 1, backgroundColor: isDarkMode ? colors.bg_primary : '#FFFFFF' }} level="2">
      {/* Selector de alumno MATERNAL */}
      <FiltroAlumnos 
        alumnos={alumnosMaternalOnly}
        selectedAlumnoId={selectedAlumnoId}
        setSelectedAlumnoId={setSelectedAlumnoId}
        isDarkMode={isDarkMode}
      />
      
      {/* Indicador de nivel */}
      <View style={{ backgroundColor: isDarkMode ? colors.bg_secondary : '#F0E6F7', padding: 8 }}>
        <Text appearance="hint" category="c1" style={{ textAlign: 'center', color: isDarkMode ? colors.text_tertiary : '#764BA2' }}>
          Nivel Maternal - Seguimiento Diario
        </Text>
      </View>
      
      <ScrollView 
        style={{ flex: 1, backgroundColor: isDarkMode ? colors.bg_primary : '#FFFFFF' }} 
        contentContainerStyle={{ padding: 16, paddingBottom: 100, backgroundColor: isDarkMode ? colors.bg_primary : '#FFFFFF' }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#764BA2']}
            tintColor="#764BA2"
          />
        }
      >
        {loading && !refreshing ? (
          // Skeleton loading
          <>
            {[1, 2, 3].map((i) => (
              <Card
                key={i}
                disabled
                style={{ 
                  marginBottom: 16, 
                  borderRadius: 16, 
                  backgroundColor: isDarkMode ? colors.bg_secondary : '#F8FAFB',
                  borderWidth: 1,
                  borderColor: isDarkMode ? colors.border_subtle : '#E6EBF0'
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <View style={{ flex: 1, gap: 8 }}>
                    <View style={{ width: '70%', height: 16, backgroundColor: isDarkMode ? colors.border_subtle : '#E6EBF0', borderRadius: 4 }} />
                    <View style={{ width: '40%', height: 12, backgroundColor: isDarkMode ? colors.border_subtle : '#E6EBF0', borderRadius: 4 }} />
                  </View>
                  <View style={{ width: 60, height: 20, backgroundColor: isDarkMode ? colors.border_subtle : '#E6EBF0', borderRadius: 8 }} />
                </View>
                <View style={{ width: '100%', height: 14, backgroundColor: isDarkMode ? colors.border_subtle : '#E6EBF0', borderRadius: 4, marginBottom: 6 }} />
                <View style={{ width: '85%', height: 14, backgroundColor: isDarkMode ? colors.border_subtle : '#E6EBF0', borderRadius: 4 }} />
              </Card>
            ))}
          </>
        ) : seguimientos.length === 0 ? (
          <Card disabled style={{ borderRadius: 16, backgroundColor: isDarkMode ? colors.bg_secondary : '#F8FAFB', borderWidth: 1, borderColor: isDarkMode ? colors.border_subtle : '#E6EBF0' }}>
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text category="h6" style={{ marginBottom: 8, color: '#764BA2' }}>Sin seguimiento registrado</Text>
              <Text appearance="hint">No hay registros de seguimiento diario en este período</Text>
            </View>
          </Card>
        ) : (
          seguimientos
            .sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
            .map((seguimiento: any) => {
              const isExpanded = expandedDays[seguimiento.id];

              return (
                <Card 
                  key={seguimiento.id} 
                  style={{ marginBottom: 16, borderRadius: 16, backgroundColor: isDarkMode ? colors.bg_secondary : '#FFFFFF', borderWidth: 1, borderColor: isDarkMode ? colors.border_subtle : '#E6EBF0', borderLeftWidth: 4, borderLeftColor: '#764BA2' }}
                  onPress={() => setExpandedDays(prev => ({ ...prev, [seguimiento.id]: !prev[seguimiento.id] }))}
                >
                  {/* Header compacto - siempre visible */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text category="s1" style={{ color: isDarkMode ? colors.text_primary : '#3D3D5C', marginBottom: 4, fontSize: 14 }}>
                        {new Date(seguimiento.fecha).toLocaleDateString('es-AR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        }).split(' de ').map((part, i) => i === 0 || i === 1 ? part.charAt(0).toUpperCase() + part.slice(1) : part).join(' de ')}
                      </Text>
                      {seguimiento.estadoDelDia && (
                        <View style={{ 
                          paddingHorizontal: 10, 
                          paddingVertical: 4, 
                          backgroundColor: isDarkMode ? (
                            seguimiento.estadoDelDia === 'no-tan-bueno' ? '#5C2B2B' :
                            seguimiento.estadoDelDia === 'bueno' ? '#1F4D3D' :
                            seguimiento.estadoDelDia === 'muy-bueno' ? '#0F4D3D' :
                            colors.bg_tertiary
                          ) : (
                            seguimiento.estadoDelDia === 'no-tan-bueno' ? '#FEE2E2' :
                            seguimiento.estadoDelDia === 'bueno' ? '#E6D9F0' :
                            seguimiento.estadoDelDia === 'muy-bueno' ? '#D4B3E6' :
                            '#F0E6F7'
                          ),
                          borderRadius: 6,
                          alignSelf: 'flex-start'
                        }}>
                          <Text category="c2" style={{ 
                            color: 
                              seguimiento.estadoDelDia === 'no-tan-bueno' ? '#FF6B6B' :
                              seguimiento.estadoDelDia === 'bueno' ? '#764BA2' :
                              seguimiento.estadoDelDia === 'muy-bueno' ? '#764BA2' :
                              '#764BA2',
                            fontSize: 11
                          }}>
                            {seguimiento.estadoDelDia.replace(/-/g, ' ')}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Icon 
                      name={isExpanded ? 'chevron-up-outline' : 'chevron-down-outline'} 
                      style={{ width: 24, height: 24 }} 
                      fill={isDarkMode ? colors.text_tertiary : '#8F9BB3'}
                    />
                  </View>

                  {/* Detalles - solo si está expandido */}
                  {isExpanded && (
                    <View style={{ marginTop: 16 }}>
                      <Divider style={{ marginBottom: 16 }} />
                      
                      {/* Alimentación */}
                      <View style={{ marginBottom: 16, backgroundColor: isDarkMode ? colors.bg_tertiary : '#F8FAFB', padding: 12, borderRadius: 8 }}>
                        <Text category="s1" style={{ marginBottom: 10, color: isDarkMode ? colors.text_primary : '#3D3D5C' }}>
                          Alimentación
                        </Text>
                        <View style={{ gap: 6 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text category="p2" style={{ color: isDarkMode ? colors.text_tertiary : '#6B7280' }}>Desayuno:</Text>
                            <Text category="p2" style={{ 
                              color: seguimiento.alimentacion?.desayuno === 'MUY_BIEN' ? '#764BA2' :
                                    seguimiento.alimentacion?.desayuno === 'BIEN' ? '#764BA2' :
                                    seguimiento.alimentacion?.desayuno === 'POCO' ? '#FFB020' : '#8F9BB3'
                            }}>
                              {seguimiento.alimentacion?.desayuno === 'MUY_BIEN' ? 'Muy bien' :
                              seguimiento.alimentacion?.desayuno === 'BIEN' ? 'Bien' :
                              seguimiento.alimentacion?.desayuno === 'POCO' ? 'Poco' : 'No comió'}
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text category="p2" style={{ color: isDarkMode ? colors.text_tertiary : '#6B7280' }}>Almuerzo:</Text>
                            <Text category="p2" style={{ 
                              color: seguimiento.alimentacion?.almuerzo === 'MUY_BIEN' ? '#764BA2' :
                                    seguimiento.alimentacion?.almuerzo === 'BIEN' ? '#764BA2' :
                                    seguimiento.alimentacion?.almuerzo === 'POCO' ? '#FFB020' : '#8F9BB3'
                            }}>
                              {seguimiento.alimentacion?.almuerzo === 'MUY_BIEN' ? 'Muy bien' :
                              seguimiento.alimentacion?.almuerzo === 'BIEN' ? 'Bien' :
                              seguimiento.alimentacion?.almuerzo === 'POCO' ? 'Poco' : 'No comió'}
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text category="p2" style={{ color: isDarkMode ? colors.text_tertiary : '#6B7280' }}>Merienda:</Text>
                            <Text category="p2" style={{ 
                              color: seguimiento.alimentacion?.merienda === 'MUY_BIEN' ? '#764BA2' :
                                    seguimiento.alimentacion?.merienda === 'BIEN' ? '#764BA2' :
                                    seguimiento.alimentacion?.merienda === 'POCO' ? '#FFB020' : '#8F9BB3'
                            }}>
                              {seguimiento.alimentacion?.merienda === 'MUY_BIEN' ? 'Muy bien' :
                              seguimiento.alimentacion?.merienda === 'BIEN' ? 'Bien' :
                              seguimiento.alimentacion?.merienda === 'POCO' ? 'Poco' : 'No comió'}
                            </Text>
                          </View>
                        </View>
                      </View>
                      
                      {/* Descanso */}
                      <View style={{ marginBottom: 16, backgroundColor: isDarkMode ? colors.bg_tertiary : '#F8FAFB', padding: 12, borderRadius: 8 }}>
                        <Text category="s1" style={{ marginBottom: 10, color: isDarkMode ? colors.text_primary : '#3D3D5C' }}>
                          Descanso
                        </Text>
                        <View style={{ gap: 6 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text category="p2" style={{ color: isDarkMode ? colors.text_tertiary : '#6B7280' }}>Llegó dormido:</Text>
                            <Text category="p2" style={{ color: seguimiento.descanso?.llegoDormido ? '#764BA2' : '#8F9BB3' }}>
                              {seguimiento.descanso?.llegoDormido ? 'Sí' : 'No'}
                            </Text>
                          </View>
                          {seguimiento.descanso?.llegoDormido && seguimiento.descanso?.horaDespertar && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 16, backgroundColor: isDarkMode ? colors.bg_secondary : '#FFF7ED', padding: 8, borderRadius: 6 }}>
                              <Text category="p2" style={{ color: isDarkMode ? colors.text_tertiary : '#92400E', fontStyle: 'italic' }}>Se despertó a las:</Text>
                              <Text category="p2" style={{ color: isDarkMode ? colors.text_primary : '#92400E', fontWeight: 'bold' }}>
                                {seguimiento.descanso.horaDespertar}
                              </Text>
                            </View>
                          )}
                          
                          {seguimiento.descanso?.llegoDormido && (
                            <View style={{ height: 1, backgroundColor: isDarkMode ? colors.border_subtle : '#E5E7EB', marginVertical: 4 }} />
                          )}
                          
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text category="p2" style={{ color: isDarkMode ? colors.text_tertiary : '#6B7280' }}>Durmió siesta:</Text>
                            <Text category="p2" style={{ color: seguimiento.descanso?.durmio ? '#764BA2' : '#8F9BB3' }}>
                              {seguimiento.descanso?.durmio ? 'Sí' : 'No'}
                            </Text>
                          </View>
                          {seguimiento.descanso?.durmio && (seguimiento.descanso?.horaDormir || seguimiento.descanso?.horaDespertar) && (
                            <View style={{ paddingLeft: 16, backgroundColor: isDarkMode ? colors.bg_secondary : '#F0E6F7', padding: 8, borderRadius: 6 }}>
                              {seguimiento.descanso?.horaDormir && (
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                  <Text category="p2" style={{ color: isDarkMode ? colors.text_tertiary : '#1E40AF', fontSize: 12 }}>Desde:</Text>
                                  <Text category="p2" style={{ color: isDarkMode ? colors.text_primary : '#1E40AF', fontWeight: 'bold' }}>
                                    {seguimiento.descanso.horaDormir}
                                  </Text>
                                </View>
                              )}
                              {seguimiento.descanso?.horaDespertar && (
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Text category="p2" style={{ color: isDarkMode ? colors.text_tertiary : '#1E40AF', fontSize: 12 }}>Hasta:</Text>
                                  <Text category="p2" style={{ color: isDarkMode ? colors.text_primary : '#1E40AF', fontWeight: 'bold' }}>
                                    {seguimiento.descanso.horaDespertar}
                                  </Text>
                                </View>
                              )}
                            </View>
                          )}
                        </View>
                      </View>
                      
                      {/* Cambios */}
                      <View style={{ marginBottom: seguimiento.notasDelDia ? 16 : 0, backgroundColor: isDarkMode ? colors.bg_tertiary : '#F8FAFB', padding: 12, borderRadius: 8 }}>
                        <Text category="s1" style={{ marginBottom: 10, color: isDarkMode ? colors.text_primary : '#3D3D5C' }}>
                          Cambios
                        </Text>
                        <View style={{ gap: 6 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text category="p2" style={{ color: isDarkMode ? colors.text_tertiary : '#6B7280' }}>Caca:</Text>
                            <Text category="p2" style={{ color: seguimiento.cambios?.caca ? '#764BA2' : '#8F9BB3' }}>
                              {seguimiento.cambios?.caca ? 'Sí' : 'No'}
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text category="p2" style={{ color: isDarkMode ? colors.text_tertiary : '#6B7280' }}>Pis:</Text>
                            <Text category="p2" style={{ color: seguimiento.cambios?.pis ? '#764BA2' : '#8F9BB3' }}>
                              {seguimiento.cambios?.pis ? 'Sí' : 'No'}
                            </Text>
                          </View>
                        </View>
                      </View>
                      
                      {/* Notas del día */}
                      {seguimiento.notasDelDia && (
                        <>
                          <Divider style={{ marginVertical: 12 }} />
                          <View style={{ backgroundColor: '#FEF3C7', padding: 12, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#FFB020' }}>
                            <Text category="s2" style={{ marginBottom: 6, color: '#92400E' }}>
                              Notas del día
                            </Text>
                            <Text category="p2" style={{ color: '#78350F', lineHeight: 20 }}>
                              {seguimiento.notasDelDia}
                            </Text>
                          </View>
                        </>
                      )}
                    </View>
                  )}
                </Card>
              );
            })
        )}
        
        {/* Filtro de fechas (Desplegable) */}
        <Card 
          style={{ marginTop: 8, marginBottom: 16, borderRadius: 12, backgroundColor: isDarkMode ? colors.bg_secondary : '#FFFFFF', borderWidth: 1, borderColor: isDarkMode ? colors.border_subtle : '#E6EBF0' }}
          onPress={() => setShowFilterPanel(!showFilterPanel)}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="funnel-outline" style={{ width: 20, height: 20 }} fill="#764BA2" />
              <Text category="s1" style={{ color: isDarkMode ? colors.text_primary : '#3D3D5C' }}>
                Filtrar fechas
              </Text>
            </View>
            <Icon 
              name={showFilterPanel ? 'chevron-up-outline' : 'chevron-down-outline'} 
              style={{ width: 24, height: 24 }} 
              fill={isDarkMode ? colors.text_tertiary : '#8F9BB3'}
            />
          </View>
          
          {showFilterPanel && (
            <View style={{ marginTop: 16, gap: 12 }}>
              {/* Botones rápidos */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <Button
                  size="tiny"
                  appearance="outline"
                  onPress={() => {
                    setFechaDesde(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000));
                    setFechaHasta(new Date());
                    refetch();
                  }}
                >
                  Últimos 3 días
                </Button>
                <Button
                  size="tiny"
                  appearance="outline"
                  onPress={() => {
                    setFechaDesde(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
                    setFechaHasta(new Date());
                    refetch();
                  }}
                >
                  Última semana
                </Button>
                <Button
                  size="tiny"
                  appearance="outline"
                  onPress={() => {
                    setFechaDesde(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
                    setFechaHasta(new Date());
                    refetch();
                  }}
                >
                  Último mes
                </Button>
              </View>

              <Divider style={{ backgroundColor: isDarkMode ? colors.border_subtle : undefined }} />

              {/* Fechas personalizadas */}
              <Text category="c1" appearance="hint" style={{ marginTop: 4, color: isDarkMode ? colors.text_tertiary : undefined }}>
                Rango personalizado:
              </Text>
              
              {showDatePicker && (
                <View style={{ marginBottom: 12 }}>
                  <Text category="c1" style={{ marginBottom: 8, color: '#764BA2', fontWeight: 'bold' }}>
                    {datePickerMode === 'desde' ? 'Selecciona fecha desde:' : 'Selecciona fecha hasta:'}
                  </Text>
                  <Datepicker
                    date={datePickerMode === 'desde' ? fechaDesde : fechaHasta}
                    onSelect={(date) => {
                      if (datePickerMode === 'desde') {
                        setFechaDesde(date);
                      } else {
                        setFechaHasta(date);
                      }
                      setShowDatePicker(false);
                    }}
                  />
                </View>
              )}
              
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button
                  size="small"
                  appearance={showDatePicker && datePickerMode === 'desde' ? 'filled' : 'outline'}
                  style={{ flex: 1 }}
                  accessoryLeft={(props) => <Icon {...props} name="calendar-outline" />}
                  onPress={() => {
                    setDatePickerMode('desde');
                    setShowDatePicker(true);
                  }}
                >
                  {fechaDesde.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                </Button>
                <Button
                  size="small"
                  appearance={showDatePicker && datePickerMode === 'hasta' ? 'filled' : 'outline'}
                  style={{ flex: 1 }}
                  accessoryLeft={(props) => <Icon {...props} name="calendar-outline" />}
                  onPress={() => {
                    setDatePickerMode('hasta');
                    setShowDatePicker(true);
                  }}
                >
                  {fechaHasta.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                </Button>
              </View>
              <Button
                size="small"
                onPress={() => {
                  refetch();
                  setShowFilterPanel(false);
                }}
                accessoryLeft={(props) => <Icon {...props} name="checkmark-outline" />}
              >
                Aplicar filtro
              </Button>
            </View>
          )}
        </Card>
      </ScrollView>
    </Layout>
  );
}

// ⚙️ CONFIGURACIONES
function ConfiguracionesTab({ onLogout, isDarkMode = false }: { onLogout: () => void; isDarkMode?: boolean }) {
  const [editingTutor, setEditingTutor] = useState(false);
  const [editingAlumnoId, setEditingAlumnoId] = useState<string | null>(null);
  
  // Obtener colores según modo oscuro
  const colors = getColors(isDarkMode);
  
  const [tutorNombre, setTutorNombre] = useState('');
  const [tutorApellido, setTutorApellido] = useState('');
  const [tutorTelefono, setTutorTelefono] = useState('');
  const [tutorEmail, setTutorEmail] = useState('');
  
  const [alumnoCondiciones, setAlumnoCondiciones] = useState<string[]>([]);
  const [alumnoObservaciones, setAlumnoObservaciones] = useState('');
  const [alumnoFechaNacimiento, setAlumnoFechaNacimiento] = useState<Date>(new Date());
  const [nuevaCondicion, setNuevaCondicion] = useState('');
  
  const { data: tutorInfoData, loading: tutorLoading, error: tutorError, refetch: refetchTutor } = useQuery(GET_TUTOR_INFO);
  const { data: alumnosData, refetch: refetchAlumnos } = useQuery(GET_ALUMNOS_TUTOR);
  const [updateTutor] = useMutation(UPDATE_TUTOR_PROFILE);
  const [updateAlumno] = useMutation(UPDATE_ALUMNO_CONDICIONES);
  
  const tutorData = tutorInfoData?.tutorInfo;
  const alumnos = alumnosData?.alumnosTutor || [];
  
  useEffect(() => {
    console.log('📊 ConfiguracionesTab - tutorInfoData:', tutorInfoData);
    console.log('📊 ConfiguracionesTab - tutorData:', tutorData);
    console.log('📊 ConfiguracionesTab - loading:', tutorLoading);
    console.log('📊 ConfiguracionesTab - error:', tutorError);
  }, [tutorInfoData, tutorData, tutorLoading, tutorError]);
  
  useEffect(() => {
    if (tutorData) {
      console.log('✅ Cargando datos del tutor:', tutorData);
      setTutorNombre(tutorData.nombre || '');
      setTutorApellido(tutorData.apellido || '');
      setTutorTelefono(tutorData.telefono || '');
      setTutorEmail(tutorData.email || '');
    }
  }, [tutorData]);
  
  const handleSaveTutor = async () => {
    if (!tutorData) return;
    
    try {
      await updateTutor({
        variables: {
          id: tutorData.id,
          input: {
            nombre: tutorNombre,
            apellido: tutorApellido,
            telefono: tutorTelefono,
            email: tutorEmail
          }
        }
      });
      
      // Actualizar AsyncStorage también
      const updatedData = { ...tutorData, nombre: tutorNombre, apellido: tutorApellido, telefono: tutorTelefono, email: tutorEmail };
      await AsyncStorage.setItem('tutorData', JSON.stringify(updatedData));
      
      setEditingTutor(false);
      refetchTutor();
      alert('Datos actualizados correctamente');
    } catch (error: any) {
      alert('Error al actualizar: ' + error.message);
    }
  };
  
  const handleEditAlumno = (alumno: any) => {
    setEditingAlumnoId(alumno.id);
    setAlumnoCondiciones(alumno.condicionesEspeciales || []);
    setAlumnoObservaciones(alumno.observacionesCondiciones || '');
    
    // Convertir fecha de forma segura
    const fechaNac = alumno.fechaNacimiento ? new Date(alumno.fechaNacimiento) : new Date();
    setAlumnoFechaNacimiento(fechaNac);
  };
  
  const handleSaveAlumno = async () => {
    try {
      await updateAlumno({
        variables: {
          id: editingAlumnoId,
          input: {
            condicionesEspeciales: alumnoCondiciones,
            observacionesCondiciones: alumnoObservaciones,
            fechaNacimiento: alumnoFechaNacimiento.toISOString()
          }
        }
      });
      
      setEditingAlumnoId(null);
      refetchAlumnos();
      alert('Datos actualizados correctamente');
    } catch (error: any) {
      alert('Error al actualizar: ' + error.message);
    }
  };
  
  const handleAddCondicion = () => {
    if (nuevaCondicion.trim()) {
      setAlumnoCondiciones([...alumnoCondiciones, nuevaCondicion.trim()]);
      setNuevaCondicion('');
    }
  };
  
  const handleRemoveCondicion = (index: number) => {
    setAlumnoCondiciones(alumnoCondiciones.filter((_, i) => i !== index));
  };
  
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFB' }}>
      <Layout style={{ padding: 20 }}>
        
        {/* Indicador de carga */}
        {tutorLoading && (
          <View style={{ alignItems: 'center', padding: 20 }}>
            <Spinner size="large" status="primary" style={{ borderColor: '#764BA2' }} />
            <Text category="s1" style={{ marginTop: 10, color: '#764BA2' }}>Cargando datos...</Text>
          </View>
        )}
        
        {/* Mensaje de error */}
        {tutorError && (
          <Card status="danger" style={{ marginBottom: 20 }}>
            <Text>Error al cargar datos del tutor: {tutorError.message}</Text>
          </Card>
        )}
        
        {/* Sección: Datos del Tutor */}
        <Card style={{ marginBottom: 20, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6EBF0' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text category="h6" style={{ color: '#3D3D5C' }}>Mis Datos</Text>
            {!editingTutor && (
              <Button
                size="small"
                appearance="ghost"
                accessoryLeft={(props) => <Icon {...props} name="edit-outline" />}
                onPress={() => setEditingTutor(true)}
              >
                Editar
              </Button>
            )}
          </View>
          
          {editingTutor ? (
            <>
              <Input
                label="Nombre"
                value={tutorNombre}
                onChangeText={setTutorNombre}
                style={{ marginBottom: 12 }}
              />
              <Input
                label="Apellido"
                value={tutorApellido}
                onChangeText={setTutorApellido}
                style={{ marginBottom: 12 }}
              />
              <Input
                label="Teléfono"
                value={tutorTelefono}
                onChangeText={setTutorTelefono}
                keyboardType="phone-pad"
                style={{ marginBottom: 12 }}
              />
              <Input
                label="Email"
                value={tutorEmail}
                onChangeText={setTutorEmail}
                keyboardType="email-address"
                style={{ marginBottom: 16 }}
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button
                  appearance="outline"
                  style={{ flex: 1 }}
                  onPress={() => {
                    setEditingTutor(false);
                    // Restaurar valores originales
                    if (tutorData) {
                      setTutorNombre(tutorData.nombre || '');
                      setTutorApellido(tutorData.apellido || '');
                      setTutorTelefono(tutorData.telefono || '');
                      setTutorEmail(tutorData.email || '');
                    }
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  style={{ flex: 1 }}
                  onPress={handleSaveTutor}
                >
                  Guardar
                </Button>
              </View>
            </>
          ) : (
            <>
              <View style={{ marginBottom: 8 }}>
                <Text category="c1" appearance="hint">Documento</Text>
                <Text category="s1">{tutorData?.documento}</Text>
              </View>
              <View style={{ marginBottom: 8 }}>
                <Text category="c1" appearance="hint">Nombre</Text>
                <Text category="s1">{tutorApellido} {tutorNombre}</Text>
              </View>
              <View style={{ marginBottom: 8 }}>
                <Text category="c1" appearance="hint">Teléfono</Text>
                <Text category="s1">{tutorTelefono || 'No especificado'}</Text>
              </View>
              <View>
                <Text category="c1" appearance="hint">Email</Text>
                <Text category="s1">{tutorEmail || 'No especificado'}</Text>
              </View>
            </>
          )}
        </Card>
        
        {/* Sección: Alumnos */}
        <Text category="h6" style={{ marginBottom: 12, color: '#3D3D5C' }}>Mis Hijos</Text>
        {alumnos.map((alumno: any) => (
          <Card key={alumno.id} style={{ marginBottom: 16, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6EBF0' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text category="s1" style={{ color: '#3D3D5C' }}>
                {alumno.apellido} {alumno.nombre}
              </Text>
              {editingAlumnoId !== alumno.id && (
                <Button
                  size="tiny"
                  appearance="ghost"
                  accessoryLeft={(props) => <Icon {...props} name="edit-outline" />}
                  onPress={() => handleEditAlumno(alumno)}
                >
                  Editar
                </Button>
              )}
            </View>
            
            {editingAlumnoId === alumno.id ? (
              <>
                <Datepicker
                  label="Fecha de Nacimiento"
                  date={alumnoFechaNacimiento}
                  onSelect={setAlumnoFechaNacimiento}
                  style={{ marginBottom: 16 }}
                />
                
                <Text category="label" style={{ marginBottom: 8 }}>Condiciones Especiales</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                  <Input
                    placeholder="Nueva condición (ej: diabetes, alergia al maní)"
                    value={nuevaCondicion}
                    onChangeText={setNuevaCondicion}
                    style={{ flex: 1 }}
                  />
                  <Button
                    size="small"
                    accessoryLeft={(props) => <Icon {...props} name="plus-outline" />}
                    onPress={handleAddCondicion}
                  />
                </View>
                
                <View style={{ gap: 6, marginBottom: 12 }}>
                  {alumnoCondiciones.map((condicion, index) => (
                    <View key={index} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', padding: 8, borderRadius: 6 }}>
                      <Text style={{ flex: 1, color: '#92400E' }}>{condicion}</Text>
                      <TouchableOpacity onPress={() => handleRemoveCondicion(index)}>
                        <Icon name="close-outline" fill="#92400E" style={{ width: 20, height: 20 }} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                
                <Input
                  label="Observaciones"
                  value={alumnoObservaciones}
                  onChangeText={setAlumnoObservaciones}
                  multiline
                  numberOfLines={3}
                  textStyle={{ minHeight: 64 }}
                  style={{ marginBottom: 16 }}
                />
                
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button
                    appearance="outline"
                    style={{ flex: 1 }}
                    onPress={() => setEditingAlumnoId(null)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    style={{ flex: 1 }}
                    onPress={handleSaveAlumno}
                  >
                    Guardar
                  </Button>
                </View>
              </>
            ) : (
              <>
                <View style={{ marginBottom: 12 }}>
                  <Text category="c1" appearance="hint" style={{ marginBottom: 4 }}>Fecha de Nacimiento:</Text>
                  <Text category="s2" style={{ color: '#3D3D5C' }}>
                    {alumno.fechaNacimiento ? new Date(alumno.fechaNacimiento).toLocaleDateString('es-AR', { 
                      day: '2-digit', 
                      month: 'long', 
                      year: 'numeric' 
                    }) : 'No especificada'}
                  </Text>
                </View>
                
                <Divider style={{ marginBottom: 12 }} />
                
                <Text category="c1" appearance="hint" style={{ marginBottom: 4 }}>Condiciones Especiales:</Text>
                {alumno.condicionesEspeciales && alumno.condicionesEspeciales.length > 0 ? (
                  <View style={{ gap: 4, marginBottom: 8 }}>
                    {alumno.condicionesEspeciales.map((condicion: string, index: number) => (
                      <View key={index} style={{ backgroundColor: '#FEF3C7', padding: 6, borderRadius: 4 }}>
                        <Text style={{ color: '#92400E', fontSize: 12 }}>• {condicion}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text category="p2" appearance="hint" style={{ marginBottom: 8 }}>Sin condiciones especiales</Text>
                )}
                
                {alumno.observacionesCondiciones && (
                  <>
                    <Text category="c1" appearance="hint" style={{ marginBottom: 4 }}>Observaciones:</Text>
                    <Text category="p2">{alumno.observacionesCondiciones}</Text>
                  </>
                )}
              </>
            )}
          </Card>
        ))}
        
        {/* Botón Cerrar Sesión */}
        <Button
          appearance="outline"
          status="danger"
          accessoryLeft={(props) => <Icon {...props} name="log-out-outline" />}
          onPress={onLogout}
          style={{ marginTop: 20, marginBottom: 100 }}
        >
          Cerrar Sesión
        </Button>
        
      </Layout>
    </ScrollView>
  );
}

// Helper para formatear fecha legible: "Martes, 24 de Octubre 2025"
const formatearFechaLegible = (fechaString: string) => {
  const fecha = new Date(fechaString);
  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  
  const diaSemana = diasSemana[fecha.getDay()];
  const dia = fecha.getDate();
  const mes = meses[fecha.getMonth()];
  const año = fecha.getFullYear();
  
  return `${diaSemana}, ${dia} de ${mes} ${año}`;
};

// 📸 CARRUSEL DE POSTEOS GENERALES
function CarruselPosteos({ mensajesGenerales }: { mensajesGenerales: any[] }) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [carouselWidth, setCarouselWidth] = useState(0);
  
  console.log('🎠 CarruselPosteos render:', { 
    mensajesCount: mensajesGenerales?.length || 0,
    mensajes: mensajesGenerales 
  });
  
  // Logs detallados de imágenes
  useEffect(() => {
    if (mensajesGenerales && mensajesGenerales.length > 0) {
      console.log('🎠 CarruselPosteos - Análisis de imágenes:');
      mensajesGenerales.forEach((post, index) => {
        const imagen = post.contenido?.imagen;
        const tieneImagen = !!imagen;
        console.log(`   Post ${index} (ID: ${post.id}):`, {
          tieneImagen,
          tamaño: tieneImagen ? `${(imagen.length / 1024).toFixed(2)} KB` : 'N/A',
          primeros80Chars: tieneImagen ? imagen.substring(0, 80) : 'Sin imagen'
        });
      });
    }
  }, [mensajesGenerales]);
  
  if (!mensajesGenerales || mensajesGenerales.length === 0) {
    return (
      <View style={{ paddingVertical: 16, paddingHorizontal: 12, backgroundColor: '#F0F4F8', borderRadius: 12, borderWidth: 1, borderColor: '#E6EBF0' }}>
        <Text appearance="hint" style={{ textAlign: 'center', color: '#A0AEC0' }}>
          Sin posteos generales disponibles
        </Text>
      </View>
    );
  }

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / carouselWidth);
    setCurrentIndex(Math.min(index, mensajesGenerales.length - 1));
  };

  return (
    <View style={{ marginBottom: 20 }}>
      {/* Carrusel */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onLayout={(e) => setCarouselWidth(e.nativeEvent.layout.width)}
      >
        {mensajesGenerales.map((post) => (
          <View
            key={post.id}
            style={{
              width: carouselWidth || 380,
              marginHorizontal: carouselWidth ? 0 : 8,
              paddingHorizontal: 16,
            }}
          >
            <Card
              style={{
                borderRadius: 16,
                overflow: 'hidden',
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#E6EBF0',
              }}
            >
              {/* Imagen */}
              {post.imagen || post.contenido?.imagen ? (
                <Image
                  source={{ uri: post.imagen || post.contenido?.imagen }}
                  style={{
                    width: '100%',
                    height: 200,
                    backgroundColor: '#E6EBF0',
                  }}
                  onError={(error) => {
                    console.warn('🖼️❌ Error loading image for post:', post.id);
                    console.warn('   Error:', error.nativeEvent.error);
                    console.warn('   URI:', (post.imagen || post.contenido?.imagen)?.substring(0, 100));
                  }}
                  onLoad={() => {
                    console.log('🖼️✅ Image loaded successfully for post:', post.id);
                    console.log('   Size: ' + ((post.imagen || post.contenido?.imagen)?.length || 0) / 1024 + ' KB');
                  }}
                />
              ) : (
                <View
                  style={{
                    height: 200,
                    backgroundColor: '#764BA2',
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'relative',
                  }}
                >
                  {/* Degradado de fondo */}
                  <LinearGradient
                    colors={['rgba(0, 191, 165, 0.3)', 'rgba(0, 191, 165, 0.8)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                    }}
                  />

                  {/* Icono decorativo */}
                  <Icon
                    name="bell-outline"
                    fill="#FFFFFF"
                    style={{
                      width: 60,
                      height: 60,
                      opacity: 0.6,
                    }}
                  />
                </View>
              )}

              {/* Contenido */}
              <View style={{ padding: 16 }}>
                {/* Título */}
                <Text
                  category="h6"
                  style={{
                    color: '#3D3D5C',
                    marginBottom: 8,
                    fontWeight: '700',
                  }}
                  numberOfLines={2}
                >
                  {post.contenido.titulo || 'Anuncio del Colegio'}
                </Text>

                {/* Epígrafe/Descripción */}
                <Text
                  appearance="hint"
                  category="p2"
                  style={{
                    color: '#718096',
                    marginBottom: 12,
                    lineHeight: 20,
                  }}
                  numberOfLines={3}
                >
                  {post.contenido.contenido || 'Sin descripción'}
                </Text>

                {/* Meta información */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 8,
                    borderTopWidth: 1,
                    borderTopColor: '#E6EBF0',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Icon
                      name="person-outline"
                      fill="#CBD5E0"
                      style={{ width: 14, height: 14 }}
                    />
                    <Text
                      appearance="hint"
                      category="c2"
                      style={{ color: '#A0AEC0' }}
                    >
                      {post.contenido.autorNombre || 'Colegio'}
                    </Text>
                  </View>

                  <Text appearance="hint" category="c2" style={{ color: '#A0AEC0' }}>
                    {new Date(post.contenido.publicadoEn || post.contenido.creadoEn).toLocaleDateString(
                      'es-AR',
                      { day: 'numeric', month: 'short' }
                    )}
                  </Text>
                </View>
              </View>
            </Card>
          </View>
        ))}
      </ScrollView>

      {/* Indicadores de página */}
      {mensajesGenerales.length > 1 && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
            marginTop: 12,
          }}
        >
          {mensajesGenerales.map((_, index) => (
            <View
              key={index}
              style={{
                width: index === currentIndex ? 28 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: index === currentIndex ? '#764BA2' : '#CBD5E0',
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// 🔄 FUNCIÓN AUXILIAR: Mapear cualquier tipo de post al formato PostCard
function mapPostToPostCardProps(post: any): any {
  const tipo = post.tipo || 'MENSAJE';
  
  const baseProps = {
    tipo,
    fecha: post.fecha || post.publicadoEn || post.creadoEn,
  };

  switch (tipo) {
    case 'MENSAJE':
      return {
        ...baseProps,
        titulo: post.titulo,
        contenido: post.contenido,
        autorNombre: post.autorNombre,
        imagenes: post.imagenes,
        imagen: post.imagen,
        alumnoNombre: post.alumnoNombre,
        alumnoApellido: post.alumnoApellido,
      };

    case 'ASISTENCIA':
      const presente = post.estado === 'PRESENTE' || post.estado === 'TARDE';
      return {
        ...baseProps,
        titulo: `Asistencia: ${post.estado}`,
        contenido: `Estado: ${post.estado}${post.observaciones ? ` - ${post.observaciones}` : ''}`,
        autorNombre: 'Sistema',
        alumnoNombre: post.alumnoNombre,
        alumnoApellido: post.alumnoApellido,
      };

    case 'EVALUACION':
      const nota = post.nota || 'Sin calificar';
      return {
        ...baseProps,
        titulo: `Evaluación: ${post.materia || 'Sin materia'}`,
        contenido: `Nota: ${nota}${post.descripcion ? ` - ${post.descripcion}` : ''}`,
        autorNombre: 'Sistema',
        alumnoNombre: post.alumnoNombre,
        alumnoApellido: post.alumnoApellido,
      };

    case 'SEGUIMIENTO':
      return {
        ...baseProps,
        titulo: 'Seguimiento del día',
        contenido: post.contenido || 'Sin notas',
        autorNombre: 'Sistema',
        alumnoNombre: post.alumnoNombre,
        alumnoApellido: post.alumnoApellido,
      };

    default:
      return {
        ...baseProps,
        titulo: 'Post',
        contenido: post.contenido || 'Sin contenido',
        autorNombre: 'Sistema',
      };
  }
}

// 🏠 DASHBOARD TAB - Feed tipo Instagram/Facebook
function DashboardTab({ 
  alumnos, 
  selectedAlumnoId, 
  setSelectedAlumnoId,
  setActiveTab,
  isDarkMode = false
}: { 
  alumnos: any[]; 
  selectedAlumnoId: string | null;
  setSelectedAlumnoId: (id: string | null) => void;
  setActiveTab: (tab: string) => void;
  isDarkMode?: boolean;
}) {
  const [refreshing, setRefreshing] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});
  const [filtroTipo, setFiltroTipo] = useState<string[]>(['MENSAJE', 'ASISTENCIA', 'EVALUACION', 'SEGUIMIENTO']);
  const [mostrarModalFiltros, setMostrarModalFiltros] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null); // null = hoy
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Obtener colores según modo oscuro
  const colors = getColors(isDarkMode);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  
  const { data: mensajesData, loading: mensajesLoading, refetch: refetchMensajes } = useQuery(GET_MENSAJES_TUTOR);
  const mensajes = mensajesData?.mensajesTutor || [];
  const [marcarLeido] = useMutation(MARCAR_MENSAJE_LEIDO);
  
  // Handler para navegación desde notificaciones
  const handleNavigateToSection = (section: 'Mensajes' | 'Calificaciones' | 'Asistencia' | 'Seguimientos' | 'Evaluaciones' | 'Asistencias', alumnoId?: string | null) => {
    console.log('🔔 [Notificación] Navegando a:', section, 'con alumnoId:', alumnoId);
    const tabMap: Record<string, string> = {
      'Mensajes': 'mensajes',
      'Calificaciones': 'evaluaciones',
      'Asistencia': 'asistencias',
      'Asistencias': 'asistencias',
      'Seguimientos': 'seguimiento',
      'Evaluaciones': 'evaluaciones'
    };
    if (alumnoId) {
      setSelectedAlumnoId(alumnoId);
    }
    setActiveTab(tabMap[section] || section);
  };
  
  // Debugging: Loguear errores de query
  useEffect(() => {
    console.log('📧 [Dashboard] GET_MENSAJES_TUTOR:', {
      hasData: !!mensajesData,
      mensajeCount: mensajes.length,
      firstMensaje: mensajes[0]
    });
  }, [mensajesData, mensajes.length]);
  
  // Helper para formatear fechas sin problemas de UTC
  const formatearFechaLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Obtener fecha base (seleccionada o últimos 3 días hábiles)
  const getFechaBaseInicio = () => {
    if (selectedDate) {
      // Si hay fecha seleccionada, mostrar solo ese día
      return selectedDate;
    }
    
    // Si no hay fecha seleccionada, calcular inicio de últimos 3 días hábiles
    const hoy = new Date();
    let diasAtras = 0;
    let diasHabilesContados = 0;
    
    // Retroceder hasta tener 3 días hábiles (incluyendo hoy si es hábil)
    while (diasHabilesContados < 3 && diasAtras < 10) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - diasAtras);
      const diaSemana = fecha.getDay();
      
      // Si es día hábil (lunes a viernes)
      if (diaSemana !== 0 && diaSemana !== 6) {
        diasHabilesContados++;
        if (diasHabilesContados === 3) {
          return fecha; // Este es el día más antiguo de los 3
        }
      }
      diasAtras++;
    }
    
    // Fallback: 3 días corridos
    const fallback = new Date(hoy);
    fallback.setDate(fallback.getDate() - 2);
    return fallback;
  };
  
  const fechaBaseInicio = getFechaBaseInicio();
  const fechaBaseFin = selectedDate || new Date(); // Hoy o fecha seleccionada
  
  // Asistencias del rango (últimos 3 días hábiles o fecha seleccionada + 7 días atrás)
  const hoy = formatearFechaLocal(fechaBaseFin);
  const fechaDesde = selectedDate 
    ? formatearFechaLocal(new Date(selectedDate.getTime() - 7 * 24 * 60 * 60 * 1000))
    : formatearFechaLocal(fechaBaseInicio);
  
  console.log('🗓️ FECHAS ASISTENCIAS:', {
    fechaBaseFin: fechaBaseFin.toISOString(),
    hoy,
    fechaDesde,
    selectedDate: selectedDate?.toISOString() || 'null'
  });
    
  const { data: asistenciasData, loading: loadingAsistencias } = useQuery(GET_ASISTENCIAS, {
    variables: { desde: fechaDesde, hasta: hoy },
    skip: !fechaDesde || !hoy  // No ejecutar si las fechas no están listas
  });
  
  // Calificaciones recientes (últimos 30 días desde la fecha seleccionada para ver más datos)
  const fechaLimite = new Date(fechaBaseFin.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Query de calificaciones - NULL para obtener todos los alumnos del tutor
  const { data: calificacionesData, loading: loadingCalificaciones } = useQuery(GET_CALIFICACIONES, {
    skip: false  // Siempre ejecutar
  });
  
  // Seguimiento - Por ahora solo obtenemos los seguimientos consultando individualmente en el frontend
  // Esto requeriría hacer múltiples queries o modificar el backend para aceptar múltiples alumnos
  const alumnosMaternalIds = alumnos.filter((a: any) => a.nivel === 'MATERNAL').map((a: any) => a.id);
  const primerMaternalId = alumnosMaternalIds.length > 0 ? alumnosMaternalIds[0] : null;
  
  // Por ahora solo consultamos el primero - TODO: mejorar para consultar todos
  const { data: seguimientosDataRaw, loading: loadingSeguimientos } = useQuery(GET_SEGUIMIENTO_DIARIO, {
    variables: {
      alumnoId: primerMaternalId,
      limit: 7
    },
    skip: !primerMaternalId
  });
  
  // Adaptar formato de seguimientos
  const seguimientosData = React.useMemo(() => {
    return {
      seguimientosDiariosPorAlumnoTutor: seguimientosDataRaw?.seguimientosDiariosPorAlumnoTutor || []
    };
  }, [seguimientosDataRaw]);
  
  // Crear feed unificado de "posts"
  const feedPosts = React.useMemo(() => {
    const posts: any[] = [];
    
    console.log('=== DASHBOARD DEBUG ===');
    console.log('Fecha base inicio:', fechaBaseInicio.toISOString().split('T')[0]);
    console.log('Fecha base fin:', fechaBaseFin.toISOString().split('T')[0]);
    console.log('Fecha seleccionada:', selectedDate?.toISOString().split('T')[0] || 'ninguna (últimos 3 días)');
    console.log('Alumnos disponibles:', alumnos.length, alumnos.map((a: any) => `${a.nombre}(${a.id})`).join(', '));
    console.log('Mensajes:', mensajes.length);
    
    // Debug asistencias
    console.log('🏫 ASISTENCIAS DATA:', {
      hasData: !!asistenciasData,
      loading: loadingAsistencias,
      asistenciasTutorLength: asistenciasData?.asistenciasTutor?.length || 0,
      firstAsistencia: asistenciasData?.asistenciasTutor?.[0],
      totalRegistros: asistenciasData?.asistenciasTutor?.reduce((sum: number, a: any) => sum + (a.registros?.length || 0), 0) || 0,
      fullData: asistenciasData
    });
    
    console.log('Fecha límite evaluaciones:', fechaLimite.toISOString().split('T')[0]);
    console.log('Rango asistencias/seguimiento:', fechaDesde, 'a', hoy);
    
    // Debug calificaciones
    console.log('📊 CALIFICACIONES DATA:', {
      hasData: !!calificacionesData,
      loading: loadingCalificaciones,
      materias: calificacionesData?.calificacionesTutor?.length || 0,
      firstMateria: calificacionesData?.calificacionesTutor?.[0],
      fullData: calificacionesData
    });
    
    console.log('Seguimientos data:', { 
      hasData: !!seguimientosData,
      registros: seguimientosData?.seguimientosDiariosPorAlumnoTutor?.length || 0
    });
    
    // 1. Mensajes recientes (del rango: últimos 3 días hábiles o fecha seleccionada + 7 días)
    const fechaLimiteMensajes = selectedDate 
      ? new Date(selectedDate.getTime() - 7 * 24 * 60 * 60 * 1000)
      : fechaBaseInicio;
    const mensajesRecientes = mensajes.filter((m: any) => {
      const fechaMensaje = new Date(m.publicadoEn || m.creadoEn);
      // Filtrar mensajes entre fechaLimiteMensajes y fechaBaseFin
      return fechaMensaje >= fechaLimiteMensajes && fechaMensaje <= fechaBaseFin;
    });
    
    console.log('📧 Mensajes Recientes:', mensajesRecientes.map(m => ({
      id: m.id,
      titulo: m.titulo,
      alcance: m.alcance,
      tipo: m.tipo,
      destinatarioIds: m.destinatarioIds,
      tieneDestinatarios: m.destinatarioIds && m.destinatarioIds.length > 0
    })));
    
    mensajesRecientes.forEach((mensaje: any) => {
      // Si el mensaje tiene destinatarioIds (para alumnos específicos o divisiones/grados)
      if (mensaje.destinatarioIds && mensaje.destinatarioIds.length > 0) {
        // Para mensajes de alumno individual: crear un post por cada alumno
        if (mensaje.alcance === 'ALUMNO') {
          mensaje.destinatarioIds.forEach((destinatarioId: string) => {
            const alumno = alumnos.find((a: any) => a.id === destinatarioId);
            if (alumno) {
              posts.push({
                id: `mensaje-${mensaje.id}-${alumno.id}`,
                tipo: 'MENSAJE',
                fecha: mensaje.publicadoEn || mensaje.creadoEn,
                contenido: mensaje,
                alumno: alumno,
                prioridad: mensaje.leido ? 2 : 3
              });
            }
          });
        } else {
          // Para mensajes de grado/división: crear un único post (sin alumno específico)
          console.log(`✅ Mensaje de ${mensaje.alcance} detectado:`, mensaje.titulo);
          posts.push({
            id: `mensaje-${mensaje.id}`,
            tipo: 'MENSAJE',
            fecha: mensaje.publicadoEn || mensaje.creadoEn,
            contenido: mensaje,
            alumno: null,
            prioridad: mensaje.leido ? 2 : 3
          });
        }
      } else {
        // Mensaje general (COLEGIO - sin destinatarios específicos)
        console.log('✅ Mensaje general detectado:', mensaje.titulo);
        posts.push({
          id: `mensaje-${mensaje.id}`,
          tipo: 'MENSAJE',
          fecha: mensaje.publicadoEn || mensaje.creadoEn,
          contenido: mensaje,
          alumno: null,
          prioridad: mensaje.leido ? 2 : 3
        });
      }
    });
    
    console.log('Mensajes recientes agregados:', mensajesRecientes.length);
    
    // 2. Asistencia de hoy
    if (asistenciasData?.asistenciasTutor) {
      console.log('🔍 Procesando asistencias, total días:', asistenciasData.asistenciasTutor.length);
      asistenciasData.asistenciasTutor.forEach((asistencia: any, idxAsis: number) => {
        console.log(`  Día ${idxAsis}:`, {fecha: asistencia.fecha, registros: asistencia.registros?.length || 0});
        asistencia.registros.forEach((registro: any, idxReg: number) => {
          const alumno = alumnos.find((a: any) => a.id === registro.alumnoId);
          console.log(`    Registro ${idxReg}:`, {alumnoId: registro.alumnoId, encontrado: !!alumno, estado: registro.estado});
          if (alumno) {
            posts.push({
              id: `asistencia-${asistencia.id}-${registro.alumnoId}`,
              tipo: 'ASISTENCIA',
              fecha: asistencia.fecha,
              contenido: { ...registro, fecha: asistencia.fecha },
              alumno,
              prioridad: 2
            });
          }
        });
      });
      console.log('✅ Asistencias agregadas al feed:', posts.filter((p: any) => p.tipo === 'ASISTENCIA').length);
    } else {
      console.log('❌ NO HAY ASISTENCIAS DATA - asistenciasData:', asistenciasData);
    }
    
    // 3. Evaluaciones recientes - solo para todos los alumnos con data disponible
    if (calificacionesData?.calificacionesTutor) {
      console.log('🔍 Procesando evaluaciones, total materias:', calificacionesData.calificacionesTutor.length);
      alumnos.forEach((alumno) => {
        calificacionesData.calificacionesTutor.forEach((materia: any) => {
          materia.evaluaciones?.forEach((evaluacion: any) => {
            const fechaEval = new Date(evaluacion.fecha);
            if (fechaEval >= fechaLimite) {
              // Buscar la nota específica de este alumno
              const notaAlumno = evaluacion.notas?.find((n: any) => n.alumnoId === alumno.id);
              if (notaAlumno) {
                console.log(`  ✓ Eval agregada: ${materia.nombre} - ${alumno.nombre}`);
                posts.push({
                  id: `evaluacion-${evaluacion._id}-${alumno.id}`,
                  tipo: 'EVALUACION',
                  fecha: evaluacion.fecha,
                  contenido: { 
                    ...evaluacion, 
                    materiaNombre: materia.nombre,
                    notaAlumno // Agregar la nota del alumno específico
                  },
                  alumno,
                  prioridad: 2
                });
              }
            }
          });
        });
      });
      console.log('✅ Evaluaciones agregadas al feed:', posts.filter((p: any) => p.tipo === 'EVALUACION').length);
    } else {
      console.log('❌ NO HAY CALIFICACIONES DATA - calificacionesData:', calificacionesData);
    }
    
    // 4. Seguimiento diario (si aplica)
    if (seguimientosData?.seguimientosDiariosPorAlumnoTutor && seguimientosData.seguimientosDiariosPorAlumnoTutor.length > 0) {
      seguimientosData.seguimientosDiariosPorAlumnoTutor.forEach((seg: any) => {
        const alumno = alumnos.find((a: any) => a.id === seg.alumnoId);
        if (alumno) {
          posts.push({
            id: `seguimiento-${seg.id}`,
            tipo: 'SEGUIMIENTO',
            fecha: seg.fecha,
            contenido: seg,
            alumno,
            prioridad: 1
          });
        }
      });
    }
    
    // Ordenar SOLO por fecha descendente (más nuevo primero), ignorando prioridad
    const feedOrdenado = posts.sort((a, b) => {
      const fechaA = new Date(a.fecha).getTime();
      const fechaB = new Date(b.fecha).getTime();
      return fechaB - fechaA; // Más nuevo primero
    });
    
    console.log('📋 FEED FINAL:', {
      total: feedOrdenado.length,
      mensajes: feedOrdenado.filter(p => p.tipo === 'MENSAJE').length,
      asistencias: feedOrdenado.filter(p => p.tipo === 'ASISTENCIA').length,
      evaluaciones: feedOrdenado.filter(p => p.tipo === 'EVALUACION').length,
      seguimientos: feedOrdenado.filter(p => p.tipo === 'SEGUIMIENTO').length
    });
    
    return feedOrdenado;
  }, [mensajes, asistenciasData, calificacionesData, seguimientosData, alumnos, fechaLimite, selectedDate, fechaBaseInicio, fechaBaseFin]);
  
  // Aplicar filtros
  const feedPostsFiltrados = React.useMemo(() => {
    let postsFiltrados = feedPosts;
    
    // Filtrar por tipo
    postsFiltrados = postsFiltrados.filter(post => filtroTipo.includes(post.tipo));
    
    // Filtrar por alumno
    if (selectedAlumnoId) {
      postsFiltrados = postsFiltrados.filter(post => {
        if (post.tipo === 'MENSAJE' && !post.alumno) return true; // Mensajes generales siempre
        return post.alumno?.id === selectedAlumnoId;
      });
    }
    
    // 🎨 POSTEOS DE EJEMPLO (ELIMINAR DESPUÉS)
    
    return postsFiltrados;
  }, [feedPosts, filtroTipo, selectedAlumnoId]);
  
  // Agrupar posts por alumno
  const postsPorAlumno = React.useMemo(() => {
    const grupos: Record<string, any[]> = {};
    const mensajesGenerales: any[] = [];
    
    feedPostsFiltrados.forEach(post => {
      if (post.tipo === 'MENSAJE' && !post.alumno) {
        // Mensajes generales
        mensajesGenerales.push(post);
      } else if (post.alumno) {
        // Posts de alumnos específicos
        const alumnoId = post.alumno.id;
        if (!grupos[alumnoId]) {
          grupos[alumnoId] = [];
        }
        grupos[alumnoId].push(post);
      }
    });
    
    console.log('📊 PostsPorAlumno Debug:', {
      totalFeedPostsFiltrados: feedPostsFiltrados.length,
      mensajesGenerales: mensajesGenerales.length,
      grupos: Object.keys(grupos).length,
      detallesMensajesGenerales: mensajesGenerales.map(m => ({ 
        id: m.id, 
        titulo: m.contenido.titulo,
        alumno: m.alumno
      })),
      detallesGrupos: Object.entries(grupos).map(([alumnoId, posts]: [string, any]) => ({
        alumnoId,
        totalPosts: posts.length,
        tipos: posts.map(p => p.tipo)
      }))
    });
    
    return { grupos, mensajesGenerales };
  }, [feedPostsFiltrados]);
  
  // Agrupar posts por día (solo cuando NO hay fecha seleccionada)
  const postsPorDia = React.useMemo(() => {
    if (selectedDate) return null; // No agrupar por día si hay fecha seleccionada
    
    const hoy = new Date();
    const diasHabiles: { fecha: Date; label: string; posts: any[] }[] = [];
    let diasAtras = 0;
    
    // Obtener últimos 3 días hábiles
    while (diasHabiles.length < 3 && diasAtras < 10) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - diasAtras);
      const diaSemana = fecha.getDay();
      
      if (diaSemana !== 0 && diaSemana !== 6) {
        let label = '';
        // Todas las fechas con formato completo
        label = fecha.toLocaleDateString('es-AR', { 
          weekday: 'long',
          day: 'numeric', 
          month: 'long' 
        }).split(' ').map((word, i) => i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word).join(' ');
        
        diasHabiles.push({ fecha, label, posts: [] });
      }
      diasAtras++;
    }
    
    // Asignar posts a cada día
    feedPostsFiltrados.forEach(post => {
      const fechaPost = new Date(post.fecha);
      const fechaPostStr = fechaPost.toDateString();
      
      diasHabiles.forEach(dia => {
        if (dia.fecha.toDateString() === fechaPostStr) {
          dia.posts.push(post);
        }
      });
    });
    
    return diasHabiles;
  }, [feedPostsFiltrados, selectedDate]);
  
  const toggleFiltroTipo = (tipo: string) => {
    setFiltroTipo(prev => {
      if (prev.includes(tipo)) {
        return prev.filter(t => t !== tipo);
      } else {
        return [...prev, tipo];
      }
    });
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await refetchMensajes();
    setRefreshing(false);
  };
  
  const togglePost = async (postId: string, post?: any) => {
    const willExpand = !expandedPosts[postId];
    setExpandedPosts(prev => ({ ...prev, [postId]: willExpand }));
    
    // Si es un mensaje, está expandiéndose y no está leído, marcarlo como leído
    if (willExpand && post && post.tipo === 'MENSAJE' && post.contenido && !post.contenido.leido) {
      console.log('📖 Marcando mensaje como leído:', post.contenido.id);
      try {
        await marcarLeido({
          variables: { mensajeId: post.contenido.id },
          // Actualizar el cache de Apollo para que se refleje en TODAS las queries
          update: (cache, { data }) => {
            if (data?.marcarMensajeComoLeido) {
              cache.modify({
                fields: {
                  mensajesTutor(existingMensajes = []) {
                    return existingMensajes.map((mensajeRef: any) => {
                      if (mensajeRef.__ref === `MensajeGeneral:${post.contenido.id}`) {
                        return { ...mensajeRef, leido: true };
                      }
                      return mensajeRef;
                    });
                  }
                }
              });
            }
          }
        });
        console.log('✅ Mensaje marcado como leído y cache actualizado');
        
        // Refrescar la lista de mensajes para asegurar sincronización
        await refetchMensajes();
      } catch (error) {
        console.error('❌ Error al marcar mensaje como leído:', error);
      }
    }
  };
  
  // Ya no mostramos loading aquí, lo maneja la transición de tabs
  
  // Ordenar mensajes por fecha descendente (más recientes primero)
  const mensajesOrdenados = [...mensajes].sort((a, b) => {
    const fechaA = new Date(a.publicadoEn || a.creadoEn).getTime();
    const fechaB = new Date(b.publicadoEn || b.creadoEn).getTime();
    return fechaB - fechaA;
  });
  
  return (
    <Layout style={{ flex: 1, backgroundColor: colors.bg_primary }} level="2">
      {/* Filtro de alumnos */}
      <FiltroAlumnos 
        alumnos={alumnos}
        selectedAlumnoId={selectedAlumnoId}
        setSelectedAlumnoId={setSelectedAlumnoId}
        isDarkMode={isDarkMode}
      />
      
      {/* Feed de Mensajes - Instagram Style */}
      <ScrollView 
        style={{ flex: 1, backgroundColor: colors.bg_primary }} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 12, paddingHorizontal: 10, paddingBottom: 80 }}
      >
        {mensajesLoading && feedPostsFiltrados.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <Spinner size="giant" status="primary" style={{ borderColor: '#764BA2' }} />
            <Text category="s1" style={{ marginTop: 16, color: '#764BA2' }}>
              Cargando novedades...
            </Text>
          </View>
        ) : feedPostsFiltrados.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <View style={{ 
              width: 100, 
              height: 100, 
              borderRadius: 50, 
              backgroundColor: colors.bg_tertiary, 
              justifyContent: 'center', 
              alignItems: 'center',
              marginBottom: 16
            }}>
              <Icon name="inbox-outline" style={{ width: 50, height: 50 }} fill={colors.accent_rose} />
            </View>
            <Text category="h6" style={{ color: colors.accent_rose, marginBottom: 8 }}>No hay novedades</Text>
            <Text appearance="hint" style={{ textAlign: 'center', color: colors.text_tertiary }}>
              Las novedades (mensajes, asistencias, evaluaciones) aparecerán aquí
            </Text>
          </View>
        ) : (
          <View style={{ alignItems: 'center' }}>
            {/* Renderizar todos los posts ordenados por fecha más reciente, sin agrupación */}
            {feedPostsFiltrados.map((post: any) => {
              // Renderizar componente según tipo
              const renderPost = () => {
                switch (post.tipo) {
                  case 'MENSAJE':
                    return (
                      <MensajePostWrapper 
                        mensaje={post.contenido}
                        onNavigateToSection={handleNavigateToSection}
                        isDarkMode={isDarkMode}
                        mostrarBadgeAlumno={!!post.alumno}
                        alumno={post.alumno || null}
                      />
                    );
                  case 'ASISTENCIA':
                    return (
                      <AsistenciaPost 
                        asistencia={post.contenido} 
                        alumno={post.alumno} 
                        onNavigateToSection={handleNavigateToSection}
                        mostrarBadgeAlumno={true}
                      />
                    );
                  case 'EVALUACION':
                    return (
                      <EvaluacionPost 
                        evaluacion={post.contenido} 
                        alumno={post.alumno} 
                        onNavigateToSection={handleNavigateToSection}
                        mostrarBadgeAlumno={true}
                      />
                    );
                  case 'SEGUIMIENTO':
                    return (
                      <SeguimientoPost 
                        seguimiento={post.contenido} 
                        alumno={post.alumno} 
                        onNavigateToSection={handleNavigateToSection}
                        mostrarBadgeAlumno={true}
                      />
                    );
                  default:
                    return null;
                }
              };
              
              return (
                <View key={post.id} style={{ width: '100%', paddingHorizontal: 10, marginBottom: 8 }}>
                  {renderPost()}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Layout>
  );
}

// 🎬 Componente wrapper que maneja la reacción de un mensaje
function MensajePostWrapper({ mensaje, onNavigateToSection, isDarkMode = false, mostrarBadgeAlumno = false, alumno = null, grado = null, division = null }: { mensaje: any; onNavigateToSection?: (section: string, alumnoId?: string | null) => void; isDarkMode?: boolean; mostrarBadgeAlumno?: boolean; alumno?: any; grado?: any; division?: any }) {
  const [expandedContent, setExpandedContent] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loadingImages, setLoadingImages] = useState<{ [key: number]: boolean }>({});
  const [carouselWidth, setCarouselWidth] = useState(0);
  const flatListRef = useRef(null);
  
  // Validación: No renderizar si no hay ID o datos críticos
  if (!mensaje || !mensaje.id) {
    console.warn('⚠️ MensajePostWrapper: mensaje sin ID, saltando render');
    return null;
  }

  try {
    // DISABLED: Hook depends on broken query
    // const { miReaccion, totalReacciones, handleToggleReaccion } = useMensajeReaccion(mensaje.id);
    const miReaccion = null;
    const totalReacciones = {};
    const handleToggleReaccion = () => {};
    
    // Validar que el tipo sea uno válido para mensajes generales
    const tiposValidos = ['ANUNCIO_GENERAL', 'RECORDATORIO', 'NOTA_EXAMEN', 'GALERIA', 'MENSAJE_PRIVADO', 'INFORME', 'CONSULTA_TUTOR'];
    const tipoMensaje = tiposValidos.includes(mensaje.tipo) ? mensaje.tipo : 'ANUNCIO_GENERAL';
    
    // Obtener todas las imágenes (múltiples o una sola)
    const todasLasImagenes = (mensaje.imagenes && mensaje.imagenes.length > 0) ? mensaje.imagenes : mensaje.imagen ? [mensaje.imagen] : [];

    const handleScroll = (e: any) => {
      if (carouselWidth === 0) return;
      const contentOffsetX = e.nativeEvent.contentOffset.x;
      const index = Math.round(contentOffsetX / carouselWidth);
      setCurrentImageIndex(Math.max(0, Math.min(index, todasLasImagenes.length - 1)));
    };

    const formatDate = (date: any) => {
      if (!date) return 'Sin fecha';
      const d = new Date(date);
      return d.toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    return (
      <View style={{ width: '100%' }}>
        {mostrarBadgeAlumno && alumno && (
          <View style={{ 
            backgroundColor: '#F093FB20',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16
          }}>
            <Text style={{ 
              fontWeight: '600',
              fontSize: 14,
              color: '#6B4C85'
            }}>
              {alumno.nombre}
            </Text>
          </View>
        )}
        {(mensaje.alcance === 'GRADO' || mensaje.alcance === 'DIVISION') && !mostrarBadgeAlumno && (
          <View style={{ 
            backgroundColor: '#6ff1ae60',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16
          }}>
            <Text style={{ 
              fontWeight: '600',
              fontSize: 14,
              color: '#064E3B'
            }}>
              {mensaje.alcance === 'GRADO' ? `${tipoMensaje.replace(/_/g, ' ')} a Grado` : `${tipoMensaje.replace(/_/g, ' ')} a División`}
            </Text>
          </View>
        )}
        
        <Card
          style={{ 
            borderRadius: (mostrarBadgeAlumno && alumno) || (mensaje.alcance === 'GRADO' || mensaje.alcance === 'DIVISION') && !mostrarBadgeAlumno ? 0 : 16,
            borderTopLeftRadius: (mostrarBadgeAlumno && alumno) || (mensaje.alcance === 'GRADO' || mensaje.alcance === 'DIVISION') && !mostrarBadgeAlumno ? 0 : 16,
            borderTopRightRadius: (mostrarBadgeAlumno && alumno) || (mensaje.alcance === 'GRADO' || mensaje.alcance === 'DIVISION') && !mostrarBadgeAlumno ? 0 : 16,
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#E4E9F2',
            overflow: 'hidden',
            paddingTop: 8,
            paddingBottom: 8,
            paddingHorizontal: 8,
            width: '100%'
          }}
        >
          {/* Título */}
          <Text style={{ 
            fontSize: 16,
            fontWeight: 'bold',
            color: '#3D3D5C',
            marginBottom: 8
          }}>
            {mensaje.titulo || 'Sin título'}
          </Text>
          
          {/* Metadata: Autor, Fecha, Tipo */}
          <View style={{ marginBottom: 12, gap: 8 }}>
            <Text style={{ 
              fontSize: 12,
              color: '#8F9BB3'
            }}>
              {mensaje.autorNombre || 'Anónimo'}
            </Text>
            <Text style={{ 
              fontSize: 11,
              color: '#8F9BB3'
            }}>
              {formatDate(mensaje.publicadoEn || mensaje.creadoEn)}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {tipoMensaje && (
                <View style={{ 
                  backgroundColor: tipoMensaje === 'GENERAL' ? '#E6F7FF' : '#F0E6FF',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 8,
                  alignSelf: 'flex-start'
                }}>
                  <Text style={{ 
                    fontSize: 10,
                    fontWeight: '600',
                    color: tipoMensaje === 'GENERAL' ? '#0369A1' : '#6D28D9',
                    textTransform: 'uppercase'
                  }}>
                    {tipoMensaje}
                  </Text>
                </View>
              )}
              {mensaje.alcance && (
                <View style={{ 
                  backgroundColor: mensaje.alcance === 'COLEGIO' ? '#E0F2FE' : '#FEF3C7',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 8,
                  alignSelf: 'flex-start'
                }}>
                  <Text style={{ 
                    fontSize: 10,
                    fontWeight: '600',
                    color: mensaje.alcance === 'COLEGIO' ? '#0284C7' : '#B45309',
                    textTransform: 'uppercase'
                  }}>
                    {mensaje.alcance === 'COLEGIO' ? 'Toda la institución' : 
                     mensaje.alcance === 'GRADO' ? 'Por grado' :
                     mensaje.alcance === 'DIVISION' ? 'Por división' :
                     mensaje.alcance === 'ALUMNO' ? 'Personal' : mensaje.alcance}
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          {/* Contenido con expansión */}
          <Text style={{ 
            fontSize: 14,
            color: '#3D3D5C',
            lineHeight: 20,
            marginBottom: 12
          }}>
            {expandedContent ? mensaje.contenido : mensaje.contenido?.substring(0, 150)}
            {!expandedContent && mensaje.contenido?.length > 150 && '...'}
          </Text>
          
          {/* Botón más/menos */}
          {mensaje.contenido?.length > 150 && (
            <TouchableOpacity 
              onPress={() => setExpandedContent(!expandedContent)}
              style={{ marginBottom: 12 }}
            >
              <Text style={{ 
                fontSize: 12,
                color: '#764BA2',
                fontWeight: '600'
              }}>
                {expandedContent ? 'menos' : 'más'}
              </Text>
            </TouchableOpacity>
          )}
          
          {/* Carrusel de Imágenes */}
          {todasLasImagenes.length > 0 && (
            <View 
              onLayout={(e) => setCarouselWidth(e.nativeEvent.layout.width)}
              style={{ marginBottom: 12, position: 'relative', borderRadius: 8, overflow: 'hidden', backgroundColor: '#F7FAFC', marginHorizontal: -16 }}
            >
              <FlatList
                ref={flatListRef}
                data={todasLasImagenes}
                horizontal
                pagingEnabled
                scrollEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                renderItem={({ item, index }) => (
                  <View style={{ 
                    width: carouselWidth || Dimensions.get('window').width - 32,
                    height: 280,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    {loadingImages[index] && (
                      <View style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        right: 0, 
                        bottom: 0,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        zIndex: 10
                      }}>
                        <Spinner size='large' status='primary' style={{ borderColor: '#764BA2' }} />
                      </View>
                    )}
                    <Image
                      source={{ uri: item }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                      onLoadStart={() => setLoadingImages(prev => ({ ...prev, [index]: true }))}
                      onLoadEnd={() => setLoadingImages(prev => ({ ...prev, [index]: false }))}
                    />
                  </View>
                )}
                keyExtractor={(_, index) => index.toString()}
              />
              
              {/* Contador de imágenes - Top Right */}
              {todasLasImagenes.length > 1 && (
                <View style={{ 
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  backgroundColor: 'rgba(0, 0, 0, 0.65)',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                  zIndex: 20
                }}>
                  <Text style={{ 
                    color: '#FFFFFF',
                    fontSize: 12,
                    fontWeight: '600'
                  }}>
                    {currentImageIndex + 1}/{todasLasImagenes.length}
                  </Text>
                </View>
              )}
              
              {/* Dots Indicator - Bottom */}
              {todasLasImagenes.length > 1 && (
                <View style={{ 
                  position: 'absolute',
                  bottom: 12,
                  left: 0,
                  right: 0,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 6,
                  zIndex: 20
                }}>
                  {todasLasImagenes.map((_, index) => (
                    <View
                      key={index}
                      style={{
                        width: index === currentImageIndex ? 24 : 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: index === currentImageIndex ? '#764BA2' : 'rgba(255, 255, 255, 0.6)'
                      }}
                    />
                  ))}
                </View>
              )}
            </View>
          )}
          
          {onNavigateToSection && (
            <View style={{ 
              marginTop: 12,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: '#E4E9F2'
            }}>
              <TouchableOpacity onPress={() => onNavigateToSection('Mensajes')}>
                <Text style={{ 
                  fontWeight: '600',
                  fontSize: 12,
                  color: '#764BA2',
                  textAlign: 'center'
                }}>
                  Ver todos los mensajes →
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>
      </View>
    );
  } catch (error) {
    console.error('❌ Error renderizando MensajePostWrapper:', error);
    console.error('   Mensaje:', JSON.stringify(mensaje));
    return null;
  }
}

// 📧 Componente de Post para Mensaje
function MensajePost({ mensaje, expanded, onToggle }: { mensaje: any; expanded: boolean; onToggle: () => void }) {
  return (
    <Card 
      style={{ 
        borderRadius: 16, 
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E4E9F2'
      }}
      onPress={onToggle}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, }}>
        <View style={{ 
          width: 40, 
          height: 40, 
          borderRadius: 20, 
          backgroundColor: '#FFE8EE',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12
        }}>
          <Icon name="email" fill="#FF3D71" style={{ width: 24, height: 24 }} />
        </View>
        <View style={{ flex: 1 }}>
          <Text category="s1" style={{ fontWeight: 'bold', color: '#3D3D5C' }}>
            {mensaje.leido ? 'Mensaje' : 'Mensaje Nuevo'}
          </Text>
          <Text appearance="hint" category="c1">
            {formatearFechaLegible(mensaje.publicadoEn || mensaje.creadoEn)}
          </Text>
        </View>
        {!mensaje.leido && (
          <View style={{ 
            width: 10, 
            height: 10, 
            borderRadius: 5, 
            backgroundColor: '#FF3D71' 
          }} />
        )}
      </View>
      
      <Text category="h6" style={{ marginBottom: 8, fontSize: 15 }}>
        {mensaje.titulo}
      </Text>
      <Text numberOfLines={expanded ? undefined : 2} appearance="hint">
        {mensaje.contenido}
      </Text>
      
      {!expanded && (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
          <Text category="c2" style={{ color: '#764BA2' }}>
            Tocar para ver más
          </Text>
        </View>
      )}
    </Card>
  );
}

// 📅 Componente de Post para Asistencia
function AsistenciaPost({ asistencia, alumno, onNavigateToSection, mostrarBadgeAlumno = false }: { asistencia: any; alumno: any; onNavigateToSection?: (section: string, alumnoId?: string | null) => void; mostrarBadgeAlumno?: boolean }) {
  const presente = asistencia.estado === 'PRESENTE' || asistencia.estado === 'TARDE';
  
  return (
    <View style={{ maxWidth: 500 }}>
      {mostrarBadgeAlumno && alumno && (
        <View style={{ 
          backgroundColor: '#F093FB20',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16
        }}>
          <Text style={{ 
            fontWeight: '600',
            fontSize: 14,
            color: '#9E7BAB'
          }}>
            {alumno.nombre}
          </Text>
        </View>
      )}
      <Card 
        style={{ 
          borderRadius: mostrarBadgeAlumno && alumno ? 0 : 16,
          borderTopLeftRadius: mostrarBadgeAlumno && alumno ? 0 : 16,
          borderTopRightRadius: mostrarBadgeAlumno && alumno ? 0 : 16,
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: '#E4E9F2',
          overflow: 'hidden',
          paddingTop: 8,
          paddingBottom: 8,
          paddingHorizontal: 8
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ 
            width: 40, 
            height: 40, 
            borderRadius: 20, 
            backgroundColor: presente ? '#E8F8F5' : '#FFE8E8',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12
          }}>
            <Icon 
              name={presente ? 'checkmark-circle-2' : 'close-circle'}
              fill={presente ? '#764BA2' : '#FF6B6B'}
              style={{ width: 24, height: 24 }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text category="s1" style={{ fontWeight: 'bold', color: '#3D3D5C' }}>
              Asistencia
            </Text>
            <Text appearance="hint" category="c1">
              {formatearFechaLegible(asistencia.fecha)}
            </Text>
          </View>
        </View>
      
      <View style={{ 
        backgroundColor: presente ? '#E8F8F5' : '#FFE8E8',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 12,
        marginBottom: 12
      }}>
        <Text style={{ 
          fontWeight: 'bold',
          fontSize: 12,
          color: presente ? '#764BA2' : '#FF6B6B'
        }}>
          {asistencia.estado === 'TARDE' ? 'TARDE' : presente ? 'PRESENTE' : 'AUSENTE'}
        </Text>
      </View>
      
      {asistencia.observaciones && (
        <View style={{ backgroundColor: '#FFF3E0', padding: 10, borderRadius: 8 }}>
          <Text appearance="hint" category="c1" style={{ marginBottom: 4 }}>Observaciones:</Text>
          <Text category="p2">{asistencia.observaciones}</Text>
        </View>
      )}
      
      {onNavigateToSection && (
        <View style={{ 
          marginTop: 12,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: '#E4E9F2'
        }}>
          <TouchableOpacity onPress={() => onNavigateToSection('Asistencias', alumno?.id)}>
            <Text style={{ 
              fontWeight: '600',
              fontSize: 12,
              color: '#764BA2',
              textAlign: 'center'
            }}>
              Ver todas las asistencias de {alumno?.nombre || 'alumno'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
    </View>
  );
}

// 📊 Componente de Post para Evaluación
function EvaluacionPost({ evaluacion, alumno, onNavigateToSection, mostrarBadgeAlumno = false }: { evaluacion: any; alumno: any; onNavigateToSection?: (section: string, alumnoId?: string | null) => void; mostrarBadgeAlumno?: boolean }) {
  const calificacion = evaluacion.notaAlumno?.calificacion;
  let valorMostrar = 'S/N';
  let color = '#8F9BB3';
  
  if (calificacion) {
    if (calificacion.tipo === 'NUMERICA' && calificacion.valorNumerico != null) {
      valorMostrar = calificacion.valorNumerico.toFixed(1);
      color = calificacion.valorNumerico >= 7 ? '#764BA2' : calificacion.valorNumerico >= 4 ? '#FF9800' : '#F44336';
    } else if (calificacion.tipo === 'CONCEPTUAL' && calificacion.valorConceptual) {
      valorMostrar = calificacion.valorConceptual;
      color = calificacion.aprobado ? '#764BA2' : '#F44336';
    }
  }
  
  return (
    <View style={{ maxWidth: 500 }}>
      {mostrarBadgeAlumno && alumno && (
        <View style={{ 
          backgroundColor: color + '20',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16
        }}>
          <Text style={{ 
            fontWeight: '600',
            fontSize: 14,
            color: color
          }}>
            {alumno.nombre}
          </Text>
        </View>
      )}
      <Card 
        style={{ 
          borderRadius: mostrarBadgeAlumno && alumno ? 0 : 16,
          borderTopLeftRadius: mostrarBadgeAlumno && alumno ? 0 : 16,
          borderTopRightRadius: mostrarBadgeAlumno && alumno ? 0 : 16,
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: '#E4E9F2',
          overflow: 'hidden',
          paddingTop: 8,
          paddingBottom: 8,
          paddingHorizontal: 8
        }}
      >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View style={{ 
          width: 40, 
          height: 40, 
          borderRadius: 20, 
          backgroundColor: color + '20',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12
        }}>
          <Icon name="bar-chart" fill={color} style={{ width: 24, height: 24 }} />
        </View>
        <View style={{ flex: 1 }}>
          <Text category="s1" style={{ fontWeight: 'bold', color: '#3D3D5C' }}>
            Evaluación
          </Text>
          <Text appearance="hint" category="c1">
            {formatearFechaLegible(evaluacion.fecha)}
          </Text>
        </View>
        <View style={{ 
          backgroundColor: color + '20',
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 8
        }}>
          <Text style={{ color, fontWeight: 'bold', fontSize: 14 }}>
            {valorMostrar}
          </Text>
        </View>
      </View>
      
      <View style={{ marginBottom: evaluacion.notaAlumno?.observaciones ? 12 : 0 }}>
        <Text style={{ color: '#2196F3', marginBottom: 2, fontSize: 13, fontWeight: '600' }}>
          {evaluacion.materiaNombre}
        </Text>
        <Text style={{ color: '#3D3D5C', fontSize: 12 }}>
          {evaluacion.tema || evaluacion.tipo}
        </Text>
      </View>
      
      {evaluacion.notaAlumno?.observaciones && (
        <View style={{ backgroundColor: '#FFF3E0', padding: 10, borderRadius: 8 }}>
          <Text appearance="hint" category="c1" style={{ marginBottom: 4 }}>Observaciones:</Text>
          <Text category="p2">{evaluacion.notaAlumno.observaciones}</Text>
        </View>
      )}
      
      {onNavigateToSection && (
        <View style={{ 
          marginTop: 12,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: '#E4E9F2'
        }}>
          <TouchableOpacity onPress={() => onNavigateToSection('Evaluaciones', alumno?.id)}>
            <Text style={{ 
              fontWeight: '600',
              fontSize: 12,
              color: color,
              textAlign: 'center'
            }}>
              Ver todas las evaluaciones de {alumno?.nombre || 'alumno'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
    </View>
  );
}

// 🍼 Componente de Post para Seguimiento
function SeguimientoPost({ seguimiento, alumno, onNavigateToSection, mostrarBadgeAlumno = false }: { seguimiento: any; alumno?: any; onNavigateToSection?: (section: string, alumnoId?: string | null) => void; mostrarBadgeAlumno?: boolean }) {
  const getEstadoColor = () => {
    if (seguimiento.estadoDelDia === 'muy-bueno') return '#764BA2';
    if (seguimiento.estadoDelDia === 'bueno') return '#FFB020';
    return '#FF6B6B';
  };
  
  const headerColor = mostrarBadgeAlumno && alumno ? '#FFB020' : getEstadoColor();
  
  return (
    <View style={{ maxWidth: 500 }}>
      {mostrarBadgeAlumno && alumno && (
        <View style={{ 
          backgroundColor: headerColor + '20',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16
        }}>
          <Text style={{ 
            fontWeight: '600',
            fontSize: 14,
            color: headerColor
          }}>
            {alumno.nombre}
          </Text>
        </View>
      )}
      <Card 
        style={{ 
          borderRadius: mostrarBadgeAlumno && alumno ? 0 : 16,
          borderTopLeftRadius: mostrarBadgeAlumno && alumno ? 0 : 16,
          borderTopRightRadius: mostrarBadgeAlumno && alumno ? 0 : 16,
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: '#E4E9F2',
          overflow: 'hidden',
          paddingTop: 8,
          paddingBottom: 8,
          paddingHorizontal: 8
        }}
      >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View style={{ 
          width: 40, 
          height: 40, 
          borderRadius: 20, 
          backgroundColor: '#FFF3E0',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12
        }}>
          <Icon name="activity" fill="#FFB020" style={{ width: 24, height: 24 }} />
        </View>
        <View style={{ flex: 1 }}>
          <Text category="s1" style={{ fontWeight: 'bold', color: '#3D3D5C' }}>
            Seguimiento Diario
          </Text>
          <Text appearance="hint" category="c1">
            {formatearFechaLegible(seguimiento.fecha)}
          </Text>
        </View>
      </View>
      
      <View style={{
        backgroundColor: getEstadoColor() + '20',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 12,
        marginBottom: 12
      }}>
        <Text style={{ color: getEstadoColor(), fontSize: 12, fontWeight: 'bold' }}>
          {seguimiento.estadoDelDia?.replace(/-/g, ' ').toUpperCase()}
        </Text>
      </View>
      
      {/* Resumen compacto */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
        <View style={{ flex: 1, backgroundColor: '#F8FAFB', padding: 10, borderRadius: 8 }}>
          <Text appearance="hint" category="c1">Alimentación</Text>
          <Text category="s2">
            {[
              seguimiento.alimentacion?.desayuno,
              seguimiento.alimentacion?.almuerzo,
              seguimiento.alimentacion?.merienda
            ].filter(Boolean).length} comidas
          </Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#F8FAFB', padding: 10, borderRadius: 8 }}>
          <Text appearance="hint" category="c1">Descanso</Text>
          <Text category="s2">
            {seguimiento.descanso?.durmio ? 'Durmió' : 'No durmió'}
          </Text>
        </View>
      </View>
      
      {seguimiento.notasDelDia && (
        <View style={{ marginTop: 12, backgroundColor: '#FEF3C7', padding: 10, borderRadius: 8 }}>
          <Text appearance="hint" category="c1" style={{ marginBottom: 4 }}>Notas:</Text>
          <Text category="p2">{seguimiento.notasDelDia}</Text>
        </View>
      )}
      
      {onNavigateToSection && (
        <View style={{ 
          marginTop: 12,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: '#E4E9F2'
        }}>
          <TouchableOpacity onPress={() => onNavigateToSection('Seguimientos', alumno?.id)}>
            <Text style={{ 
              fontWeight: '600',
              fontSize: 12,
              color: '#FFB020',
              textAlign: 'center'
            }}>
              Ver todos los seguimientos de {alumno?.nombre || 'alumno'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
    </View>
  );
}

// 📊 PLACEHOLDER
function PlaceholderTab({ icon, title }: { icon: string; title: string }) {
  return (
    <Layout style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Icon name={icon} style={{ width: 80, height: 80 }} fill="#8F9BB3" />
      <Text category="h5" style={{ marginTop: 16 }}>{title}</Text>
      <Text appearance="hint" style={{ textAlign: 'center', marginTop: 8 }}>
        Próximamente disponible
      </Text>
    </Layout>
  );
}

// 🎯 CUSTOM SELECT - Select personalizado legible en dark mode
interface CustomSelectProps {
  items: { key: string | number; title: string }[];
  selectedKey: string | number | null;
  onSelect: (key: string | number) => void;
  placeholder?: string;
  isDarkMode?: boolean;
}

function CustomSelect({ items, selectedKey, onSelect, placeholder = 'Seleccionar', isDarkMode = false }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const colors = getColors(isDarkMode);
  const selectedItem = items.find(item => item.key === selectedKey);

  return (
    <View>
      <TouchableOpacity
        onPress={() => setIsOpen(!isOpen)}
        style={{
          backgroundColor: isDarkMode ? colors.bg_primary : '#FFFFFF',
          borderColor: isDarkMode ? colors.border_medium : '#E6EBF0',
          borderWidth: 1,
          borderRadius: 8,
          padding: 12,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: selectedItem ? (isDarkMode ? colors.text_primary : '#1A1A2E') : (isDarkMode ? colors.text_tertiary : '#999') }}>
          {selectedItem?.title || placeholder}
        </Text>
        <Text style={{ fontSize: 16, color: isDarkMode ? colors.text_tertiary : '#666' }}>
          {isOpen ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      {isOpen && (
        <View
          style={{
            backgroundColor: isDarkMode ? colors.bg_secondary : '#FFFFFF',
            borderColor: isDarkMode ? colors.border_medium : '#E6EBF0',
            borderWidth: 1,
            borderTopWidth: 0,
            borderRadius: 0,
            marginTop: -1,
            maxHeight: 250,
            zIndex: 100,
          }}
        >
          <ScrollView scrollEnabled={items.length > 5} nestedScrollEnabled={true}>
            {items.map((item) => (
              <TouchableOpacity
                key={item.key}
                onPress={() => {
                  onSelect(item.key);
                  setIsOpen(false);
                }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  backgroundColor: selectedKey === item.key ? (isDarkMode ? colors.bg_tertiary : '#F0F0F0') : (isDarkMode ? colors.bg_secondary : '#FFFFFF'),
                  borderBottomColor: isDarkMode ? colors.border_subtle : '#E6EBF0',
                  borderBottomWidth: 1,
                }}
              >
                <Text style={{ color: isDarkMode ? colors.text_primary : '#1A1A2E', fontWeight: selectedKey === item.key ? '600' : '400' }}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// 🎯 APP CONTENT - Componente principal de contenido
function AppContent({ isDarkMode, setIsDarkMode }: { isDarkMode: boolean; setIsDarkMode: (value: boolean) => void }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const blurAnim = useRef(new Animated.Value(100)).current;
  const [blurValue, setBlurValue] = useState(100);
  const bgColorAnim = useRef(new Animated.Value(0)).current;
  const [bgColorValue, setBgColorValue] = useState(0);
  const fadeOutAnim = useRef(new Animated.Value(0)).current;
  const [fadeOutValue, setFadeOutValue] = useState(0);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    const id = blurAnim.addListener(({ value }) => {
      setBlurValue(value);
    });
    const idBgColor = bgColorAnim.addListener(({ value }) => {
      setBgColorValue(value);
    });
    const idFadeOut = fadeOutAnim.addListener(({ value }) => {
      setFadeOutValue(value);
    });
    
    // Primero: animar blur y cambiar fondo de blanco a violeta por 2 segundos
    Animated.parallel([
      Animated.timing(blurAnim, {
        toValue: 0,
        duration: 2000,
        useNativeDriver: false,
      }),
      Animated.timing(bgColorAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false,
      })
    ]).start(() => {
      // Mantener violeta por 2 segundos más (total 4 segundos de violeta)
      setTimeout(() => {
        // Luego: transición a blanco por 1 segundo
        Animated.timing(fadeOutAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }).start(() => {
          setShowSplash(false);
          checkAuth();  // Verificar autenticación después del splash
        });
      }, 2000);
    });
    
    return () => {
      blurAnim.removeListener(id);
      bgColorAnim.removeListener(idBgColor);
      fadeOutAnim.removeListener(idFadeOut);
    };
  }, []);
  
  // 🔔 Mutación para guardar el push token
  const [updatePushToken] = useMutation(UPDATE_PUSH_TOKEN);

  // 🔄 Hook para invalidar cache automáticamente
  useApolloCache({
    resetOnAppForeground: true,  // Resetea cuando app vuelve del background
    resetIntervalMs: 5 * 60 * 1000,  // Resetea cada 5 minutos
    onCacheReset: () => {
      console.log('✅ Cache invalidado - datos frescos obtenidos');
    },
  });

  useEffect(() => {
    // (Eliminado: animación fade/scale, solo blur)
  }, []);

  const toggleDarkMode = async (): Promise<void> => {
    try {
      const newValue = !isDarkMode;
      setIsDarkMode(newValue);
      await AsyncStorage.setItem('isDarkMode', JSON.stringify(newValue));
    } catch (error) {
      console.error('Error guardando preferencia de tema:', error);
    }
  };

  // 🔔 useEffect para manejar notificaciones entrantes
  useEffect(() => {
    // Listener cuando llega una notificación (app en foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notificación recibida:', notification);
    });

    // Listener cuando el usuario toca la notificación
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Usuario tocó la notificación:', response);
      // Aquí podrías navegar a una sección específica de la app
      // Por ejemplo, si es un mensaje nuevo, ir a la pestaña de mensajes
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      setIsAuthenticated(!!token);
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    // Registrar push token después del login
    registerForPushNotifications();
  };
  
  const handleLogout = async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('tutorData');
    setIsAuthenticated(false);
  };

  // 🔔 Función para registrar notificaciones push
  const registerForPushNotifications = async () => {
    try {
      // Solo funciona en dispositivos físicos
      if (!Device.isDevice) {
        console.log('Las notificaciones push solo funcionan en dispositivos físicos');
        return;
      }

      // Obtener permisos
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Permisos de notificación denegados');
        return;
      }

      // Obtener el token push
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      
      console.log('📱 Push token obtenido:', token);

      // Guardar el token localmente
      await AsyncStorage.setItem('expoPushToken', token);

      // Intentar guardar el token en el backend (solo si está disponible)
      try {
        await updatePushToken({
          variables: { token }
        });
        console.log('✅ Token push guardado en el backend');
      } catch (error: any) {
        // Si el backend aún no tiene la mutación, solo mostrar advertencia
        console.warn('⚠️ Backend aún no soporta push tokens. Token guardado localmente:', token);
        console.warn('Implementa la mutación updateTutorPushToken en el backend');
      }

      // Configurar canal de notificaciones para Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#764BA2',
        });
      }
    } catch (error) {
      console.error('Error registrando notificaciones:', error);
    }
  };

  // Mostrar splash screen
  if (showSplash) {
    // Interpolar color de blanco a violeta
    const bgColor = bgColorValue === 0 ? '#FFFFFF' : bgColorValue === 1 ? '#764BA2' : 
      `rgba(118, 75, 162, ${bgColorValue})`;
    
    return (
      <Animated.View style={{ 
        flex: 1, 
        backgroundColor: bgColor,
        justifyContent: 'center', 
        alignItems: 'center'
      }}>
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#FFFFFF',
          opacity: fadeOutValue
        }} />
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center',
          zIndex: 1
        }}>
        {/* Letras aparecen con blur animado */}
        {blurValue <= 100 && (
          <View style={{ alignItems: 'center', gap: 8 }}>
            <Text style={{
              fontSize: 38,
              fontWeight: '300',
              color: '#FFFFFF',
              letterSpacing: 16,
              fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-light',
              textTransform: 'uppercase',
              textShadowColor: 'rgba(0, 0, 0, 0.1)',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: blurValue > 0 ? blurValue / 10 : 0
            }}>
              DHORA
            </Text>
            <Text style={{
              fontSize: 12,
              fontWeight: '300',
              color: '#FFFFFF',
              letterSpacing: 2,
              fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-light',
              textShadowColor: 'rgba(0, 0, 0, 0.1)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 2,
              opacity: 0.9
            }}>
              Conexión Familiar
            </Text>
          </View>
        )}
        </View>
        </Animated.View>
    );
  }

  

  if (loading) {
    return (
      <Layout style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Spinner size="giant" />
      </Layout>
    );
  }

  return isAuthenticated ? <HomeScreen onLogout={handleLogout} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} /> : <LoginScreen onLogin={handleLogin} />;
}

// 🎨 APP PRINCIPAL
export default function App() {
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  React.useEffect(() => {
    loadThemePreference();
    
    // Log de configuración de API
    console.log('='.repeat(80));
    console.log('🚀 APP INICIADA');
    console.log('🌐 Variables de entorno:');
    console.log('   EXPO_PUBLIC_GRAPHQL_URL:', process.env.EXPO_PUBLIC_GRAPHQL_URL);
    console.log('   NODE_ENV:', process.env.NODE_ENV);
    console.log('='.repeat(80));
  }, []);

  const loadThemePreference = async () => {
    try {
      const saved = await AsyncStorage.getItem('isDarkMode');
      if (saved !== null) {
        setIsDarkMode(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error cargando preferencia de tema:', error);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <IconRegistry icons={EvaIconsPack} />
      <ApplicationProvider {...eva} theme={isDarkMode ? darkTheme : customTheme}>
        
        <ApolloProvider client={apolloClient}>
       
          <AppContent isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        </ApolloProvider>
      </ApplicationProvider>
    </GestureHandlerRootView>
  );
}
