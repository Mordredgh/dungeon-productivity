#!/usr/bin/env bash
# deploy.sh — bump SW, commit, push y dispara Coolify
# Uso: bash deploy.sh "mensaje del commit"

set -euo pipefail
cd "$(dirname "$0")"

MSG="${1:-}"
COOLIFY_URL="http://195.26.247.101:8000"
APP_UUID="c55fjfme7f49eeob1surogue"
TOKEN="${COOLIFY_DUNGEON_TOKEN:-}"

# 1. Leer versión actual del SW
OLD_VER=$(grep -oE 'dungeon-v[0-9]+' sw.js | head -n 1 | sed 's/dungeon-v//')
if [ -z "$OLD_VER" ]; then
  echo "❌ No se pudo leer la versión de sw.js"
  exit 1
fi
NEW_VER=$((OLD_VER + 1))
echo "📦 Bumping v${OLD_VER} → v${NEW_VER}"

# 2. Bump SW cache name. JS/CSS/arte se cachean bajo demanda; nunca se
# precachea el catálogo completo porque degrada la primera carga.
sed -i "s/dungeon-v${OLD_VER}/dungeon-v${NEW_VER}/" sw.js
echo "   Cache del Service Worker → v${NEW_VER}"

# Bump también el query string ?v= en index.html — si no, el navegador
# cachea JS/CSS por URL exacta y nunca baja el código nuevo aunque el SW cambie.
sed -i "s/?v=${OLD_VER}/?v=${NEW_VER}/g" index.html
echo "   Query strings ?v= en index.html → v${NEW_VER}"

# Mantener las variantes gzip alineadas con el código que se publica.
gzip -9 -kf index.html css/*.css js/*.js

# 3. Commit & push
if [ -z "$MSG" ]; then
  MSG="deploy: bump cache v${NEW_VER}"
fi
git add -A
git commit -m "${MSG}

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
git push origin main
echo "✅ Push a GitHub OK"

# 4. Triggerear Coolify deploy
if [ -z "$TOKEN" ]; then
  echo "⚠  COOLIFY_DUNGEON_TOKEN no encontrado — salta deploy Coolify"
  echo "   Corre manualmente: deploy.ps1"
else
  echo "🚀 Triggering Coolify deploy..."
  RESP=$(curl -sf -X POST \
    "${COOLIFY_URL}/api/v1/deploy?uuid=${APP_UUID}&force=false" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" || echo "ERROR")
  if [[ "$RESP" == "ERROR" ]]; then
    echo "⚠  Coolify deploy call falló — el auto-deploy de git puede funcionar igual"
  else
    echo "   Deploy encolado: ${RESP}"
    echo "⏳ Esperando 40s para build..."
    sleep 40
    curl -sf "${COOLIFY_URL}/api/v1/applications/${APP_UUID}/restart" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" > /dev/null && echo "✅ Restart OK" || echo "⚠  Restart call falló"
  fi
fi

echo ""
echo "🎉 Deploy v${NEW_VER} completado — dungeon.mordredgh.com listo en ~1 min"
