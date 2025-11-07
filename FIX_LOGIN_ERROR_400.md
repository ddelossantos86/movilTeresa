# Solución: Error 400 del Login - API 149.50.150.151:3090

## Raíz del Problema

El servidor en `149.50.150.151:3090` espera `LoginTutorPasswordInput` con:
- `documento` (String! requerido)
- `password` (String! requerido)

NO acepta `usuario` como campo.

## Cambios Realizados

### 1. Updated GraphQL Query (queries.ts)

Removida el campo `usuario` de la respuesta ya que no existe en producción:

```typescript
// ANTES
user {
  id
  usuario
  documento
  tipo
  nombre
  apellido
}

// AHORA
user {
  id
  documento
  tipo
  nombre
  apellido
}
```

### 2. Apollo Configuration Mejorada (apollo.ts)

Agregado mejor logging para debug:
- Log de operación enviada
- Log de URL destino
- Log de respuesta de errores

## Verificación de Conectividad

✅ El servidor en `149.50.150.151:3090/graphql` responde correctamente
✅ Acepta la mutation `loginTutorPassword`
✅ Espera input: `{ documento: String!, password: String! }`

## Test Curl Exitoso

```bash
curl -X POST http://149.50.150.151:3090/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation LoginTutorPassword($input: LoginTutorPasswordInput!) { loginTutorPassword(input: $input) { token user { id documento tipo nombre apellido } primerLogin } }",
    "variables": {
      "input": {
        "documento": "30123456",
        "password": "director"
      }
    }
  }'
```

Responde con HTTP 200 y mensaje de error válido cuando credenciales son inválidas (esto es esperado).

## Status de la App

**Code Fix**: ✅ COMPLETADO
- Removido campo `usuario` de la query
- Mejorado logging en Apollo
- Configuración ya apunta a producción correctamente

**Próximo paso**: Reiniciar la app mobile y probar login con un usuario válido

## Notas

- El app está correctamente enviando `documento` en la mutation (revisar línea 156-162 de App.tsx)
- El problema era que la query pedía un campo que no retorna el servidor
- Error 400 era en realidad "BAD_USER_INPUT" porque la query incluía campo `usuario` no definido en el schema

