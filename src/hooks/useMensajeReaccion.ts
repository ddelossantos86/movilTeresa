import { useMutation, useQuery } from '@apollo/client';
import { useState, useCallback, useEffect } from 'react';
import { TOGGLE_MENSAJE_REACCION, GET_REACCIONES_MENSAJE } from '../graphql/queries';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Hook para manejar reacciones en mensajes
 * - Toggle de reacción (crear/eliminar)
 * - Obtener contador de reacciones
 * - Manejar estado local optimista
 */
export const useMensajeReaccion = (mensajeId: string) => {
  const [localReaccion, setLocalReaccion] = useState<boolean>(false);
  const [localContador, setLocalContador] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [tutorId, setTutorId] = useState<string | null>(null);

  // Obtener tutorId del almacenamiento
  useEffect(() => {
    const loadTutorId = async () => {
      try {
        const id = await AsyncStorage.getItem('tutorId');
        setTutorId(id);
      } catch (err) {
        console.error('Error cargando tutorId:', err);
      }
    };
    loadTutorId();
  }, []);

  // Query para obtener reacciones del mensaje
  const { data: reaccionesData, loading: contadorLoading, refetch: refetchContador } = useQuery(
    GET_REACCIONES_MENSAJE,
    {
      variables: { mensajeId },
      skip: !mensajeId,
      errorPolicy: 'ignore', // Ignorar errores silenciosamente
      onError: (error) => {
        console.warn('⚠️ Error cargando reacciones (ignorado):', error.message);
      }
    }
  );

  // Sincronizar datos de query con estado local
  useEffect(() => {
    try {
      if (reaccionesData?.reaccionesMensaje) {
        const reacciones = reaccionesData.reaccionesMensaje;
        const totalReacciones = reacciones.length;
        const miReaccion = tutorId ? reacciones.some((r: any) => r.tutorId === tutorId) : false;
        
        setLocalReaccion(miReaccion);
        setLocalContador(totalReacciones);
        setError(null);
      }
    } catch (err) {
      console.error('❌ Error sincronizando datos:', err);
      setError('Error al cargar reacciones');
    }
  }, [reaccionesData?.reaccionesMensaje, tutorId]);

  // Mutation para hacer toggle de reacción
  const [toggleReaccion, { loading: toggleLoading }] = useMutation(TOGGLE_MENSAJE_REACCION, {
    errorPolicy: 'ignore',
  });

  // Función para hacer toggle de reacción
  const handleToggleReaccion = useCallback(
    async (tipo: string = 'CORAZON') => {
      try {
        setError(null);
        console.log(`🔄 Iniciando toggle: msg=${mensajeId}, tipo=${tipo}`);

        // Cambio optimista inmediato
        const nuevoEstado = !localReaccion;
        setLocalReaccion(nuevoEstado);
        setLocalContador(nuevoEstado ? localContador + 1 : Math.max(0, localContador - 1));

        // Ejecutar mutation
        const result = await toggleReaccion({
          variables: {
            mensajeId,
            tipo,
          },
        });

        if (result.errors) {
          console.error('❌ GraphQL errors:', result.errors);
          setError(result.errors[0]?.message || 'Error al procesar la reacción');
          // Revertir cambio optimista
          setLocalReaccion(!nuevoEstado);
          setLocalContador(!nuevoEstado ? localContador + 1 : Math.max(0, localContador - 1));
          return;
        }

        console.log('✅ Toggle exitoso, refrescando contador...');

        // Refrescar contador desde servidor
        try {
          await refetchContador();
        } catch (refetchError) {
          console.warn('⚠️ Error refrescando contador:', refetchError);
          // Continuar incluso si el refetch falla
        }
      } catch (err) {
        console.error('❌ Error en handleToggleReaccion:', err);
        setError(err instanceof Error ? err.message : 'Error al procesar la reacción');
        // Revertir cambio optimista
        setLocalReaccion(!localReaccion);
        setLocalContador(localReaccion ? localContador + 1 : Math.max(0, localContador - 1));
      }
    },
    [mensajeId, toggleReaccion, localReaccion, localContador, refetchContador]
  );

  return {
    miReaccion: localReaccion,
    totalReacciones: localContador,
    handleToggleReaccion,
    loading: toggleLoading || contadorLoading,
    error,
  };
};
