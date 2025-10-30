# 📅 Vista Previa: Selector de Días Históricos

## Antes de implementación

```
┌────────────────────────────────────┐
│  🏠 Inicio                         │
│  Viernes 17 de enero               │
│  2 alumnos • 🔔 5                  │
│                                    │
│  [Filtros ≡]                       │
├────────────────────────────────────┤
│                                    │
│  📧 Mensaje de la directora...     │
│  📊 Evaluación de Matemática...    │
│  ✓ Asistencia: Juan Pérez         │
│  ...                               │
│                                    │
│  [Final del feed]                  │
│                                    │
└────────────────────────────────────┘
```

## Después de implementación

```
┌────────────────────────────────────┐
│  🏠 Inicio                         │
│  Viernes 17 de enero               │
│  2 alumnos • 🔔 5                  │
│                                    │
│  [Filtros ≡]                       │
├────────────────────────────────────┤
│                                    │
│  📧 Mensaje de la directora...     │
│  📊 Evaluación de Matemática...    │
│  ✓ Asistencia: Juan Pérez         │
│  ...                               │
│                                    │
├────────────────────────────────────┤
│  📅 Ver información de otros días  │
│  Selecciona un día para ver el     │
│  resumen de novedades              │
│                                    │
│  [✓ Hoy] [jue 16] [mié 15]        │
│  [mar 14] [lun 13] [dom 12]       │
│                                    │
└────────────────────────────────────┘
```

## Cuando seleccionas un día anterior

```
┌────────────────────────────────────┐
│  🏠 Inicio                         │
│  Miércoles 15 de enero             │← Fecha actualizada
│  2 alumnos • 🔔 3                  │
│                                    │
│  [Filtros ≡]                       │
├────────────────────────────────────┤
│                                    │
│  📧 Mensaje sobre tarea...         │← Datos del 15/01
│  ✓ Asistencia: María López        │
│  ...                               │
│                                    │
├────────────────────────────────────┤
│  📅 Ver información de otros días  │
│                                    │
│  [Hoy] [jue 16] [✓ mié 15]       │← Botón seleccionado
│  [mar 14] [lun 13] [dom 12]       │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ 📅 Viendo: miércoles 15 de   │ │← Banner indicador
│  │    enero de 2025         [X] │ │
│  └──────────────────────────────┘ │
│                                    │
└────────────────────────────────────┘
```

## Detalles de Diseño

### Botón NO seleccionado
```
┌──────────────┐
│  jue 16 ene  │  ← Texto gris #2E3A59
└──────────────┘  ← Fondo claro #F8FAFB
                  ← Borde gris #E4E9F2
```

### Botón seleccionado
```
┌──────────────┐
│ ✓ Hoy        │  ← Texto blanco #FFFFFF
└──────────────┘  ← Fondo verde #00BFA5
                  ← Borde verde #00BFA5
                  ← Checkmark visible
```

### Banner de fecha seleccionada
```
┌────────────────────────────────────┐
│ 📅 Viendo: miércoles 15 de enero  [X] │
└────────────────────────────────────┘
  ↑                                   ↑
  Fondo verde claro                   Botón cerrar
  #E6F7F4                             (vuelve a hoy)
  Texto verde #00BFA5
```

## Estados Visuales

### Estado 1: Vista Actual (Default)
- Botón "Hoy" → Verde (seleccionado)
- Otros botones → Gris claro
- Header → Fecha de hoy
- Banner → NO visible

### Estado 2: Vista Histórica
- Botón del día seleccionado → Verde (con ✓)
- Botón "Hoy" → Gris claro
- Otros botones → Gris claro
- Header → Fecha seleccionada
- Banner → VISIBLE con fecha completa

## Interacciones

1. **Tap en "Hoy"**
   - Limpia selección (`setSelectedDate(null)`)
   - Vuelve a datos actuales
   - Oculta banner

2. **Tap en día anterior**
   - Establece fecha (`setSelectedDate(fecha)`)
   - Recarga queries con nueva fecha base
   - Muestra banner
   - Actualiza header

3. **Tap en [X] del banner**
   - Igual que tap en "Hoy"
   - Limpia selección
   - Vuelve a hoy

4. **Pull to refresh**
   - Recarga datos del día seleccionado
   - Mantiene selección

## Responsive Design

```
Pantalla pequeña:
[Hoy] [j16] [m15]
[m14] [l13] [d12]

Pantalla normal:
[Hoy] [jue 16] [mié 15] [mar 14] [lun 13] [dom 12]

Pantalla grande:
[✓ Hoy] [jue 16 ene] [mié 15 ene] [mar 14 ene] [lun 13 ene] [dom 12 ene]
```

## Accesibilidad

- ✅ Contraste suficiente en todos los estados
- ✅ Área de toque mínima: 44x44pt
- ✅ Feedback visual claro (checkmark + color)
- ✅ Labels descriptivos
- ✅ Funciona con TalkBack/VoiceOver

## Animaciones (futuras)

```typescript
// Sugerencia para v2:
Animated.timing(fadeAnim, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true
})
```

---

**Inspiración**: AsistenciasTab date picker  
**Paleta**: Colores existentes del Dashboard  
**Layout**: ScrollView → Feed → Selector (al final)
