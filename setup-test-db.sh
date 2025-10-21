#!/bin/bash
# setup-test-db.sh - Configure la base de données de test

echo "🗄️  Configuration de la base de données de test..."

# Charger les variables d'environnement depuis .env
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | grep -v '^ *$' | xargs)
fi

# Extraire les informations depuis DATABASE_URL
DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_NAME="secure_api_test"

# Créer la base de données de test
mysql -u $DB_USER -p$DB_PASS -e "DROP DATABASE IF EXISTS $DB_NAME;"
mysql -u $DB_USER -p$DB_PASS -e "CREATE DATABASE $DB_NAME;"

echo "✅ Base de données '$DB_NAME' créée"

# Appliquer les migrations sur la base de test
cross-env NODE_ENV=test DATABASE_URL="mysql://$DB_USER:$DB_PASS@localhost:3306/$DB_NAME" npx prisma migrate dev --name test-init --skip-generate

echo "✅ Migrations appliquées sur la base de test"

# Générer le client Prisma
npx prisma generate

echo "✅ Client Prisma généré"
echo "🎉 Base de données de test prête !"