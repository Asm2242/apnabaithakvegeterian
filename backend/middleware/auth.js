import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';

// must be logged in (same style as authMiddleware)
const authMiddleware = async (req, res, next) => {
    const { token } = req.headers;
    if (!token) {
        return res.json({ success: false, message: 'Not Authorized Login Again' });
    }
    try {
        const token_decode = jwt.verify(token, process.env.JWT_SECRET);
        req.body.userId = token_decode.id;
        next();
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}

// must be logged in AND have one of the allowed roles
const roleMiddleware = (roles) => {
    return async (req, res, next) => {
        const { token } = req.headers;
        if (!token) {
            return res.json({ success: false, message: 'Not Authorized Login Again' });
        }
        try {
            const token_decode = jwt.verify(token, process.env.JWT_SECRET);
            const user = await userModel.findById(token_decode.id);
            if (!user || !user.active) {
                return res.json({ success: false, message: 'Account disabled' });
            }
            if (!roles.includes(user.role)) {
                return res.json({ success: false, message: 'Access denied' });
            }
            req.body.userId = token_decode.id;
            req.user = user;
            next();
        } catch (error) {
            return res.json({ success: false, message: error.message });
        }
    }
}

const adminAuth = roleMiddleware(['admin']);
const riderAuth = roleMiddleware(['rider', 'admin']);

export default authMiddleware;
export { adminAuth, riderAuth, roleMiddleware };
