import jwt from 'jsonwebtoken';
import db from '../database/db.js';
import logger from '../utils/logger.js';
import config from '../config/config.js';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    jwt.verify(token, config.jwt.secret, async (err, decoded) => {
        if (err) {
            logger.warn(`Invalid token attempt from ${req.ip}`);
            return res.status(403).json({ error: 'Invalid or expired token' });
        }

        try {
            // Get full user details from database
            const user = await getUserById(decoded.userId || decoded.id);
            if (!user || user.status !== 'approved') {
                return res.status(403).json({ error: 'User not authorized' });
            }

            // Update last login
            await updateLastLogin(user.id);
            
            req.user = user;
            next();
        } catch (error) {
            logger.error('Authentication error:', error);
            res.status(500).json({ error: 'Authentication failed' });
        }
    });
};

const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        if (!roles.includes(req.user.role)) {
            logger.warn(`Unauthorized access attempt by ${req.user.email} (role: ${req.user.role}) for resource requiring ${roles}`);
            return res.status(403).json({ error: 'Access denied: Insufficient permissions' });
        }

        next();
    };
};

function getUserById(userId) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
            if (err) reject(err);
            else resolve(user);
        });
    });
}

function updateLastLogin(userId) {
    return new Promise((resolve, reject) => {
        db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [userId], (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

export { authenticateToken, authorizeRole };