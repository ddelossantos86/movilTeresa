#!/bin/bash

# 🧪 Script para probar notificaciones push
# Uso: ./test-notification.sh [EXPO_PUSH_TOKEN]

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔔 Probador de Notificaciones Push${NC}\n"

# Verificar si se proporcionó el token
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: Debes proporcionar el Expo Push Token${NC}"
    echo -e "${BLUE}Uso: ./test-notification.sh ExponentPushToken[xxxxx]${NC}\n"
    echo -e "Para obtener el token:"
    echo "1. Abre la app en tu dispositivo"
    echo "2. Haz login"
    echo "3. Busca en los logs: 'Push token obtenido:'"
    exit 1
fi

TOKEN=$1

echo -e "${GREEN}📱 Enviando notificación de prueba...${NC}\n"

# Enviar notificación
RESPONSE=$(curl -s -H "Content-Type: application/json" \
  -X POST https://exp.host/--/api/v2/push/send \
  -d "{
    \"to\": \"$TOKEN\",
    \"title\": \"🎉 Notificación de Prueba\",
    \"body\": \"Esta es una prueba desde el script. Si ves esto, ¡funciona!\",
    \"sound\": \"default\",
    \"priority\": \"high\",
    \"badge\": 1,
    \"data\": {
      \"tipo\": \"PRUEBA\",
      \"timestamp\": \"$(date +%s)\"
    }
  }")

echo -e "${BLUE}Respuesta del servidor:${NC}"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

# Verificar si fue exitoso
if echo "$RESPONSE" | grep -q '"status":"ok"'; then
    echo -e "\n${GREEN}✅ Notificación enviada exitosamente${NC}"
    echo -e "${BLUE}Revisa tu dispositivo Android${NC}"
else
    echo -e "\n${RED}❌ Error al enviar la notificación${NC}"
    echo -e "${BLUE}Verifica que el token sea correcto${NC}"
fi
