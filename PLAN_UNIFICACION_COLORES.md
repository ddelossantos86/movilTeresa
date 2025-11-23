# 📋 Plan de Unificación de Colores en Todas las Secciones

## 🎯 Objetivo
Replicar el estilo de color de las cards de MensajesTab (bg_secondary) en TODAS las secciones para consistencia visual.

## 🎨 Color Target
- **colors.bg_secondary** = #222841 (gris oscuro)
- En light mode: #FFFFFF (blanco)

## 📊 Secciones a Actualizar

### ✅ 1. AsistenciasTab
**Estado**: EN PROGRESO
- ✅ Cards principales: bg_secondary (cambio realizado)
- ✅ Skeleton loading: bg_secondary (cambio realizado)
- ⏳ Modal: revisar

### 2. EvaluacionesTab
**Estado**: PENDIENTE
- ⏳ Cards de observaciones: #FFFFFF → bg_secondary
- ⏳ Skeleton loading: #F8FAFB → bg_secondary
- ⏳ Select card: revisar
- ⏳ Textos y dividers: dinámicos

### 3. SeguimientoTab
**Estado**: PENDIENTE
- ⏳ Cards: revisar color actual
- ⏳ Skeleton loading: revisar
- ⏳ Contenido interno: dinámicos

### 4. DashboardTab
**Estado**: PENDIENTE
- ⏳ Cards de MensajePostWrapper: bg_secondary
- ⏳ Cards de resumen: revisar

### 5. ConfiguracionesTab
**Estado**: REVISAR
- ⏳ Cards: revisar si existen

## 🔧 Patrón de Cambio

### Antes:
```tsx
backgroundColor: '#FFFFFF' o '#F8FAFB'
```

### Después:
```tsx
backgroundColor: isDarkMode ? colors.bg_secondary : '#FFFFFF'
```

### Para Skeleton:
```tsx
backgroundColor: isDarkMode ? colors.bg_secondary : '#F8FAFB'
```

## 📝 Cambios Realizados en Esta Sesión

1. AsistenciasTab - Card principal:
   - Cambio de `colors.bg_tertiary` a `colors.bg_secondary`
   
2. AsistenciasTab - Skeleton loading:
   - Cambio de `colors.bg_tertiary` a `colors.bg_secondary`

## ⏭️ Próximos Pasos

1. Actualizar EvaluacionesTab
2. Actualizar SeguimientoTab
3. Verificar DashboardTab
4. Verificar ConfiguracionesTab
5. Compilación final
6. Verificación visual en app

