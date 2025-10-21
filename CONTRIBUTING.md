# Guide de Contribution

Merci de votre intérêt pour contribuer au Squelette Express.js Sécurisé ! 🎉

## Comment contribuer

### 🐛 Signaler des bugs

1. Vérifiez que le bug n'a pas déjà été signalé dans [les issues](https://github.com/Mohammed-el-Amine/secure-api/issues)
2. Utilisez le template "Bug Report"
3. Incluez un maximum de détails (OS, versions, logs, etc.)

### ✨ Proposer des fonctionnalités

1. Créez une issue avec le template "Feature Request"
2. Décrivez clairement le problème que cela résoudrait
3. Considérez l'impact sur la sécurité

### 🔧 Développement

#### Prérequis
- Node.js 18+
- MySQL 8.0+
- Git

#### Setup
```bash
git clone https://github.com/Mohammed-el-Amine/secure-api.git
cd secure-api
npm install
cp .env.example .env
# Configurez votre DATABASE_URL
npx prisma migrate dev --name init
npm run dev
```

#### Standards de code
- Utilisez ESLint et Prettier
- Commentez le code en français
- Suivez les conventions de nommage existantes
- Tous les endpoints doivent être sécurisés

#### Tests
- Testez manuellement tous les endpoints
- Vérifiez que `/api/health` fonctionne
- Assurez-vous que l'application ne crash pas

### 📝 Pull Requests

1. Fork le projet
2. Créez une branche : `git checkout -b feature/ma-fonctionnalite`
3. Committez : `git commit -m 'feat: ajouter ma fonctionnalité'`
4. Push : `git push origin feature/ma-fonctionnalite`
5. Ouvrez une Pull Request

#### Format des commits
- `feat:` nouvelle fonctionnalité
- `fix:` correction de bug
- `docs:` documentation
- `refactor:` refactoring
- `security:` amélioration sécurité

### 🔒 Sécurité

Ce projet met l'accent sur la sécurité. Toute contribution doit :
- Maintenir ou améliorer le niveau de sécurité
- Ne pas introduire de vulnérabilités
- Respecter les bonnes pratiques OWASP

### ❓ Questions

Utilisez le template "Question" dans les issues ou contactez-nous.

Merci pour vos contributions ! 🚀