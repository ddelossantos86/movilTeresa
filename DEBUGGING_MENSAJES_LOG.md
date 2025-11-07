# 🧪 DEBUGGING: Por qué no aparecen mensajes

## Cambios Aplicados

He agregado logs detallados en `MensajesTab` para ver exactamente qué datos retorna la query.

### Logs que verás en Expo Console:

```
📨 [MensajesTab] Query data: {...}
📨 [MensajesTab] Query loading: false
📨 [MensajesTab] Mensajes encontrados: 0 (o N)
📨 [MensajesTab] Primer mensaje: {...}
```

## 🔍 Qué revisar

### Escenario 1: "Mensajes encontrados: 0"
- **Causa probable**: No hay mensajes en la BD para este tutor
- **Solución**: 
  1. Verifica que en app-colegios existan mensajes PUBLICADOS
  2. Verifica que el tutor tiene hijos asignados
  3. Verifica que los mensajes están dirigidos al nivel/grado/división de los hijos

### Escenario 2: Error GraphQL
- **Logs**: `❌ [MensajesTab] Query error: ...`
- **Causas**:
  - Token inválido o expirado
  - Query malformada
  - Permiso insuficiente
- **Solución**: Ver el error exacto en los logs y reportarlo

### Escenario 3: Query loading forever
- **Logs**: `Query loading: true` (permanentemente)
- **Causa**: Conexión de red lenta o servidor no responde
- **Solución**: Verifica que 149.50.150.151:3090 está disponible

### Escenario 4: Data es null
- **Logs**: `Query data: null`
- **Causa**: Apollo no tiene datos en cache
- **Solución**: Fuerza refresh con "pull to refresh" en la app

## 📱 Pasos de Testing

### 1. Reinicia la app
```bash
cd /Users/nano/Documents/colegio/movilTeresa
npm start
```

### 2. Abre Expo en el dispositivo/emulador
- Escanea el código QR
- Espera a que cargue

### 3. Haz login
- Documento: (válido de producción)
- Contraseña: (válida de producción)

### 4. Navega a la pestaña de Mensajes
- Abre los logs de Expo
- Busca los logs `📨 [MensajesTab]`
- Copia el output completo

### 5. Reporta:
- ¿Cuántos mensajes aparecen?
- ¿Hay un error GraphQL?
- ¿Qué estructura tiene el primer mensaje?

## 📋 Información para Debugging

**Archivo**: `/movilTeresa/App.tsx` línea 663-683

**Query ejecutada**: `GET_MENSAJES_TUTOR`

**Endpoint**: `http://149.50.150.151:3090/graphql`

**Campos solicitados**:
```graphql
{
  id, titulo, contenido, tipo, alcance, estado,
  autorNombre, imagen, publicadoEn, creadoEn,
  leido, leidoPorTutorIds, destinatarioIds
}
```

## 🚀 Si Funciona

Si ves mensajes:
1. Elimina los logs de debugging
2. Prueba las funcionalidades:
   - [ ] Ver mensaje
   - [ ] Marcar como leído
   - [ ] Filtrar por alumno
   - [ ] Ver imágenes

## 📞 Información para Reportar

Si hay problema, reporta:
- Los logs exactos de `📨 [MensajesTab]`
- El error GraphQL (si hay)
- Número de mensajes esperados vs encontrados
- Datos del tutor (documento, hijos asignados)

