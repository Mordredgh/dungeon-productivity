#!/usr/bin/env bash
# deploy.sh — bump cache version, verify ASSETS, commit & push
# Uso: bash deploy.sh "mensaje del commit"
# Si no se pasa mensaje, usa "deploy: bump cache vN"

set -euo pipefail
cd "$(dirname "$0")"

MSG="${1:-}"

# 1. Leer versión actual del SW (solo línea 1: const CACHE = 'dungeon-vN')
OLD_VER=$(sed -n "1s/.*dungeon-v\([0-9]\+\).*/\1/p" sw.js)
if [ -z "$OLD_VER" ]; then
  echo "❌ No se pudo leer la versión de sw.js (línea 1)"
  exit 1
fi
NEW_VER=$((OLD_VER + 1))
echo "📦 Bumping v${OLD_VER} → v${NEW_VER}"

# 2. Bump SW cache name (solo línea 1)
sed -i "1s/dungeon-v${OLD_VER}/dungeon-v${NEW_VER}/" sw.js

# 3. Bump TODOS los ?v= en index.html
COUNT=$(grep -c '?v=' index.html || true)
sed -i "s/?v=[0-9]\+/?v=${NEW_VER}/g" index.html
echo "   index.html: ${COUNT} refs → ?v=${NEW_VER}"

# 4. Verificar que cada JS/CSS de index.html esté en ASSETS de sw.js
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
  echo ""
  echo "❌ Hay archivos en index.html que no están en sw.js ASSETS."
  echo "   Agrégalos a mano y vuelve a correr deploy.sh"
  sed -i "1s/dungeon-v${NEW_VER}/dungeon-v${OLD_VER}/" sw.js
  sed -i "s/?v=${NEW_VER}/?v=${OLD_VER}/g" index.html
  exit 1
fi

echo "✅ Todos los JS/CSS de index.html están en ASSETS"

# 5. Commit & push
if [ -z "$MSG" ]; then
  MSG="deploy: bump cache v${NEW_VER}"
fi

git add -A
git commit -m "${MSG}

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
git push origin main

echo ""
echo "🚀 Deployed v${NEW_VER} — Coolify rebuild en ~1 min"
