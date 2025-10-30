import React, { useState, useEffect } from 'react';
import { View, SafeAreaView, ScrollView, RefreshControl } from 'react-native';
import { ApplicationProvider, Layout, Text, Input, Button, Card, Spinner, Modal, Divider, Icon, TopNavigation, TopNavigationAction } from '@ui-kitten/components';
import * as eva from '@eva-design/eva';
import { ApolloProvider, useMutation, useQuery } from '@apollo/client';
import { apolloClient } from './src/config/apollo';
import { LOGIN_TUTOR, GET_MENSAJES_TUTOR } from './src/graphql/queries';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🎨 Temas personalizados
const customLightTheme = {
  ...eva.light,
  'color-primary-500': '#6949FF',
  'color-primary-600': '#4D35DB',
};

const customDarkTheme = {
  ...eva.dark,
  'color-primary-500': '#6949FF',
  'color-primary-600': '#4D35DB',
};

// 🔐 LOGIN
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [documento, setDocumento] = useState('');
  const [password, setPassword] = useState('');
  const [loginTutor, { loading }] = useMutation(LOGIN_TUTOR);

  const handleLogin = async () => {
    try {
      const { data } = await loginTutor({ variables: { documento, password } });
      if (data?.loginTutorPassword?.token) {
        await AsyncStorage.setItem('authToken', data.loginTutorPassword.token);
        await AsyncStorage.setItem('tutorData', JSON.stringify(data.loginTutorPassword.tutor));
        onLogin();
      }
    } catch (error: any) {
      alert(error.message || 'Error en el login');
    }
  };

  const PersonIcon = (props: any) => <Icon {...props} name="person-outline" />;
  const LockIcon = (props: any) => <Icon {...props} name="lock-outline" />;

  return (
    <Layout style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Card disabled style={{ marginBottom: 20 }}>
        <Text category="h1" style={{ marginBottom: 8 }}>¡Hola! 👋</Text>
        <Text category="s1" appearance="hint">Ingresá tus datos</Text>
      </Card>

      <Input
        placeholder="Documento"
        value={documento}
        onChangeText={setDocumento}
        accessoryLeft={PersonIcon}
        keyboardType="numeric"
        size="large"
        style={{ marginBottom: 16 }}
      />

      <Input
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        accessoryLeft={LockIcon}
        secureTextEntry
        size="large"
        style={{ marginBottom: 20 }}
      />

      <Button onPress={handleLogin} disabled={loading || !documento || !password} size="large">
        {loading ? 'Ingresando...' : 'Ingresar'}
      </Button>
    </Layout>
  );
}

// 🏠 HOME
function HomeScreen({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState('mensajes');
  const [mensajes, setMensajes] = useState<any[]>([]);

  const LogoutIcon = (props: any) => <Icon {...props} name="log-out-outline" />;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopNavigation
        title="movilTeresa"
        alignment="center"
        accessoryRight={() => <TopNavigationAction icon={LogoutIcon} onPress={onLogout} />}
      />
      <Divider />

      <Layout style={{ flex: 1 }}>
        {activeTab === 'mensajes' && <MensajesTab onMensajesUpdate={setMensajes} />}
        {activeTab === 'dashboard' && <PlaceholderTab icon="home-outline" title="Dashboard" />}
        {activeTab === 'asistencias' && <PlaceholderTab icon="calendar-outline" title="Asistencias" />}
        {activeTab === 'calificaciones' && <PlaceholderTab icon="bar-chart-outline" title="Calificaciones" />}
      </Layout>

      {/* TAB BAR */}
      <Layout level="2" style={{ flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 4 }}>
        <Button
          appearance={activeTab === 'dashboard' ? 'filled' : 'ghost'}
          accessoryLeft={(props) => <Icon {...props} name="home-outline" />}
          onPress={() => setActiveTab('dashboard')}
          style={{ flex: 1, marginHorizontal: 2 }}
        >
          Inicio
        </Button>
        <Button
          appearance={activeTab === 'mensajes' ? 'filled' : 'ghost'}
          accessoryLeft={(props) => <Icon {...props} name="email-outline" />}
          onPress={() => setActiveTab('mensajes')}
          style={{ flex: 1, marginHorizontal: 2 }}
        >
          {mensajes.length > 0 ? `(${mensajes.length})` : 'Mensajes'}
        </Button>
        <Button
          appearance={activeTab === 'asistencias' ? 'filled' : 'ghost'}
          accessoryLeft={(props) => <Icon {...props} name="calendar-outline" />}
          onPress={() => setActiveTab('asistencias')}
          style={{ flex: 1, marginHorizontal: 2 }}
        >
          Asist.
        </Button>
        <Button
          appearance={activeTab === 'calificaciones' ? 'filled' : 'ghost'}
          accessoryLeft={(props) => <Icon {...props} name="bar-chart-outline" />}
          onPress={() => setActiveTab('calificaciones')}
          style={{ flex: 1, marginHorizontal: 2 }}
        >
          Notas
        </Button>
      </Layout>
    </SafeAreaView>
  );
}

