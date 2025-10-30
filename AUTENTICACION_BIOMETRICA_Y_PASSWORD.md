# Sistema de Autenticación Biométrica y Cambio de Contraseña

## 1. Autenticación Biométrica (Huella/Face ID)

### Paquetes Instalados
```bash
expo-local-authentication  # Para biometría
expo-secure-store         # Para almacenar credenciales de forma segura
```

### Implementación en Login

Agregar en `App.tsx` o en un componente de login separado:

```typescript
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

// Verificar si el dispositivo soporta biometría
const checkBiometricSupport = async () => {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return compatible && enrolled;
};

// Guardar credenciales después de login exitoso
const saveCredentials = async (documento: string, password: string) => {
  await SecureStore.setItemAsync('userDocumento', documento);
  await SecureStore.setItemAsync('userPassword', password);
  await SecureStore.setItemAsync('biometricEnabled', 'true');
};

// Autenticar con biometría
const authenticateWithBiometrics = async () => {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Autenticar con huella digital',
      fallbackLabel: 'Usar contraseña',
      cancelLabel: 'Cancelar',
    });

    if (result.success) {
      // Obtener credenciales guardadas
      const documento = await SecureStore.getItemAsync('userDocumento');
      const password = await SecureStore.getItemAsync('userPassword');
      
      if (documento && password) {
        // Hacer login automático
        await handleLogin(documento, password);
      }
    }
  } catch (error) {
    console.error('Error en autenticación biométrica:', error);
  }
};

// En el componente de Login, agregar botón de huella
<TouchableOpacity 
  onPress={authenticateWithBiometrics}
  style={{ marginTop: 20 }}
>
  <Icon name="fingerprint" />
  <Text>Usar huella digital</Text>
</TouchableOpacity>
```

---

## 2. Sistema de Cambio de Contraseña

### Backend - Mutation Disponible

```graphql
mutation CambiarPasswordTutor(
  $nuevaPassword: String!
  $confirmarPassword: String!
  $passwordActual: String
) {
  cambiarPasswordTutor(
    nuevaPassword: $nuevaPassword
    confirmarPassword: $confirmarPassword
    passwordActual: $passwordActual
  ) {
    id
    nombre
    apellido
    primerLogin
  }
}
```

### Flujo de Primer Login

1. Al hacer login, verificar si `tutor.primerLogin === true`
2. Si es true, mostrar modal/pantalla obligatoria de cambio de contraseña
3. El tutor no puede continuar sin cambiar la contraseña

### Implementación en Frontend

