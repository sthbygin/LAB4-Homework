const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Please log in first'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: User account no longer exists'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: Invalid or expired token'
        });
    }
};

const adminOnly = (req, res, next) => {
    if (!req.user || req.user.type !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Forbidden: Only admin users can perform this action.'
        });
    }
    next();
};

module.exports = {
    protect,
    adminOnly
};
