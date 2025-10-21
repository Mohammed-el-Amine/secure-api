# 🗄️ Base de Données avec Prisma - Guide Complet

## 🎯 Vue d'ensemble

Prisma est au cœur de notre architecture de données, fournissant une couche ORM type-safe, moderne et performante pour MySQL. Cette section documente l'utilisation complète de Prisma dans notre application.

**Avantages clés :**
- **Type Safety** : Prévention des erreurs SQL à la compilation
- **Migrations automatiques** : Versioning des changements de schéma
- **Query Builder intuitif** : API JavaScript naturelle
- **Performance optimisée** : Requêtes SQL générées et optimisées
- **Introspection** : Synchronisation bidirectionnelle avec la base

## � Structure Complète

```
prisma/
├── schema.prisma        # 📋 Schéma principal de la base de données
├── migrations/          # 📦 Historique des migrations versionnées
│   ├── 20241021000000_init/         # Migration initiale
│   │   ├── migration.sql            # Script SQL de la migration
│   │   └── snapshot.json           # État du schéma après migration
│   └── migration_lock.toml         # Verrou pour éviter conflits
├── seed.js             # 🌱 Script de peuplement (données test/dev)
└── README.md           # 📚 Cette documentation
```

**Workflow type :**
1. **Modification** du `schema.prisma`
2. **Génération** de migration avec `prisma migrate dev`
3. **Application** automatique en base locale
4. **Génération** du client TypeScript mis à jour
5. **Commit** des fichiers de migration pour l'équipe

## 🏗️ Schéma de Base de Données

**Fichier :** `schema.prisma`
```prisma
// Configuration du générateur de client
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
}

// Configuration de la source de données
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// Modèle utilisateur avec contraintes et optimisations
model User {
  id           Int      @id @default(autoincrement())
  username     String   @unique @db.VarChar(30)
  passwordHash String   @db.VarChar(255)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Index pour optimiser les requêtes de recherche
  @@index([username])
  @@index([createdAt])
  
  // Mapping vers la table MySQL existante
  @@map("users")
}

// Exemple d'extension future : Sessions persistantes
// model Session {
//   id        String   @id @default(cuid())
//   userId    Int
//   user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
//   expiresAt DateTime
//   createdAt DateTime @default(now())
//   
//   @@index([userId])
//   @@index([expiresAt])
//   @@map("sessions")
// }
```

**Détails du modèle User :**
- **id** : Clé primaire auto-incrémentée (performance optimale)
- **username** : Contrainte unique avec index (recherche rapide)
- **passwordHash** : Stockage sécurisé (jamais le mot de passe en clair)
- **timestamps** : Audit automatique des créations/modifications
- **indexes** : Optimisation des requêtes fréquentes

## 🚀 Commandes Essentielles

### Développement
```bash
# Générer le client Prisma
npx prisma generate

# Appliquer les migrations en dev
npx prisma migrate dev --name nom_migration

# Réinitialiser la base (⚠️ supprime les données)
npx prisma migrate reset

# Interface graphique pour explorer les données
npx prisma studio
```

### Production
```bash
# Appliquer les migrations en production
npx prisma migrate deploy

# Générer le client (après déploiement)
npx prisma generate
```

### Utilitaires
```bash
# Synchroniser le schéma avec une DB existante
npx prisma db pull

# Valider le schéma
npx prisma validate

# Formatter le schéma
npx prisma format
```

## ⚙️ Configuration Avancée

### Variables d'Environnement Détaillées
```bash
# Développement (.env) - Configuration locale
DATABASE_URL="mysql://username:password@localhost:3306/secure_api?schema=public&connection_limit=10&pool_timeout=20&socket_timeout=60"

# Test (.env.test) - Base de données isolée pour les tests
DATABASE_URL="mysql://username:password@localhost:3306/secure_api_test?schema=public&connection_limit=5"

# Production - Configuration optimisée avec SSL
DATABASE_URL="mysql://username:password@prod-host:3306/secure_api?sslmode=require&connection_limit=20&pool_timeout=20&socket_timeout=60&sslcert=./certs/client-cert.pem&sslkey=./certs/client-key.pem&sslrootcert=./certs/ca-cert.pem"
```

**Paramètres d'URL expliqués :**
- `connection_limit` : Nombre max de connexions simultanées
- `pool_timeout` : Timeout d'acquisition de connexion (secondes)
- `socket_timeout` : Timeout des requêtes MySQL (secondes)
- `sslmode` : Mode SSL (disable, prefer, require)

