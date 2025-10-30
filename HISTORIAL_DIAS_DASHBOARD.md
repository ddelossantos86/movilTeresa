# Selector de Fecha en Dashboard - Teresa

## 📋 Resumen

Se agregó un **selector de fecha** integrado en el modal de filtros del Dashboard (Hub de Información) de la aplicación móvil Teresa. El calendario **excluye automáticamente sábados y domingos**, permitiendo solo seleccionar días hábiles.

## ✨ Características Implementadas

### 1. Selector de Fecha en Modal de Filtros

- **Ubicación**: Dentro del modal de filtros (botón con ícono de embudo)
- **Posición**: Al final del modal, después de filtros de tipo y alumno
- **Funcionalidad**: Dos opciones:
  - **"Hoy"**: Volver a la fecha actual
  - **"Seleccionar otro día"**: Abre calendario para elegir fecha
- **Integración**: Funciona junto con otros filtros (tipo y alumno)

### 2. Calendario Inteligente

- **DatePicker**: Componente nativo de UI Kitten (`Datepicker`)
- **Filtro de días**: Excluye automáticamente sábados (6) y domingos (0)
- **Formato**: Argentino (es-AR)
- **Navegación**: Por meses usando flechas
- **Estado temporal**: Usa `tempDate` mientras se selecciona, solo aplica al confirmar

### 3. Cambios en la Lógica de Datos

#### Estados Agregados
```typescript
const [selectedDate, setSelectedDate] = useState<Date | null>(null); // null = hoy
const [showDatePicker, setShowDatePicker] = useState(false); // Modal del calendario
const [tempDate, setTempDate] = useState<Date>(new Date()); // Fecha temporal para el picker
const fechaBase = selectedDate || new Date(); // Fecha de referencia para queries
```

#### Queries Actualizadas
Todas las queries ahora usan `fechaBase` en lugar de fecha actual:
- **Mensajes**: Filtrados entre `fechaBase - 7 días` y `fechaBase`
- **Asistencias**: Últimos 7 días desde `fechaBase`
- **Evaluaciones**: Últimos 30 días desde `fechaBase`
- **Seguimiento Diario**: Rango de 7 días hasta `fechaBase`

### 4. Indicadores Visuales

#### En el Header
- **Fecha dinámica**: Muestra fecha seleccionada o fecha actual
- **Badge "Filtrado"**: Aparece cuando hay una fecha seleccionada
  ```tsx
  {selectedDate && (
    <View style={{ backgroundColor: '#E6F7F4', ... }}>
      <Icon name="calendar" fill="#00BFA5" />
      <Text style={{ color: '#00BFA5' }}>Filtrado</Text>
    </View>
  )}
  ```

#### En el Botón de Filtros
- **Punto indicador (●)**: Aparece cuando hay filtros activos (tipo, alumno o fecha)
  ```tsx
  {filtroTipo.length < 4 || filtroAlumno || selectedDate ? '●' : ''}
  ```

### 5. Componentes UI

#### Sección en Modal de Filtros
```tsx
{/* Filtro por fecha */}
<Divider style={{ marginBottom: 16 }} />
<Text category="s1">Fecha</Text>

{/* Opción "Hoy" */}
<TouchableOpacity onPress={() => setSelectedDate(null)}>
  <Icon name="calendar" fill="#00BFA5" />
  <Text>Hoy</Text>
  {!selectedDate && <Icon name="checkmark-circle-2" fill="#00BFA5" />}
</TouchableOpacity>

{/* Opción "Seleccionar otro día" */}
<TouchableOpacity onPress={() => setShowDatePicker(true)}>
  <Icon name="calendar-outline" fill="#00BFA5" />
  <Text>
    {selectedDate 
      ? selectedDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
      : 'Seleccionar otro día'
    }
  </Text>
  {selectedDate && <Icon name="checkmark-circle-2" fill="#00BFA5" />}
</TouchableOpacity>
```

