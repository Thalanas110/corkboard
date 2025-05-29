const crypto = require('crypto');
const { promisify } = require('util');

const scryptAsync = promisify(crypto.scrypt);

// In-memory session storage (in production, use Redis or database)
const sessions = {};

async function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const buf = await scryptAsync(password, salt, 64);
    return `${buf.toString('hex')}.${salt}`;
}

async function comparePasswords(supplied, stored) {
    const [hashed, salt] = stored.split('.');
    const hashedBuf = Buffer.from(hashed, 'hex');
    const suppliedBuf = await scryptAsync(supplied, salt, 64);
    return crypto.timingSafeEqual(hashedBuf, suppliedBuf);
}

function generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
}

// Clean up expired sessions every hour
setInterval(() => {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    Object.keys(sessions).forEach(sessionId => {
        if (now - sessions[sessionId].createdAt > oneHour) {
            delete sessions[sessionId];
        }
    });
}, 60 * 60 * 1000);

module.exports = {
    hashPassword,
    comparePasswords,
    generateSessionId,
    sessions
};
