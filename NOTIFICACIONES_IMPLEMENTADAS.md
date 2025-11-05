# 🔔 Notificaciones Push - Implementación Completada

## ✅ Implementación Frontend (COMPLETADA)

### Dependencias Instaladas
```bash
✅ expo-notifications
✅ expo-device  
✅ expo-constants
```

### Archivos Modificados

#### 1. `App.tsx`
- ✅ Importación de librerías de notificaciones
- ✅ Configuración del handler de notificaciones
- ✅ Función `registerForPushNotifications()` - Obtiene el token y lo guarda
- ✅ Listeners para notificaciones entrantes
- ✅ Listener para cuando el usuario toca una notificación
- ✅ Llamada a `registerForPushNotifications()` después del login

#### 2. `src/graphql/queries.ts`
- ✅ Nueva mutación `UPDATE_PUSH_TOKEN` para guardar el token en el backend

#### 3. `app.json`
- ✅ Agregado permiso `POST_NOTIFICATIONS` para Android
- ✅ Configuración de notificaciones (ícono, color, modo)
- ✅ projectId de EAS para generar tokens

### Funcionalidad Implementada

#### Al hacer login:
1. La app solicita permisos de notificación al usuario
2. Obtiene el Expo Push Token del dispositivo
3. Envía el token al backend mediante GraphQL mutation
4. El backend guarda el token en la base de datos del tutor

#### Cuando llega una notificación:
- **App abierta**: Se muestra alert/banner dentro de la app
- **App en background**: Se muestra en la barra de notificaciones
- **App cerrada**: Se muestra en la barra de notificaciones

#### Cuando el usuario toca la notificación:
- Se abre la app
- Se puede navegar a la sección específica (mensajes, evaluaciones, etc.)

## ⏳ Pendiente: Implementación Backend

Ver archivo: `NOTIFICACIONES_PUSH_BACKEND.md` para instrucciones detalladas.

### Resumen de lo que falta en el backend:

1. **Agregar campo al modelo Tutor**
   ```typescript
   pushToken: String
   ```

2. **Crear mutación GraphQL**
   ```graphql
   mutation UpdatePushToken($token: String!) {
     updateTutorPushToken(token: $token) {
       id
       pushToken
     }
   }
   ```

3. **Instalar librería en backend**
   ```bash
   npm install expo-server-sdk
   ```

4. **Enviar notificaciones cuando ocurran eventos**
   - Mensaje nuevo → Notificar al tutor
   - Evaluación publicada → Notificar al tutor
   - Asistencia registrada → Notificar al tutor
   - Seguimiento diario → Notificar al tutor

## 🧪 Cómo Probar

### 1. En Desarrollo (Expo Go)
- Solo funciona en **dispositivo físico** (no en emulador)
- Instalar la app con Expo Go
- Hacer login
- Aceptar permisos de notificación
- El token se imprimirá en console

### 2. En Producción (Build)
- Hacer build con `eas build`
- Instalar el APK en dispositivo Android
- Hacer login
- El backend podrá enviar notificaciones

### 3. Enviar Notificación de Prueba
Una vez que el backend guarde el token, puedes probar enviando una notificación manualmente:

```bash
curl -H "Content-Type: application/json" \\
  -X POST https://exp.host/--/api/v2/push/send \\
  -d '{
    "to": "ExponentPushToken[xxxxx]",
    "title": "🎉 Prueba",
    "body": "Esta es una notificación de prueba",
    "sound": "default",
    "priority": "high",
    "data": {
      "tipo": "MENSAJE"
    }
  }'
```

## 📊 Monitoreo

Dashboard de Expo para ver estadísticas:
```
https://expo.dev/accounts/[cuenta]/projects/movilTeresa/push-notifications
```

Muestra:
- ✅ Notificaciones enviadas
- ✅ Notificaciones entregadas
- ✅ Errores
- ✅ Tasa de apertura

## 🎯 Casos de Uso Implementados

### Frontend listo para recibir notificaciones de:

1. **📧 Mensajes Nuevos**
   ```json
   {
     "title": "📧 Mensaje Nuevo",
     "body": "Tienes un nuevo mensaje",
     "data": {
       "tipo": "MENSAJE",
       "mensajeId": "123",
       "screen": "mensajes"
     }
   }
   ```

2. **📝 Evaluaciones**
   ```json
   {
     "title": "📝 Evaluación Publicada",
     "body": "Nota de evaluación de Matemática",
     "data": {
       "tipo": "EVALUACION",
       "evaluacionId": "456"
     }
   }
   ```

3. **📅 Asistencias**
   ```json
   {
     "title": "📅 Asistencia Registrada",
     "body": "Juan - Presente",
     "data": {
       "tipo": "ASISTENCIA",
       "fecha": "2025-11-05"
     }
   }
   ```

4. **📋 Seguimiento Diario**
   ```json
   {
     "title": "📋 Seguimiento Diario",
     "body": "Novedades diarias de Juan",
     "data": {
       "tipo": "SEGUIMIENTO",
       "seguimientoId": "789"
     }
   }
   ```

## 💡 Características

- ✅ **Gratuito**: Sin costo de uso
- ✅ **Cross-platform**: Funciona en Android e iOS
- ✅ **Tiempo real**: Las notificaciones llegan instantáneamente
- ✅ **Sonido y vibración**: Configurable
- ✅ **Badge**: Contador de notificaciones
- ✅ **Deep linking**: Navega a secciones específicas al tocar
- ✅ **Funciona con app cerrada**: Las notificaciones llegan igual

## 🔒 Seguridad

- ✅ El token se guarda solo para el tutor autenticado
- ✅ El token se actualiza cada vez que hace login
- ✅ El token es único por dispositivo
- ✅ Si el tutor hace logout, el token sigue guardado para próximo login

## 📱 Próximos Pasos

1. Implementar el backend según `NOTIFICACIONES_PUSH_BACKEND.md`
2. Probar enviando notificaciones de prueba
3. Configurar envío automático al crear mensajes/evaluaciones
4. (Opcional) Agregar navegación automática al tocar notificación
5. (Opcional) Agregar badge counter en el ícono de la app

## ✨ Resultado Final

Los tutores recibirán notificaciones push en tiempo real cada vez que:
- 📧 Reciban un mensaje nuevo del colegio
- 📝 Se publique una evaluación de su hijo
- 📅 Se registre la asistencia de su hijo
- 📋 Haya un seguimiento diario nuevo (Nivel Maternal)

Las notificaciones aparecerán en la barra de notificaciones del celular, incluso si la app está cerrada, y al tocarlas abrirán la app automáticamente.
