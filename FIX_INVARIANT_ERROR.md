# ✅ Solución al InvariantError #95 de Apollo Client

## 🔍 Diagnóstico

**Error Original**:
```
Invariant Violation
https://go.apollo.dev/c/err#{"version":"3.14.0","message":95,"args":["<undefined>"]}
```

**Error Code 95**: Apollo Client encontró un valor `undefined` durante la serialización del cache.

## 🎯 Causa Raíz Identificada

El hook `useMensajeReaccion.ts` estaba intentando usar una query GraphQL que **NO EXISTE**:

```typescript
// ❌ PROBLEMA: Importando query inexistente
import { TOGGLE_MENSAJE_REACCION, GET_CONTADOR_REACCIONES } from '../graphql/queries';
```

En `src/graphql/queries.ts`, la query `GET_CONTADOR_REACCIONES` está comentada como **DEPRECATED**:

```typescript
// DEPRECATED: Este resolver no existe en el backend
// export const GET_CONTADOR_REACCIONES = gql`
//   query GetContadorReacciones($mensajeId: ID!) {
//     contadorReacciones(mensajeId: $mensajeId) {
//       mensajeId
//       totalReacciones
//       reaccionesPorTipo {
//         tipo
//         cantidad
//       }
//       miReaccion
//     }
//   }
// `;
```

### Secuencia del Error

1. `useMensajeReaccion` hook intenta importar `GET_CONTADOR_REACCIONES`
2. La importación devuelve `undefined` (la constante no está exportada)
3. Apollo Client recibe `undefined` como query
4. Al intentar ejecutar `useQuery(undefined, ...)`, Apollo lanza InvariantError #95
5. El error se propaga a `MensajePostWrapper` que usa este hook
6. La app crashea al renderizar mensajes

## ✅ Solución Implementada

Reemplazar `GET_CONTADOR_REACCIONES` (inexistente) con `GET_REACCIONES_MENSAJE` (existente) y calcular el contador client-side.

### Cambios en `src/hooks/useMensajeReaccion.ts`

**ANTES**:
```typescript
import { TOGGLE_MENSAJE_REACCION, GET_CONTADOR_REACCIONES } from '../graphql/queries';

const { data: contadorData, loading, refetch } = useQuery(
  GET_CONTADOR_REACCIONES, // ❌ undefined!
  {
    variables: { mensajeId },
    skip: !mensajeId,
    errorPolicy: 'all',
  }
);

useEffect(() => {
  if (contadorData?.contadorReacciones) {
    const { miReaccion, totalReacciones } = contadorData.contadorReacciones;
    setLocalReaccion(miReaccion);
    setLocalContador(totalReacciones || 0);
  }
}, [contadorData?.contadorReacciones]);
```

**DESPUÉS**:
```typescript
import { TOGGLE_MENSAJE_REACCION, GET_REACCIONES_MENSAJE } from '../graphql/queries';
import AsyncStorage from '@react-native-async-storage/async-storage';

const [tutorId, setTutorId] = useState<string | null>(null);

// Cargar tutorId para identificar reacciones propias
useEffect(() => {
  const loadTutorId = async () => {
    try {
      const id = await AsyncStorage.getItem('tutorId');
      setTutorId(id);
    } catch (err) {
      console.error('Error cargando tutorId:', err);
    }
  };
  loadTutorId();
}, []);

// ✅ Usar query existente
const { data: reaccionesData, loading, refetch } = useQuery(
  GET_REACCIONES_MENSAJE, // ✅ Esta query SÍ existe
  {
    variables: { mensajeId },
    skip: !mensajeId,
    errorPolicy: 'all',
  }
);

