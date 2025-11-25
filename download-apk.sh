#!/bin/bash

# Script para descargar y preparar el APK de movilTeresa

set -e

PROJECT_DIR="/Users/nano/Documents/colegio/movilTeresa"
BUILD_DIR="$PROJECT_DIR/build"
APK_NAME="movilTeresa-v1.0.0.apk"

mkdir -p "$BUILD_DIR"

echo "╔════════════════════════════════════════════════════════╗"
echo "║       📱 Descargando APK de movilTeresa               ║"
echo "╚════════════════════════════════════════════════════════╝"

cd "$PROJECT_DIR"

echo ""
echo "🔍 Obteniendo lista de builds..."
BUILD_INFO=$(npx eas build:list --platform android --limit 1 2>/dev/null | grep -A 1 "Application Archive URL" | tail -1 || echo "")

if [ -z "$BUILD_INFO" ]; then
  echo ""
  echo "⚠️  No hay builds previos. Generando nuevo build..."
  echo ""
  echo "📡 Iniciando build en EAS (esto tomará 5-15 minutos):"
  npx eas build --platform android --profile preview --json > build_output.json 2>&1 || true
  
  BUILD_URL=$(cat build_output_json | grep -o '"artifacts":[^}]*"url":"[^"]*' | head -1 | cut -d'"' -f6)
else
  BUILD_URL=$(echo "$BUILD_INFO" | awk '{print $1}' | sed 's/^[ \t]*//')
fi

if [ -z "$BUILD_URL" ] || [ "$BUILD_URL" == "null" ]; then
  echo ""
  echo "✅ Build iniciado en EAS"
  echo ""
  echo "📋 Pasos siguientes:"
  echo "  1. Ve a https://expo.dev/accounts/@nanote1986/projects/movilTeresa"
  echo "  2. Espera a que se complete el build (status: finished)"
  echo "  3. Descarga el APK desde el build"
  echo ""
  exit 0
fi

echo ""
echo "📥 URL del APK: $BUILD_URL"
echo "💾 Descargando..."

curl -L "$BUILD_URL" -o "$BUILD_DIR/$APK_NAME" 2>&1 | grep -E "Progress|100"

APK_SIZE=$(ls -lh "$BUILD_DIR/$APK_NAME" | awk '{print $5}')

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║          ✅ APK Listo para Instalar                   ║"
echo "╚════════════════════════════════════════════════════════╝"

echo ""
echo "📦 Información del APK:"
echo "   Nombre: $APK_NAME"
echo "   Tamaño: $APK_SIZE"
echo "   Ubicación: $BUILD_DIR/$APK_NAME"
echo ""
echo "📱 Para instalar en tu Android:"
echo "   1. Copia el archivo APK a tu celular"
echo "   2. Abre el archivo desde el administrador de archivos"
echo "   3. Presiona 'Instalar'"
echo ""
echo "💻 O desde terminal:"
echo "   adb install '$BUILD_DIR/$APK_NAME'"
