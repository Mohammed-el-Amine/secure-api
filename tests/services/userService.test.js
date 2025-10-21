import { jest } from '@jest/globals';
import { UserService } from '../../src/services/userService.js';
import { cleanDatabase, generateUniqueUsername } from '../helpers.js';

describe('UserService', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe('createUser', () => {
    test('devrait créer un utilisateur avec des données valides', async () => {
      const username = generateUniqueUsername();
      const password = 'ValidPassword123!';

      const user = await UserService.createUser(username, password);

      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('username', username);
      expect(user).toHaveProperty('createdAt');
      expect(user).not.toHaveProperty('passwordHash'); // Ne doit pas être exposé
    });

    test('devrait rejeter la création d\'un utilisateur avec un nom existant', async () => {
      const username = generateUniqueUsername();
      const password = 'ValidPassword123!';

      // Créer le premier utilisateur
      await UserService.createUser(username, password);

      // Tenter de créer un second utilisateur avec le même nom
      await expect(
        UserService.createUser(username, password)
      ).rejects.toThrow('Utilisateur déjà existant');
    });

    test('devrait hacher le mot de passe correctement', async () => {
      const username = generateUniqueUsername();
      const password = 'ValidPassword123!';

      await UserService.createUser(username, password);

      // Vérifier que le mot de passe est haché en base
      const userInDb = await UserService.findByUsername(username);
      expect(userInDb.passwordHash).toBeDefined();
      expect(userInDb.passwordHash).not.toBe(password);
      expect(userInDb.passwordHash.length).toBeGreaterThan(50); // bcrypt hash
    });
  });

  describe('findByUsername', () => {
    test('devrait trouver un utilisateur existant', async () => {
      const username = generateUniqueUsername();
      const password = 'ValidPassword123!';

      await UserService.createUser(username, password);
      const foundUser = await UserService.findByUsername(username);

      expect(foundUser).toBeDefined();
      expect(foundUser.username).toBe(username);
      expect(foundUser).toHaveProperty('passwordHash');
    });

    test('devrait retourner null pour un utilisateur inexistant', async () => {
      const nonExistentUser = await UserService.findByUsername('nonexistent');
      expect(nonExistentUser).toBeNull();
    });
  });

  describe('findById', () => {
    test('devrait trouver un utilisateur par son ID', async () => {
      const username = generateUniqueUsername();
      const password = 'ValidPassword123!';

      const createdUser = await UserService.createUser(username, password);
      const foundUser = await UserService.findById(createdUser.id);

      expect(foundUser).toBeDefined();
      expect(foundUser.id).toBe(createdUser.id);
      expect(foundUser.username).toBe(username);
      expect(foundUser).not.toHaveProperty('passwordHash'); // Sélection sécurisée
    });

    test('devrait retourner null pour un ID inexistant', async () => {
      const nonExistentUser = await UserService.findById(99999);
      expect(nonExistentUser).toBeNull();
    });
  });

  describe('verifyPassword', () => {
    test('devrait vérifier un mot de passe correct', async () => {
      const password = 'ValidPassword123!';
      const username = generateUniqueUsername();

      const user = await UserService.createUser(username, password);
      const userWithHash = await UserService.findByUsername(username);

      const isValid = await UserService.verifyPassword(password, userWithHash.passwordHash);
      expect(isValid).toBe(true);
    });

    test('devrait rejeter un mot de passe incorrect', async () => {
      const password = 'ValidPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const username = generateUniqueUsername();

      await UserService.createUser(username, password);
      const userWithHash = await UserService.findByUsername(username);

      const isValid = await UserService.verifyPassword(wrongPassword, userWithHash.passwordHash);
      expect(isValid).toBe(false);
    });
  });

  describe('countUsers', () => {
    test('devrait compter le nombre d\'utilisateurs', async () => {
      const initialCount = await UserService.countUsers();

      await UserService.createUser(generateUniqueUsername(), 'Password123!');
      await UserService.createUser(generateUniqueUsername(), 'Password123!');

      const finalCount = await UserService.countUsers();
      expect(finalCount).toBe(initialCount + 2);
    });
  });
});