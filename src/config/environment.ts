import { Platform } from 'react-native';

/**
 * Configuración dinámica de API
 * Lee de variables de entorno o fallback a valores por defecto
 */

// Obtener del .env.local o usar valores por defecto
const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.API_PORT || '3000';
const API_PROTOCOL = process.env.API_PROTOCOL || 'http';
const IS_PRODUCTION = process.env.ENVIRONMENT === 'production';

// En Android Emulator, mapear localhost a 10.0.2.2
let finalHost = API_HOST;
if (!IS_PRODUCTION && Platform.OS === 'android') {
  if (API_HOST === 'localhost' || API_HOST === '127.0.0.1') {
    finalHost = '10.0.2.2';
    console.log('🔄 [Android Emulator] Mapeando localhost → 10.0.2.2');
  }
}

const API_URL = `${API_PROTOCOL}://${finalHost}:${API_PORT}/graphql`;

export const config = {
  API_URL,
  API_HOST: finalHost,
  API_PORT,
  API_PROTOCOL,
  IS_PRODUCTION,
  PLATFORM: Platform.OS,
};

console.log('⚙️  [Config Loaded]');
console.log(`   Environment: ${IS_PRODUCTION ? 'PRODUCTION' : 'DEVELOPMENT'}`);
console.log(`   Platform: ${Platform.OS}`);
console.log(`   API URL: ${API_URL}`);
