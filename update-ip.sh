#!/bin/bash

# Script para detectar automáticamente la IP local y actualizar apollo.ts
# Uso: ejecuta este script cada vez que tu red cambie (o ponlo en cron)

# Obtener IP local (excluyendo localhost)
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')

if [ -z "$LOCAL_IP" ]; then
  echo "❌ No se pudo detectar la IP local"
  exit 1
fi

echo "🔍 IP detectada: $LOCAL_IP"

# Archivo a actualizar
APOLLO_FILE="src/config/apollo.ts"

# Actualizar el archivo
sed -i '' "s/const API_HOST = '[^']*';/const API_HOST = '$LOCAL_IP';/" "$APOLLO_FILE"

echo "✅ apollo.ts actualizado con IP: $LOCAL_IP"
echo "📱 Ahora recarga la app con: npm start (presiona 'r')"
