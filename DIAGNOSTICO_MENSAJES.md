# 🔍 Diagnóstico: Mensajes no aparecen después del login

## Problema
Después de hacer login en movilTeresa, no se ven los mensajes (GET_MENSAJES_TUTOR retorna vacío o error).

## Cambios Implementados

### 1. Apollo Cache Reset
Agregado `apolloClient.cache.reset()` después del login exitoso en `performLogin()`.

**Razón**: El cache de Apollo podría estar guardando resultados de queries previas sin autenticación.

```typescript
// Limpiar el cache de Apollo para que cargue datos frescos
await apolloClient.cache.reset();
```

## Puntos de Verificación

### 1. ¿El login es exitoso?
- [ ] ¿Ves la pantalla de inicio (mensajes/alumnos)?
- [ ] ¿El token se guarda en AsyncStorage?
  - Ver console logs: `🔐 Login Response User:`

### 2. ¿Se envía el token a las requests?
- [ ] Ver console logs de Apollo: `🔑 Token obtenido:`
- [ ] Debería mostrar: `🔑 Token obtenido: eyJhbGciOi...` (primeros 20 caracteres)
- [ ] Si muestra `NO HAY TOKEN`, el AsyncStorage no guardó correctamente

### 3. ¿La API retorna datos?
- [ ] Revisar errores de red en console logs
- [ ] Buscar mensajes de error GraphQL

## Test Manual desde Terminal

Para verificar que la API retorna mensajes con autenticación:

```bash
# 1. Hacer login primero
curl -X POST http://149.50.150.151:3090/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation LoginTutorPassword($input: LoginTutorPasswordInput!) { loginTutorPassword(input: $input) { token } }",
    "variables": { "input": { "documento": "30123456", "password": "director" } }
  }'

# Copia el token de la respuesta

# 2. Usar el token para obtener mensajes
curl -X POST http://149.50.150.151:3090/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_AQUI>" \
  -d '{
    "query": "query { mensajesTutor { id titulo contenido } }"
  }'
```

## Solución Aplicada

**apollo.ts**: ✅ Configuración correcta
- IS_PRODUCTION = true
- API_URL = http://149.50.150.151:3090/graphql
- authLink envía token en header Authorization

**App.tsx**: ✅ Limpieza de cache
- performLogin() ahora llama apolloClient.cache.reset()
- Fuerza recarga de datos después del login

**queries.ts**: ✅ Query actualizada
- Removido campo `usuario` que no existe en producción
- Solo pide campos existentes

## Logs Importantes

Cuando hagas login, deberías ver en console:

```
🌐 Entorno: PRODUCCIÓN
🌐 API_URL configurada: http://149.50.150.151:3090/graphql
🔑 Token obtenido: eyJhbGciOi...
📤 Enviando operación: GET_MENSAJES_TUTOR
🧹 Apollo cache limpiado después del login
```

Si falta alguno de estos logs, hay un problema en esa parte del flujo.

## Próximos Pasos

1. **Reinicia la app mobile**: `npm start`
2. **Haz login** con credenciales válidas
3. **Revisa los console logs** en Expo para ver si los logs anteriores aparecen
4. **Verifica que ves mensajes** en la pantalla
5. Si aún no funciona, reporta:
   - ¿Qué logs ves exactamente?
   - ¿Qué error GraphQL se retorna (si hay)?

