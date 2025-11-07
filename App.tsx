import React, { useState, useEffect, useRef } from 'react';
import { View, SafeAreaView, ScrollView, RefreshControl, StatusBar, Modal, TouchableOpacity, Animated, Easing, Platform, LogBox, Alert, Image } from 'react-native';
import { ApplicationProvider, Layout, Text, Input, Button, Card, Spinner, Divider, Icon, TopNavigation, TopNavigationAction, IconRegistry, Datepicker, Select, SelectItem, IndexPath } from '@ui-kitten/components';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import * as eva from '@eva-design/eva';
import { ApolloProvider, useMutation, useQuery, gql } from '@apollo/client';
import { apolloClient } from './src/config/apollo';
import { LOGIN_TUTOR, GET_MENSAJES_TUTOR, MARCAR_MENSAJE_LEIDO, GET_ALUMNOS_TUTOR, GET_ASISTENCIAS, GET_CALIFICACIONES, GET_OBSERVACIONES_INICIAL, GET_SEGUIMIENTO_DIARIO, UPDATE_TUTOR_PROFILE, UPDATE_ALUMNO_CONDICIONES, GET_TUTOR_INFO, UPDATE_PUSH_TOKEN } from './src/graphql/queries';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import TeresaLogo from './assets/TeresaLogo';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import TeresaLogoIcon from './assets/TeresaLogoIcon';
import { BlurView } from '@react-native-community/blur';
import { LinearGradient } from 'expo-linear-gradient';

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
     args[0].includes('Apollo'))
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
  // Turquesa vibrante como color principal
  'color-primary-100': '#C2F5EC',
  'color-primary-200': '#8AEBDA',
  'color-primary-300': '#52E0C8',
  'color-primary-400': '#1AD6B6',
  'color-primary-500': '#00BFA5', // Turquesa principal
  'color-primary-600': '#00A58D',
  'color-primary-700': '#008B75',
  'color-primary-800': '#00715D',
  'color-primary-900': '#005745',
  
  // Fondos súper claros y limpios
  'color-basic-100': '#FFFFFF',
  'color-basic-200': '#F8FAFB',
  'color-basic-300': '#EFF3F6',
  'color-basic-400': '#E6EBF0',
  'color-basic-500': '#C5CEE0',
  'color-basic-600': '#8F9BB3',
  
  // Colores de acento vibrantes
  'color-success-100': '#D4F8E8',
  'color-success-500': '#00E096', // Verde brillante
  'color-success-700': '#00B377',
  
  'color-warning-100': '#FFF3D6',
  'color-warning-500': '#FFB020', // Naranja cálido
  'color-warning-700': '#E69500',
  
  'color-danger-100': '#FFECEC',
  'color-danger-500': '#FF3D71', // Rojo coral
  'color-danger-700': '#DB2C5E',
  
  'color-info-100': '#D6EDFF',
  'color-info-500': '#0095FF', // Azul cielo brillante
  'color-info-700': '#006FD6',
};

