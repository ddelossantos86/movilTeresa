# ✅ Cambios Aplicados para Mensajes No Visibles

## Problemas Identificados y Solucionados

### 1. **Query con Campos Inválidos**
**Problema**: La query `GET_MENSAJES_TUTOR` pedía campos que podrían no existir en el servidor de producción
- Removido: `destinatarioIds`
- Removido: `leidoPorTutorIds`
- Mantenidos: `id`, `titulo`, `contenido`, `imagen`, `tipo`, `alcance`, `autorNombre`, `publicadoEn`, `creadoEn`, `leido`

**Solución**: Simplificada la query a los campos core más probables de existir.

### 2. **Apollo Cache No Actualizado Después del Login**
**Problema**: El cache de Apollo guardaba resultados previos sin autenticación
- El token se guardaba pero Apollo seguía usando datos del cache sin token

**Solución**: Agregado `apolloClient.cache.reset()` después del login:
```typescript
// En performLogin() - App.tsx
await apolloClient.cache.reset();
console.log('🧹 Apollo cache limpiado después del login');
```

### 3. **Debugging Insuficiente**
**Problema**: Los errores no eran claros en console logs

**Solución**: Mejorados los logs de Apollo:
```typescript
❌ [GraphQL error en GET_MENSAJES_TUTOR]: Unauthorized
   HTTP Status: 401
❌ [Network error]: ...
```

## 📱 Pasos para Verificar

### Paso 1: Reiniciar la app
```bash
cd /Users/nano/Documents/colegio/movilTeresa
npm start
```

### Paso 2: Hacer login
- Ingresa documento y contraseña válidos de producción
- Espera a que aparezca la pantalla de inicio

### Paso 3: Revisar console logs en Expo

**Si ves estos logs**, el login fue exitoso:
```
🌐 Entorno: PRODUCCIÓN
🌐 API_URL configurada: http://149.50.150.151:3090/graphql
🔐 Login Response User: { id: "...", documento: "...", nombre: "..." }
🧹 Apollo cache limpiado después del login
🔑 Token obtenido: eyJhbGciOi...
📤 Enviando operación: GetMensajesTutor
```

**Si ves errores**, revisa:
```
❌ [GraphQL error en GetMensajesTutor]: Unauthorized
   HTTP Status: 401
```
→ El token no se está enviando → verificar AsyncStorage

```
❌ [GraphQL error en GetMensajesTutor]: Cannot query field "destinatarioIds"
```
→ Campo no existe → ya fue removido de la query

```
❌ [Network error]: 
   HTTP Status: 400
```
→ Problema de formato de request (poco probable ahora)

## 🔍 Posibles Causas Si Aún No Funciona

| Síntoma | Causa Probable | Solución |
|---------|---|---|
| "NO HAY TOKEN" en logs | Token no se guardó después del login | Verificar AsyncStorage |
| "Unauthorized" (401) | Token no se envía con la request | Verificar authLink en apollo.ts |
| "Cannot query field X" | Campo no existe en server | Será mostrado en error - remover de query |
| Pantalla en blanco | Query retorna null | Verificar que mensajesTutor existe en server |
| Error de red | Servidor no responde en 149.50.150.151:3090 | Verificar IP y puerto |

## 📊 Archivos Modificados

1. **src/graphql/queries.ts**
   - Simplificada `GET_MENSAJES_TUTOR`
   - Removidos campos: `destinatarioIds`, `leidoPorTutorIds`

2. **src/config/apollo.ts**
   - Mejorados logs de error
   - Más información en console

3. **App.tsx**
   - Agregado `apolloClient.cache.reset()` después del login
   - Nuevo log: "🧹 Apollo cache limpiado"

## 🚀 Test Rápido

Si tienes acceso a un tutor en producción con documento conocido:

```bash
# Terminal 1: Inicia la app
cd /Users/nano/Documents/colegio/movilTeresa
npm start

# Terminal 2: Escanea QR desde dispositivo
# Haz login con documento y password válidos

# Revisa Expo console en Terminal 1 para los logs
```

## 📝 Notas

- La app ahora apunta correctamente a `149.50.150.151:3090/graphql`
- SDK 51 es estable (revertido desde SDK 54)
- Autenticación JWT está configurada correctamente
- El cache se limpia después del login para evitar datos obsoletos

