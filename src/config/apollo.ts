import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Observable } from '@apollo/client';

// Configuración de URL de API según entorno
// DESARROLLO: IP local (cambiar según tu red)
// PRODUCCIÓN: IP del servidor DonWeb

const IS_PRODUCTION = false; // ✅ CAMBIAR A false PARA LOCAL
const LOCAL_IP = '10.1.142.88';
const PRODUCTION_IP = '149.50.150.151';

// Usar IP de producción o desarrollo según configuración
const API_URL = IS_PRODUCTION 
  ? `http://${PRODUCTION_IP}:3090/graphql`
  : `http://${LOCAL_IP}:3000/graphql`;

console.log('🌐 Entorno:', IS_PRODUCTION ? 'PRODUCCIÓN' : 'DESARROLLO');
console.log('🌐 API_URL configurada:', API_URL);
console.log('📱 Platform:', Platform.OS);

const httpLink = createHttpLink({
  uri: API_URL,
  // Configuraciones adicionales para mejorar la conectividad
  fetchOptions: {
    timeout: 30000, // 30 segundos de timeout
  },
  // Habilitar credenciales si es necesario
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Contador de reintentos para backoff exponencial
const retryCountMap = new Map<string, number>();

// Link de manejo de errores con retry automático y cache invalidation
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  let shouldRetry = false;
  let cacheWasReset = false;
  const operationKey = `${operation.operationName}-${JSON.stringify(operation.variables)}`.substring(0, 100);
  const retryCount = retryCountMap.get(operationKey) || 0;
  const MAX_RETRIES = 3;

  // ==================== MANEJO DE ERRORES GRAPHQL ====================
  if (graphQLErrors && graphQLErrors.length > 0) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.log(`❌ [GraphQL error en ${operation.operationName}]: ${message}`);
      
      if (locations) console.log(`   📍 Ubicación: ${JSON.stringify(locations)}`);
      if (path) console.log(`   🔗 Path: ${JSON.stringify(path)}`);
      
      // ERROR 1: Campo no existe en schema (schema cambió en el servidor)
      if (message.includes('Cannot query field') || (message.includes('Field') && message.includes('doesn\'t exist'))) {
        console.log('⚠️  ERROR DE SCHEMA: Campo solicitado no existe en servidor');
        console.log('💡 Probable causa: Servidor fue reiniciado o schema cambió');
        console.log('🧹 Acción: Limpiando cache y reintentando...');
        if (!cacheWasReset) {
          apolloClient.cache.reset();
          cacheWasReset = true;
        }
        shouldRetry = true;
      }
      
      // ERROR 2: Tipo no esperado
      if (message.includes('Unexpected') || message.includes('Expected')) {
        console.log('⚠️  ERROR DE TIPO: Respuesta no es del tipo esperado');
        console.log('🧹 Acción: Limpiando cache y reintentando...');
        if (!cacheWasReset) {
          apolloClient.cache.reset();
          cacheWasReset = true;
        }
        shouldRetry = true;
      }
      
      // ERROR 3: Error de autenticación
      if (message.includes('Unauthorized') || message.includes('Forbidden')) {
        console.log('🔐 ERROR DE AUTENTICACIÓN: Token inválido o expirado');
        shouldRetry = false; // No reintentar errores de auth
      }
    });
  }

  // ==================== MANEJO DE ERRORES DE RED ====================
  if (networkError) {
    console.log(`❌ [Network error en ${operation.operationName}]:`, networkError);
    
    const statusCode = (networkError as any).statusCode;
    const statusText = (networkError as any).statusText;
    
    if (statusCode) {
      console.log(`   Status: ${statusCode} ${statusText || ''}`);
    }
    
    if ((networkError as any).result) {
      const resultStr = JSON.stringify((networkError as any).result).substring(0, 300);
      console.log(`   Response: ${resultStr}`);
      
      // Si la respuesta contiene error de schema
      if (resultStr.includes('Cannot query field')) {
        console.log('⚠️  ERROR 400: Respuesta contiene error de schema');
        console.log('🧹 Acción: Limpiando cache...');
        if (!cacheWasReset) {
          apolloClient.cache.reset();
          cacheWasReset = true;
        }
        shouldRetry = true;
      }
    }

    // ERROR: Servidor no responde (5xx)
    if (statusCode >= 500 && statusCode <= 599) {
      console.log(`⚠️  ERROR DE SERVIDOR (${statusCode}): Servidor no disponible o error interno`);
      console.log('🧹 Acción: Limpiando cache y reintentando...');
      if (!cacheWasReset) {
        apolloClient.cache.reset();
        cacheWasReset = true;
      }
      shouldRetry = true;
    }

    // ERROR: Cliente (4xx excepto auth)
    if (statusCode >= 400 && statusCode < 500 && statusCode !== 401 && statusCode !== 403) {
      console.log(`⚠️  ERROR DEL CLIENTE (${statusCode}): Posible incompatibilidad de schema`);
      if (!cacheWasReset) {
        apolloClient.cache.reset();
        cacheWasReset = true;
      }
      shouldRetry = true;
    }

    // ERROR: Sin conexión o timeout
    if (!statusCode) {
      console.log('⚠️  SIN CONEXIÓN: No se pudo alcanzar el servidor');
      console.log('🧹 Acción: Limpiando cache y reintentando...');
      if (!cacheWasReset) {
        apolloClient.cache.reset();
        cacheWasReset = true;
      }
      shouldRetry = true;
    }
  }

  // ==================== LÓGICA DE REINTENTO ====================
  if (shouldRetry && retryCount < MAX_RETRIES && forward) {
    retryCountMap.set(operationKey, retryCount + 1);
    
    // Backoff exponencial: 100ms, 200ms, 400ms
    const delayMs = 100 * Math.pow(2, retryCount);
    console.log(
      `🔄 Reintentando ${operation.operationName} ` +
      `(intento ${retryCount + 1}/${MAX_RETRIES}) en ${delayMs}ms...`
    );
    
    return new Observable(subscriber => {
      setTimeout(() => {
        console.log(`🔄 Ejecutando reintento ${retryCount + 1}/${MAX_RETRIES}...`);
        forward(operation).subscribe(subscriber);
      }, delayMs);
    });
  } else if (shouldRetry && retryCount >= MAX_RETRIES) {
    console.error(`❌ Máximo de reintentos (${MAX_RETRIES}) alcanzado para ${operation.operationName}`);
    retryCountMap.delete(operationKey);
  } else if (!shouldRetry && retryCount > 0) {
    // Limpiar el contador si fue exitoso sin necesidad de más reintentos
    retryCountMap.delete(operationKey);
  }
});

// Link de autenticación
const authLink = setContext(async (operation, { headers }) => {
  // Obtener el token del storage
  const token = await AsyncStorage.getItem('authToken');
  
  if (!token) {
    console.warn('⚠️  No hay token de autenticación disponible');
  } else {
    console.log('🔑 Token disponible:', token.substring(0, 20) + '...');
  }
  
  console.log(`📤 Enviando operación: ${operation.operationName}`);
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    }
  };
});

// Cliente Apollo
export const apolloClient = new ApolloClient({
  link: errorLink.concat(authLink.concat(httpLink)),
  cache: new InMemoryCache({
    typePolicies: {},
    resultCacheMaxSize: 10000000,
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

export default apolloClient;