### Client Prisma Optimisé (`src/config/database.js`)
```javascript
import { PrismaClient } from '@prisma/client';

// Configuration différenciée par environnement
const getLogLevel = () => {
  switch (process.env.NODE_ENV) {
    case 'development':
      return ['query', 'info', 'warn', 'error'];
    case 'test':
      return ['error']; // Silencieux en test
    case 'production':
      return ['error']; // Seulement les erreurs en prod
    default:
      return ['info', 'warn', 'error'];
  }
};

export const prisma = new PrismaClient({
  log: getLogLevel(),
  errorFormat: 'pretty',
  
  // Configuration avancée du datasource
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  
  // Métriques de performance (optionnel)
  __internal: {
    measurePerformance: process.env.NODE_ENV === 'development'
  }
});

// Middleware pour logging des requêtes lentes
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  
  const queryTime = after - before;
  if (queryTime > 1000) { // Log si > 1 seconde
    console.warn(`🐌 Requête lente détectée: ${params.model}.${params.action} (${queryTime}ms)`);
  }
  
  return result;
});

// Gestion gracieuse de la fermeture avec retry
const gracefulShutdown = async () => {
  console.log('🔌 Fermeture des connexions Prisma...');
  let retries = 3;
  
  while (retries > 0) {
    try {
      await prisma.$disconnect();
      console.log('✅ Connexions Prisma fermées');
      break;
    } catch (error) {
      retries--;
      console.error(`❌ Erreur fermeture Prisma (${retries} tentatives restantes):`, error.message);
      if (retries === 0) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};

// Gestionnaires de signaux pour shutdown gracieux
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('beforeExit', gracefulShutdown);

// Test de connexion au démarrage
export const testDatabaseConnection = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Connexion base de données établie');
    
    // Test de requête simple
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Base de données opérationnelle');
    
  } catch (error) {
    console.error('❌ Erreur connexion base de données:', error.message);
    console.error('💡 Vérifiez votre DATABASE_URL et que MySQL fonctionne');
    process.exit(1);
  }
};
```

## 🔄 Workflow des Migrations

### 1. Modifier le Schéma
```prisma
// Exemple : Ajouter un champ email
model User {
  id           Int      @id @default(autoincrement())
  username     String   @unique @db.VarChar(30)
  email        String   @unique @db.VarChar(100) // ← Nouveau champ
  passwordHash String   @db.VarChar(255)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("users")
}
```

### 2. Créer la Migration
```bash
npx prisma migrate dev --name add_email_field
```

### 3. Appliquer Automatiquement
- Migration appliquée sur la DB locale
- Fichier SQL généré dans `prisma/migrations/`
- Client Prisma mis à jour automatiquement

## 🛡️ Sécurité et Performance - Bonnes Pratiques

### Protection SQL Injection Garantie
```javascript
// ✅ SÉCURISÉ - Prisma paramétrise automatiquement
const user = await prisma.user.findUnique({
  where: { username: userInput } // Impossible d'injecter du SQL
});

const users = await prisma.user.findMany({
  where: {
    username: { contains: searchTerm }, // Recherche sécurisée
    createdAt: { gte: new Date(dateFilter) } // Dates sécurisées
  }
});

// ⚠️ SQL brut - À utiliser avec précaution
const result = await prisma.$queryRaw`
  SELECT COUNT(*) as total 
  FROM users 
  WHERE created_at > ${startDate}
`; // Prisma paramétrise même le SQL brut

// ❌ JAMAIS FAIRE - Concaténation directe
// const query = `SELECT * FROM users WHERE username = '${userInput}'`; // VULNÉRABLE
```

### Optimisations de Performance

#### 1. Sélection de Champs Ciblée
```javascript
// ✅ Select spécifique - Économise bande passante et mémoire
const publicUser = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    username: true,
    createdAt: true
    // passwordHash intentionnellement omis pour la sécurité
  }
});

// ✅ Exclusion de champs sensibles avec omit (Prisma 5+)
const userWithoutPassword = await prisma.user.findUnique({
  where: { id: userId },
  omit: { passwordHash: true }
});
```

#### 2. Pagination et Tri Optimisés
```javascript
// ✅ Pagination cursor-based (plus performante pour grandes tables)
const users = await prisma.user.findMany({
  take: 20,
  cursor: lastUserId ? { id: lastUserId } : undefined,
  skip: lastUserId ? 1 : 0,
  orderBy: { id: 'desc' }
});

// ✅ Pagination offset-based (plus simple, moins performante)
const page = 2, limit = 10;
const users = await prisma.user.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' }
});

// ✅ Compter avec pagination optimisée
const [users, totalCount] = await Promise.all([
  prisma.user.findMany({
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' }
  }),
  prisma.user.count({
    where: searchConditions
  })
]);
```

#### 3. Requêtes Complexes Optimisées
```javascript
// ✅ Requête avec conditions multiples et index
const activeUsers = await prisma.user.findMany({
  where: {
    AND: [
      { createdAt: { gte: thirtyDaysAgo } }, // Utilise l'index sur createdAt
      { username: { not: null } } // Filtre les utilisateurs valides
    ]
  },
  orderBy: [
    { createdAt: 'desc' }, // Index principal
    { username: 'asc' }    // Index secondaire
  ]
});

// ✅ Agrégations performantes
const userStats = await prisma.user.aggregate({
  _count: true,
  _min: { createdAt: true },
  _max: { createdAt: true },
  where: {
    createdAt: { gte: startOfMonth }
  }
});
```