// ✅ Calcular contador y estado client-side
useEffect(() => {
  try {
    if (reaccionesData?.reaccionesMensaje) {
      const reacciones = reaccionesData.reaccionesMensaje;
      const totalReacciones = reacciones.length;
      const miReaccion = tutorId ? reacciones.some((r: any) => r.tutorId === tutorId) : false;
      
      setLocalReaccion(miReaccion);
      setLocalContador(totalReacciones);
      setError(null);
    }
  } catch (err) {
    console.error('❌ Error sincronizando datos:', err);
    setError('Error al cargar reacciones');
  }
}, [reaccionesData?.reaccionesMensaje, tutorId]);
```

## 🔧 Qué Hace la Solución

1. **Usa query existente**: `GET_REACCIONES_MENSAJE` devuelve array de reacciones del mensaje
2. **Calcula total**: `reacciones.length` para obtener total de reacciones
3. **Identifica reacción propia**: Compara `tutorId` con `r.tutorId` de cada reacción
4. **Maneja estado**: Actualiza `localReaccion` (booleano) y `localContador` (número)

### Ventajas de esta Implementación

✅ **No requiere cambios en backend** - Usa resolvers existentes  
✅ **Más flexible** - Podemos agregar filtros por tipo de reacción en el futuro  
✅ **Mismo comportamiento** - El hook retorna los mismos valores  
✅ **Error handling robusto** - Try-catch protege contra datos inesperados  

## 📊 Estructura de Datos

### Query `GET_REACCIONES_MENSAJE`

**Request**:
```graphql
query GetReaccionesMensaje($mensajeId: ID!) {
  reaccionesMensaje(mensajeId: $mensajeId) {
    id
    mensajeId
    tutorId
    tutorNombre
    tipo
    creadoEn
  }
}
```

**Response Example**:
```json
{
  "data": {
    "reaccionesMensaje": [
      {
        "id": "123abc",
        "mensajeId": "691a690f3b4cfece4618f44c",
        "tutorId": "68eda85c609839abf0a65bc3",
        "tutorNombre": "María González",
        "tipo": "CORAZON",
        "creadoEn": "2025-11-17T10:30:00.000Z"
      },
      {
        "id": "456def",
        "mensajeId": "691a690f3b4cfece4618f44c",
        "tutorId": "68eda85c609839abf0a65999",
        "tutorNombre": "Juan Pérez",
        "tipo": "CORAZON",
        "creadoEn": "2025-11-17T11:15:00.000Z"
      }
    ]
  }
}
```

**Cálculo Client-Side**:
```typescript
const totalReacciones = reacciones.length; // = 2
const miReaccion = reacciones.some(r => r.tutorId === "68eda85c609839abf0a65bc3"); // = true
```

## 🧪 Testing

Para verificar que el fix funciona:

1. **Reiniciar app móvil**:
   ```bash
   cd movilTeresa
   npx expo start -c
   ```

2. **Verificar logs**:
   - ✅ NO debe aparecer InvariantError #95
   - ✅ Mensajes deben renderizarse correctamente
   - ✅ Contador de reacciones debe mostrarse

3. **Probar interacción**:
   - Dar like a un mensaje
   - Verificar que contador incrementa
   - Quitar like
   - Verificar que contador decrementa

## 🔄 Migrations Aplicadas

Este fix **NO requiere** cambios en:
- ❌ Backend (NestJS/GraphQL)
- ❌ Base de datos
- ❌ Schemas GraphQL
- ❌ Otros componentes

Solo se modificó:
- ✅ `/movilTeresa/src/hooks/useMensajeReaccion.ts`

## 📝 Lecciones Aprendidas

1. **Verificar exports**: Siempre confirmar que las constantes importadas están realmente exportadas
2. **Queries deprecadas**: Comentar queries no es suficiente - hay que actualizar todos los imports
3. **Error messages**: Apollo InvariantError #95 = "undefined value in cache serialization"
4. **Debugging approach**: Error en renderizado → Revisar queries en hooks → Verificar exports

## 🚀 Próximos Pasos (Opcional)

1. **Limpiar queries.ts**: Eliminar completamente el código comentado de `GET_CONTADOR_REACCIONES`
2. **Agregar tests**: Unit tests para `useMensajeReaccion`
3. **TypeScript typing**: Mejorar tipos para reacciones
4. **Cache optimization**: Agregar cache policies para reacciones

## 📚 Referencias

- [Apollo Client Error #95](https://go.apollo.dev/c/err#%7B%22version%22%3A%223.14.0%22%2C%22message%22%3A95%7D)
- [Apollo Client useQuery Hook](https://www.apollographql.com/docs/react/data/queries/)
- [GraphQL Query Best Practices](https://www.apollographql.com/docs/react/data/operation-best-practices/)