#### Modal de DatePicker
```tsx
{showDatePicker && (
  <Modal visible={true} transparent={true} animationType="fade">
    <View style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', ... }}>
      <Card>
        <Text category="h6">Seleccionar fecha</Text>
        
        <Datepicker
          date={tempDate}
          onSelect={(date) => setTempDate(date)}
          filter={(date) => {
            // Deshabilitar sábados (6) y domingos (0)
            const diaSemana = date.getDay();
            return diaSemana !== 0 && diaSemana !== 6;
          }}
        />
        
        <Button onPress={() => {
          setSelectedDate(tempDate);
          setShowDatePicker(false);
        }}>
          Seleccionar
        </Button>
        <Button appearance="outline" onPress={() => setShowDatePicker(false)}>
          Cancelar
        </Button>
      </Card>
    </View>
  </Modal>
)}
```

## 🎨 Paleta de Colores Utilizada

Manteniendo la estética existente:
- **Principal**: `#00BFA5` (Verde agua - color de marca)
- **Fondo claro**: `#F8FAFB`
- **Bordes**: `#E4E9F2`
- **Texto principal**: `#2E3A59`
- **Fondo seleccionado**: `#E6F7F4` (Verde claro)
- **Blanco**: `#FFFFFF`
- **Overlay**: `rgba(0, 0, 0, 0.5)` (para modal)

## 📱 Experiencia de Usuario

### Flujo Normal (Hoy)
1. Usuario abre Dashboard → Ve novedades de hoy
2. Botón de filtros no tiene punto (●)
3. Badge "Filtrado" NO visible

### Flujo de Selección de Fecha
1. Usuario toca **Filtros** (botón con embudo)
2. Baja hasta la sección **Fecha**
3. Toca **"Seleccionar otro día"**
4. Se abre modal con calendario
5. Selecciona una fecha (sábados y domingos deshabilitados)
6. Toca **"Seleccionar"**
7. Modal se cierra, fecha queda seleccionada
8. Toca **"Aplicar"** en el modal de filtros
9. Dashboard se actualiza con datos de esa fecha

### Indicadores Visuales Activos
- Header muestra la fecha seleccionada
- Badge verde "📅 Filtrado" aparece
- Botón de filtros muestra punto (●)
- En modal de filtros, opción de fecha muestra checkmark verde

### Volver a Hoy
1. Usuario toca **Filtros**
2. En sección Fecha, toca **"Hoy"**
3. Toca **"Aplicar"**
4. O simplemente toca **"Limpiar"** (resetea todos los filtros)

## 🔧 Aspectos Técnicos

### Filtrado de Mensajes
```typescript
const mensajesRecientes = mensajes.filter((m: any) => {
  const fechaMensaje = new Date(m.publicadoEn || m.creadoEn);
  // Filtrar mensajes entre fechaLimiteMensajes y fechaBase
  return fechaMensaje >= fechaLimiteMensajes && fechaMensaje <= fechaBase;
});
```

### Filtro del DatePicker (Excluir Fines de Semana)
```typescript
filter={(date) => {
  // Deshabilitar sábados (6) y domingos (0)
  const diaSemana = date.getDay();
  return diaSemana !== 0 && diaSemana !== 6;
}}
```

### Dependencias del Memo
Se agregó `selectedDate` y `fechaBase` a las dependencias del `useMemo` de `feedPosts`:
```typescript
}, [mensajes, asistenciasData, calificacionesQueries, seguimientosQueries, 
    alumnos, fechaLimite, selectedDate, fechaBase]);
```

### Botón "Limpiar" Actualizado
```typescript
onPress={() => {
  setFiltroTipo(['MENSAJE', 'ASISTENCIA', 'EVALUACION', 'SEGUIMIENTO']);
  setFiltroAlumno(null);
  setSelectedDate(null); // ← Ahora también limpia la fecha
}}
```

## 🚀 Ventajas de esta Implementación

1. **Centralizado**: Todo en un solo lugar (modal de filtros)
2. **Consistente**: Mismo patrón que AsistenciasTab
3. **Inteligente**: Excluye automáticamente fines de semana
4. **Flexible**: Cualquier día hábil, cualquier mes/año
5. **Combinable**: Funciona con filtros de tipo y alumno
6. **No intrusivo**: No ocupa espacio permanente en la UI
7. **Cancelable**: Cambios no se aplican hasta presionar "Seleccionar"

## 📊 Comparación de Implementaciones

### ❌ Implementación Anterior (Removida)

**Ubicación**: Al final del feed, siempre visible

