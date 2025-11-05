# 📱 Implementación de Notificaciones Push - Backend

## ✅ Frontend Completado
El frontend ya está configurado para:
- ✅ Solicitar permisos de notificación
- ✅ Obtener el Expo Push Token
- ✅ Enviar el token al backend mediante la mutación `updateTutorPushToken`
- ✅ Manejar notificaciones cuando llegan
- ✅ Responder cuando el usuario toca una notificación

## 🔧 Implementación Necesaria en el Backend (API)

### 1. Agregar campo `pushToken` al modelo Tutor

```typescript
// En tu modelo de Tutor (MongoDB/Mongoose)
{
  // ... campos existentes
  pushToken: {
    type: String,
    default: null
  }
}
```

### 2. Crear la mutación `updateTutorPushToken`

```typescript
// En tu schema GraphQL
type Mutation {
  updateTutorPushToken(token: String!): Tutor
}

// En tu resolver
updateTutorPushToken: async (_: any, { token }: { token: string }, context: any) => {
  // Obtener el tutor del contexto (usuario autenticado)
  const tutorId = context.user.id;
  
  // Actualizar el push token
  const tutor = await Tutor.findByIdAndUpdate(
    tutorId,
    { pushToken: token },
    { new: true }
  );
  
  console.log(`✅ Push token actualizado para tutor ${tutorId}`);
  return tutor;
}
```

### 3. Instalar la librería para enviar notificaciones

```bash
npm install expo-server-sdk
```

### 4. Crear función para enviar notificaciones

```typescript
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

export async function enviarNotificacionPush(
  pushToken: string,
  titulo: string,
  cuerpo: string,
  data?: any
) {
  // Verificar que el token sea válido
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Token inválido: ${pushToken}`);
    return;
  }

  // Crear el mensaje
  const mensaje: ExpoPushMessage = {
    to: pushToken,
    sound: 'default',
    title: titulo,
    body: cuerpo,
    data: data || {},
    priority: 'high',
    badge: 1,
  };

  try {
    const chunks = expo.chunkPushNotifications([mensaje]);
    const tickets = [];

    for (const chunk of chunks) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    }

    console.log('✅ Notificación enviada:', tickets);
    return tickets;
  } catch (error) {
    console.error('❌ Error enviando notificación:', error);
    throw error;
  }
}
```

### 5. Enviar notificaciones cuando se crean mensajes

```typescript
// En tu resolver de crear mensaje
crearMensajeGeneral: async (_: any, { input }: any, context: any) => {
  // ... lógica existente de crear mensaje
  const mensaje = await MensajeGeneral.create(input);
  
  // Enviar notificaciones push a los tutores destinatarios
  if (input.destinatarioIds && input.destinatarioIds.length > 0) {
    // Obtener los tutores de los alumnos destinatarios
    const alumnos = await Alumno.find({ _id: { $in: input.destinatarioIds } });
    const tutorIds = [...new Set(alumnos.map(a => a.tutorId))];
    
    // Obtener los push tokens
    const tutores = await Tutor.find({ 
      _id: { $in: tutorIds },
      pushToken: { $exists: true, $ne: null }
    });
    
    // Enviar notificación a cada tutor
    for (const tutor of tutores) {
      try {
        await enviarNotificacionPush(
          tutor.pushToken,
          '📧 Nuevo Mensaje',
          input.titulo || 'Tienes un mensaje nuevo',
          {
            tipo: 'MENSAJE',
            mensajeId: mensaje.id,
            screen: 'mensajes'
          }
        );
      } catch (error) {
        console.error(`Error enviando notificación a tutor ${tutor.id}:`, error);
      }
    }
  }
  
  return mensaje;
}
```

### 6. Casos de Uso para Notificaciones

#### A. Mensaje Nuevo
```typescript
await enviarNotificacionPush(
  tutor.pushToken,
  '📧 Mensaje Nuevo',
  'Tienes un nuevo mensaje',
  { tipo: 'MENSAJE', mensajeId: mensaje.id }
);
```

#### B. Nueva Evaluación
```typescript
await enviarNotificacionPush(
  tutor.pushToken,
  '📝 Evaluación Publicada',
  `Nota de evaluación de ${materia}`,
  { tipo: 'EVALUACION', evaluacionId: evaluacion.id }
);
```

#### C. Registro de Asistencia
```typescript
await enviarNotificacionPush(
  tutor.pushToken,
  '📅 Asistencia Registrada',
  `${alumno.nombre} - ${estado}`,
  { tipo: 'ASISTENCIA', fecha: asistencia.fecha }
);
```

#### D. Seguimiento Diario (Maternal)
```typescript
await enviarNotificacionPush(
  tutor.pushToken,
  '📋 Seguimiento Diario',
  `Novedades diarias de ${alumno.nombre}`,
  { tipo: 'SEGUIMIENTO', seguimientoId: seguimiento.id }
);
```

## 🔐 Seguridad

### Variables de Entorno
Aunque Expo maneja los tokens, es buena práctica validar:

```typescript
// Validar que el usuario autenticado sea el tutor
if (context.user.tipo !== 'TUTOR') {
  throw new Error('No autorizado');
}
```

## 📊 Monitoreo

Expo proporciona un dashboard para ver:
- Notificaciones enviadas
- Notificaciones entregadas
- Errores
- Tasa de apertura

Accede en: https://expo.dev/accounts/[tu-cuenta]/projects/movilTeresa/push-notifications

## 🧪 Testing

### Enviar notificación de prueba desde terminal:

```bash
curl -H "Content-Type: application/json" \
  -X POST https://exp.host/--/api/v2/push/send \
  -d '{
    "to": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
    "title": "Prueba",
    "body": "Notificación de prueba",
    "sound": "default",
    "priority": "high"
  }'
```

## 📱 Próximos Pasos

1. ✅ Implementar la mutación `updateTutorPushToken` en el backend
2. ✅ Agregar el campo `pushToken` al modelo Tutor
3. ✅ Instalar `expo-server-sdk` en el backend
4. ✅ Implementar la función `enviarNotificacionPush`
5. ✅ Agregar llamadas a `enviarNotificacionPush` en las mutaciones relevantes:
   - Crear mensaje
   - Crear evaluación
   - Registrar asistencia
   - Crear seguimiento diario

## 🎯 Resultado Final

Los tutores recibirán notificaciones push en tiempo real cuando:
- 📧 Reciban un mensaje nuevo
- 📝 Se publique una evaluación
- 📅 Se registre la asistencia de su hijo
- 📋 Haya un seguimiento diario nuevo (Maternal)

Las notificaciones aparecerán incluso si la app está cerrada, y al tocarlas, abrirán la app directamente.