### Connection Pooling Avancé
```javascript
// Configuration optimisée du pool dans DATABASE_URL
const getDatabaseUrl = () => {
  const baseUrl = process.env.DATABASE_URL;
  
  // Paramètres selon l'environnement
  const poolConfig = {
    development: 'connection_limit=5&pool_timeout=20',
    test: 'connection_limit=2&pool_timeout=10',
    production: 'connection_limit=20&pool_timeout=30&socket_timeout=60'
  };
  
  const config = poolConfig[process.env.NODE_ENV] || poolConfig.development;
  return `${baseUrl}?${config}`;
};

// Monitoring des connexions (développement)
if (process.env.NODE_ENV === 'development') {
  setInterval(async () => {
    try {
      const metrics = await prisma.$metrics.json();
      console.log('📊 Pool de connexions:', {
        active: metrics.counters.find(c => c.key === 'prisma_pool_connections_open')?.value || 0,
        idle: metrics.counters.find(c => c.key === 'prisma_pool_connections_idle')?.value || 0
      });
    } catch (error) {
      // Métriques non disponibles dans toutes les versions
    }
  }, 30000); // Toutes les 30 secondes
}
```

### Gestion des Transactions
```javascript
// ✅ Transaction simple
const transferUser = await prisma.$transaction(async (tx) => {
  const user = await tx.user.update({
    where: { id: userId },
    data: { username: newUsername }
  });
  
  // Log de l'action
  await tx.auditLog.create({
    data: {
      userId: user.id,
      action: 'username_change',
      oldValue: oldUsername,
      newValue: newUsername
    }
  });
  
  return user;
});

// ✅ Transaction avec retry automatique
const createUserWithRetry = async (userData, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        return await tx.user.create({
          data: userData,
          select: { id: true, username: true, createdAt: true }
        });
      });
    } catch (error) {
      if (attempt === maxRetries || !isRetryableError(error)) {
        throw error;
      }
      
      const delay = Math.pow(2, attempt) * 1000; // Backoff exponentiel
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

const isRetryableError = (error) => {
  return error.code === 'P2034' || // Transaction conflict
         error.code === 'P1001' || // Connection error
         error.message.includes('timeout');
};
```

## 🔧 Maintenance

### Scripts Utiles (`package.json`)
```json
{
  "scripts": {
    "db:reset": "npx prisma migrate reset --force",
    "db:studio": "npx prisma studio",
    "db:generate": "npx prisma generate",
    "db:migrate": "npx prisma migrate dev",
    "db:deploy": "npx prisma migrate deploy"
  }
}
```

### Backup et Restore
```bash
# Backup
mysqldump -u user -p secure_api > backup.sql

# Restore
mysql -u user -p secure_api < backup.sql
```

## 🧪 Tests avec Prisma

### Configuration Test
```javascript
// tests/setup.js
import { prisma } from '../src/config/database.js';

beforeEach(async () => {
  // Nettoyer les données de test
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

### Base de Données de Test
```bash
# Utiliser setup-test-db.sh pour créer la base de test
./setup-test-db.sh

# Ou manuellement
export DATABASE_URL="mysql://user:pass@localhost:3306/secure_api_test"
npx prisma migrate dev --name test-init
```

## 📊 Monitoring

### Logs des Requêtes
```javascript
// En développement
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'info', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
});

prisma.$on('query', (e) => {
  console.log('Query: ' + e.query);
  console.log('Duration: ' + e.duration + 'ms');
});
```

### Métriques Performance
- **Connection pool** : Surveiller les connexions actives
- **Slow queries** : Logs des requêtes > 100ms
- **Error rate** : Taux d'erreurs de connexion

## 🚨 Dépannage

### Erreurs Courantes

**"Can't reach database server"**
```bash
# Vérifier MySQL
sudo systemctl status mysql
sudo systemctl start mysql

# Tester la connexion
mysql -u user -p -h localhost
```

**"Access denied"**
```bash
# Vérifier les droits utilisateur
mysql -u root -p -e "SHOW GRANTS FOR 'user'@'localhost';"

# Donner les droits nécessaires
GRANT ALL PRIVILEGES ON secure_api.* TO 'user'@'localhost';
```

**"Migration failed"**
```bash
# Voir l'historique des migrations
npx prisma migrate status

# Forcer la résolution
npx prisma migrate resolve --applied "migration_name"
```

### Reset Complet
```bash
# ⚠️ SUPPRIME TOUTES LES DONNÉES
npx prisma migrate reset --force
npx prisma generate
```

## 🎯 Bonnes Pratiques

1. **Toujours** utiliser `select` pour éviter les fuites de données sensibles
2. **Jamais** commit les `.env` avec vrais passwords
3. **Toujours** tester les migrations sur une copie avant prod
4. **Utiliser** des transactions pour les opérations critiques
5. **Monitor** les performances des requêtes

## 📈 Évolutions Prévues

- **Audit trail** : Log des modifications
- **Soft delete** : Suppression logique
- **Roles/Permissions** : Système de droits
- **Indexes** : Optimisation des requêtes fréquentes