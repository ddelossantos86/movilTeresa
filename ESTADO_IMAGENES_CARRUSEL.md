# 🖼️ Estado de Imágenes en Carrusel

## 🎯 Situación Actual

### Problema
Las imágenes de ejemplo en el carrusel estaban usando URLs de Unsplash que:
- ❌ No existían (404 Not Found)
- ❌ Eran URLs externas innecesarias
- ❌ Retornaban errores HTTP 404

**Error observado**:
```
Error loading image for post: ejemplo-3 
Unexpected HTTP code Response{protocol=h2, code=404, 
url=https://images.unsplash.com/photo-150784272343-583f20270319...}
```

### Solución Implementada

#### 1. Remover URLs de ejemplo (App.tsx línea ~4050)
```typescript
// ANTES:
imagen: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop'

// DESPUÉS:
imagen: undefined
```

Se actualizaron todos los 4 posteos de ejemplo para no tener imágenes.

#### 2. El Carrusel ahora:
- ✅ Muestra degradado turquesa para posteos sin imagen
- ✅ Mostraría imagen si el backend la devuelve
- ❌ No intenta cargar URLs inexistentes

---

## 📊 Flujo Actual de Imágenes

### Estado: Sin Imágenes del Backend
```
Usuario abre app
    ↓
GET_MENSAJES_TUTOR query
    ↓
Backend (149.50.150.151:3090)
    ↓ No devuelve campo 'imagen' 
      (versión antigua del backend)
    ↓
Carrusel recibe: imagen = undefined
    ↓
Muestra degradado turquesa ✅
```

### Estado: Cuando Backend sea Actualizado
```
Usuario abre app
    ↓
GET_MENSAJES_TUTOR query (incluyendo 'imagen')
    ↓
Backend (actualizado)
    ↓ Devuelve: imagen: "base64 o URL"
    ↓
Carrusel recibe: imagen = "data:image/jpeg;base64,..."
    ↓
Muestra imagen ✅
```

---

## 🔧 Qué Falta para que Funcionen las Imágenes

### Requisito: Backend Actualizado

1. **Servidor de producción** (`149.50.150.151:3090`) debe correr:
   - ✅ api-colegios actualizado con soporte para campo `imagen`
   - ✅ Código que guarde imágenes en MongoDB
   - ✅ GraphQL schema que exponga `imagen` field

2. **En movilTeresa**, cuando backend esté actualizado:
   - Re-agregar campo `imagen` a GET_MENSAJES_TUTOR
   - CarruselPosteos mostrará automáticamente las imágenes

---

## 📋 Checklist

### Frontend (movilTeresa) ✅
- [x] Query sin campo `imagen` (evita error 400)
- [x] CarruselPosteos muestra degradado si no hay imagen
- [x] Posteos de ejemplo sin URLs de Unsplash
- [x] Logging para debugging

### Backend (api-colegios) ⏳
- [ ] Deploy a producción de versión con `imagen`
- [ ] MongoDB con campo `imagen` en MensajeGeneral
- [ ] GraphQL schema expone campo `imagen`
- [ ] API devuelve `imagen` en GET_MENSAJES_TUTOR

---

## 🎨 Visual Actual

### Sin Imagen
```
┌─────────────────────────────────┐
│  ▁▂▃▄▅▆▇█ DEGRADADO TURQUESA  │
│  ▆▇█████████████████████████   │
│         (icono campana)         │
│  ████████████████████████▆▇█   │
│  ▂▃▄▅▆▇█████████████████▂▃▄▅  │
└─────────────────────────────────┘
│ 📝 Título del Anuncio          │
│ Contenido del anuncio...       │
│ ───────────────────────────    │
│ 👤 Autor    📅 Fecha          │
└─────────────────────────────────┘
```

### Con Imagen (cuando backend esté actualizado)
```
┌─────────────────────────────────┐
│        🖼️  IMAGEN REAL         │
│      (base64 o URL)             │
└─────────────────────────────────┘
│ 📝 Título del Anuncio          │
│ Contenido del anuncio...       │
│ ───────────────────────────────│
│ 👤 Autor    📅 Fecha          │
└─────────────────────────────────┘
```

---

## 🚀 Próximos Pasos

### Para que funcionen las imágenes:

1. **Deploy backend a producción**
   ```bash
   cd /Users/nano/Documents/colegio/api-colegios
   git pull && npm run build && npm start
   ```

2. **Re-agregar campo `imagen` a queries**
   ```typescript
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
         imagen              # ← RE-AGREGAR
         publicadoEn
         creadoEn
         leido
         leidoPorTutorIds
         destinatarioIds
       }
     }
   `;
   ```

3. **Crear mensaje con imagen en app-colegios**
   - Ir a Crear Anuncio
   - Seleccionar imagen
   - Guardar
   - Verificar en movilTeresa que se ve

---

## 📝 Nota

Las imágenes del carrusel funcionarán **cuando se cumplan dos condiciones**:

1. ✅ El backend de producción esté actualizado (expone campo `imagen`)
2. ✅ La query incluya el campo `imagen`

Por ahora, movilTeresa está **sin errores** y mostrará degradado hasta que ambas condiciones se cumplan.

