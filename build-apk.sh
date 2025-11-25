#!/bin/bash

# Script para generar APK de movilTeresa
# Este script genera un APK listo para instalar en Android

set -e

PROJECT_DIR="/Users/nano/Documents/colegio/movilTeresa"
OUTPUT_DIR="$PROJECT_DIR/build"

echo "╔════════════════════════════════════════════════════════╗"
echo "║     🚀 Generando APK de movilTeresa                   ║"
echo "╚════════════════════════════════════════════════════════╝"

# Crear directorio de output
mkdir -p "$OUTPUT_DIR"

cd "$PROJECT_DIR"

echo ""
echo "📦 Pasos:"
echo "  1. Instalar dependencias faltantes..."
npm install expo-system-ui --save 2>&1 | grep -i "added\|up to date" || true

echo ""
echo "  2. Hacer prebuild de native code..."
npx expo prebuild --clean 2>&1 | tail -5

echo ""
echo "  3. Espera mientras se genera el APK en EAS..."
echo "     Este proceso puede tardar 5-15 minutos..."
echo ""

# Generar APK con EAS
npx eas build --platform android --wait

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║     ✅ APK Generado                                   ║"
echo "╚════════════════════════════════════════════════════════╝"

echo ""
echo "📥 El APK está disponible en EAS Build Dashboard"
echo "   URL: https://expo.dev/builds"
echo ""
echo "📱 Para instalar en tu celular:"
echo "   1. Descarga el APK desde EAS Build Dashboard"
echo "   2. Transfiere el archivo .apk a tu Android"
echo "   3. Abre el archivo y presiona instalar"
echo ""
echo "💡 O abre directamente con:"
echo "   eas build:list"