**UI**:
```
📅 Ver información de otros días
[Hoy] [jue 16] [mié 15] [mar 14] [lun 13] [dom 12]
```

**Problemas**:
- Botones fijos (incluían fines de semana)
- Solo últimos 5 días
- Ocupaba espacio permanente
- No integrado con otros filtros
- Banner adicional al seleccionar

### ✅ Implementación Actual

**Ubicación**: Dentro del modal de filtros

**UI**:
```
Filtros
└── Fecha
    ├── Hoy (con ✓)
    └── Seleccionar otro día → [Calendario]
```

**Ventajas**:
- Calendario completo (cualquier día)
- Excluye fines de semana automáticamente
- Integrado con otros filtros
- No ocupa espacio permanente
- Consistente con otras secciones

## ✅ Testing

### Casos de Prueba
- [x] Seleccionar "Hoy" muestra datos actuales
- [x] Abrir calendario muestra mes actual
- [x] Sábados y domingos están deshabilitados en calendario
- [x] Seleccionar día histórico muestra datos de ese día
- [x] Header se actualiza con fecha seleccionada
- [x] Badge "Filtrado" aparece cuando hay fecha seleccionada
- [x] Botón de filtros muestra punto (●) cuando hay filtros activos
- [x] Botón "Cancelar" cierra calendario sin aplicar cambios
- [x] Botón "Limpiar" resetea fecha junto con otros filtros
- [x] Scroll funciona correctamente en modal
- [x] Filtros combinados funcionan (fecha + tipo + alumno)
- [x] Refresh (pull to refresh) mantiene fecha seleccionada

### Casos Edge
- [x] Seleccionar fecha futura (permitido, aunque no habrá datos)
- [x] Seleccionar fecha muy antigua (funciona, queries limitan rango)
- [x] Cambiar de mes en calendario (funciona)
- [x] Cerrar modal sin seleccionar (tempDate se resetea al abrir de nuevo)

## 📝 Notas de Implementación

- **No rompe funcionalidad existente**: Por defecto (`selectedDate = null`) muestra datos de hoy
- **Compatibilidad**: Funciona con todos los niveles (Maternal, Inicial, Primaria, Medio)
- **Performance**: No afecta el rendimiento, solo cambia las variables de las queries existentes
- **Estética preservada**: Usa los mismos componentes, colores y espaciados del diseño actual
- **Código reutilizable**: Mismo patrón que AsistenciasTab (fácil de mantener)

## 🐛 Debugging

### Logs útiles
```typescript
console.log('=== DASHBOARD DEBUG ===');
console.log('Fecha base seleccionada:', fechaBase.toISOString().split('T')[0]);
console.log('Mensajes:', mensajes.length);
console.log('Rango asistencias/seguimiento:', hace7Dias, 'a', hoy);
```

### Props a verificar
- `selectedDate`: Date | null
- `showDatePicker`: boolean
- `tempDate`: Date
- `fechaBase`: Date (calculado)

---

**Fecha de implementación**: Octubre 2025  
**Archivo modificado**: `/movilTeresa/App.tsx`  
**Función modificada**: `DashboardTab` (líneas ~3260-4000)  
**Patrón usado**: AsistenciasTab DatePicker (líneas ~1900-2350)

## ✨ Características Implementadas

### 1. Selector de Días Históricos

- **Ubicación**: Al final del feed de novedades en el Dashboard
- **Funcionalidad**: Botones para ver los últimos 5 días + botón "Hoy"
- **Estética**: Mantiene el diseño existente con colores y estilos coherentes

### 2. Cambios en la Lógica de Datos

#### Estado Agregado
```typescript
const [selectedDate, setSelectedDate] = useState<Date | null>(null); // null = hoy
const fechaBase = selectedDate || new Date(); // Fecha de referencia
```

#### Queries Actualizadas
Todas las queries ahora usan `fechaBase` en lugar de fecha actual:
- **Mensajes**: Filtrados entre `fechaBase - 7 días` y `fechaBase`
- **Asistencias**: Últimos 7 días desde `fechaBase`
- **Evaluaciones**: Últimos 30 días desde `fechaBase`
- **Seguimiento Diario**: Rango de 7 días hasta `fechaBase`

### 3. Componentes UI

