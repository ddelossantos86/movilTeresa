# 🖼️ Debugging: Imágenes en Base64 - SOLUCIÓN IMPLEMENTADA

## 📋 Cambios Realizados

### 1. Query GraphQL Actualizada ✅
**Archivo**: `src/graphql/queries.ts`
- ✅ Agregado campo `imagen` a `GET_MENSAJES_TUTOR`
- Ahora la query incluye: `imagen` en la lista de campos

**Código**:
```graphql
query GetMensajesTutor($alumnoId: ID) {
  mensajesTutor(alumnoId: $alumnoId) {
    id
    titulo
    contenido
    tipo
    alcance
    estado
    autorNombre
    imagen        # ← AGREGADO
    publicadoEn
    creadoEn
    leido
    leidoPorTutorIds
    destinatarioIds
  }
}
```

### 2. Componente CarruselPosteos Actualizado ✅
**Archivo**: `App.tsx` (línea ~3600)
- ✅ Removido condicional `{false ? ...}` 
- ✅ Ahora evalúa `{post.contenido.imagen ? ...}`
- ✅ Mostrar imagen si existe, fallback a degradado si no
- ✅ Agregados handlers `onError` y `onLoad`

**Estructura de datos**:
```javascript
// post.contenido es el objeto MensajeGeneral completo
{
  id: 'mensaje-123',
  tipo: 'MENSAJE',
  fecha: '...',
  contenido: {
    id: '456',
    titulo: 'Título',
    contenido: 'Contenido',
    imagen: 'data:image/jpeg;base64,...',  // ← Aquí está
    autorNombre: '...',
    publicadoEn: '...',
    creadoEn: '...',
    leido: false,
    leidoPorTutorIds: [...],
    destinatarioIds: [...]
  },
  alumno: null,
  prioridad: 3
}
```

### 3. Logging Mejorado ✅
**Archivo**: `App.tsx`

#### En MensajesTab (línea ~676):
```javascript
console.log('🖼️  [MensajesTab] Imagen del primer mensaje:', 
  mensajes[0].imagen ? `Presente (${(mensajes[0].imagen.length / 1024).toFixed(2)} KB)` : 'No existe');
if (mensajes[0].imagen) {
  console.log('🖼️  [MensajesTab] Primeros 100 caracteres de imagen:', mensajes[0].imagen.substring(0, 100));
}
```

#### En CarruselPosteos (línea ~3559):
```javascript
useEffect(() => {
  if (mensajesGenerales && mensajesGenerales.length > 0) {
    console.log('🎠 CarruselPosteos - Análisis de imágenes:');
    mensajesGenerales.forEach((post, index) => {
      const imagen = post.contenido?.imagen;
      const tieneImagen = !!imagen;
      console.log(`   Post ${index} (ID: ${post.id}):`, {
        tieneImagen,
        tamaño: tieneImagen ? `${(imagen.length / 1024).toFixed(2)} KB` : 'N/A',
        primeros80Chars: tieneImagen ? imagen.substring(0, 80) : 'Sin imagen'
      });
    });
  }
}, [mensajesGenerales]);
```

## 🔍 Cómo Verificar que Funciona

### Paso 1: Chequear en la Console
```bash
# En la terminal donde corre movilTeresa:
npm start

# Luego chequea la salida de la app
```

### Paso 2: Ver Logs en App
Abre Expo Go/movilTeresa y busca los logs:
- `📨 [MensajesTab] Imagen del primer mensaje: ...`
- `🎠 CarruselPosteos - Análisis de imágenes:`
- `   Post 0 (ID: ...): { tieneImagen: true/false, tamaño: '...' }`

### Paso 3: Crear Mensaje de Prueba
1. Abre app-colegios
2. Crea un nuevo mensaje GENERAL (sin asignar a alumno)
3. Adjunta una imagen
4. Envía
5. Abre movilTeresa y ve a Inicio
6. Verifica que la imagen aparece en el carrusel

## 🐛 Solución de Problemas

### Problema: "Imagen del primer mensaje: No existe"

**Causa 1: Servidor no devuelve el campo**
- El servidor de producción NO expone el campo `imagen`
- Solución: Deploy del código actualizado a 149.50.150.151:3090

**Causa 2: Mensajes sin imagen**
- Los mensajes en la BD no tienen imagen
- Solución: Crear mensaje con imagen en app-colegios

**Causa 3: Query no incluye el campo**
- GET_MENSAJES_TUTOR no está pidiendo `imagen`
- Solución: Verificar que src/graphql/queries.ts tiene el campo