// 🔐 LOGIN
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
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            {/* Logo SVG de TERESA */}
            <TeresaLogo size={140} />
         
          </View>

          <Card disabled style={{ 
            marginBottom: 24, 
            borderRadius: 20, 
            backgroundColor: '#F8FAFB',
            borderWidth: 1,
            borderColor: '#E6EBF0'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
             
              <View>
                <Text category="h6" style={{ marginBottom: 4, color: '#00BFA5', fontWeight: 'bold' }}>Bienvenido!</Text>
                <Text category="p2" appearance="hint">Ingresá tus credenciales</Text>
              </View>
            </View>
          </Card>


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
        style={{ marginBottom: 16, borderRadius: 12 }}
      />

      <Button 
        onPress={handleLogin} 
        disabled={loading || !documento || !password} 
        size="large"
        style={{ borderRadius: 12, marginBottom: 12 }}
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
function HomeScreen({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [tutorNombre, setTutorNombre] = useState<string>('');
  const mensajesNoLeidos = mensajes.filter((m: any) => !m.leido).length;
  
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
  console.log('🔍 DEBUG Alumnos:', alumnos.map((a: any) => ({ nombre: a.nombre, nivel: a.nivel })));
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
      <StatusBar barStyle="light-content" backgroundColor="#00BFA5" />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#00BFA5' }}>
        {/* Header personalizado - Compacto */}
        <View style={{ 
          backgroundColor: '#00BFA5',
          paddingTop: 15,
          paddingBottom: 15,
          paddingHorizontal: 16
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Logo y título */}
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{ 
                  width: 36, 
                  height: 36, 
                  borderRadius: 18, 
                  overflow: 'hidden',
                  marginRight: 10
                }}>
                  <TeresaLogoIcon size={36} />
                </View>
                <View>
                  <Text category="s1" style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                    {getTituloActivo()}
                  </Text>
                  {tutorNombre && (
                    <Text category="c1" style={{ color: 'rgba(255,255,255,0.95)', fontSize: 11, marginTop: 1 }}>
                      {tutorNombre}
                    </Text>
                  )}
                </View>
              </View>
              
              {/* Botón de configuraciones - Solo visible si NO estás en configuraciones */}
              {activeTab !== 'configuraciones' && (
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
              )}
            </View>
        </View>

      <View style={{ flex: 1, position: 'relative' }}>
        {activeTab === 'mensajes' && (
          <MensajesTab 
            onMensajesUpdate={setMensajes} 
            alumnoId={selectedAlumnoId}
            alumnos={alumnos}
            selectedAlumnoId={selectedAlumnoId}
            setSelectedAlumnoId={setSelectedAlumnoId}
          />
        )}
        {activeTab === 'dashboard' && (
          <DashboardTab 
            alumnos={alumnos}
            selectedAlumnoId={selectedAlumnoId}
            setSelectedAlumnoId={setSelectedAlumnoId}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === 'asistencias' && (
          <AsistenciasTab 
            alumnos={alumnos}
            selectedAlumnoId={selectedAlumnoId}
            setSelectedAlumnoId={setSelectedAlumnoId}
          />
        )}
        {activeTab === 'evaluaciones' && (
          <EvaluacionesTab 
            alumnos={alumnos}
            selectedAlumnoId={selectedAlumnoId}
            setSelectedAlumnoId={setSelectedAlumnoId}
          />
        )}
        {activeTab === 'seguimiento' && tieneMaternalAlumno && (
          <SeguimientoTab 
            alumnos={alumnos}
            selectedAlumnoId={selectedAlumnoId}
            setSelectedAlumnoId={setSelectedAlumnoId}
          />
        )}
        {activeTab === 'configuraciones' && <ConfiguracionesTab onLogout={onLogout} />}
        
        {/* Blur overlay durante transición - Fondo opaco */}
        {isTransitioning && Platform.OS === 'ios' && (
          <View style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
            backgroundColor: '#FFFFFF'
          }}>
            <Animated.View style={{ 
              flex: 1,
              opacity: blurOpacity
            }}>
              <BlurView
                style={{ flex: 1 }}
                blurType="light"
                blurAmount={10}
                reducedTransparencyFallbackColor="white"
              />
            </Animated.View>
          </View>
        )}
        
        {/* Fallback para Android - overlay blanco opaco */}
        {isTransitioning && Platform.OS === 'android' && (
          <Animated.View style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
            backgroundColor: '#FFFFFF',
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
            <Spinner size="large" />
          </View>
        )}

        {/* TAB BAR FLOTANTE */}
        <View style={{ 
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          flexDirection: 'row',
          paddingVertical: 12,
          paddingHorizontal: 10,
          paddingBottom: Platform.OS === 'ios' ? 20 : 12
        }}>
          <Button
            appearance={activeTab === 'dashboard' ? 'filled' : 'ghost'}
            accessoryLeft={(props) => <Icon {...props} name="home-outline" width={26} height={26} />}
            onPress={() => handleTabChange('dashboard')}
            style={{ flex: 1, marginHorizontal: 4, borderRadius: 3 }}
            size="small"
          />
          
          <Button
            appearance={activeTab === 'mensajes' ? 'filled' : 'ghost'}
            accessoryLeft={(props) => <Icon {...props} name="email-outline" width={26} height={26} />}
            onPress={() => handleTabChange('mensajes')}
            style={{ flex: 1, marginHorizontal: 4, borderRadius: 3 }}
            size="small"
          />
          
          <Button
            appearance={activeTab === 'asistencias' ? 'filled' : 'ghost'}
            accessoryLeft={(props) => <Icon {...props} name="calendar-outline" width={26} height={26} />}
            onPress={() => handleTabChange('asistencias')}
            style={{ flex: 1, marginHorizontal: 4, borderRadius: 3 }}
            size="small"
          />
          
          {/* Tab universal de Evaluaciones */}
          <Button
            appearance={activeTab === 'evaluaciones' ? 'filled' : 'ghost'}
            accessoryLeft={(props) => <Icon {...props} name="bar-chart-outline" width={26} height={26} />}
            onPress={() => handleTabChange('evaluaciones')}
            style={{ flex: 1, marginHorizontal: 4, borderRadius: 3 }}
            size="small"
          />
          
          {/* Tab Seguimiento - Solo visible si hay alumnos de nivel MATERNAL */}
          {tieneMaternalAlumno && (
            <Button
              appearance={activeTab === 'seguimiento' ? 'filled' : 'ghost'}
              accessoryLeft={(props) => <Icon {...props} name="activity-outline" width={26} height={26} />}
              onPress={() => handleTabChange('seguimiento')}
              style={{ flex: 1, marginHorizontal: 4, borderRadius: 3 }}
              size="small"
            />
          )}
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
  setSelectedAlumnoId 
}: { 
  alumnos: any[]; 
  selectedAlumnoId: string | null; 
  setSelectedAlumnoId: (id: string | null) => void;
}) {
  if (alumnos.length <= 1) return null;
  
  return (
    <View style={{ padding: 16, paddingBottom: 0 }}>
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
      <Divider style={{ marginTop: 8 }} />
    </View>
  );
}

// 📧 MENSAJES
function MensajesTab({ 
  onMensajesUpdate, 
  alumnoId, 
  alumnos, 
  selectedAlumnoId, 
  setSelectedAlumnoId 
}: { 
  onMensajesUpdate: (mensajes: any[]) => void; 
  alumnoId?: string;
  alumnos: any[];
  selectedAlumnoId: string | null;
  setSelectedAlumnoId: (id: string | null) => void;
}) {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMensaje, setSelectedMensaje] = useState<any>(null);
  const [showNuevoMensaje, setShowNuevoMensaje] = useState(false);
  const [responderA, setResponderA] = useState<any>(null);
  
  const { data, loading, error, refetch } = useQuery(GET_MENSAJES_TUTOR, {
    variables: selectedAlumnoId ? { alumnoId: selectedAlumnoId } : {}
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

  // Ya no mostramos loading aquí, lo maneja la transición de tabs

  return (
    <>
      <Layout style={{ flex: 1 }}>
        {/* Selector de alumno */}
        <FiltroAlumnos 
          alumnos={alumnos}
          selectedAlumnoId={selectedAlumnoId}
          setSelectedAlumnoId={setSelectedAlumnoId}
        />
        
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
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
                    backgroundColor: '#F8FAFB',
                    borderWidth: 1,
                    borderColor: '#E6EBF0'
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                    <View style={{ flex: 1, gap: 8 }}>
                      <View style={{ width: '70%', height: 16, backgroundColor: '#E6EBF0', borderRadius: 4 }} />
                      <View style={{ width: '40%', height: 12, backgroundColor: '#E6EBF0', borderRadius: 4 }} />
                    </View>
                    <View style={{ width: 60, height: 20, backgroundColor: '#E6EBF0', borderRadius: 8 }} />
                  </View>
                  <View style={{ width: '100%', height: 14, backgroundColor: '#E6EBF0', borderRadius: 4, marginBottom: 6 }} />
                  <View style={{ width: '85%', height: 14, backgroundColor: '#E6EBF0', borderRadius: 4 }} />
                </Card>
              ))}
            </>
          ) : mensajes.length === 0 ? (
            <Card disabled style={{ borderRadius: 20, backgroundColor: '#F8FAFB', borderWidth: 1, borderColor: '#E6EBF0' }}>
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <View style={{ 
                  width: 100, 
                  height: 100, 
                  borderRadius: 50, 
                  backgroundColor: '#E6F7F4', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  marginBottom: 20
                }}>
                  <Icon name="email-outline" style={{ width: 50, height: 50 }} fill="#00BFA5" />
                </View>
                <Text category="h6" style={{ marginBottom: 8, color: '#00BFA5' }}>No hay mensajes</Text>
                <Text appearance="hint">
                  {selectedAlumnoId ? 'No hay mensajes para este alumno' : 'Los mensajes aparecerán aquí'}
                </Text>
              </View>
            </Card>
          ) : (
          mensajes.map((mensaje: any, index: number) => {
            const alumnoDelMensaje = getAlumnoByDestinatarioId(mensaje);
            
            return (
            <Card
              key={mensaje.id || index}
              style={{ 
                marginBottom: 16, 
                borderRadius: 16, 
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: mensaje.leido ? '#E6EBF0' : '#00BFA5',
                shadowColor: '#00BFA5',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: mensaje.leido ? 0 : 0.1,
                shadowRadius: 8,
                elevation: mensaje.leido ? 1 : 3
              }}
              onPress={() => handleAbrirMensaje(mensaje)}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text category="h6" numberOfLines={1} style={{ color: '#1A1F36', fontWeight: '700' }}>
                    {mensaje.titulo || 'Sin título'}
                  </Text>
                  
                  {/* Indicador del alumno */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Icon name="person-outline" style={{ width: 14, height: 14, marginRight: 4 }} fill="#00BFA5" />
                    <Text category="c1" style={{ color: '#00BFA5', fontWeight: '600' }}>
                      {alumnoDelMensaje 
                        ? `${alumnoDelMensaje.nombre} ${alumnoDelMensaje.apellido}` 
                        : 'Cargando alumno...'}
                    </Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, flexWrap: 'wrap', gap: 6 }}>
                    {mensaje.tipo && (
                      <View style={{ 
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        backgroundColor: 
                          mensaje.tipo === 'GENERAL' ? '#E6F7FF' :
                          mensaje.tipo === 'ACADEMICO' ? '#F0E6FF' :
                          mensaje.tipo === 'ADMINISTRATIVO' ? '#FFE6E6' :
                          mensaje.tipo === 'EVENTO' ? '#E6FFE6' :
                          mensaje.tipo === 'CONSULTA_TUTOR' ? '#FFF3E6' :
                          '#FFF9E6',
                        borderRadius: 8
                      }}>
                        <Text style={{ 
                          color: 
                            mensaje.tipo === 'GENERAL' ? '#0369A1' :
                            mensaje.tipo === 'ACADEMICO' ? '#6D28D9' :
                            mensaje.tipo === 'ADMINISTRATIVO' ? '#B91C1C' :
                            mensaje.tipo === 'EVENTO' ? '#047857' :
                            mensaje.tipo === 'CONSULTA_TUTOR' ? '#EA580C' :
                            '#A67C00',
                          fontWeight: '600', 
                          fontSize: 10 
                        }}>
                          {formatTipo(mensaje.tipo, mensaje.autorNombre)}
                        </Text>
                      </View>
                    )}
                    {!mensaje.leido && (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: 4, 
                          backgroundColor: '#00E096', 
                          marginRight: 4 
                        }} />
                        <Text category="c2" style={{ color: '#00BFA5', fontWeight: 'bold', fontSize: 10 }}>
                          NUEVO
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={{ 
                  paddingHorizontal: 8, 
                  paddingVertical: 4, 
                  backgroundColor: '#F8FAFB', 
                  borderRadius: 8 
                }}>
                  <Text category="c1" appearance="hint" style={{ fontSize: 11 }}>
                    {formatDate(mensaje.publicadoEn || mensaje.creadoEn)}
                  </Text>
                </View>
              </View>
              <Text numberOfLines={2} appearance="hint" category="p2" style={{ lineHeight: 20 }}>
                {mensaje.contenido || 'Sin contenido'}
              </Text>
            </Card>
            );
          })
        )}
        </ScrollView>
        
        {/* Botón flotante para nuevo mensaje */}
        <TouchableOpacity
          style={{
            position: 'absolute',
            bottom: 100,
            right: 20,
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: '#00E096',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#00E096',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8
          }}
          onPress={() => {
            setResponderA(null);
            setShowNuevoMensaje(true);
          }}
        >
          <Icon name="plus-outline" style={{ width: 30, height: 30 }} fill="#FFFFFF" />
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
              backgroundColor: 'rgba(0, 0, 0, 0.5)', 
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
            
            <View style={{ width: '100%', maxWidth: 450, zIndex: 1 }}>
              <Card 
                disabled 
                style={{ 
                  borderRadius: 24,
                  backgroundColor: '#FFFFFF',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 12,
                  elevation: 8
                }}
              >
                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  style={{ maxHeight: 650 }}
                  contentContainerStyle={{ padding: 16 }}
                  nestedScrollEnabled={true}
                >
                  <View style={{ marginBottom: 16 }}>
                    <Text 
                      style={{ 
                        marginBottom: 12, 
                        fontSize: 20, 
                        fontWeight: '700', 
                        color: '#1A1F36',
                        lineHeight: 28
                      }}
                    >
                      {selectedMensaje.titulo || 'Sin título'}
                    </Text>
                    
                    {(() => {
                      const alumnoDelMensajeModal = getAlumnoByDestinatarioId(selectedMensaje);
                      return alumnoDelMensajeModal && (
                        <View style={{ 
                          flexDirection: 'row', 
                          alignItems: 'center', 
                          marginBottom: 12,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          backgroundColor: '#E6F7F4',
                          borderRadius: 10,
                          borderLeftWidth: 3,
                          borderLeftColor: '#00BFA5'
                        }}>
                          <Icon name="person-outline" style={{ width: 18, height: 18, marginRight: 8 }} fill="#00BFA5" />
                          <Text style={{ color: '#00BFA5', fontWeight: '700', fontSize: 14 }}>
                            Para: {alumnoDelMensajeModal.nombre} {alumnoDelMensajeModal.apellido}
                          </Text>
                        </View>
                      );
                    })()}
                    
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8, gap: 8 }}>
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
                              selectedMensaje.tipo === 'EVENTO' ? '#10B981' :
                              selectedMensaje.tipo === 'CONSULTA_TUTOR' ? '#EA580C' :
                              '#FFB020'
                            }
                          />
                          <Text style={{ 
                            color: 
                              selectedMensaje.tipo === 'GENERAL' ? '#0369A1' :
                              selectedMensaje.tipo === 'ACADEMICO' ? '#6D28D9' :
                              selectedMensaje.tipo === 'ADMINISTRATIVO' ? '#B91C1C' :
                              selectedMensaje.tipo === 'EVENTO' ? '#047857' :
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
                      alignSelf: 'flex-start'
                    }}>
                      <Icon name="calendar-outline" style={{ width: 16, height: 16, marginRight: 8 }} fill="#00BFA5" />
                      <Text style={{ color: '#00BFA5', fontWeight: '600', fontSize: 12 }}>
                        {selectedMensaje.publicadoEn || selectedMensaje.creadoEn ? formatDate(selectedMensaje.publicadoEn || selectedMensaje.creadoEn) : 'Sin fecha'}
                      </Text>
                    </View>
                  </View>
                  
                  <Divider style={{ marginVertical: 16, backgroundColor: '#E6EBF0' }} />
                  
                  <View style={{ marginBottom: 20 }}>
                    <Text 
                      style={{ 
                        lineHeight: 24, 
                        color: '#2D3748', 
                        fontSize: 15
                      }}
                    >
                      {selectedMensaje.contenido || 'Sin contenido'}
                    </Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {/* Solo mostrar botón Responder si el mensaje NO fue enviado por un tutor */}
                    {selectedMensaje.tipo !== 'CONSULTA_TUTOR' && (
                      <Button 
                        style={{ borderRadius: 14, flex: 1 }} 
                        appearance="outline"
                        onPress={() => {
                          setResponderA(selectedMensaje);
                          setSelectedMensaje(null);
                          setShowNuevoMensaje(true);
                        }}
                        size="medium"
                        accessoryLeft={(props) => <Icon {...props} name="corner-up-left-outline" />}
                      >
                        Responder
                      </Button>
                    )}
                    <Button 
                      style={{ 
                        borderRadius: 14, 
                        flex: selectedMensaje.tipo === 'CONSULTA_TUTOR' ? 1 : 1 
                      }} 
                      onPress={() => setSelectedMensaje(null)}
                      size="medium"
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
      
      {/* Modal para nuevo mensaje o responder */}
      {showNuevoMensaje && (
        <NuevoMensajeModal
          visible={showNuevoMensaje}
          onClose={() => {
            setShowNuevoMensaje(false);
            setResponderA(null);
          }}
          responderA={responderA}
          onEnviado={() => {
            setShowNuevoMensaje(false);
            setResponderA(null);
            refetch();
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
  onEnviado: () => void;
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
        estado
        autorNombre
        publicadoEn
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
        }
      });
      
      console.log('✅ Mensaje enviado:', result);
      Alert.alert('Éxito', 'Mensaje enviado correctamente');
      onEnviado();
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
          shadowColor: '#000',
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
                borderLeftColor: '#00BFA5'
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
  
  // Si hay alumnos pero no hay seleccionado, seleccionar el primero automáticamente
  useEffect(() => {
    if (alumnos.length > 0 && !selectedAlumno) {
      setSelectedAlumno(alumnos[0].id);
    }
  }, [alumnos.length]);
  
  // Query para obtener calificaciones - SOLO ejecutar si hay alumno seleccionado
  const { data: calificacionesData, loading: loadingCalificaciones, refetch: refetchCalificaciones } = useQuery(GET_CALIFICACIONES, {
    variables: { alumnoId: selectedAlumno },
    skip: !selectedAlumno
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
        <Spinner size="large" />
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
      {/* Selector de alumno si hay más de uno */}
      {alumnos.length > 1 && (
        <View style={{ padding: 16, backgroundColor: '#F8FAFB', borderBottomWidth: 1, borderBottomColor: '#E6EBF0' }}>
          <Text category="s2" style={{ marginBottom: 8, fontWeight: 'bold' }}>
            Seleccionar alumno:
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
            colors={['#00BFA5']}
            tintColor="#00BFA5"
          />
        }
      >
        {loadingCalificaciones ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Spinner size="large" />
            <Text appearance="hint" style={{ marginTop: 12 }}>Cargando calificaciones...</Text>
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
                        color: promedio >= 7 ? '#00BFA5' : promedio >= 4 ? '#FFB020' : '#FF6B6B',
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
                                    color: nota.nota >= 7 ? '#00BFA5' : nota.nota >= 4 ? '#FFB020' : '#FF6B6B'
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
  setSelectedAlumnoId 
}: { 
  alumnos: any[]; 
  selectedAlumnoId: string | null;
  setSelectedAlumnoId: (id: string | null) => void;
}) {
  const [selectedMateriaIndex, setSelectedMateriaIndex] = useState<IndexPath>(new IndexPath(0));
  const [refreshing, setRefreshing] = useState(false);
  
  // Si hay alumnos pero no hay seleccionado, seleccionar el primero automáticamente
  useEffect(() => {
    if (alumnos.length > 0 && !selectedAlumnoId) {
      setSelectedAlumnoId(alumnos[0].id);
    }
  }, [alumnos.length]);
  
  // Obtener alumno seleccionado y su nivel
  const alumnoActual = alumnos.find((a: any) => a.id === selectedAlumnoId);
  const nivelAlumno = alumnoActual?.nivel || 'PRIMARIO';
  const esNivelInicial = nivelAlumno === 'MATERNAL' || nivelAlumno === 'INICIAL';
  
  const shouldSkipCalificaciones = !selectedAlumnoId || esNivelInicial;
  const shouldSkipObservaciones = !selectedAlumnoId || !esNivelInicial;
  
  // Query para calificaciones (Primario/Secundario)
  const { data: calificacionesData, loading: loadingCalificaciones, error: errorCalificaciones, refetch: refetchCalificaciones } = useQuery(GET_CALIFICACIONES, {
    variables: { alumnoId: selectedAlumnoId },
    skip: shouldSkipCalificaciones
  });
  
  // Query para observaciones iniciales (Maternal/Inicial)
  const { data: observacionesData, loading: loadingObservaciones, error: errorObservaciones, refetch: refetchObservaciones } = useQuery(GET_OBSERVACIONES_INICIAL, {
    variables: { alumnoId: selectedAlumnoId },
    skip: shouldSkipObservaciones
  });
  
  // Función para refrescar datos
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      if (esNivelInicial) {
        await refetchObservaciones();
      } else {
        await refetchCalificaciones();
      }
    } catch (error) {
      console.error('Error al refrescar:', error);
    }
    setRefreshing(false);
  }, [esNivelInicial, refetchCalificaciones, refetchObservaciones]);
  
  const materias = calificacionesData?.calificacionesTutor || [];
  const observaciones = observacionesData?.observacionesInicialesTutor || [];
  
  // Preparar lista de evaluaciones cronológicas
  const evaluacionesCronologicas = React.useMemo(() => {
    const lista: any[] = [];
    
    materias.forEach((materia: any) => {
      if (materia.evaluaciones && materia.evaluaciones.length > 0) {
        materia.evaluaciones.forEach((evaluacion: any) => {
          const notaAlumno = evaluacion.notas?.find((n: any) => n.alumnoId === selectedAlumnoId);
          if (notaAlumno || evaluacion.notas?.length === 0) { // Mostrar si tiene nota o si no hay notas aún
            lista.push({
              ...evaluacion,
              materiaNombre: materia.nombre,
              materiaId: materia.id,
              notaAlumno
            });
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
    <Layout style={{ flex: 1 }} level="2">
      {/* Selector de alumno */}
      <FiltroAlumnos 
        alumnos={alumnos}
        selectedAlumnoId={selectedAlumnoId}
        setSelectedAlumnoId={setSelectedAlumnoId}
      />
      
      {/* Indicador de nivel */}
      <View style={{ backgroundColor: esNivelInicial ? '#E6F7F4' : '#E3F2FD', padding: 12 }}>
        <Text appearance="hint" category="c1" style={{ textAlign: 'center', color: esNivelInicial ? '#00BFA5' : '#2196F3' }}>
          {nivelAlumno ? `Nivel ${nivelAlumno.charAt(0) + nivelAlumno.slice(1).toLowerCase()} - ${esNivelInicial ? 'Campos Formativos' : 'Evaluaciones'}` : 'Cargando...'}
        </Text>
      </View>
      
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#00BFA5']}
            tintColor="#00BFA5"
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
                  backgroundColor: '#F8FAFB',
                  borderWidth: 1,
                  borderColor: '#E6EBF0'
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <View style={{ flex: 1, gap: 8 }}>
                    <View style={{ width: '70%', height: 16, backgroundColor: '#E6EBF0', borderRadius: 4 }} />
                    <View style={{ width: '40%', height: 12, backgroundColor: '#E6EBF0', borderRadius: 4 }} />
                  </View>
                  <View style={{ width: 60, height: 20, backgroundColor: '#E6EBF0', borderRadius: 8 }} />
                </View>
                <View style={{ width: '100%', height: 14, backgroundColor: '#E6EBF0', borderRadius: 4, marginBottom: 6 }} />
                <View style={{ width: '85%', height: 14, backgroundColor: '#E6EBF0', borderRadius: 4 }} />
              </Card>
            ))}
          </>
        ) : esNivelInicial ? (
          // VISTA PARA MATERNAL/INICIAL - Campos Formativos
          observaciones.length === 0 ? (
            <Card disabled style={{ borderRadius: 16, backgroundColor: '#F8FAFB', borderWidth: 1, borderColor: '#E6EBF0' }}>
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Icon name="book-outline" style={{ width: 60, height: 60, marginBottom: 16 }} fill="#00BFA5" />
                <Text category="h6" style={{ marginBottom: 8, color: '#00BFA5' }}>Sin observaciones</Text>
                <Text appearance="hint">No hay observaciones registradas aún</Text>
              </View>
            </Card>
          ) : (
            observaciones.map((obs: any) => (
              <Card key={obs.id} style={{ marginBottom: 16, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6EBF0' }}>
                <Text category="h6" style={{ marginBottom: 12, color: '#00BFA5' }}>
                  Período: {obs.periodo}
                </Text>
                <Divider style={{ marginBottom: 12 }} />
                
                {obs.camposFormativos?.map((campo: any, idx: number) => (
                  <View key={idx} style={{ marginBottom: 16 }}>
                    <Text category="s1" style={{ marginBottom: 8 }}>{campo.campoFormativoNombre}</Text>
                    
                    {campo.logrosAlcanzados && campo.logrosAlcanzados.length > 0 && (
                      <View style={{ marginBottom: 4 }}>
                        <Text appearance="hint" category="c1">✓ Logros alcanzados:</Text>
                        {campo.logrosAlcanzados.map((logro: string, i: number) => (
                          <Text key={i} category="p2" style={{ marginLeft: 16 }}>• {logro}</Text>
                        ))}
                      </View>
                    )}
                    
                    {campo.enDesarrollo && campo.enDesarrollo.length > 0 && (
                      <View style={{ marginBottom: 4 }}>
                        <Text appearance="hint" category="c1">🕐 En desarrollo:</Text>
                        {campo.enDesarrollo.map((item: string, i: number) => (
                          <Text key={i} category="p2" style={{ marginLeft: 16 }}>• {item}</Text>
                        ))}
                      </View>
                    )}
                    
                    {campo.enRevision && campo.enRevision.length > 0 && (
                      <View style={{ marginBottom: 4 }}>
                        <Text appearance="hint" category="c1">! En revisión:</Text>
                        {campo.enRevision.map((item: string, i: number) => (
                          <Text key={i} category="p2" style={{ marginLeft: 16 }}>• {item}</Text>
                        ))}
                      </View>
                    )}
                    
                    {campo.observaciones && (
                      <Text appearance="hint" category="c1" style={{ marginTop: 4, fontStyle: 'italic' }}>
                        Obs: {campo.observaciones}
                      </Text>
                    )}
                  </View>
                ))}
                
                {obs.observacionesGenerales && (
                  <>
                    <Divider style={{ marginVertical: 12 }} />
                    <Text category="s2" style={{ marginBottom: 4 }}>Observaciones Generales:</Text>
                    <Text appearance="hint">{obs.observacionesGenerales}</Text>
                  </>
                )}
              </Card>
            ))
          )
        ) : (
          // VISTA PARA PRIMARIO/SECUNDARIO - Notas Cronológicas
          <>
            {/* Filtro por materia con Select dropdown */}
            {materiasUnicas.length > 0 && (
              <Card style={{ marginBottom: 16, borderRadius: 12 }}>
                <Text category="label" appearance="hint" style={{ marginBottom: 8 }}>
                  Filtrar por materia:
                </Text>
                <Select
                  selectedIndex={selectedMateriaIndex}
                  value={selectDisplayValue}
                  onSelect={(index) => setSelectedMateriaIndex(index as IndexPath)}
                  placeholder="Seleccionar materia"
                  style={{ borderRadius: 8 }}
                >
                  {[
                    <SelectItem key="todas" title="Todas las materias" />,
                    ...materiasUnicas.map((m: any) => (
                      <SelectItem key={m.id} title={m.nombre} />
                    ))
                  ]}
                </Select>
                
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
              <Card disabled style={{ borderRadius: 16, backgroundColor: '#F8FAFB', borderWidth: 1, borderColor: '#E6EBF0' }}>
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Text category="h6" style={{ marginBottom: 8, color: '#2196F3' }}>Sin evaluaciones</Text>
                  <Text appearance="hint">
                    {selectedMateria === 'todas' 
                      ? 'No hay evaluaciones registradas aún'
                      : 'No hay evaluaciones para esta materia'}
                  </Text>
                </View>
              </Card>
            ) : (
              evaluacionesFiltradas.map((evaluacion: any, idx: number) => {
                const calificacion = evaluacion.notaAlumno?.calificacion;
                
                // Obtener el valor correcto según el tipo de calificación
                let valorMostrar = 'S/N';
                let color = '#8F9BB3';
                
                if (calificacion) {
                  if (calificacion.tipo === 'NUMERICA' && calificacion.valorNumerico != null) {
                    valorMostrar = calificacion.valorNumerico.toFixed(2);
                    color = calificacion.valorNumerico >= 7 ? '#00BFA5' : calificacion.valorNumerico >= 4 ? '#FF9800' : '#F44336';
                  } else if (calificacion.tipo === 'CONCEPTUAL' && calificacion.valorConceptual) {
                    valorMostrar = calificacion.valorConceptual;
                    color = calificacion.aprobado ? '#00BFA5' : '#F44336';
                  }
                }
                
                return (
                  <Card key={`${evaluacion._id}-${idx}`} style={{ marginBottom: 16, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6EBF0' }}>
                    {/* Fecha */}
                    <View style={{ marginBottom: 8 }}>
                      <Text appearance="hint" category="c1">
                        {new Date(evaluacion.fecha).toLocaleDateString('es-AR', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </Text>
                    </View>
                    
                    {/* Materia */}
                    <View style={{ marginBottom: 8 }}>
                      <Text category="s1" style={{ color: '#2196F3' }}>{evaluacion.materiaNombre}</Text>
                    </View>
                    
                    {/* Tema/Tipo */}
                    <Text category="h7" style={{ fontWeight: 'bold',  marginBottom: 8 }}>
                      {evaluacion.tema || evaluacion.tipo}
                    </Text>
                    
                    {/* Nota */}
                    <View style={{ 
                      backgroundColor: color + '15', 
                      padding: 12, 
                      borderRadius: 8, 
                      borderLeftWidth: 4, 
                      borderLeftColor: color,
                      marginBottom: 8
                    }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text category="s2" style={{ color }}>Calificación</Text>
                        <Text category="h5" style={{ color }}>
                          {valorMostrar}
                        </Text>
                      </View>
                    </View>
                    
                    {/* Observaciones de la nota */}
                    {evaluacion.notaAlumno?.observaciones && (
                      <View style={{ 
                        backgroundColor: '#F7F9FC', 
                        padding: 10, 
                        borderRadius: 8,
                        marginBottom: 8 
                      }}>
                        <Text appearance="hint" category="c1" style={{ fontWeight: 'bold', marginBottom: 4 }}>
                          Observaciones:
                        </Text>
                        <Text category="p2">{evaluacion.notaAlumno.observaciones}</Text>
                      </View>
                    )}
                    
                    {/* Observaciones generales de la evaluación */}
                    {evaluacion.observaciones && (
                      <Text appearance="hint" category="c1" style={{ marginTop: 4, fontStyle: 'italic' }}>
                        {evaluacion.observaciones}
                      </Text>
                    )}
                    
                    {/* Indicador de recuperatorio */}
                    {evaluacion.esRecuperatorio && (
                      <View style={{ 
                        marginTop: 8, 
                        backgroundColor: '#FFF3E0', 
                        padding: 6, 
                        borderRadius: 6
                      }}>
                        <Text category="c2" style={{ color: '#FF9800' }}>Recuperatorio</Text>
                      </View>
                    )}
                  </Card>
                );
              })
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
  setSelectedAlumnoId 
}: { 
  alumnos: any[]; 
  selectedAlumnoId: string | null;
  setSelectedAlumnoId: (id: string | null) => void;
}) {
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
    <Layout style={{ flex: 1 }}>
      {/* Filtro de alumnos */}
      <FiltroAlumnos 
        alumnos={alumnos}
        selectedAlumnoId={selectedAlumnoId}
        setSelectedAlumnoId={setSelectedAlumnoId}
      />
      
      {/* Barra de búsqueda por fecha */}
      <View style={{ padding: 16, backgroundColor: '#F8FAFB', borderBottomWidth: 1, borderBottomColor: '#E6EBF0' }}>
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
          <Text appearance="hint" category="c1" style={{ marginTop: 4, textAlign: 'center' }}>
            {viewMode === 'dia' ? 'Mostrando asistencias del día seleccionado' :
             viewMode === 'semana' ? 'Mostrando asistencias de la semana' :
             'Mostrando asistencias del mes'}
          </Text>
        )}
      </View>

      <ScrollView 
        style={{ flex: 1, padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#00BFA5']}
            tintColor="#00BFA5"
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
                  backgroundColor: '#F8FAFB',
                  borderWidth: 1,
                  borderColor: '#E6EBF0'
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <View style={{ flex: 1, gap: 8 }}>
                    <View style={{ width: '70%', height: 16, backgroundColor: '#E6EBF0', borderRadius: 4 }} />
                    <View style={{ width: '40%', height: 12, backgroundColor: '#E6EBF0', borderRadius: 4 }} />
                  </View>
                  <View style={{ width: 60, height: 20, backgroundColor: '#E6EBF0', borderRadius: 8 }} />
                </View>
                <View style={{ width: '100%', height: 14, backgroundColor: '#E6EBF0', borderRadius: 4, marginBottom: 6 }} />
                <View style={{ width: '85%', height: 14, backgroundColor: '#E6EBF0', borderRadius: 4 }} />
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
              <Card key={alumno.id} style={{ marginBottom: 16, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6EBF0' }}>
                {/* Header con nombre del alumno */}
                <View style={{ marginBottom: 12 }}>
                  <Text category="h6" style={{ color: '#00BFA5', fontWeight: 'bold' }}>
                    {alumno.nombre} {alumno.apellido}
                  </Text>
                </View>

                <Divider style={{ marginBottom: 12 }} />

                {/* Estadísticas */}
                {asistencias.length === 0 ? (
                  <View style={{ 
                    padding: 20, 
                    alignItems: 'center',
                    backgroundColor: '#F8FAFB',
                    borderRadius: 10
                  }}>
                    <Icon name="calendar-outline" style={{ width: 40, height: 40, marginBottom: 8 }} fill="#8F9BB3" />
                    <Text appearance="hint" style={{ textAlign: 'center' }}>
                      Sin registros de asistencia en el período seleccionado
                    </Text>
                  </View>
                ) : (
                  <>
                    {mostrarEstadisticas && (
                      <>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 }}>
                          <View style={{ alignItems: 'center' }}>
                            <Text category="h4" style={{ color: '#00BFA5', fontWeight: 'bold' }}>
                              {presente}
                            </Text>
                            <Text appearance="hint" category="c1">Presentes</Text>
                          </View>
                          <View style={{ alignItems: 'center' }}>
                            <Text category="h4" style={{ color: '#FF6B6B', fontWeight: 'bold' }}>
                              {ausente}
                            </Text>
                            <Text appearance="hint" category="c1">Ausentes</Text>
                          </View>
                          <View style={{ alignItems: 'center' }}>
                            <Text category="h4" style={{ color: '#4A90E2', fontWeight: 'bold' }}>
                              {porcentaje}%
                            </Text>
                            <Text appearance="hint" category="c1">Asistencia</Text>
                          </View>
                        </View>

                        <Divider style={{ marginBottom: 12 }} />
                      </>
                    )}

                    {/* Lista de asistencias */}
                    <Text category="s1" style={{ marginBottom: 8, fontWeight: 'bold' }}>
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
                            backgroundColor: asistencia.presente ? '#E8F8F5' : '#FFE8E8',
                            borderRadius: 8
                          }}
                        >
                          <Text category="p2">
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
                              fill={asistencia.presente ? '#00BFA5' : '#FF6B6B'}
                            />
                            <Text 
                              category="p2" 
                              style={{ 
                                fontWeight: 'bold',
                                color: asistencia.presente ? '#00BFA5' : '#FF6B6B'
                              }}
                            >
                              {asistencia.estado === 'TARDE' ? 'Tarde' : asistencia.presente ? 'Presente' : 'Ausente'}
                            </Text>
                          </View>
                        </View>
                        {asistencia.observaciones && (
                          <Text appearance="hint" category="c1" style={{ marginTop: -2, marginBottom: 6, marginLeft: 12, fontStyle: 'italic' }}>
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
  setSelectedAlumnoId 
}: { 
  alumnos: any[]; 
  selectedAlumnoId: string | null;
  setSelectedAlumnoId: (id: string | null) => void;
}) {
  const [refreshing, setRefreshing] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [fechaDesde, setFechaDesde] = useState(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)); // Últimos 10 días
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
      fechaInicio: fechaDesde.toISOString(),
      fechaFin: fechaHasta.toISOString()
    },
    skip: shouldSkip
  });
  
  const seguimientos = data?.seguimientosDiariosPorAlumno || [];
  
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
    <Layout style={{ flex: 1 }} level="2">
      {/* Selector de alumno MATERNAL */}
      <FiltroAlumnos 
        alumnos={alumnosMaternalOnly}
        selectedAlumnoId={selectedAlumnoId}
        setSelectedAlumnoId={setSelectedAlumnoId}
      />
      
      {/* Indicador de nivel */}
      <View style={{ backgroundColor: '#E6F7F4', padding: 8 }}>
        <Text appearance="hint" category="c1" style={{ textAlign: 'center', color: '#00BFA5' }}>
          Nivel Maternal - Seguimiento Diario
        </Text>
      </View>
      
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#00BFA5']}
            tintColor="#00BFA5"
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
                  backgroundColor: '#F8FAFB',
                  borderWidth: 1,
                  borderColor: '#E6EBF0'
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <View style={{ flex: 1, gap: 8 }}>
                    <View style={{ width: '70%', height: 16, backgroundColor: '#E6EBF0', borderRadius: 4 }} />
                    <View style={{ width: '40%', height: 12, backgroundColor: '#E6EBF0', borderRadius: 4 }} />
                  </View>
                  <View style={{ width: 60, height: 20, backgroundColor: '#E6EBF0', borderRadius: 8 }} />
                </View>
                <View style={{ width: '100%', height: 14, backgroundColor: '#E6EBF0', borderRadius: 4, marginBottom: 6 }} />
                <View style={{ width: '85%', height: 14, backgroundColor: '#E6EBF0', borderRadius: 4 }} />
              </Card>
            ))}
          </>
        ) : seguimientos.length === 0 ? (
          <Card disabled style={{ borderRadius: 16, backgroundColor: '#F8FAFB', borderWidth: 1, borderColor: '#E6EBF0' }}>
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text category="h6" style={{ marginBottom: 8, color: '#00BFA5' }}>Sin seguimiento registrado</Text>
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
                  style={{ marginBottom: 16, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6EBF0', borderLeftWidth: 4, borderLeftColor: '#00BFA5' }}
                  onPress={() => setExpandedDays(prev => ({ ...prev, [seguimiento.id]: !prev[seguimiento.id] }))}
                >
                  {/* Header compacto - siempre visible */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text category="s1" style={{ color: '#2E3A59', marginBottom: 4, fontSize: 14 }}>
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
                          backgroundColor: 
                            seguimiento.estadoDelDia === 'no-tan-bueno' ? '#FEE2E2' :
                            seguimiento.estadoDelDia === 'bueno' ? '#D1FAE5' :
                            seguimiento.estadoDelDia === 'muy-bueno' ? '#A7F3D0' :
                            '#E6F7F4',
                          borderRadius: 6,
                          alignSelf: 'flex-start'
                        }}>
                          <Text category="c2" style={{ 
                            color: 
                              seguimiento.estadoDelDia === 'no-tan-bueno' ? '#DC2626' :
                              seguimiento.estadoDelDia === 'bueno' ? '#059669' :
                              seguimiento.estadoDelDia === 'muy-bueno' ? '#047857' :
                              '#00BFA5',
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
                      fill="#8F9BB3" 
                    />
                  </View>

                  {/* Detalles - solo si está expandido */}
                  {isExpanded && (
                    <View style={{ marginTop: 16 }}>
                      <Divider style={{ marginBottom: 16 }} />
                      
                      {/* Alimentación */}
                      <View style={{ marginBottom: 16, backgroundColor: '#F8FAFB', padding: 12, borderRadius: 8 }}>
                        <Text category="s1" style={{ marginBottom: 10, color: '#2E3A59' }}>
                          Alimentación
                        </Text>
                        <View style={{ gap: 6 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text category="p2" style={{ color: '#6B7280' }}>Desayuno:</Text>
                            <Text category="p2" style={{ 
                              color: seguimiento.alimentacion?.desayuno === 'MUY_BIEN' ? '#10B981' :
                                    seguimiento.alimentacion?.desayuno === 'BIEN' ? '#00BFA5' :
                                    seguimiento.alimentacion?.desayuno === 'POCO' ? '#FFB020' : '#8F9BB3'
                            }}>
                              {seguimiento.alimentacion?.desayuno === 'MUY_BIEN' ? 'Muy bien' :
                              seguimiento.alimentacion?.desayuno === 'BIEN' ? 'Bien' :
                              seguimiento.alimentacion?.desayuno === 'POCO' ? 'Poco' : 'No comió'}
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text category="p2" style={{ color: '#6B7280' }}>Almuerzo:</Text>
                            <Text category="p2" style={{ 
                              color: seguimiento.alimentacion?.almuerzo === 'MUY_BIEN' ? '#10B981' :
                                    seguimiento.alimentacion?.almuerzo === 'BIEN' ? '#00BFA5' :
                                    seguimiento.alimentacion?.almuerzo === 'POCO' ? '#FFB020' : '#8F9BB3'
                            }}>
                              {seguimiento.alimentacion?.almuerzo === 'MUY_BIEN' ? 'Muy bien' :
                              seguimiento.alimentacion?.almuerzo === 'BIEN' ? 'Bien' :
                              seguimiento.alimentacion?.almuerzo === 'POCO' ? 'Poco' : 'No comió'}
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text category="p2" style={{ color: '#6B7280' }}>Merienda:</Text>
                            <Text category="p2" style={{ 
                              color: seguimiento.alimentacion?.merienda === 'MUY_BIEN' ? '#10B981' :
                                    seguimiento.alimentacion?.merienda === 'BIEN' ? '#00BFA5' :
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
                      <View style={{ marginBottom: 16, backgroundColor: '#F8FAFB', padding: 12, borderRadius: 8 }}>
                        <Text category="s1" style={{ marginBottom: 10, color: '#2E3A59' }}>
                          Descanso
                        </Text>
                        <View style={{ gap: 6 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text category="p2" style={{ color: '#6B7280' }}>Llegó dormido:</Text>
                            <Text category="p2" style={{ color: seguimiento.descanso?.llegoDormido ? '#00BFA5' : '#8F9BB3' }}>
                              {seguimiento.descanso?.llegoDormido ? 'Sí' : 'No'}
                            </Text>
                          </View>
                          {seguimiento.descanso?.llegoDormido && seguimiento.descanso?.horaDespertar && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 16, backgroundColor: '#FFF7ED', padding: 8, borderRadius: 6 }}>
                              <Text category="p2" style={{ color: '#92400E', fontStyle: 'italic' }}>Se despertó a las:</Text>
                              <Text category="p2" style={{ color: '#92400E', fontWeight: 'bold' }}>
                                {seguimiento.descanso.horaDespertar}
                              </Text>
                            </View>
                          )}
                          
                          {seguimiento.descanso?.llegoDormido && (
                            <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 4 }} />
                          )}
                          
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text category="p2" style={{ color: '#6B7280' }}>Durmió siesta:</Text>
                            <Text category="p2" style={{ color: seguimiento.descanso?.durmio ? '#00BFA5' : '#8F9BB3' }}>
                              {seguimiento.descanso?.durmio ? 'Sí' : 'No'}
                            </Text>
                          </View>
                          {seguimiento.descanso?.durmio && (seguimiento.descanso?.horaDormir || seguimiento.descanso?.horaDespertar) && (
                            <View style={{ paddingLeft: 16, backgroundColor: '#EFF6FF', padding: 8, borderRadius: 6 }}>
                              {seguimiento.descanso?.horaDormir && (
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                  <Text category="p2" style={{ color: '#1E40AF', fontSize: 12 }}>Desde:</Text>
                                  <Text category="p2" style={{ color: '#1E40AF', fontWeight: 'bold' }}>
                                    {seguimiento.descanso.horaDormir}
                                  </Text>
                                </View>
                              )}
                              {seguimiento.descanso?.horaDespertar && (
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Text category="p2" style={{ color: '#1E40AF', fontSize: 12 }}>Hasta:</Text>
                                  <Text category="p2" style={{ color: '#1E40AF', fontWeight: 'bold' }}>
                                    {seguimiento.descanso.horaDespertar}
                                  </Text>
                                </View>
                              )}
                            </View>
                          )}
                        </View>
                      </View>
                      
                      {/* Cambios */}
                      <View style={{ marginBottom: seguimiento.notasDelDia ? 16 : 0, backgroundColor: '#F8FAFB', padding: 12, borderRadius: 8 }}>
                        <Text category="s1" style={{ marginBottom: 10, color: '#2E3A59' }}>
                          Cambios
                        </Text>
                        <View style={{ gap: 6 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text category="p2" style={{ color: '#6B7280' }}>Caca:</Text>
                            <Text category="p2" style={{ color: seguimiento.cambios?.caca ? '#00BFA5' : '#8F9BB3' }}>
                              {seguimiento.cambios?.caca ? 'Sí' : 'No'}
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text category="p2" style={{ color: '#6B7280' }}>Pis:</Text>
                            <Text category="p2" style={{ color: seguimiento.cambios?.pis ? '#00BFA5' : '#8F9BB3' }}>
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
          style={{ marginTop: 8, marginBottom: 16, borderRadius: 12, backgroundColor: '#FFFFFF' }}
          onPress={() => setShowFilterPanel(!showFilterPanel)}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="funnel-outline" style={{ width: 20, height: 20 }} fill="#00BFA5" />
              <Text category="s1" style={{ color: '#2E3A59' }}>
                Filtrar fechas
              </Text>
            </View>
            <Icon 
              name={showFilterPanel ? 'chevron-up-outline' : 'chevron-down-outline'} 
              style={{ width: 24, height: 24 }} 
              fill="#8F9BB3" 
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

              <Divider />

              {/* Fechas personalizadas */}
              <Text category="c1" appearance="hint" style={{ marginTop: 4 }}>
                Rango personalizado:
              </Text>
              
              {showDatePicker && (
                <View style={{ marginBottom: 12 }}>
                  <Text category="c1" style={{ marginBottom: 8, color: '#00BFA5', fontWeight: 'bold' }}>
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
function ConfiguracionesTab({ onLogout }: { onLogout: () => void }) {
  const [editingTutor, setEditingTutor] = useState(false);
  const [editingAlumnoId, setEditingAlumnoId] = useState<string | null>(null);
  
  const [tutorNombre, setTutorNombre] = useState('');
  const [tutorApellido, setTutorApellido] = useState('');
  const [tutorTelefono, setTutorTelefono] = useState('');
  const [tutorEmail, setTutorEmail] = useState('');
  
  const [alumnoCondiciones, setAlumnoCondiciones] = useState<string[]>([]);
  const [alumnoObservaciones, setAlumnoObservaciones] = useState('');
  const [alumnoFechaNacimiento, setAlumnoFechaNacimiento] = useState<Date>(new Date());
  const [nuevaCondicion, setNuevaCondicion] = useState('');
  
  const { data: tutorInfoData, refetch: refetchTutor } = useQuery(GET_TUTOR_INFO);
  const { data: alumnosData, refetch: refetchAlumnos } = useQuery(GET_ALUMNOS_TUTOR);
  const [updateTutor] = useMutation(UPDATE_TUTOR_PROFILE);
  const [updateAlumno] = useMutation(UPDATE_ALUMNO_CONDICIONES);
  
  const tutorData = tutorInfoData?.tutorInfo;
  const alumnos = alumnosData?.alumnosTutor || [];
  
  useEffect(() => {
    if (tutorData) {
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
        
        {/* Sección: Datos del Tutor */}
        <Card style={{ marginBottom: 20, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6EBF0' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text category="h6" style={{ color: '#2E3A59' }}>Mis Datos</Text>
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
        <Text category="h6" style={{ marginBottom: 12, color: '#2E3A59' }}>Mis Hijos</Text>
        {alumnos.map((alumno: any) => (
          <Card key={alumno.id} style={{ marginBottom: 16, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6EBF0' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text category="s1" style={{ color: '#2E3A59' }}>
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
                  <Text category="s2" style={{ color: '#2E3A59' }}>
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
                    backgroundColor: '#00BFA5',
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
                    color: '#2E3A59',
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
                backgroundColor: index === currentIndex ? '#00BFA5' : '#CBD5E0',
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// 🏠 DASHBOARD TAB - Feed tipo Instagram/Facebook
function DashboardTab({ 
  alumnos, 
  selectedAlumnoId, 
  setSelectedAlumnoId,
  setActiveTab
}: { 
  alumnos: any[]; 
  selectedAlumnoId: string | null;
  setSelectedAlumnoId: (id: string | null) => void;
  setActiveTab: (tab: string) => void;
}) {
  const [refreshing, setRefreshing] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});
  const [filtroTipo, setFiltroTipo] = useState<string[]>(['MENSAJE', 'ASISTENCIA', 'EVALUACION', 'SEGUIMIENTO']);
  const [mostrarModalFiltros, setMostrarModalFiltros] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null); // null = hoy
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  
  const { data: mensajesData, refetch: refetchMensajes } = useQuery(GET_MENSAJES_TUTOR);
  const mensajes = mensajesData?.mensajesTutor || [];
  const [marcarLeido] = useMutation(MARCAR_MENSAJE_LEIDO);
  
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
    variables: { desde: fechaDesde, hasta: hoy }
  });
  
  // Calificaciones recientes (últimos 30 días desde la fecha seleccionada para ver más datos)
  const fechaLimite = new Date(fechaBaseFin.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Query de calificaciones - NULL para obtener todos los alumnos del tutor
  const { data: calificacionesData, loading: loadingCalificaciones } = useQuery(GET_CALIFICACIONES);
  
  // Seguimiento - Por ahora solo obtenemos los seguimientos consultando individualmente en el frontend
  // Esto requeriría hacer múltiples queries o modificar el backend para aceptar múltiples alumnos
  const alumnosMaternalIds = alumnos.filter((a: any) => a.nivel === 'MATERNAL').map((a: any) => a.id);
  const primerMaternalId = alumnosMaternalIds.length > 0 ? alumnosMaternalIds[0] : null;
  
  // Por ahora solo consultamos el primero - TODO: mejorar para consultar todos
  const { data: seguimientosDataRaw, loading: loadingSeguimientos } = useQuery(GET_SEGUIMIENTO_DIARIO, {
    variables: {
      alumnoId: primerMaternalId,
      fechaInicio: fechaDesde,
      fechaFin: hoy
    },
    skip: !primerMaternalId
  });
  
  // Adaptar formato de seguimientos
  const seguimientosData = React.useMemo(() => {
    return {
      seguimientosDiariosPorAlumno: seguimientosDataRaw?.seguimientosDiariosPorAlumno || []
    };
  }, [seguimientosDataRaw]);
  
  // Crear feed unificado de "posts"
  const feedPosts = React.useMemo(() => {
    const posts: any[] = [];
    
    console.log('=== DASHBOARD DEBUG ===');
    console.log('Fecha base inicio:', fechaBaseInicio.toISOString().split('T')[0]);
    console.log('Fecha base fin:', fechaBaseFin.toISOString().split('T')[0]);
    console.log('Fecha seleccionada:', selectedDate?.toISOString().split('T')[0] || 'ninguna (últimos 3 días)');
    console.log('Mensajes:', mensajes.length);
    console.log('Asistencias data:', asistenciasData?.asistenciasTutor?.length || 0, 'registros');
    console.log('Fecha límite evaluaciones:', fechaLimite.toISOString().split('T')[0]);
    console.log('Rango asistencias/seguimiento:', fechaDesde, 'a', hoy);
    console.log('Calificaciones data:', {
      hasData: !!calificacionesData,
      materias: calificacionesData?.calificacionesTutor?.length || 0
    });
    console.log('Seguimientos data:', { 
      hasData: !!seguimientosData,
      registros: seguimientosData?.seguimientosDiariosPorAlumno?.length || 0
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
      destinatarioIds: m.destinatarioIds,
      tieneDestinatarios: m.destinatarioIds && m.destinatarioIds.length > 0
    })));
    
    mensajesRecientes.forEach((mensaje: any) => {
      // Si el mensaje tiene destinatarioIds, crear un post por cada alumno destinatario
      if (mensaje.destinatarioIds && mensaje.destinatarioIds.length > 0) {
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
        // Mensaje general (sin destinatarios específicos)
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
      asistenciasData.asistenciasTutor.forEach((asistencia: any) => {
        asistencia.registros.forEach((registro: any) => {
          const alumno = alumnos.find((a: any) => a.id === registro.alumnoId);
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
    }
    
    // 3. Evaluaciones recientes - solo para todos los alumnos con data disponible
    if (calificacionesData?.calificacionesTutor) {
      alumnos.forEach((alumno) => {
        calificacionesData.calificacionesTutor.forEach((materia: any) => {
          materia.evaluaciones?.forEach((evaluacion: any) => {
            const fechaEval = new Date(evaluacion.fecha);
            if (fechaEval >= fechaLimite) {
              // Buscar la nota específica de este alumno
              const notaAlumno = evaluacion.notas?.find((n: any) => n.alumnoId === alumno.id);
              if (notaAlumno) {
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
    }
    
    // 4. Seguimiento diario (si aplica)
    if (seguimientosData?.seguimientosDiariosPorAlumno && seguimientosData.seguimientosDiariosPorAlumno.length > 0) {
      seguimientosData.seguimientosDiariosPorAlumno.forEach((seg: any) => {
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
    
    // Ordenar por prioridad descendente y luego por fecha descendente (más nuevo primero)
    return posts.sort((a, b) => {
      // Primero por prioridad (mayor prioridad primero)
      if (a.prioridad !== b.prioridad) {
        return b.prioridad - a.prioridad;
      }
      // Luego por fecha (más reciente primero)
      const fechaA = new Date(a.fecha).getTime();
      const fechaB = new Date(b.fecha).getTime();
      return fechaB - fechaA; // Más nuevo primero
    });
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
    const posTeosDeEjemplo = [
      {
        id: 'ejemplo-1',
        tipo: 'MENSAJE',
        fecha: new Date().toISOString(),
        contenido: {
          id: 'ej1',
          titulo: '🎉 ¡Bienvenida Nueva Directora!',
          contenido: 'Nos complace anunciar que la Directora María García se unirá a nuestro equipo. ¡Esperamos un excelente año juntas!',
          autorNombre: 'Dirección',
          publicadoEn: new Date().toISOString(),
          creadoEn: new Date().toISOString(),
          leido: false,
          imagen: undefined
        },
        alumno: null,
        prioridad: 3
      },
      {
        id: 'ejemplo-2',
        tipo: 'MENSAJE',
        fecha: new Date(Date.now() - 86400000).toISOString(),
        contenido: {
          id: 'ej2',
          titulo: '🏆 Ganadores Olimpíada Matemática',
          contenido: 'Felicitamos a nuestros estudiantes por obtener el primer lugar en la competencia regional. ¡Orgullo del colegio!',
          autorNombre: 'Rectorado',
          publicadoEn: new Date(Date.now() - 86400000).toISOString(),
          creadoEn: new Date(Date.now() - 86400000).toISOString(),
          leido: true,
          imagen: undefined
        },
        alumno: null,
        prioridad: 3
      },
      {
        id: 'ejemplo-3',
        tipo: 'MENSAJE',
        fecha: new Date(Date.now() - 172800000).toISOString(),
        contenido: {
          id: 'ej3',
          titulo: '📚 Nueva Biblioteca Digital',
          contenido: 'Ya disponible: acceso a miles de libros y recursos educativos. Ingresa con tu usuario del colegio.',
          autorNombre: 'Biblioteca',
          publicadoEn: new Date(Date.now() - 172800000).toISOString(),
          creadoEn: new Date(Date.now() - 172800000).toISOString(),
          leido: true,
          imagen: undefined
        },
        alumno: null,
        prioridad: 3
      },
      {
        id: 'ejemplo-4',
        tipo: 'MENSAJE',
        fecha: new Date(Date.now() - 259200000).toISOString(),
        contenido: {
          id: 'ej4',
          titulo: '⚽ Campeonato Inter-colegial',
          contenido: 'Nos vemos el 15/11 en el estadio municipal. ¡Ven a apoyar a nuestros deportistas! Evento abierto a toda la comunidad.',
          autorNombre: 'Deportes',
          publicadoEn: new Date(Date.now() - 259200000).toISOString(),
          creadoEn: new Date(Date.now() - 259200000).toISOString(),
          leido: true,
          imagen: undefined
        },
        alumno: null,
        prioridad: 3
      }
    ];
    
    // DESCOMENTAR LA LÍNEA DE ABAJO PARA VER LOS POSTEOS DE EJEMPLO
    postsFiltrados = [...posTeosDeEjemplo, ...postsFiltrados];
    
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
  
  return (
    <Layout style={{ flex: 1 }} level="2">
      {/* Filtro de alumnos */}
      <FiltroAlumnos 
        alumnos={alumnos}
        selectedAlumnoId={selectedAlumnoId}
        setSelectedAlumnoId={setSelectedAlumnoId}
      />
      
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#00BFA5']}
            tintColor="#00BFA5"
          />
        }
      >
        {/* 📸 CARRUSEL DE POSTEOS GENERALES */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <CarruselPosteos mensajesGenerales={postsPorAlumno.mensajesGenerales} />
        </View>

        {/* Header de bienvenida con fecha */}
        <View style={{ padding: 16, paddingBottom: 8 }}>
          <Text category="h6" style={{ color: '#2E3A59', marginBottom: 4 }}>
            {selectedDate ? '📅 Actividad del día' : '🏠 Novedades de Hoy'}
          </Text>
          <Text appearance="hint" style={{ fontSize: 13 }}>
            {selectedDate 
              ? new Date(selectedDate).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
              : new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
            }
          </Text>
        </View>

        {/* Cards por Alumno - COMPRIMIDO Y EXPANDIBLE */}
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {(() => {
            // Filtrar alumnos si hay un filtro activo
            const alumnosFiltrados = selectedAlumnoId 
              ? alumnos.filter((a: any) => a.id === selectedAlumnoId)
              : alumnos;

            // Calcular rango de fechas para filtrar novedades recientes
            const fechaLimiteMensajes = selectedDate 
              ? new Date(selectedDate.getTime() - 7 * 24 * 60 * 60 * 1000)
              : fechaBaseInicio;

            // Calcular novedades por alumno (solo recientes)
            const alumnosConNovedades = alumnosFiltrados.map((alumno: any) => {
              // Mensajes del alumno (solo recientes y del rango de fechas)
              const mensajesAlumno = mensajes.filter((m: any) => {
                const fechaMensaje = new Date(m.publicadoEn || m.creadoEn);
                const enRango = fechaMensaje >= fechaLimiteMensajes && fechaMensaje <= fechaBaseFin;
                
                // Verificar si el alumno es destinatario
                if (m.destinatarioIds && Array.isArray(m.destinatarioIds)) {
                  return enRango && m.destinatarioIds.includes(alumno.id);
                }
                
                // Si no tiene destinatarios específicos, es mensaje general (no contar por alumno)
                return false;
              });
              
              // Asistencias del alumno (procesar estructura correcta de asistenciasTutor)
              const asistenciasAlumno: any[] = [];
              if (asistenciasData?.asistenciasTutor) {
                asistenciasData.asistenciasTutor.forEach((asistencia: any) => {
                  asistencia.registros.forEach((registro: any) => {
                    if (registro.alumnoId === alumno.id) {
                      // Extraer solo la fecha (YYYY-MM-DD) del formato ISO
                      const fechaSoloDate = asistencia.fecha.split('T')[0];
                      
                      asistenciasAlumno.push({
                        alumnoId: registro.alumnoId,
                        fecha: fechaSoloDate,
                        presente: registro.estado === 'PRESENTE',
                        estado: registro.estado,
                        observaciones: registro.observaciones
                      });
                    }
                  });
                });
              }
              
              // Evaluaciones del alumno (filtrar por fecha límite de 30 días y por alumno)
              let evaluacionesAlumno: any[] = [];
              if (calificacionesData?.calificacionesTutor) {
                calificacionesData.calificacionesTutor.forEach((materia: any) => {
                  if (materia.evaluaciones) {
                    materia.evaluaciones.forEach((evaluacion: any) => {
                      const fechaEval = new Date(evaluacion.fecha);
                      const enRango = fechaEval >= fechaLimite && fechaEval <= fechaBaseFin;
                      
                      // Verificar si esta evaluación tiene una nota para este alumno
                      if (enRango && evaluacion.notas) {
                        const tieneNotaAlumno = evaluacion.notas.some((nota: any) => 
                          nota.alumnoId === alumno.id
                        );
                        if (tieneNotaAlumno) {
                          evaluacionesAlumno.push(evaluacion);
                        }
                      }
                    });
                  }
                });
              }
              
              // Seguimientos del alumno (ya vienen filtrados por fecha desde el query)
              const seguimientosAlumno = seguimientosData?.seguimientosDiariosPorAlumno?.filter((s: any) => 
                s.alumnoId === alumno.id
              ) || [];
              
              // Verificar si tiene asistencia de HOY
              const hoyStr = formatearFechaLocal(new Date());
              const asistenciaHoy = asistenciasAlumno.find((a: any) => a.fecha === hoyStr);
              const tieneAsistenciaHoy = !!asistenciaHoy;
              
              // Contar total de novedades (asistencia solo cuenta si tiene registro de hoy)
              const totalNovedades = 
                (filtroTipo.includes('MENSAJE') ? mensajesAlumno.length : 0) +
                (filtroTipo.includes('ASISTENCIA') && tieneAsistenciaHoy ? 1 : 0) +
                (filtroTipo.includes('EVALUACION') ? evaluacionesAlumno.length : 0) +
                (filtroTipo.includes('SEGUIMIENTO') ? seguimientosAlumno.length : 0);
              
              return {
                ...alumno,
                mensajes: mensajesAlumno,
                asistencias: asistenciasAlumno,
                evaluaciones: evaluacionesAlumno,
                seguimientos: seguimientosAlumno,
                totalNovedades
              };
            });

            // Ordenar: primero los que tienen novedades, luego los que no
            const alumnosOrdenados = alumnosConNovedades.sort((a, b) => {
              if (a.totalNovedades > 0 && b.totalNovedades === 0) return -1;
              if (a.totalNovedades === 0 && b.totalNovedades > 0) return 1;
              return b.totalNovedades - a.totalNovedades;
            });

            return alumnosOrdenados.map((alumno: any) => {
              const isExpanded = expandedPosts[`alumno-${alumno.id}`];
              const tieneNovedades = alumno.totalNovedades > 0;
              
              return (
                <Card 
                  key={alumno.id} 
                  style={{ 
                    marginBottom: 0, 
                    borderRadius: 12, 
                    backgroundColor: tieneNovedades ? '#FFFFFF' : '#F8FAFB',
                    borderWidth: 1,
                    borderColor: tieneNovedades ? '#E0E8F1' : '#E6EBF0',
                    overflow: 'hidden'
                  }}
                >
                  {/* Header Comprimido - Siempre Visible */}
                  <TouchableOpacity 
                    onPress={() => setExpandedPosts(prev => ({ ...prev, [`alumno-${alumno.id}`]: !isExpanded }))}
                    style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      backgroundColor: tieneNovedades ? '#FFFFFF' : '#F8FAFB'
                    }}
                  >
                    {/* Avatar + Info */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <View style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: tieneNovedades ? '#00BFA5' : '#CBD5E0',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' }}>
                          {alumno.nombre.charAt(0)}{alumno.apellido.charAt(0)}
                        </Text>
                      </View>
                      
                      <View style={{ flex: 1 }}>
                        <Text category="s2" style={{ color: '#2E3A59', fontWeight: '600' }}>
                          {alumno.nombre} {alumno.apellido}
                        </Text>
                        <Text appearance="hint" category="c2" style={{ fontSize: 11 }}>
                          {alumno.nivel} {alumno.division ? `• ${alumno.division}` : ''}
                        </Text>
                      </View>
                    </View>
                    
                    {/* Indicador de Novedades + Icono Expandir */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {tieneNovedades && (
                        <View style={{
                          backgroundColor: '#00BFA5',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 12
                        }}>
                          <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 }}>
                            {alumno.totalNovedades}
                          </Text>
                        </View>
                      )}
                      
                      <Icon 
                        name={isExpanded ? "chevron-up-outline" : "chevron-down-outline"} 
                        fill={tieneNovedades ? '#00BFA5' : '#CBD5E0'} 
                        style={{ width: 20, height: 20 }} 
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Contenido Expandible */}
                  {isExpanded && (
                    <View style={{ 
                      borderTopWidth: 1, 
                      borderTopColor: '#E6EBF0',
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      gap: 8,
                      backgroundColor: tieneNovedades ? '#FAFBFC' : '#F8FAFB'
                    }}>
                      {/* Mensajes */}
                      {filtroTipo.includes('MENSAJE') && (
                        <TouchableOpacity
                          style={{ 
                            flexDirection: 'row', 
                            alignItems: 'center', 
                            gap: 8,
                            paddingHorizontal: 8,
                            paddingVertical: 8,
                            borderRadius: 8,
                            backgroundColor: alumno.mensajes.length > 0 ? '#EFF6FF' : '#F9FAFB'
                          }}
                          onPress={() => {
                            if (alumno.mensajes.length > 0) {
                              setSelectedAlumnoId(alumno.id);
                              setActiveTab('mensajes');
                            }
                          }}
                        >
                          <Icon name="email-outline" fill="#3B82F6" style={{ width: 18, height: 18 }} />
                          <View style={{ flex: 1 }}>
                            <Text category="c2" style={{ color: '#2E3A59', fontWeight: '500' }}>Mensajes</Text>
                          </View>
                          <Text style={{ 
                            color: alumno.mensajes.length > 0 ? '#3B82F6' : '#9CA3AF',
                            fontWeight: 'bold',
                            fontSize: 13
                          }}>
                            {alumno.mensajes.length}
                          </Text>
                        </TouchableOpacity>
                      )}

                      {/* Asistencias */}
                      {filtroTipo.includes('ASISTENCIA') && (() => {
                        const hoyStr = formatearFechaLocal(new Date());
                        const asistenciaHoy = alumno.asistencias.find((a: any) => a.fecha === hoyStr);
                        const tieneAsistenciaHoy = !!asistenciaHoy;
                        const estaPresente = asistenciaHoy?.presente || false;
                        
                        return (
                          <TouchableOpacity
                            style={{ 
                              flexDirection: 'row', 
                              alignItems: 'center', 
                              gap: 8,
                              paddingHorizontal: 8,
                              paddingVertical: 8,
                              borderRadius: 8,
                              backgroundColor: tieneAsistenciaHoy 
                                ? (estaPresente ? '#ECFDF5' : '#FEE2E2') 
                                : '#F9FAFB'
                            }}
                            onPress={() => {
                              setSelectedAlumnoId(alumno.id);
                              setActiveTab('asistencias');
                            }}
                          >
                            <Icon 
                              name={tieneAsistenciaHoy ? (estaPresente ? "checkmark-circle-outline" : "close-circle-outline") : "alert-circle-outline"} 
                              fill={tieneAsistenciaHoy ? (estaPresente ? '#10B981' : '#EF4444') : '#9CA3AF'} 
                              style={{ width: 18, height: 18 }} 
                            />
                            <View style={{ flex: 1 }}>
                              <Text category="c2" style={{ color: '#2E3A59', fontWeight: '500' }}>Asistencia</Text>
                            </View>
                            <Text style={{ 
                              color: tieneAsistenciaHoy ? (estaPresente ? '#10B981' : '#EF4444') : '#9CA3AF',
                              fontWeight: 'bold',
                              fontSize: 12
                            }}>
                              {tieneAsistenciaHoy 
                                ? (estaPresente ? 'PRESENTE' : 'AUSENTE')
                                : 'N/A'}
                            </Text>
                          </TouchableOpacity>
                        );
                      })()}

                      {/* Evaluaciones */}
                      {filtroTipo.includes('EVALUACION') && (
                        <TouchableOpacity
                          style={{ 
                            flexDirection: 'row', 
                            alignItems: 'center', 
                            gap: 8,
                            paddingHorizontal: 8,
                            paddingVertical: 8,
                            borderRadius: 8,
                            backgroundColor: alumno.evaluaciones.length > 0 ? '#FFFBEB' : '#F9FAFB'
                          }}
                          onPress={() => {
                            if (alumno.evaluaciones.length > 0) {
                              setSelectedAlumnoId(alumno.id);
                              setActiveTab('evaluaciones');
                            }
                          }}
                        >
                          <Icon name="star-outline" fill="#F59E0B" style={{ width: 18, height: 18 }} />
                          <View style={{ flex: 1 }}>
                            <Text category="c2" style={{ color: '#2E3A59', fontWeight: '500' }}>Evaluaciones</Text>
                          </View>
                          <Text style={{ 
                            color: alumno.evaluaciones.length > 0 ? '#F59E0B' : '#9CA3AF',
                            fontWeight: 'bold',
                            fontSize: 13
                          }}>
                            {alumno.evaluaciones.length}
                          </Text>
                        </TouchableOpacity>
                      )}

                      {/* Seguimientos */}
                      {filtroTipo.includes('SEGUIMIENTO') && alumno.nivel === 'MATERNAL' && (
                        <TouchableOpacity
                          style={{ 
                            flexDirection: 'row', 
                            alignItems: 'center', 
                            gap: 8,
                            paddingHorizontal: 8,
                            paddingVertical: 8,
                            borderRadius: 8,
                            backgroundColor: alumno.seguimientos.length > 0 ? '#F5F3FF' : '#F9FAFB'
                          }}
                          onPress={() => {
                            if (alumno.seguimientos.length > 0) {
                              setSelectedAlumnoId(alumno.id);
                              setActiveTab('seguimiento');
                            }
                          }}
                        >
                          <Icon name="heart-outline" fill="#8B5CF6" style={{ width: 18, height: 18 }} />
                          <View style={{ flex: 1 }}>
                            <Text category="c2" style={{ color: '#2E3A59', fontWeight: '500' }}>Seguimiento</Text>
                          </View>
                          <Text style={{ 
                            color: alumno.seguimientos.length > 0 ? '#8B5CF6' : '#9CA3AF',
                            fontWeight: 'bold',
                            fontSize: 13
                          }}>
                            {alumno.seguimientos.length}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </Card>
              );
            });
          })()}
        </View>
        
        <View style={{ height: 80 }} />
      </ScrollView>
      
      {/* Modal de Filtros */}
      <Modal
        visible={mostrarModalFiltros}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setMostrarModalFiltros(false)}
      >
        {/* Blur de fondo */}
        {Platform.OS === 'ios' ? (
          <BlurView
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            blurType="light"
            blurAmount={20}
            reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.9)"
          />
        ) : (
          <View style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.85)'
          }} />
        )}
        
        <View style={{ 
          flex: 1, 
          backgroundColor: 'rgba(0, 0, 0, 0.5)', 
          justifyContent: 'flex-end'
        }}>
          <View style={{ 
            backgroundColor: '#FFFFFF', 
            borderTopLeftRadius: 24, 
            borderTopRightRadius: 24,
            padding: 20,
            maxHeight: '80%'
          }}>
            {/* Header del modal */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text category="h6" style={{ color: '#2E3A59' }}>Filtros</Text>
              <TouchableOpacity onPress={() => setMostrarModalFiltros(false)}>
                <Icon name="close-outline" style={{ width: 28, height: 28 }} fill="#8F9BB3" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Filtros por tipo */}
              <Text category="s1" style={{ marginBottom: 12, color: '#2E3A59' }}>Tipo de novedad</Text>
              <View style={{ gap: 10, marginBottom: 24 }}>
                <TouchableOpacity
                  onPress={() => toggleFiltroTipo('MENSAJE')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: filtroTipo.includes('MENSAJE') ? '#FFE8EE' : '#F8FAFB',
                    borderWidth: 1,
                    borderColor: filtroTipo.includes('MENSAJE') ? '#FF3D71' : '#E4E9F2'
                  }}
                >
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#FFE8EE',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12
                  }}>
                    <Icon name="email" fill="#FF3D71" style={{ width: 20, height: 20 }} />
                  </View>
                  <Text style={{ flex: 1, color: '#2E3A59' }}>Mensajes</Text>
                  {filtroTipo.includes('MENSAJE') && (
                    <Icon name="checkmark-circle-2" fill="#FF3D71" style={{ width: 24, height: 24 }} />
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => toggleFiltroTipo('ASISTENCIA')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: filtroTipo.includes('ASISTENCIA') ? '#E8F8F5' : '#F8FAFB',
                    borderWidth: 1,
                    borderColor: filtroTipo.includes('ASISTENCIA') ? '#00BFA5' : '#E4E9F2'
                  }}
                >
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#E8F8F5',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12
                  }}>
                    <Icon name="calendar" fill="#00BFA5" style={{ width: 20, height: 20 }} />
                  </View>
                  <Text style={{ flex: 1, color: '#2E3A59' }}>Asistencias</Text>
                  {filtroTipo.includes('ASISTENCIA') && (
                    <Icon name="checkmark-circle-2" fill="#00BFA5" style={{ width: 24, height: 24 }} />
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => toggleFiltroTipo('EVALUACION')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: filtroTipo.includes('EVALUACION') ? '#E3F2FD' : '#F8FAFB',
                    borderWidth: 1,
                    borderColor: filtroTipo.includes('EVALUACION') ? '#2196F3' : '#E4E9F2'
                  }}
                >
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#E3F2FD',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12
                  }}>
                    <Icon name="bar-chart" fill="#2196F3" style={{ width: 20, height: 20 }} />
                  </View>
                  <Text style={{ flex: 1, color: '#2E3A59' }}>Evaluaciones</Text>
                  {filtroTipo.includes('EVALUACION') && (
                    <Icon name="checkmark-circle-2" fill="#2196F3" style={{ width: 24, height: 24 }} />
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => toggleFiltroTipo('SEGUIMIENTO')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: filtroTipo.includes('SEGUIMIENTO') ? '#FFF3E0' : '#F8FAFB',
                    borderWidth: 1,
                    borderColor: filtroTipo.includes('SEGUIMIENTO') ? '#FFB020' : '#E4E9F2'
                  }}
                >
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#FFF3E0',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12
                  }}>
                    <Icon name="activity" fill="#FFB020" style={{ width: 20, height: 20 }} />
                  </View>
                  <Text style={{ flex: 1, color: '#2E3A59' }}>Seguimiento Diario</Text>
                  {filtroTipo.includes('SEGUIMIENTO') && (
                    <Icon name="checkmark-circle-2" fill="#FFB020" style={{ width: 24, height: 24 }} />
                  )}
                </TouchableOpacity>
              </View>
              
              {/* Filtros por alumno - ELIMINADO (ahora está en el header) */}
              
              {/* Filtro por fecha */}
              <Divider style={{ marginBottom: 16 }} />
              <Text category="s1" style={{ marginBottom: 12, color: '#2E3A59' }}>Fecha</Text>
              <View style={{ gap: 10, marginBottom: 16 }}>
                {/* Botón "Hoy" */}
                <TouchableOpacity
                  onPress={() => setSelectedDate(null)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: !selectedDate ? '#E6F7F4' : '#F8FAFB',
                    borderWidth: 1,
                    borderColor: !selectedDate ? '#00BFA5' : '#E4E9F2'
                  }}
                >
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#E6F7F4',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12
                  }}>
                    <Icon name="calendar" fill="#00BFA5" style={{ width: 20, height: 20 }} />
                  </View>
                  <Text style={{ flex: 1, color: '#2E3A59' }}>Hoy</Text>
                  {!selectedDate && (
                    <Icon name="checkmark-circle-2" fill="#00BFA5" style={{ width: 24, height: 24 }} />
                  )}
                </TouchableOpacity>
                
                {/* Botón para seleccionar fecha */}
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: selectedDate ? '#E6F7F4' : '#F8FAFB',
                    borderWidth: 1,
                    borderColor: selectedDate ? '#00BFA5' : '#E4E9F2'
                  }}
                >
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#E6F7F4',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12
                  }}>
                    <Icon name="calendar-outline" fill="#00BFA5" style={{ width: 20, height: 20 }} />
                  </View>
                  <Text style={{ flex: 1, color: '#2E3A59' }}>
                    {selectedDate 
                      ? selectedDate.toLocaleDateString('es-AR', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'long' 
                        })
                      : 'Seleccionar otro día'
                    }
                  </Text>
                  {selectedDate && (
                    <Icon name="checkmark-circle-2" fill="#00BFA5" style={{ width: 24, height: 24 }} />
                  )}
                </TouchableOpacity>
              </View>
              
              {/* Botones de acción */}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <Button
                  style={{ flex: 1 }}
                  appearance="outline"
                  onPress={() => {
                    setFiltroTipo(['MENSAJE', 'ASISTENCIA', 'EVALUACION', 'SEGUIMIENTO']);
                    setSelectedAlumnoId(null);
                    setSelectedDate(null);
                  }}
                >
                  Limpiar
                </Button>
                <Button
                  style={{ flex: 1 }}
                  onPress={() => setMostrarModalFiltros(false)}
                >
                  Aplicar
                </Button>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Modal de DatePicker */}
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
            
            <View style={{ width: '100%', maxWidth: 400, zIndex: 1 }}>
              <Card disabled style={{ borderRadius: 20 }}>
                <Text category="h6" style={{ marginBottom: 16, textAlign: 'center' }}>
                  Seleccionar fecha
                </Text>
                
                {/* DatePicker */}
                <Datepicker
                  date={tempDate}
                  onSelect={(date) => setTempDate(date)}
                  filter={(date) => {
                    // Deshabilitar sábados (6) y domingos (0)
                    const diaSemana = date.getDay();
                    return diaSemana !== 0 && diaSemana !== 6;
                  }}
                  style={{ marginBottom: 16 }}
                />
                
                {/* Botones de acción */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button
                    style={{ flex: 1 }}
                    appearance="outline"
                    onPress={() => setShowDatePicker(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    style={{ flex: 1 }}
                    onPress={() => {
                      setSelectedDate(tempDate);
                      setShowDatePicker(false);
                    }}
                  >
                    Seleccionar
                  </Button>
                </View>
              </Card>
            </View>
          </View>
        </Modal>
      )}
    </Layout>
  );
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
          <Text category="s1" style={{ fontWeight: 'bold', color: '#2E3A59' }}>
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
          <Text category="c2" style={{ color: '#00BFA5' }}>
            Tocar para ver más
          </Text>
        </View>
      )}
    </Card>
  );
}

// 📅 Componente de Post para Asistencia
function AsistenciaPost({ asistencia, alumno }: { asistencia: any; alumno: any }) {
  const presente = asistencia.estado === 'PRESENTE' || asistencia.estado === 'TARDE';
  
  return (
    <Card 
      style={{ 
        borderRadius: 16, 
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E4E9F2'
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
            fill={presente ? '#00BFA5' : '#FF6B6B'}
            style={{ width: 24, height: 24 }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text category="s1" style={{ fontWeight: 'bold', color: '#2E3A59' }}>
            Asistencia
          </Text>
          <Text appearance="hint" category="c1">
            {formatearFechaLegible(asistencia.fecha)}
          </Text>
        </View>
        <View style={{ 
          backgroundColor: presente ? '#E8F8F5' : '#FFE8E8',
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 12
        }}>
          <Text style={{ 
            fontWeight: 'bold',
            fontSize: 12,
            color: presente ? '#00BFA5' : '#FF6B6B'
          }}>
            {asistencia.estado === 'TARDE' ? 'TARDE' : presente ? 'PRESENTE' : 'AUSENTE'}
          </Text>
        </View>
      </View>
      
      {asistencia.observaciones && (
        <View style={{ backgroundColor: '#FFF3E0', padding: 10, borderRadius: 8, marginTop: 12 }}>
          <Text appearance="hint" category="c1" style={{ marginBottom: 4 }}>Observaciones:</Text>
          <Text category="p2">{asistencia.observaciones}</Text>
        </View>
      )}
    </Card>
  );
}

// 📊 Componente de Post para Evaluación
function EvaluacionPost({ evaluacion, alumno }: { evaluacion: any; alumno: any }) {
  const calificacion = evaluacion.notaAlumno?.calificacion;
  let valorMostrar = 'S/N';
  let color = '#8F9BB3';
  
  if (calificacion) {
    if (calificacion.tipo === 'NUMERICA' && calificacion.valorNumerico != null) {
      valorMostrar = calificacion.valorNumerico.toFixed(1);
      color = calificacion.valorNumerico >= 7 ? '#00BFA5' : calificacion.valorNumerico >= 4 ? '#FF9800' : '#F44336';
    } else if (calificacion.tipo === 'CONCEPTUAL' && calificacion.valorConceptual) {
      valorMostrar = calificacion.valorConceptual;
      color = calificacion.aprobado ? '#00BFA5' : '#F44336';
    }
  }
  
  return (
    <Card 
      style={{ 
        borderRadius: 16, 
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E4E9F2'
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
          <Text category="s1" style={{ fontWeight: 'bold', color: '#2E3A59' }}>
            Evaluación
          </Text>
          <Text appearance="hint" category="c1">
            {formatearFechaLegible(evaluacion.fecha)}
          </Text>
        </View>
        <View style={{ 
          backgroundColor: color + '20',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 12
        }}>
          <Text style={{ color, fontWeight: 'bold', fontSize: 18 }}>
            {valorMostrar}
          </Text>
        </View>
      </View>
      
      <Text category="s2" style={{ color: '#2196F3', marginBottom: 4 }}>
        {evaluacion.materiaNombre}
      </Text>
      <Text category="h6" style={{ marginBottom: 8 }}>
        {evaluacion.tema || evaluacion.tipo}
      </Text>
      
      {evaluacion.notaAlumno?.observaciones && (
        <View style={{ backgroundColor: '#FFF3E0', padding: 10, borderRadius: 8, marginTop: 8 }}>
          <Text appearance="hint" category="c1" style={{ marginBottom: 4 }}>Observaciones:</Text>
          <Text category="p2">{evaluacion.notaAlumno.observaciones}</Text>
        </View>
      )}
    </Card>
  );
}

// 🍼 Componente de Post para Seguimiento
function SeguimientoPost({ seguimiento, alumno, expanded, onToggle }: { seguimiento: any; alumno: any; expanded: boolean; onToggle: () => void }) {
  const getEstadoColor = () => {
    if (seguimiento.estadoDelDia === 'muy-bueno') return '#00BFA5';
    if (seguimiento.estadoDelDia === 'bueno') return '#FFB020';
    return '#FF6B6B';
  };
  
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
          <Text category="s1" style={{ fontWeight: 'bold', color: '#2E3A59' }}>
            Seguimiento Diario
          </Text>
          <Text appearance="hint" category="c1">
            {formatearFechaLegible(seguimiento.fecha)}
          </Text>
        </View>
        <View style={{ 
          backgroundColor: getEstadoColor() + '20',
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 12
        }}>
          <Text style={{ color: getEstadoColor(), fontSize: 12, fontWeight: 'bold' }}>
            {seguimiento.estadoDelDia?.replace(/-/g, ' ').toUpperCase()}
          </Text>
        </View>
      </View>
      
      {/* Resumen compacto */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
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
      
      {!expanded && (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
          <Text category="c2" style={{ color: '#00BFA5' }}>
            Tocar para ver más
          </Text>
        </View>
      )}
      
      {expanded && seguimiento.notasDelDia && (
        <View style={{ marginTop: 12, backgroundColor: '#FEF3C7', padding: 10, borderRadius: 8 }}>
          <Text appearance="hint" category="c1" style={{ marginBottom: 4 }}>Notas:</Text>
          <Text category="p2">{seguimiento.notasDelDia}</Text>
        </View>
      )}
    </Card>
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

// 🎯 APP CONTENT
function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();
  
  // 🔔 Mutación para guardar el push token
  const [updatePushToken] = useMutation(UPDATE_PUSH_TOKEN);

  useEffect(() => {
    // Animación del splash
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 2,
        useNativeDriver: true,
      })
    ]).start();

    // Después de 2.5 segundos, fade out y cargar app
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setShowSplash(false);
        checkAuth();
      });
    }, 2500);
  }, []);

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
          lightColor: '#00BFA5',
        });
      }
    } catch (error) {
      console.error('Error registrando notificaciones:', error);
    }
  };

  // Mostrar splash screen
  if (showSplash) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: '#FFFFFF',
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <Animated.View style={{
          opacity: fadeAnim,
          alignItems: 'center'
        }}>
          {/* Logo de Teresa - minimalista */}
          <TeresaLogo size={80} />
          
          <Text style={{
            marginTop: 16,
            fontSize: 12,
            color: '#718096',
            fontStyle: 'italic',
            letterSpacing: 0.5
          }}>
            Conexión Familiar
          </Text>
        </Animated.View>
      </View>
    );
  }

  if (loading) {
    return (
      <Layout style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Spinner size="giant" />
      </Layout>
    );
  }

  return isAuthenticated ? <HomeScreen onLogout={handleLogout} /> : <LoginScreen onLogin={handleLogin} />;
}

// 🎨 APP PRINCIPAL
export default function App() {
  return (
    <>
      <IconRegistry icons={EvaIconsPack} />
      <ApplicationProvider {...eva} theme={customTheme}>
        <ApolloProvider client={apolloClient}>
          <AppContent />
        </ApolloProvider>
      </ApplicationProvider>
    </>
  );
}