// 📧 MENSAJES
function MensajesTab({ onMensajesUpdate }: { onMensajesUpdate: (mensajes: any[]) => void }) {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMensaje, setSelectedMensaje] = useState<any>(null);
  const { data, loading, refetch } = useQuery(GET_MENSAJES_TUTOR);

  const mensajes = data?.mensajesTutor || [];

  useEffect(() => {
    if (mensajes.length > 0) {
      onMensajesUpdate(mensajes);
    }
  }, [mensajes.length]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading && !refreshing) {
    return (
      <Layout style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Spinner size="giant" />
        <Text category="s1" appearance="hint" style={{ marginTop: 16 }}>Cargando...</Text>
      </Layout>
    );
  }

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {mensajes.length === 0 ? (
          <Card disabled>
            <View style={{ alignItems: 'center', padding: 20 }}>
              <Icon name="email-outline" style={{ width: 64, height: 64 }} fill="#8F9BB3" />
              <Text category="h6" style={{ marginTop: 16 }}>No hay mensajes</Text>
            </View>
          </Card>
        ) : (
          mensajes.map((mensaje: any) => (
            <Card
              key={mensaje._id}
              style={{ marginBottom: 12 }}
              onPress={() => setSelectedMensaje(mensaje)}
              header={() => (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16, paddingBottom: 0 }}>
                  <Text category="s1">{mensaje.asunto}</Text>
                  <Text category="c1" appearance="hint">{formatDate(mensaje.fechaEnvio)}</Text>
                </View>
              )}
            >
              <Text numberOfLines={2} appearance="hint">{mensaje.mensaje}</Text>
              {!mensaje.leido && (
                <View style={{ marginTop: 8 }}>
                  <Text category="c2" status="primary">● NUEVO</Text>
                </View>
              )}
            </Card>
          ))
        )}
      </ScrollView>

      <Modal
        visible={!!selectedMensaje}
        backdropStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onBackdropPress={() => setSelectedMensaje(null)}
      >
        <Card disabled style={{ maxWidth: 500, width: '90%' }}>
          <Text category="h6" style={{ marginBottom: 8 }}>{selectedMensaje?.asunto}</Text>
          <Text category="c1" appearance="hint" style={{ marginBottom: 16 }}>
            {selectedMensaje?.fechaEnvio && formatDate(selectedMensaje.fechaEnvio)}
          </Text>
          <Divider style={{ marginBottom: 16 }} />
          <Text>{selectedMensaje?.mensaje}</Text>
          <Button style={{ marginTop: 20 }} onPress={() => setSelectedMensaje(null)}>
            Cerrar
          </Button>
        </Card>
      </Modal>
    </>
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

  useEffect(() => {
    checkAuth();
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

  const handleLogin = () => setIsAuthenticated(true);
  
  const handleLogout = async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('tutorData');
    setIsAuthenticated(false);
  };

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
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    const savedTheme = await AsyncStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  };

  return (
    <ApplicationProvider {...eva} theme={isDarkMode ? customDarkTheme : customLightTheme}>
      <ApolloProvider client={apolloClient}>
        <AppContent />
      </ApolloProvider>
    </ApplicationProvider>
  );
}
