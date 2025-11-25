#!/bin/bash

set -e

# Configurar Java 17
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export PATH=$JAVA_HOME/bin:$PATH

echo "========================================="
echo "Build Nativo Android - Sin EAS"
echo "========================================="
echo ""
echo "Java version:"
java -version
echo ""

# Ir al directorio del proyecto
cd "$(dirname "$0")"

# Limpiar cache de Gradle
echo "Limpiando cache de Gradle..."
rm -rf android/.gradle
rm -rf android/app/build

# Generar proyecto nativo si no existe
if [ ! -d "android" ]; then
    echo "Generando proyecto Android nativo..."
    npx expo prebuild --platform android --clean
fi

# Build con Gradle directamente
echo ""
echo "========================================="
echo "Compilando APK..."
echo "========================================="
cd android

# Usar wrapper de Gradle con Java 17
./gradlew clean
./gradlew assembleRelease \
    --no-daemon \
    --warning-mode=all \
    -Dorg.gradle.jvmargs="-Xmx4096m -XX:MaxMetaspaceSize=1024m" \
    -Pandroid.injected.build.abi=arm64-v8a,armeabi-v7a

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================="
    echo "✅ APK generado exitosamente!"
    echo "========================================="
    APK_PATH="app/build/outputs/apk/release/app-release.apk"
    
    if [ -f "$APK_PATH" ]; then
        ls -lh "$APK_PATH"
        
        # Copiar a directorio build/
        cd ..
        mkdir -p build
        cp "android/$APK_PATH" build/Dhora-$(date +%Y%m%d-%H%M%S).apk
        cp "android/$APK_PATH" build/Dhora-latest.apk
        
        echo ""
        echo "APK copiado a:"
        ls -lh build/Dhora-latest.apk
        echo ""
        echo "Ubicación original: android/$APK_PATH"
    else
        echo "❌ APK no encontrado en la ubicación esperada"
        exit 1
    fi
else
    echo ""
    echo "❌ Build falló"
    exit 1
fi
