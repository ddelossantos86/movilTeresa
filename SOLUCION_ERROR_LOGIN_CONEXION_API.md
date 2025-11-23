# 🔧 SOLUCIÓN: movilTeresa - Error al conectar con API

## 🔴 El Problema

La app movilTeresa intenta conectarse a `192.168.68.116:3000` pero esa IP ya no es válida o el API no está corriendo en ese puerto.

```
Error: Network error
Failed to login
No connection to API
```

---

## 🔍 DIAGNÓSTICO

### Paso 1: Identifica tu IP local actual

En tu Mac, abre Terminal:

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

O simplemente:

```bash
ifconfig
```

**Busca algo como:**
```
inet 192.168.X.XXX
```

Por ejemplo: `192.168.1.100` o `192.168.68.120`

### Paso 2: Verifica el API está corriendo localmente

En otro Terminal:

```bash
cd /Users/nano/Documents/colegio/api-colegios
npm run start:dev
```

Deberías ver algo como:
```
[Nest] 12345  - 11/13/2025, 10:30:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 11/13/2025, 10:30:01 AM     LOG [GraphQLModule] GraphQL endpoint enabled at /graphql
```

**IMPORTANTE:** El puerto debe ser `3000` (o el que configures)

### Paso 3: Prueba conectar desde tu Mac

```bash
curl http://192.168.68.116:3000/graphql
```

Si funciona, verás una respuesta JSON. Si NO funciona:

```bash
curl: (7) Failed to connect to 192.168.68.116 port 3000: Connection refused
```

---

## ✅ SOLUCIÓN

### Opción A: DESARROLLO LOCAL (Tu Mac)

#### 1. Obtén tu IP actual

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Por ejemplo: `192.168.1.100`

#### 2. Actualiza `.env.local`

**Archivo:** `movilTeresa/.env.local`

```env
# DESARROLLO - Tu IP local
API_HOST=192.168.1.100    # ← CAMBIA ESTO A TU IP
API_PORT=3000
API_PROTOCOL=http
ENVIRONMENT=development
```

#### 3. Asegúrate que el API esté corriendo

```bash
cd /Users/nano/Documents/colegio/api-colegios
npm run start:dev
```

Ver que esté en puerto `3000` ✅

#### 4. Reinicia movilTeresa

```bash
cd /Users/nano/Documents/colegio/movilTeresa
npm start
```

Presiona `r` para recargar.

#### 5. Verifica en los logs

Busca en la terminal de movilTeresa:

```
🌐 API_URL configurada: http://192.168.1.100:3000/graphql
```

---

### Opción B: PRODUCCIÓN (Servidor)

Si quieres conectar a tu servidor en producción:

#### 1. Actualiza `.env.local`

```env
# PRODUCCIÓN - Servidor
API_HOST=149.50.150.151
API_PORT=3090
API_PROTOCOL=http
ENVIRONMENT=production
```

#### 2. Asegúrate que el API esté en el servidor

En el servidor:

```bash
ssh root@149.50.150.151
pm2 status
pm2 logs api-teresa
```

Debe estar en puerto `3090` y estado `online` ✅

#### 3. Reinicia movilTeresa

```bash
npm start
```

Presiona `r` para recargar.

---

## 🧪 TESTING

### Test 1: Conectividad de Red

Desde tu Mac:

```bash
# Verifica que el API está respondiendo
curl -v http://TU_IP:3000/graphql

# Debería retornar algo como:
# < HTTP/1.1 400 Bad Request
# (Eso está bien, significa que el servidor está activo)
```

### Test 2: GraphQL Query Manual

Instala `curl` o usa Postman:

```bash
curl -X POST http://TU_IP:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query { __typename }"}'
```

Debería responder (no error de conexión).

### Test 3: Logs de movilTeresa

Busca estos mensajes en la terminal:

```
✅ BIEN:
🌐 API_URL configurada: http://192.168.X.X:3000/graphql

❌ MAL:
🌐 API_URL configurada: http://192.168.68.116:3000/graphql
(y la app falla)
```

---

## 🐛 PROBLEMAS COMUNES

### Problema: "Network error" al loguearme

**Soluciones:**
1. ✅ Verifica que `.env.local` tiene la IP correcta
2. ✅ Verifica que el API está corriendo: `npm run start:dev`
3. ✅ Prueba ping: `ping 192.168.X.X`
4. ✅ Reinicia movilTeresa: presiona `r`

### Problema: "Cannot reach server"

**Soluciones:**
1. ✅ Verifica que estés en la MISMA RED WiFi
2. ✅ Desactiva VPN si tienes
3. ✅ Verifica que el firewall no bloquea puerto 3000
4. ✅ En movilTeresa, ve a Settings → Network y verifica IP

### Problema: Funciona en web pero no en móvil

**Probablemente es problema de IP:**
- ✅ Web usa `localhost:3000`
- ✅ Móvil necesita IP local `192.168.X.X:3000`

---

## 📋 CHECKLIST RÁPIDO

```bash
# 1. Obtén tu IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# 2. Copia esa IP a .env.local
# Archivo: movilTeresa/.env.local
# API_HOST=<TU_IP>

# 3. Verifica que API corre
cd api-colegios && npm run start:dev

# 4. En otra terminal, prueba conectar
curl http://192.168.X.X:3000/graphql

# 5. Reinicia movilTeresa
cd movilTeresa && npm start
# Presiona 'r'

# 6. Verifica logs
# Busca: "API_URL configurada: http://192.168.X.X:3000/graphql"
```

---

## 🚀 SOLUCIÓN MÁS RÁPIDA

**Si estás en desarrollo local:**

```bash
# Terminal 1 - API
cd /Users/nano/Documents/colegio/api-colegios
npm run start:dev

# Terminal 2 - movilTeresa
cd /Users/nano/Documents/colegio/movilTeresa
# Edita .env.local con tu IP
# API_HOST=192.168.1.XXX  (obtén con: ipconfig)
npm start

# Terminal 2 - presiona 'r' para recargar

# Verifica logs en Terminal 2
# Debe mostrar: API_URL configurada: http://192.168.1.XXX:3000/graphql
```

---

## 📞 DEBUGGING AVANZADO

Si aún no funciona, habilita logs:

En `src/config/apollo.ts`, agrega al inicio:

```typescript
console.log('🌐 API_HOST:', process.env.EXPO_PUBLIC_API_HOST || API_HOST);
console.log('🌐 API_PORT:', process.env.EXPO_PUBLIC_API_PORT || API_PORT);
console.log('🌐 API_PROTOCOL:', process.env.EXPO_PUBLIC_API_PROTOCOL || API_PROTOCOL);
console.log('🌐 API_URL:', API_URL);
console.log('📱 Platform:', Platform.OS);
console.log('📱 Device: ', Device.modelName);
```

Luego ve los logs con:

```bash
npm start
# y en otro terminal
expo logs
```

---

**Última actualización**: 13 de noviembre de 2025
**Próxima revisión**: Cuando hagas deploy a producción

