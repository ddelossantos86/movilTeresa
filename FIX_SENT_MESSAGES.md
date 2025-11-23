# 📨 FIX: Sent Messages Not Appearing in /mensajes Tab

## Problem
Messages sent by tutors (type: CONSULTA_TUTOR) were not appearing in the /mensajes tab after sending. Only GENERAL messages (broadcast messages) were visible.

## Root Cause Analysis

### Issue #1: Incomplete Mutation Response
The `enviarMensajeTutor` mutation was returning only partial fields:
- ✅ Returns: `id, titulo, contenido, tipo, estado, autorNombre, publicadoEn`
- ❌ Missing: `alcance, creadoEn, leido, leidoPorTutorIds, destinatarioIds, imagen, imagenes`

But the `GET_MENSAJES_TUTOR` query expects all these fields to display the message correctly.

### Issue #2: No Cache Refresh After Send
After the mutation succeeded, the query cache was not being updated. The Apollo cache still had the old message list without the newly sent message.

### Issue #3: Non-Awaited Refetch
The `refetch()` call was not being awaited in the callback, so the modal could close before the refetch completed.

## Solution Implemented

### Change 1: Enhance Mutation Response (Line 1431-1457)
Updated the mutation to return all required fields:

```typescript
const [enviarMensaje, { loading }] = useMutation(gql`
  mutation EnviarMensajeTutor(...) {
    enviarMensajeTutor(...) {
      id
      titulo
      contenido
      tipo
      alcance              // ✅ ADDED
      estado
      autorNombre
      publicadoEn
      creadoEn             // ✅ ADDED
      leido                // ✅ ADDED
      leidoPorTutorIds     // ✅ ADDED
      destinatarioIds      // ✅ ADDED
      imagen               // ✅ ADDED
      imagenes             // ✅ ADDED
    }
  }
`);
```

### Change 2: Add Automatic Cache Refetch (Line 1495-1502)
Added `refetchQueries` to the mutation call to automatically refetch the message list:

```typescript
const result = await enviarMensaje({
  variables: { ... },
  refetchQueries: [
    { 
      query: GET_MENSAJES_TUTOR,
      variables: { alumnoId: alumnoSeleccionado }
    }
  ]
});
```

This ensures Apollo automatically refetches `GET_MENSAJES_TUTOR` after the mutation completes, ensuring the newly sent message appears in the list.

### Change 3: Proper Async Callback Chain (Line 1412 & 1510)
Made the `onEnviado` callback async and awaited it:

**Before:**
```typescript
onEnviado={() => {
  setShowNuevoMensaje(false);
  setResponderA(null);
  refetch();  // ❌ Not awaited, might not complete
}}
```

**After:**
```typescript
onEnviado={async () => {
  setShowNuevoMensaje(false);
  setResponderA(null);
  await refetch();  // ✅ Properly awaited
}}
```

And updated the mutation call to await the callback:
```typescript
await onEnviado();  // ✅ Wait for refetch to complete
```

### Change 4: Update Type Signature (Line 1424)
Updated the component's props type to allow async callbacks:

```typescript
function NuevoMensajeModal({ 
  visible, 
  onClose, 
  responderA, 
  onEnviado  // Now accepts Promise<void> | void
}: { 
  visible: boolean; 
  onClose: () => void; 
  responderA?: any;
  onEnviado: () => Promise<void> | void;  // ✅ Updated
}) {
```

## How It Works Now

1. **User sends a message** → `handleEnviar()` is called
2. **Mutation executes** → `enviarMensajeTutor` creates the message on backend
3. **Apollo cache refetches** → `refetchQueries` automatically runs `GET_MENSAJES_TUTOR`
4. **New message loads** → Message appears in the list with all fields populated
5. **UI closes cleanly** → Modal closes after refetch completes
6. **Tutor sees their message** → The sent message now appears in the /mensajes tab ✅

## Files Modified

- `/movilTeresa/App.tsx`
  - Line 1412: Updated callback to be async
  - Line 1424: Updated type signature
  - Line 1431-1457: Enhanced mutation response fields
  - Line 1495-1502: Added refetchQueries
  - Line 1510: Changed to await onEnviado()

## Testing Steps

1. Open the app and navigate to /mensajes tab
2. Click the "+" button to create a new message
3. Select an alumno, add a subject and message
4. Click "Enviar" (Send)
5. **Expected result**: Message should appear in the mensajes list immediately after sending
6. **Previously**: Message would not appear (only GENERAL broadcast messages appeared)

## Related Issues Fixed

This fix relates to earlier work in this session:
- ✅ Fixed Apollo InvariantError #95 (useMensajeReaccion hook)
- ✅ Fixed EVALUACIONES tab filter defaulting to first alumno
- ✅ Fixed general messages not loading (variable passing)
- ✅ **NOW FIXED**: Sent messages not appearing in /mensajes

## GraphQL Fields Reference

### GET_MENSAJES_TUTOR Returns
```typescript
mensajesTutor(alumnoId: ID) {
  id                    // Message unique ID
  titulo                // Subject
  contenido             // Message body
  tipo                  // Message type (GENERAL, CONSULTA_TUTOR, etc)
  alcance               // Scope/reach (INDIVIDUAL, GROUP, ALL)
  estado                // Message status
  autorNombre           // Sender name
  publicadoEn           // Publication date
  creadoEn              // Created date
  leido                 // Is it read
  leidoPorTutorIds      // Who read it
  destinatarioIds       // Recipient IDs
  imagen                // Single image (base64)
  imagenes              // Multiple images
}
```

### Key Points
- When `alumnoId` is null/undefined, returns ALL messages (both GENERAL and CONSULTA_TUTOR)
- When `alumnoId` is provided, returns messages for that specific alumno
- The mutation now returns the complete message structure for immediate cache update
- `refetchQueries` ensures backend data is synced even if mutation response is incomplete
