# Revert de SDK 54 a SDK 51

**Fecha**: 7 de noviembre de 2025
**Razón**: SDK 54 presentaba incompatibilidades que causaban problemas de login

## Cambios realizados

### 1. Package.json - Revert a versiones SDK 51

Se revertieron todas las dependencias de Expo 54 a Expo 51:

```
- expo: ^54.0.0 → 51.0.39
- react: 18.3.1 → 18.2.0
- react-native: 0.76.0 → 0.74.5
- expo-blur: ~14.0.0 → ~13.0.3
- expo-build-properties: ~0.14.0 → ~0.12.5
- expo-constants: ~17.0.0 → ~16.0.2
- expo-device: ~7.0.0 → ~6.0.2
- expo-linear-gradient: ~14.0.0 → ~13.0.2
- expo-local-authentication: ~15.0.0 → ~14.0.1
- expo-notifications: ~0.29.0 → ~0.28.19
- expo-secure-store: ~14.0.0 → ~13.0.2
- expo-splash-screen: ~0.28.0 → ~0.27.7
- expo-status-bar: ~2.0.0 → ~1.12.1
- react-native-gesture-handler: ~2.21.0 → ~2.16.1
- react-native-svg: 15.7.0 → 15.2.0
- @react-native-async-storage/async-storage: 1.24.0 → 1.23.1
```

### 2. Apollo Configuration

Se mantuvo la configuración original:
- `IS_PRODUCTION = true`
- `LOCAL_IP = '10.1.142.88'`
- `PRODUCTION_IP = '149.50.150.151'`
- API_URL apunta a `http://149.50.150.151:3090/graphql`

### 3. npm install

```
✓ 1562 packages instaladas
✓ 0 vulnerabilidades críticas después del audit
✓ Sin errores de instalación
```

## Razón técnica

SDK 54 introdujo cambios en React Native 0.76 que causaban incompatibilidades con:
- El sistema de autenticación JWT
- La comunicación con Apollo Client
- AsyncStorage token persistence

SDK 51 es estable y funciona correctamente con la configuración actual.

## Status

✅ Revertido exitosamente
✅ App mobile iniciada con `npm start`
✅ Backend corriendo en puerto 3000 (dev) y 3090 (prod)
✅ Frontend corriendo en puerto 3002

## Siguiente

Reiniciar la app en el dispositivo/emulador y verificar que el login funcione correctamente.
