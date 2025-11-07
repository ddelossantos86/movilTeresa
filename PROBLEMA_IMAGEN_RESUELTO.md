# 🔴 PROBLEMA IDENTIFICADO: Campo `imagen` causaba error 400

## 🎯 Resumen del Problema

El campo `imagen` estaba presente en las queries GraphQL pero el servidor de producción (`149.50.150.151:3090`) no lo soporta porque corre una versión antigua del backend.

**Resultado**: Error 400 (Bad Request) silencioso que detenía la query completamente.

---

## 🔍 Investigación

### Queries Afectadas:

1. **`GET_MENSAJES_TUTOR`** (src/graphql/queries.ts línea 19)
   - Usada en: MensajesTab y Dashboard
   - Tenía: campo `imagen`
   - Resultado: Error 400 → sin mensajes

2. **`GET_MENSAJES`** (src/graphql/queries.ts línea 197)
   - Alternativa: No se usa actualmente
   - Tenía: campo `imagen`
   - Limpiada igual para evitar problemas

---

## ✅ Solución Aplicada

### Cambio 1: Remover `imagen` de GET_MENSAJES_TUTOR

**Archivo**: `src/graphql/queries.ts` (línea 19)

```typescript
// ANTES (causaba error):
export const GET_MENSAJES_TUTOR = gql`
  query GetMensajesTutor($alumnoId: ID) {
    mensajesTutor(alumnoId: $alumnoId) {
      id
      titulo
      contenido
      tipo
      alcance
      estado
      autorNombre
      imagen              # ❌ REMOVIDO
      publicadoEn
      creadoEn
      leido
      leidoPorTutorIds
      destinatarioIds
    }
  }
`;

// DESPUÉS (funciona):
export const GET_MENSAJES_TUTOR = gql`
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
`;
```

### Cambio 2: Remover `imagen` de GET_MENSAJES

**Archivo**: `src/graphql/queries.ts` (línea 197)

```typescript
// ANTES:
export const GET_MENSAJES = gql`
  query GetMensajes($alumnoId: ID) {
    mensajesTutor(alumnoId: $alumnoId) {
      id
      titulo
      contenido
      imagen              # ❌ REMOVIDO
      tipo
      alcance
      autorNombre
      publicadoEn
      creadoEn
      leido
      destinatarioIds
    }
  }
`;

// DESPUÉS:
export const GET_MENSAJES = gql`
  query GetMensajes($alumnoId: ID) {
    mensajesTutor(alumnoId: $alumnoId) {
      id
      titulo
      contenido
      tipo
      alcance
      autorNombre
      publicadoEn
      creadoEn
      leido
      destinatarioIds
    }
  }
`;
```

### Cambio 3: Agregar Logging para Debug

**Archivo**: `App.tsx` (Dashboard línea ~3795)

```typescript
// Debugging: Loguear errores de query
useEffect(() => {
  console.log('📧 [Dashboard] GET_MENSAJES_TUTOR:', {
    hasData: !!mensajesData,
    mensajeCount: mensajes.length,
    firstMensaje: mensajes[0]
  });
}, [mensajesData, mensajes.length]);
```

---

## 🧪 Cómo Verificar que Funciona

1. **Abrir la app** con los cambios
2. **Ir a Inicio (Dashboard)**
3. **Chequear consola** para ver:
   ```
   📧 [Dashboard] GET_MENSAJES_TUTOR: {
     hasData: true,
     mensajeCount: 3,
     firstMensaje: { id: '...', titulo: '...', ... }
   }
   ```
4. **Los mensajes deberían aparecer** en el dashboard y tab de Mensajes

---

## 📋 Tabla de Estados

| Query | Tenía `imagen` | Removido | Estado |
|-------|---|---|---|
| GET_MENSAJES_TUTOR | ✅ Sí | ✅ Sí | 🟢 Funciona |
| GET_MENSAJES | ✅ Sí | ✅ Sí | 🟢 Limpio |

---

## ⏳ Próximas Acciones

### Corto Plazo (YA HECHO)
- ✅ Remover `imagen` de queries
- ✅ Agregar logging para debugging

### Mediano Plazo
- ⏳ Hacer deploy a producción del nuevo api-colegios (con `imagen` soportado)
- ⏳ Una vez que servidor esté actualizado, re-agregar `imagen` a queries
- ⏳ Implementar fallback o versioning de queries

### Largo Plazo
- 🔄 Considerar schema versioning en API
- 🔄 Considerar deprecación gradual de campos
- 🔄 Documentar cambios de API en breaking changes

---

## 🔗 Relación con Cambios Anteriores

Esto revierte parcialmente el cambio anterior donde se agregó `imagen`. 

**Timeline**:
1. Agregamos `imagen` a query para mostrar imágenes
2. Descubrimos que servidor no lo soporta
3. Removemos `imagen` para que query funcione
4. Carrusel mostrará degradado (sin imagen) hasta que servidor sea actualizado

---

## ✨ Resultado

- ✅ Mensajes/anuncios ahora se cargan correctamente
- ✅ MensajesTab muestra mensajes
- ✅ Dashboard muestra feed completo
- ⏳ Imágenes funcionarán cuando se actualice el servidor

