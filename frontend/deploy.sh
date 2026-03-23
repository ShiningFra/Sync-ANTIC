#!/bin/bash
##############################################################################
# deploy.sh — Script de déploiement production SYNC ANTIC
#
# Usage :
#   chmod +x deploy.sh
#   ./deploy.sh
#
# Prérequis sur le serveur :
#   - Node.js ≥ 18       (npm installé)
#   - Nginx installé     (sudo apt install nginx)
#   - Java 17+           (backend déjà compilé en .jar)
#   - MySQL démarré      (base cirt_db créée)
##############################################################################

set -e  # Arrêter si une commande échoue

FRONTEND_DIR="$(cd "$(dirname "$0")" && pwd)"
DEPLOY_DIR="/var/www/sync-antic"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   SYNC ANTIC — Déploiement Production    ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── 1. Build du frontend ─────────────────────────────────────────────────────
echo "▶  1/4  Build du frontend React..."
cd "$FRONTEND_DIR"
npm install --silent
npm run build

echo "    ✅ Build terminé → dossier dist/"

# ── 2. Copie du dist vers /var/www ───────────────────────────────────────────
echo "▶  2/4  Déploiement vers $DEPLOY_DIR..."
sudo mkdir -p "$DEPLOY_DIR"
sudo rm -rf "$DEPLOY_DIR/dist"
sudo cp -r dist "$DEPLOY_DIR/"
sudo chown -R www-data:www-data "$DEPLOY_DIR"

echo "    ✅ Fichiers copiés"

# ── 3. Configuration Nginx ────────────────────────────────────────────────────
echo "▶  3/4  Configuration Nginx..."
sudo cp nginx.conf /etc/nginx/sites-available/sync-antic

# Désactiver le site par défaut s'il existe
if [ -L /etc/nginx/sites-enabled/default ]; then
    sudo rm /etc/nginx/sites-enabled/default
fi

# Activer sync-antic
if [ ! -L /etc/nginx/sites-enabled/sync-antic ]; then
    sudo ln -s /etc/nginx/sites-available/sync-antic /etc/nginx/sites-enabled/sync-antic
fi

# Tester la config
sudo nginx -t

# Recharger Nginx
sudo systemctl reload nginx

echo "    ✅ Nginx configuré et rechargé"

# ── 4. Vérification du backend ───────────────────────────────────────────────
echo "▶  4/4  Vérification du backend Spring Boot..."

if curl -s --max-time 3 http://localhost:8080/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"__test__","password":"__test__"}' > /dev/null 2>&1; then
    echo "    ✅ Backend Spring Boot répond sur :8080"
else
    echo "    ⚠️  Backend non joignable sur :8080"
    echo "       Assurez-vous de démarrer le .jar avec :"
    echo "       java -jar Antic-0.0.1-SNAPSHOT.jar &"
fi

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   Déploiement terminé !                  ║"
echo "║   Application disponible sur :           ║"
echo "║   http://$(hostname -I | awk '{print $1}')           ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "  Credentials admin par défaut :"
echo "    Email    : admin@antic.cm"
echo "    Password : Admin@1234!"
echo "  ⚠️  Changez le mot de passe dès la première connexion !"
echo ""
