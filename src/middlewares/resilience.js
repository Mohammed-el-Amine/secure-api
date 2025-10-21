/**
 * Wrapper pour capturer les erreurs dans les routes asynchrones
 * Évite les crashes dus aux promesses rejetées non gérées
 */
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Middleware pour valider et nettoyer les entrées utilisateur
 * Prévient les injections et données malformées
 */
export const sanitizeInput = (req, res, next) => {
    try {
        // Nettoyer les chaînes de caractères des objets de requête
        const sanitizeObject = (obj) => {
            if (typeof obj === 'string') {
                // Supprimer les caractères dangereux
                return obj.trim().replace(/[<>]/g, '');
            }
            if (typeof obj === 'object' && obj !== null) {
                for (const key in obj) {
                    obj[key] = sanitizeObject(obj[key]);
                }
            }
            return obj;
        };

        req.body = sanitizeObject(req.body);
        req.query = sanitizeObject(req.query);
        req.params = sanitizeObject(req.params);

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware de timeout pour éviter les requêtes qui traînent
 */
export const requestTimeout = (timeoutMs = 30000) => {
    return (req, res, next) => {
        const timeout = setTimeout(() => {
            if (!res.headersSent) {
                res.status(408).json({
                    error: 'Timeout de la requête',
                    code: 'REQUEST_TIMEOUT'
                });
            }
        }, timeoutMs);

        // Nettoyer le timeout si la réponse est envoyée
        const originalSend = res.send;
        res.send = function (...args) {
            clearTimeout(timeout);
            return originalSend.apply(this, args);
        };

        next();
    };
};