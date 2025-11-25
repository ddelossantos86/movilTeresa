╔════════════════════════════════════════════════════════════╗
║  📱 INSTRUCCIONES PARA DESCARGAR Y INSTALAR APK            ║
║     movilTeresa en tu Android                              ║
╚════════════════════════════════════════════════════════════╝

⏳ El APK se está generando en EAS Build...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OPCIÓN 1: Descarga Automática (Recomendado)
────────────────────────────────────────────

Ejecuta este comando cuando el build termine:

  cd /Users/nano/Documents/colegio/movilTeresa
  bash build-apk-simple.sh

El APK se descargará automáticamente en ./build/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OPCIÓN 2: Descarga Manual
─────────────────────────

1. Ve a: https://expo.dev/accounts/@nanote1986/projects/movilTeresa/builds

2. Busca el build más reciente con status "finished"

3. Haz clic en "Application Archive URL"

4. Descarga el archivo .apk

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSTALAR EN TU ANDROID
─────────────────────

1. Copia el archivo movilTeresa.apk a tu celular

2. Abre el archivo desde:
   • Administrador de Archivos
   • Google Files
   • Cualquier explorador de archivos

3. Presiona el botón "Instalar"

4. Si te pide permiso para instalar de fuentes desconocidas:
   ✔ Permite la instalación de la app

5. ¡Listo! La app estará instalada

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTERNATIVA: Instalar vía ADB (desde tu Mac)
──────────────────────────────────────────

1. Conecta tu Android por USB

2. Ejecuta:
   adb install /Users/nano/Documents/colegio/movilTeresa/build/movilTeresa.apk

3. Espera a que diga "Success"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STATUS DEL BUILD
────────────────

Para verificar el estado:
  npx eas build:list --platform android

Para ver logs del build:
  npx eas build:view <BUILD_ID>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NOTAS IMPORTANTES
─────────────────

• El build tarda 5-15 minutos en completarse
• Necesitas estar logueado en Expo: npx expo login
• El APK incluye todas las mejoras del feed (headers, carrusel, etc)
• Compatible con Android 5.0+ (API 21+)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
