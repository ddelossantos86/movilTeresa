#!/bin/bash

# Script simplificado para generar APK de movilTeresa

cd /Users/nano/Documents/colegio/movilTeresa

echo "╔════════════════════════════════════════════════════════╗"
echo "║       🚀 Generando APK de movilTeresa                 ║"
echo "╚════════════════════════════════════════════════════════╝"

echo ""
echo "⏳ Esto tomará entre 5-15 minutos..."
echo ""
echo "📡 Iniciando build en EAS..."
echo ""

# Generar build y esperar
npx eas build \
  --platform android \
  --profile preview \
  --wait \
  --non-interactive

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║          ✅ Build Completado                          ║"
echo "╚════════════════════════════════════════════════════════╝"

echo ""
echo "📥 Descargando APK..."
echo ""

# Obtener la lista de builds y extraer la URL del más reciente
BUILD_URL=$(npx eas build:list \
  --platform android \
  --limit 1 \
  --json 2>/dev/null | \
  jq -r '.[0].artifacts.buildUrl' 2>/dev/null || echo "")

if [ -z "$BUILD_URL" ] || [ "$BUILD_URL" == "null" ]; then
  echo ""
  echo "⚠️  No se pudo obtener la URL del APK automáticamente."
  echo ""
  echo "📋 Pasos manuales:"
  echo "  1. Ve a: https://expo.dev/accounts/@nanote1986/projects/movilTeresa/builds"
  echo "  2. Descarga el APK más reciente"
  echo ""
  exit 0
fi

mkdir -p ./build
APK_FILE="./build/movilTeresa-$(date +%Y%m%d-%H%M%S).apk"

curl -L "$BUILD_URL" -o "$APK_FILE" 2>&1 | tail -3

if [ -f "$APK_FILE" ] && [ -s "$APK_FILE" ]; then
  SIZE=$(ls -lh "$APK_FILE" | awk '{print $5}')
  echo ""
  echo "╔════════════════════════════════════════════════════════╗"
  echo "║          ✅ APK Listo para Instalar                   ║"
  echo "╚════════════════════════════════════════════════════════╝"
  echo ""
  echo "📦 Información:"
  echo "   Tamaño: $SIZE"
  echo "   Ubicación: $APK_FILE"
  echo ""
  echo "📱 Para instalar en tu Android:"
  echo "   1. Transfiere el archivo a tu celular"
  echo "   2. Abre con administrador de archivos"
  echo "   3. Presiona Instalar"
  echo ""
else
  echo ""
  echo "❌ Error: No se pudo descargar el APK"
  echo ""
fi
