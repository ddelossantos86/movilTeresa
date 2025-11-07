# ✅ Solución: Error 400 en MensajesTutor

## 🔍 Problema Identificado

**Error**: "ApolloError: Response not successful: Received status code 400"

**Causa**: El campo `imagen` no existe en el servidor de producción.

## 🔧 Solución Aplicada

### Archivo: `src/graphql/queries.ts`

**Removido campo**:
```graphql
- imagen
```

**Query actualizada**:
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
    publicadoEn
    creadoEn
    leido
    leidoPorTutorIds
    destinatarioIds
  }
}
```

## 📊 Estructura MensajeGeneral en Producción

**Campos disponibles**:
- id
- titulo
- contenido
- tipo
- alcance
- estado
- autorId
- autorNombre
- autorRol
- publicadoEn
- creadoEn
- leido
- leidoPorTutorIds
- destinatarioIds
- editadoEn
- editadoPor
- editadoDespuesDeLeido
- alumnosDestinatarios
- nivelesDestino
- gradoIdsRelacionados
- divisionIdsRelacionadas
- fechaProgramada
- fechaRecordatorio
- aprobadoPorId
- aprobadoPorNombre
- rechazadoEn
- rechazadoPorId
- rechazadoPorNombre
- razonRechazo
- actualizadoEn

**Campos NO disponibles**:
- ❌ imagen (no existe)

## 🚀 Próximos Pasos

1. **Reinicia la app**:
   ```bash
   npm start
   ```

2. **Haz login** con credenciales válidas

3. **Ve a la pestaña Mensajes** y verifica que ahora ves los mensajes

## ✨ Resultado Esperado

✅ Error 400 desaparece
✅ Mensajes aparecer correctamente
✅ Sin campo `imagen` (puede agregarse después si es necesario)

## 📝 Nota sobre imágenes

El servidor de producción NO tiene soporte para imágenes en mensajes actualmente. 
Si en el futuro necesitas agregar imágenes, deberás:
1. Agregarlo al backend (add campo `imagen` a MensajeGeneral)
2. Actualizar la query en movilTeresa

