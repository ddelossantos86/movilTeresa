#!/bin/bash

# Script de deployment para Mobile
set -e

CLOUD_HOST="149.50.150.151"
CLOUD_USER="root"
CLOUD_PATH="/app/movilTeresa"
LOCAL_PATH="/Users/nano/Documents/colegio/movilTeresa"

echo "🚀 Iniciando deployment de Mobile..."

# Crear directorio en cloud si no existe
echo "📁 Preparando directorio en cloud..."
ssh "$CLOUD_USER@$CLOUD_HOST" "mkdir -p $CLOUD_PATH"

# Copiar archivos
echo "📤 Subiendo archivos a cloud..."
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.expo' \
  --exclude '.env' \
  "$LOCAL_PATH/" "$CLOUD_USER@$CLOUD_HOST:$CLOUD_PATH/"

# Instalar dependencias en cloud
echo "⚙️  Instalando dependencias en cloud..."
ssh "$CLOUD_USER@$CLOUD_HOST" "cd $CLOUD_PATH && npm ci"

# Copiar .env.cloud como .env
echo "🔧 Configurando variables de entorno..."
scp "$LOCAL_PATH/.env.cloud" "$CLOUD_USER@$CLOUD_HOST:$CLOUD_PATH/.env"

echo "✅ Mobile app deployed exitosamente a http://149.50.150.151:19000"
echo "📱 Para ejecutar: expo start en $CLOUD_PATH"
