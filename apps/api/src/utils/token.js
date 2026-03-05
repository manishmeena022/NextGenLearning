import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const TOKEN_EXPIRY = {
    ACCESS: '15m',
    REFRESH: '7d'
}

const generateAccessToken = (userId, role) => {

    return jwt.sign(
        { userId, role, type: 'access' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: TOKEN_EXPIRY.ACCESS }
    )
}

const generateRefreshToken = (userId) => {
    return jwt.sign(
        { userId, type: 'refresh', jti: uuidv4() },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: TOKEN_EXPIRY.REFRESH }
    )
}

const verifyAccesToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        if (decoded.type !== 'access') {
            return null;
        }
        return decoded;
    } catch {
        return null;
    }
}

const verifyRefreshToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        if (decoded.type !== 'refresh') {
            return null;
        }
        return decoded;
    } catch {
        return null;
    }
}

export { generateAccessToken, generateRefreshToken, verifyAccesToken, verifyRefreshToken }