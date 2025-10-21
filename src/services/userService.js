import { prisma, withRetry } from '../config/database.js';
import bcrypt from 'bcrypt';

export class UserService {

    /**
     * Créer un nouvel utilisateur
     * @param {string} username - Nom d'utilisateur
     * @param {string} password - Mot de passe en clair
     * @returns {Promise<Object>} - Utilisateur créé (sans le hash du mot de passe)
     */
    static async createUser(username, password) {
        return withRetry(async () => {
            // Hacher le mot de passe
            const passwordHash = await bcrypt.hash(password, 12);

            // Créer l'utilisateur en base
            const user = await prisma.user.create({
                data: {
                    username,
                    passwordHash
                },
                select: {
                    id: true,
                    username: true,
                    createdAt: true
                }
            });

            return user;
        }).catch(error => {
            // Gestion des erreurs de contrainte unique
            if (error.code === 'P2002') {
                throw new Error('Utilisateur déjà existant');
            }
            throw error;
        });
    }

    /**
     * Trouver un utilisateur par nom d'utilisateur
     * @param {string} username - Nom d'utilisateur
     * @returns {Promise<Object|null>} - Utilisateur trouvé ou null
     */
    static async findByUsername(username) {
        return withRetry(async () => {
            return await prisma.user.findUnique({
                where: { username }
            });
        });
    }

    /**
     * Trouver un utilisateur par ID
     * @param {number} id - ID de l'utilisateur
     * @returns {Promise<Object|null>} - Utilisateur trouvé ou null
     */
    static async findById(id) {
        return withRetry(async () => {
            return await prisma.user.findUnique({
                where: { id },
                select: {
                    id: true,
                    username: true,
                    createdAt: true,
                    updatedAt: true
                }
            });
        });
    }

    /**
     * Vérifier un mot de passe
     * @param {string} password - Mot de passe en clair
     * @param {string} passwordHash - Hash stocké en base
     * @returns {Promise<boolean>} - True si le mot de passe est correct
     */
    static async verifyPassword(password, passwordHash) {
        return await bcrypt.compare(password, passwordHash);
    }

    /**
     * Compter le nombre total d'utilisateurs
     * @returns {Promise<number>} - Nombre d'utilisateurs
     */
    static async countUsers() {
        return await prisma.user.count();
    }

    /**
     * Supprimer un utilisateur par ID
     * @param {number} id - ID de l'utilisateur
     * @returns {Promise<Object>} - Utilisateur supprimé
     */
    static async deleteUser(id) {
        return await prisma.user.delete({
            where: { id }
        });
    }
}