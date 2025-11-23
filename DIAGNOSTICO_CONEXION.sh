#!/bin/bash

# 🔍 DIAGNÓSTICO: movilTeresa - Error de Conexión a API

echo "================================"
echo "🔍 DIAGNÓSTICO DE CONEXIÓN"
echo "================================"
echo ""

# 1. Tu IP actual
echo "1️⃣  Tu IP LOCAL actual:"
echo "   Ejecuta en Terminal:"
echo ""
echo "   ifconfig | grep 'inet ' | grep -v 127.0.0.1"
echo ""
echo "   O simplemente:"
echo "   ifconfig"
echo ""
echo "   Busca en la salida algo como:"
echo "   inet 192.168.X.XXX (la que NO sea 127.0.0.1)"
echo ""

# 2. IP del servidor API
echo "2️⃣  IP del SERVIDOR API:"
echo "   - Desarrollo local: TU_IP_LOCAL:3000"
echo "   - Producción: 149.50.150.151:3090"
echo ""

# 3. Archivos a actualizar
echo "3️⃣  Archivos a actualizar:"
echo ""
echo "   📄 movilTeresa/.env.local"
echo "   ---"
echo "   API_HOST=TU_IP_ACTUAL"
echo "   API_PORT=3000"
echo "   API_PROTOCOL=http"
echo ""
echo "   O para Producción:"
echo "   API_HOST=149.50.150.151"
echo "   API_PORT=3090"
echo "   API_PROTOCOL=http"
echo ""

# 4. Verificar conectividad
echo "4️⃣  Verificar conectividad desde tu Mac:"
echo "   ping <IP_DEL_API>"
echo "   curl http://<IP_DEL_API>:3000/graphql"
echo ""

# 5. Logs de movilTeresa
echo "5️⃣  Ver logs en tiempo real:"
echo "   npm start  (en movilTeresa)"
echo "   Busca: 'API_URL configurada:'"
echo ""

# 6. Reinicia la app
echo "6️⃣  Reinicia la app:"
echo "   npm start"
echo "   Presiona 'r' para reload"
echo ""

echo "================================"
echo "✅ Sigue estos pasos"
echo "================================"
