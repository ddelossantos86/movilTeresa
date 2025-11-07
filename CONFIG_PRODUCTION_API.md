# 🚀 Configuración movilTeresa - Dev → API Producción

## ✅ Status Actual

**movilTeresa está configurada para apuntar a la API de producción:**

```
IS_PRODUCTION = true
API_URL = http://149.50.150.151:3090/graphql
```

## 📝 Archivo de Configuración

**Ubicación**: `/movilTeresa/src/config/apollo.ts`

```typescript
const IS_PRODUCTION = true;              // ← APUNTA A PRODUCCIÓN
const LOCAL_IP = '10.1.142.88';
const PRODUCTION_IP = '149.50.150.151';

// URL configurada a producción
const API_URL = IS_PRODUCTION 
  ? `http://${PRODUCTION_IP}:3090/graphql`    // ← http://149.50.150.151:3090/graphql
  : `http://${LOCAL_IP}:3000/graphql`;
```

## 🔍 Verificación

La app mobile en desarrollo (ejecutándose con `npm start`) está apuntando a:
- **Endpoint**: `http://149.50.150.151:3090/graphql`
- **Entorno**: PRODUCCIÓN
- **Base de Datos**: MongoDB Atlas (remota)

## 📱 App Mobile Ejecutándose

Terminal: `npm: start (movilTeresa)` ✅ Activo

Cuando ejecutes la app en Expo:
1. Escanea el código QR con tu dispositivo
2. La app conectará a `149.50.150.151:3090/graphql`
3. Podrás hacer login con usuarios de producción

## 🔧 Si Necesitas Cambiar

### Para volver a desarrollo local:
```typescript
const IS_PRODUCTION = false;
const LOCAL_IP = '10.1.142.88';  // Cambiar a tu IP local si es diferente
```

### Para especificar otra IP de producción:
```typescript
const PRODUCTION_IP = '149.50.150.151';  // Cambiar IP aquí
```

## ✨ Notas

- Los datos se sincronicen con la BD de producción en MongoDB Atlas
- Los usuarios y contraseñas son los de producción
- Los mensajes e imágenes vienen de la base de datos remota
- Los cambios en la app afectan los datos de producción

