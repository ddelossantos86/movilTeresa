import { useEffect, useRef } from 'react';
import { useApolloClient } from '@apollo/client';
import { AppState, AppStateStatus } from 'react-native';

/**
 * Hook para manejar la invalidación automática del cache de Apollo
 * - Resetea cache cuando la app vuelve del background
 * - Resetea cache cada cierto tiempo (póliza de refresco)
 * - Mejora consistencia de datos en producción
 */
export const useApolloCache = (options?: {
  resetOnAppForeground?: boolean;
  resetIntervalMs?: number; // ms - si está definido, resetea cada X ms
  onCacheReset?: () => void; // callback al resetear
}) => {
  const apolloClient = useApolloClient();
  const appState = useRef(AppState.currentState);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastResetRef = useRef<number>(Date.now());

  const {
    resetOnAppForeground = true,
    resetIntervalMs = 5 * 60 * 1000, // 5 minutos por defecto
    onCacheReset,
  } = options || {};

  useEffect(() => {
    const resetCache = () => {
      try {
        apolloClient.cache.reset();
        lastResetRef.current = Date.now();
        console.log('🔄 Apollo Cache reseteado (useApolloCache)');
        onCacheReset?.();
      } catch (error) {
        console.error('❌ Error al resetear Apollo Cache:', error);
      }
    };

    // Listener para cambios de app state (foreground/background)
    if (resetOnAppForeground) {
      const subscription = AppState.addEventListener('change', handleAppStateChange);

      function handleAppStateChange(nextAppState: AppStateStatus) {
        // Si volvemos del background al foreground
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          console.log('📱 App volvió al foreground - reseteando cache');
          resetCache();
        }

        appState.current = nextAppState;
      }

      return () => {
        subscription.remove();
      };
    }
  }, [apolloClient, onCacheReset, resetOnAppForeground]);

  // Reseteo periódico si está habilitado
  useEffect(() => {
    if (!resetIntervalMs) return;

    intervalRef.current = setInterval(() => {
      try {
        apolloClient.cache.reset();
        lastResetRef.current = Date.now();
        console.log(`🔄 Apollo Cache reseteado periódicamente (cada ${resetIntervalMs / 1000}s)`);
        onCacheReset?.();
      } catch (error) {
        console.error('❌ Error en reseteo periódico de cache:', error);
      }
    }, resetIntervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [apolloClient, onCacheReset, resetIntervalMs]);

  // Retornar función para resetear manualmente si es necesario
  return {
    resetCache: () => {
      apolloClient.cache.reset();
      lastResetRef.current = Date.now();
      console.log('🔄 Apollo Cache reseteado manualmente');
      onCacheReset?.();
    },
    lastResetTime: lastResetRef.current,
  };
};
