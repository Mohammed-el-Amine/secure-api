import { PrismaClient } from '@prisma/client';

// Configuration de retry pour les opérations de base de données
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 seconde

// Instance unique de Prisma Client (pattern Singleton)
let prisma;

const createPrismaClient = () => {
    return new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
        errorFormat: 'pretty',
    });
};

if (process.env.NODE_ENV === 'production') {
    prisma = createPrismaClient();
} else {
    // En développement, utiliser une instance globale pour éviter les reconnexions
    if (!global.__prisma) {
        global.__prisma = createPrismaClient();
    }
    prisma = global.__prisma;
}

/**
 * Wrapper pour exécuter des opérations avec retry automatique
 */
export const withRetry = async (operation, retries = MAX_RETRIES) => {
    try {
        return await operation();
    } catch (error) {
        console.error(`❌ Erreur base de données (tentatives restantes: ${retries}):`, error.message);

        if (retries > 0 && isRetryableError(error)) {
            console.log(`🔄 Nouvelle tentative dans ${RETRY_DELAY}ms...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return withRetry(operation, retries - 1);
        }

        throw error;
    }
};

/**
 * Vérifie si une erreur justifie une nouvelle tentative
 */
const isRetryableError = (error) => {
    const retryableCodes = [
        'P1001', // Can't reach database server
        'P1002', // The database server was reached but timed out
        'P1008', // Operations timed out
        'P1017', // Server has closed the connection
    ];

    return retryableCodes.includes(error.code) ||
        error.message.includes('timeout') ||
        error.message.includes('connection');
};

/**
 * Vérification de la santé de la base de données
 */
export const checkDbHealth = async () => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
        console.error('❌ Base de données non disponible:', error.message);
        return {
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
};

// Gestionnaire de fermeture propre
const gracefulShutdown = async () => {
    try {
        console.log('🔌 Fermeture de la connexion à la base de données...');
        await prisma.$disconnect();
        console.log('✅ Connexion base de données fermée proprement');
    } catch (error) {
        console.error('❌ Erreur lors de la fermeture de la base:', error.message);
    }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('beforeExit', gracefulShutdown);

export { prisma };