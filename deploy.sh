#!/usr/bin/env bash
# deploy.sh — bump SW, verify ASSETS, commit, push y triggerea Coolify
# Uso: bash deploy.sh "mensaje del commit"

set -euo pipefail
cd "$(dirname "$0")"

MSG="${1:-}"
COOLIFY_URL="http://195.26.247.101:8000"
APP_UUID="c55fjfme7f49eeob1surogue"
TOKEN="${COOLIFY_DUNGEON_TOKEN:-}"

# 1. Leer versión actual del SW
OLD_VER=$(sed -n "1s/.*dungeon-v\([0-9]\+\).*/\1/p" sw.js)
if [ -z "$OLD_VER" ]; then
  echo "❌ No se pudo leer la versión de sw.js"
  exit 1
fi
NEW_VER=$((OLD_VER + 1))
echo "📦 Bumping v${OLD_VER} → v${NEW_VER}"

# 2. Bump SW cache name y ?v= en index.html
sed -i "1s/dungeon-v${OLD_VER}/dungeon-v${NEW_VER}/" sw.js
COUNT=$(grep -c '?v=' index.html || true)
sed -i "s/?v=[0-9]\+/?v=${NEW_VER}/g" index.html
echo "   index.html: ${COUNT} refs → ?v=${NEW_VER}"

# 3. Verificar que cada JS/CSS de index.html esté en ASSETS de sw.js
MISSING=0
for f in $(sed -n 's/.*src="\(js\/[^"?]*\).*/\1/p' index.html); do
  if ! grep -qF "/$f" sw.js; then
    echo "⚠  FALTA en ASSETS: /$f"
    MISSING=1
  fi
done
for f in $(sed -n 's/.*href="\(css\/[^"?]*\).*/\1/p' index.html); do
  if ! grep -qF "/$f" sw.js; then
    echo "⚠  FALTA en ASSETS: /$f"
    MISSING=1
  fi
done
if [ "$MISSING" -eq 1 ]; then
  echo "❌ Hay archivos en index.html que no están en sw.js ASSETS."
  sed -i "1s/dungeon-v${NEW_VER}/dungeon-v${OLD_VER}/" sw.js
  sed -i "s/?v=${NEW_VER}/?v=${OLD_VER}/g" index.html
  exit 1
fi
echo "✅ Todos los JS/CSS de index.html están en ASSETS"

# 4. Commit & push
if [ -z "$MSG" ]; then
  MSG="deploy: bump cache v${NEW_VER}"
fi
git add -A
git commit -m "${MSG}

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
git push origin main
echo "✅ Push a GitHub OK"

# 5. Triggerear Coolify deploy
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