### Problema: "tieneImagen: true pero NO se muestra imagen"

**Causa 1: Base64 corrupto**
```
Síntoma: Console muestra tamaño pero imagen no carga
Solución: Verificar formato en console
```

**Causa 2: Formato incorrecto**
```
Esperado: "data:image/jpeg;base64,/9j/4AAQ..."
          O solo: "/9j/4AAQ..."

Si ves: "http://..." o algo raro
Solución: Verificar que se envía base64, no URL
```

**Causa 3: Tamaño muy grande**
```
Síntoma: Image tarda mucho o no carga
Tamaño: Si > 1MB, considerar compresión
Solución: Comprimir imagen antes de guardar
```

### Problema: "Error loading image"

**Log en console**:
```
🖼️ Error loading image for post: mensaje-123 ...
```

**Causas**:
1. Base64 corrupto o incompleto
2. URI excede límites de React Native (~500KB)
3. Formato no válido

**Soluciones**:
- Verificar tamaño de imagen
- Comprimir si es > 500KB
- Validar formato antes de guardar

## 📝 Estructura de Datos

### MensajeGeneral desde API
```typescript
{
  id: '507f1f77bcf86cd799439011',
  titulo: 'Anuncio importante',
  contenido: 'Contenido del mensaje...',
  imagen: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',  // ← Campo
  tipo: 'ANUNCIO',
  alcance: 'TODOS',
  estado: 'ACTIVO',
  autorNombre: 'Dirección',
  publicadoEn: '2025-11-07T10:00:00Z',
  creadoEn: '2025-11-07T10:00:00Z',
  leido: false,
  leidoPorTutorIds: ['507f1f77bcf86cd799439012'],
  destinatarioIds: []
}
```

### En CarruselPosteos
```javascript
post = {
  id: 'mensaje-507f1f77bcf86cd799439011',
  tipo: 'MENSAJE',
  fecha: '2025-11-07T10:00:00Z',
  contenido: { /* MensajeGeneral completo arriba */ },
  alumno: null,
  prioridad: 3
}

// Acceso a imagen:
post.contenido.imagen  // ← Correcto
post.imagen            // ← Incorrecto
```

## 🔄 Flujo Completo

```
app-colegios (crear mensaje)
  ↓ usuario selecciona imagen
  ↓ convertir a base64
  ↓ enviar vía GraphQL mutation
  ↓
API (149.50.150.151:3090)
  ↓ recibe imagen en base64
  ↓ guarda en MongoDB en campo "imagen"
  ↓
movilTeresa (GET_MENSAJES_TUTOR)
  ↓ solicita campo `imagen`
  ↓ recibe en respuesta
  ↓ MensajesTab captura en logs: "🖼️  [MensajesTab] Imagen del primer mensaje: Presente (123.45 KB)"
  ↓
feedPosts 
  ↓ transforma en estructura interna
  ↓ crea post con contenido.imagen
  ↓
CarruselPosteos
  ↓ recibe post.contenido.imagen
  ↓ verifica `post.contenido.imagen`
  ↓ Image.source={{ uri: post.contenido.imagen }}
  ↓ React Native renderiza imagen
  ↓
Pantalla
  ↓ imagen visible en carrusel
```

## ✅ Checklist de Verificación

- [ ] Query GET_MENSAJES_TUTOR incluye campo `imagen`
- [ ] CarruselPosteos accede a `post.contenido.imagen`
- [ ] Logging muestra información sobre imágenes
- [ ] Servidor de producción está actualizado (deploy hecho)
- [ ] Base64 está en formato correcto
- [ ] Imagen se carga sin errores
- [ ] onLoad se ejecuta cuando carga correctamente
- [ ] onError se ejecuta si falla

## 🚀 Próximos Pasos

1. **Verificar servidor en producción** - ¿Devuelve el campo `imagen`?
2. **Crear mensaje de prueba** - Crear con imagen en app-colegios
3. **Chequear logs** - Abrir movilTeresa y verificar consola
4. **Diagnosticar formato** - ¿Es base64 válido?
5. **Ajustar si es necesario** - Compresión, validación, etc.

## 📊 Estado Actual

- ✅ Query actualizada con campo `imagen`
- ✅ Componente preparado para mostrar imagen en `post.contenido.imagen`
- ✅ Logging detallado agregado en MensajesTab y CarruselPosteos
- ✅ Handlers de error y carga implementados
- ⏳ Esperando deploy a producción (149.50.150.151:3090)
- ⏳ Esperando confirmación de que imagen se recibe y carga

