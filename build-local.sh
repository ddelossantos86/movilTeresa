#!/bin/bash

# Configurar Java 17
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export PATH=$JAVA_HOME/bin:$PATH

echo "Using Java:"
java -version

echo ""
echo "Limpiando build anterior..."
cd "$(dirname "$0")"
rm -rf android/app/build
./android/gradlew -p android clean

echo ""
echo "Building APK Release..."
./android/gradlew -p android assembleRelease --warning-mode=none --stacktrace

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ APK generado exitosamente!"
    echo "Ubicación: android/app/build/outputs/apk/release/app-release.apk"
    ls -lh android/app/build/outputs/apk/release/app-release.apk
    
    # Copiar a directorio build/
    mkdir -p build
    cp android/app/build/outputs/apk/release/app-release.apk build/movilTeresa.apk
    echo ""
    echo "APK copiado a: build/movilTeresa.apk"
    ls -lh build/movilTeresa.apk
else
    echo ""
    echo "❌ Build falló"
    exit 1
fi
