import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// IP de tu Mac en la red local
// IMPORTANTE: Si estás usando un dispositivo físico, asegúrate de que 
// tu celular y tu Mac están en la misma red WiFi

const LOCAL_IP = '10.1.142.88';
// const LOCAL_IP = '192.168.68.103';

// Usar SIEMPRE la IP local (funciona para emuladores y dispositivos físicos)
const API_URL = `http://${LOCAL_IP}:3000/graphql`;

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
});

// Link de manejo de errores
const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.log(
        `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${path}`
      )
    );
  }
  
  if (networkError) {
    console.log(`[Network error]: ${networkError}`);
    console.log('Operation:', operation.operationName);
    console.log('API URL:', API_URL);
  }
});

const authLink = setContext(async (_, { headers }) => {
  // Obtener el token del storage
  const token = await AsyncStorage.getItem('authToken');
  console.log('🔑 Token obtenido:', token ? `${token.substring(0, 20)}...` : 'NO HAY TOKEN');
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    }
  };
});

export const apolloClient = new ApolloClient({
  link: errorLink.concat(authLink.concat(httpLink)),
  cache: new InMemoryCache(),
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