```typescript
// En App.tsx, después del login exitoso

useEffect(() => {
  if (userData && userData.tipo === 'TUTOR') {
    checkPrimerLogin();
  }
}, [userData]);

const checkPrimerLogin = async () => {
  const { data } = await apolloClient.query({
    query: gql\`
      query VerificarPrimerLogin {
        tutorActual {
          id
          primerLogin
        }
      }
    \`,
  });

  if (data.tutorActual.primerLogin) {
    setShowCambiarPassword(true);
    setEsPrimerLogin(true);
  }
};

// Modal de Cambio de Contraseña
function CambiarPasswordModal({ visible, onClose, esPrimerLogin }) {
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [passwordActual, setPasswordActual] = useState('');

  const [cambiarPassword] = useMutation(gql\`
    mutation CambiarPassword(
      $nuevaPassword: String!
      $confirmarPassword: String!
      $passwordActual: String
    ) {
      cambiarPasswordTutor(
        nuevaPassword: $nuevaPassword
        confirmarPassword: $confirmarPassword
        passwordActual: $passwordActual
      ) {
        id
        primerLogin
      }
    }
  \`);

  const handleCambiar = async () => {
    if (nuevaPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    try {
      await cambiarPassword({
        variables: {
          nuevaPassword,
          confirmarPassword,
          passwordActual: esPrimerLogin ? null : passwordActual,
        },
      });

      Alert.alert('Éxito', 'Contraseña cambiada correctamente');
      
      // Ofrecer guardar para biometría
      if (await checkBiometricSupport()) {
        Alert.alert(
          'Autenticación Rápida',
          '¿Deseas habilitar el acceso con huella digital?',
          [
            { text: 'No', style: 'cancel' },
            {
              text: 'Sí',
              onPress: () => saveCredentials(userData.documento, nuevaPassword),
            },
          ]
        );
      }

      onClose();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
        <Card style={{ width: '90%', maxWidth: 400 }}>
          <Text category="h5" style={{ marginBottom: 20 }}>
            {esPrimerLogin ? '🔐 Primer Ingreso - Cambia tu Contraseña' : 'Cambiar Contraseña'}
          </Text>

          {esPrimerLogin && (
            <Text appearance="hint" style={{ marginBottom: 16 }}>
              Por seguridad, debes cambiar tu contraseña antes de continuar.
            </Text>
          )}

          {!esPrimerLogin && (
            <Input
              label="Contraseña Actual"
              secureTextEntry
              value={passwordActual}
              onChangeText={setPasswordActual}
              style={{ marginBottom: 12 }}
            />
          )}

          <Input
            label="Nueva Contraseña (mínimo 6 caracteres)"
            secureTextEntry
            value={nuevaPassword}
            onChangeText={setNuevaPassword}
            style={{ marginBottom: 12 }}
          />

          <Input
            label="Confirmar Nueva Contraseña"
            secureTextEntry
            value={confirmarPassword}
            onChangeText={setConfirmarPassword}
            style={{ marginBottom: 20 }}
          />

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {!esPrimerLogin && (
              <Button 
                appearance="outline" 
                onPress={onClose}
                style={{ flex: 1 }}
              >
                Cancelar
              </Button>
            )}
            <Button 
              onPress={handleCambiar}
              style={{ flex: 1 }}
            >
              Cambiar
            </Button>
          </View>
        </Card>
      </View>
    </Modal>
  );
}
```

---

## 3. Query para Verificar Primer Login

Agregar esta query al resolver:

```typescript
@Roles(Role.TUTOR)
@Query(() => Tutor)
async tutorActual(@CurrentUser() currentUser: AuthUser) {
  const tutor = await this.tutorModel
    .findOne({ documento: Number(currentUser.documento) })
    .exec();
  
  if (!tutor) {
    throw new NotFoundException('Tutor no encontrado');
  }
  
  return tutor;
}
```

---

## 4. Características Implementadas

### Backend ✅
- ✅ Mutation `cambiarPasswordTutor`
- ✅ Validación de contraseñas
- ✅ Verificación de contraseña actual (si NO es primer login)
- ✅ Actualización del flag `primerLogin` a false
- ✅ Hash seguro con bcryptjs
- ✅ Auditoría del cambio

### Frontend (A implementar)
- ⏳ Modal de cambio de contraseña
- ⏳ Verificación de primer login después de autenticación
- ⏳ Modal obligatorio si es primer login
- ⏳ Botón de huella digital en login
- ⏳ Guardado seguro de credenciales
- ⏳ Autenticación biométrica

---

## 5. Seguridad

### Contraseñas
- Mínimo 6 caracteres
- Hash con bcrypt (salt rounds: 10)
- Validación de coincidencia

### Biometría
- Almacenamiento en SecureStore (encriptado por el SO)
- Solo funciona en dispositivos con hardware biométrico
- Fallback a contraseña manual

### Primer Login
- Flag en base de datos: `primerLogin: boolean`
- Por defecto `true` al crear tutor
- Se marca `false` después del primer cambio
- Modal no se puede cerrar si es primer login

---

## 6. Próximos Pasos

1. **Implementar CambiarPasswordModal** en el frontend
2. **Agregar verificación de primer login** después del login exitoso
3. **Implementar botón de huella** en pantalla de login
4. **Agregar query tutorActual** al resolver si no existe
5. **Testear flujo completo** con un tutor nuevo

