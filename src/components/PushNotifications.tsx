import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform, AppState } from 'react-native';

// Configurar cómo se muestran las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface Props {
  mensajes: any[];
}

export default function PushNotifications({ mensajes }: Props) {
  const previousCount = useRef(0);
  const appState = useRef(AppState.currentState);
  const [permissionsGranted, setPermissionsGranted] = React.useState(false);

  useEffect(() => {
    requestPermissions();

    // Listener para cuando la app pasa a background/foreground
    const subscription = AppState.addEventListener('change', nextAppState => {
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!permissionsGranted || !mensajes) return;

    const noLeidosCount = mensajes.filter((m: any) => !m.leido).length;

    // Si hay nuevos mensajes no leídos (y no es la primera carga)
    if (previousCount.current > 0 && noLeidosCount > previousCount.current) {
      const nuevosMensajes = noLeidosCount - previousCount.current;
      mostrarNotificacionLocal(nuevosMensajes);
    }

    previousCount.current = noLeidosCount;
  }, [mensajes, permissionsGranted]);

  async function requestPermissions() {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Mensajes Dhora',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2563eb',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus === 'granted') {
        console.log('✅ Permisos de notificaciones otorgados');
        setPermissionsGranted(true);
      } else {
        console.log('⚠️ Permisos de notificaciones denegados');
      }
    } catch (error) {
      console.error('Error solicitando permisos:', error);
    }
  }

  async function mostrarNotificacionLocal(cantidad: number) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📬 Nuevos mensajes',
          body: `Tienes ${cantidad} mensaje${cantidad > 1 ? 's' : ''} nuevo${cantidad > 1 ? 's' : ''}`,
          sound: true,
        },
        trigger: null, // null = mostrar inmediatamente
      });
      console.log('✅ Notificación mostrada');
    } catch (error) {
      console.error('❌ Error mostrando notificación:', error);
    }
  }

  return null;
}
