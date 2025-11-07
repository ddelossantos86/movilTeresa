# Debug Conexión API - Error 400

## Problema
- La app mobile reporta: "ApolloError: Response not successful: Received status code 400"
- Esto indica que `149.50.150.151:3090` está respondiendo pero rechazando la solicitud

## Posibles Causas

### 1. **Schema GraphQL Diferente**
   - La API en producción (`149.50.150.151:3090`) podría tener un schema diferente
   - La mutación `loginTutorPassword` podría no existir o tener otro nombre
   - Los tipos de input podrían tener estructura diferente

### 2. **Endpoint Incorrecto**
   - El endpoint podría no ser `/graphql` en producción
   - Podría ser `/graphql/` (con barra al final)
   - O un endpoint REST completamente diferente

### 3. **Headers o CORS**
   - Falta de headers requeridos
   - CORS no configurado
   - Content-Type no aceptado

### 4. **Formato de Payload**
   - El input espera un formato diferente
   - Variables GraphQL mal formadas
   - El body podría necesitar estar estruturado diferente

## Pruebas a Realizar

### Test 1: Verificar que la API responde
```bash
curl -i http://149.50.150.151:3090/graphql
```

### Test 2: Enviar query simple
```bash
curl -X POST http://149.50.150.151:3090/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{__typename}"}'
```

### Test 3: Inspeccionar el schema
```bash
curl -X POST http://149.50.150.151:3090/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query{__schema{types{name}}}"}'
```

## Configuración Actual

**apollo.ts**
- IS_PRODUCTION: true
- API_URL: http://149.50.150.151:3090/graphql
- Headers incluyen: Authorization, Content-Type

## Próximos Pasos

1. Ejecutar los tests curl arriba para verificar el estado de la API
2. Si la API responde, revisar el schema GraphQL disponible
3. Si retorna 400 en query simple, hay problema con el servidor
4. Si el schema es diferente, necesitaremos actualizar las queries en movilTeresa

## Logs desde la App Móvil

**Console Log 2**: "Response not successful: Received status code 400"
- Esto es de apolloError en el ApolloClient
- Significa que el servidor respondió con HTTP 400

**Console Log 1**: Warning de Apollo Cache (deprecación de option)
- No es crítico para el login