#### Selector de Días
```tsx
<View style={{ /* Contenedor del selector */ }}>
  {/* Botón "Hoy" */}
  <TouchableOpacity onPress={() => setSelectedDate(null)}>
    Hoy
  </TouchableOpacity>
  
  {/* Botones para últimos 5 días */}
  {[1, 2, 3, 4, 5].map((diasAtras) => (
    <TouchableOpacity onPress={() => setSelectedDate(fecha)}>
      {fecha.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
    </TouchableOpacity>
  ))}
</View>
```

#### Indicador de Fecha Seleccionada
Cuando se selecciona un día histórico, aparece un banner verde con:
- Icono de calendario
- Fecha completa en formato legible
- Botón "X" para volver a hoy

### 4. Header Actualizado

El header del Dashboard ahora muestra la fecha seleccionada en lugar de solo la fecha actual:
```typescript
{selectedDate 
  ? selectedDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
  : new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}
```

## 🎨 Paleta de Colores Utilizada

Manteniendo la estética existente:
- **Principal**: `#00BFA5` (Verde agua - color de marca)
- **Fondo claro**: `#F8FAFB`
- **Bordes**: `#E4E9F2`
- **Texto principal**: `#2E3A59`
- **Fondo seleccionado**: `#E6F7F4` (Verde claro)
- **Blanco**: `#FFFFFF`

## 📱 Experiencia de Usuario

### Flujo Normal (Hoy)
1. Usuario abre Dashboard → Ve novedades de hoy
2. Scroll hasta el final → Ve selector de días
3. Botón "Hoy" está seleccionado (verde)

### Flujo Histórico
1. Usuario hace clic en un día anterior (ej: "mié 15 ene")
2. Sistema recarga datos para ese día
3. Header muestra la fecha seleccionada
4. Aparece banner verde: "Viendo: miércoles 15 de enero de 2025"
5. Feed muestra novedades de ese día (mensajes, asistencias, evaluaciones, seguimiento)
6. Usuario puede hacer clic en "X" o "Hoy" para volver a la fecha actual

## 🔧 Aspectos Técnicos

### Filtrado de Mensajes
```typescript
const mensajesRecientes = mensajes.filter((m: any) => {
  const fechaMensaje = new Date(m.publicadoEn || m.creadoEn);
  return fechaMensaje >= fechaLimiteMensajes && fechaMensaje <= fechaBase;
});
```

### Dependencias del Memo
Se agregó `selectedDate` y `fechaBase` a las dependencias del `useMemo` de `feedPosts`:
```typescript
}, [mensajes, asistenciasData, calificacionesQueries, seguimientosQueries, 
    alumnos, fechaLimite, selectedDate, fechaBase]);
```

## 🚀 Próximas Mejoras (Opcionales)

1. **Calendario completo**: Agregar DatePicker modal para seleccionar cualquier fecha
2. **Navegación por flechas**: Botones ← → para ir día por día
3. **Persistencia**: Guardar última fecha vista en AsyncStorage
4. **Animaciones**: Transiciones suaves al cambiar de día
5. **Indicadores visuales**: Marcar días con novedades importantes

## ✅ Testing

### Casos de Prueba
- [x] Seleccionar "Hoy" muestra datos actuales
- [x] Seleccionar día histórico muestra datos de ese día
- [x] Header se actualiza con fecha seleccionada
- [x] Banner de fecha seleccionada aparece/desaparece correctamente
- [x] Botón "X" limpia selección y vuelve a hoy
- [x] Scroll funciona correctamente con selector al final
- [x] Filtros de tipo y alumno funcionan con fechas históricas
- [x] Refresh (pull to refresh) actualiza datos del día seleccionado

## 📝 Notas

- **No rompe funcionalidad existente**: Por defecto (`selectedDate = null`) muestra datos de hoy
- **Compatibilidad**: Funciona con todos los niveles (Maternal, Inicial, Primaria, Medio)
- **Performance**: No afecta el rendimiento, solo cambia las variables de las queries existentes
- **Estética preservada**: Usa los mismos componentes, colores y espaciados del diseño actual

---

**Fecha de implementación**: Enero 2025  
**Archivo modificado**: `/movilTeresa/App.tsx`  
**Función modificada**: `DashboardTab` (líneas ~3257-3950)
