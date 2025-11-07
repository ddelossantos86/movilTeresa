# 🧹 Estrategia de Invalidación de Cache - Apollo Client

## Problema Identificado

**Error Crítico**: "cada vez q hacer una actualizacion no puedo leer los mensajes"

Cuando el servidor en `/app/apiTeresa` se reinicia o su schema cambia, la app movilTeresa falla con:

```
Error: Response not successful: Received status code 400
[MensajesTab] Query error: ApolloError: Cannot query field "imagen"
```

### Causa Raíz

1. **Apollo Cache persiste** entre reinicios de la app
2. Cuando el servidor se reinicia/redeploy, el schema puede cambiar
3. Las **queries cacheadas contienen campos obsoletos** que el nuevo schema no reconoce
4. GraphQL rechaza la query con error 400
5. **La app queda inutilizada** sin poder leer mensajes

## Solución Implementada

### 1. Detección de Errores de Schema

El `errorLink` ahora detecta específicamente:

```typescript
- "Cannot query field" → Campo no existe en servidor
- "Unexpected" / "Expected" → Tipo de respuesta inválido
- Status 400 + schema error → Query incompatible con schema
- Status 5xx → Servidor no disponible
```

### 2. Auto-Reset de Cache

Cuando se detecta un error de schema:

```typescript
apolloClient.cache.reset()
```

**Efecto**: Todas las queries cacheadas se limpian, permitiendo que se reintenten contra el schema actualizado.

### 3. Reintento Automático con Backoff Exponencial

**Lógica de reintento**:
- Detecta error → Resetea cache → Reintenta query
- Hasta 3 intentos
- Delays: 100ms → 200ms → 400ms
- Limpia contador de reintentos cuando es exitoso

### 4. Manejo Específico de Diferentes Códigos de Error

| Código | Causa | Acción |
|--------|-------|--------|
| 400 | Incompatibilidad schema | Reset cache + reintento |
| 401/403 | Auth inválido | NO reintentar |
| 4xx (otros) | Error cliente | Reset cache + reintento |
| 5xx | Servidor down | Reset cache + reintento |
| sin código | Sin conexión | Reset cache + reintento |

## Archivos Modificados

```
movilTeresa/src/config/apollo.ts
```

### Cambios Clave

1. **Nuevo mapa de reintentos**:
```typescript
const retryCountMap = new Map<string, number>();
```

2. **Secciones de detección**:
- `MANEJO DE ERRORES GRAPHQL`
- `MANEJO DE ERRORES DE RED`
- `LÓGICA DE REINTENTO`

3. **Uso de Observable para reintento**:
```typescript
return new Observable(subscriber => {
  setTimeout(() => {
    forward(operation).subscribe(subscriber);
  }, delayMs);
});
```

## Resultado Esperado

✅ Cuando el servidor se reinicia:
1. MensajesTab intenta query
2. Recibe error 400 (schema mismatch)
3. apollo.ts detecta error de schema
4. Resetea cache
5. Reintenta automáticamente
6. Query exitosa contra nuevo schema
7. Mensajes aparecen normalmente

**Usuario nunca ve error**, la app continúa funcionando automáticamente.

## Testing

### Caso 1: Servidor Reinicia
1. App abierta en MensajesTab
2. SSH a servidor: `systemctl restart nodejs` (o similar)
3. Esperar conexión restablecida
4. **Esperado**: Mensajes cargan automáticamente, sin errores visibles

### Caso 2: Schema Cambia (agregar/remover campo)
1. Backend actualiza schema y deploya
2. App intentará query antigua
3. **Esperado**: Error detectado → Cache limpiado → Query reintentada exitosamente

### Caso 3: Sin conexión
1. Desactivar WiFi/datos
2. MensajesTab intenta refresh
3. **Esperado**: Reintenta cada 100-400ms mientras no haya conexión
4. Cuando conexión vuelve: query exitosa

## Logs para Debugging

El apollo.ts ahora produce logs detallados:

```
❌ [GraphQL error en getMensajesTutor]: Cannot query field "imagen"
⚠️  ERROR DE SCHEMA: Campo solicitado no existe en servidor
💡 Probable causa: Servidor fue reiniciado o schema cambió
🧹 Acción: Limpiando cache y reintentando...
🔄 Reintentando getMensajesTutor (intento 1/3) en 100ms...
🔄 Ejecutando reintento 1/3...
✅ Query exitosa en reintento
```

## Futuras Mejoras

- [ ] Implementar **WebSocket reconnection** para detectar cambios de schema en tiempo real
- [ ] Agregar **periodic schema sync** para validar schema cada N minutos
- [ ] Implementar **optimistic updates** para mejor UX durante reintento
- [ ] Storage de "última query exitosa" para fallback offline

## Estado

- ✅ Implementado
- ✅ Sin errores de compilación
- ⏳ Pendiente: Commit y push a GitHub
- ⏳ Pendiente: Deploy a dispositivo
- ⏳ Pendiente: Testing en producción
