const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const register = async (req, res, next) => {
    try {
        const { fullName, age, gender, email, password, type } = req.body;

        if (!fullName || !email || !password || age === undefined || !gender) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: fullName, age, gender, email, password'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Email is already registered'
            });
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const userType = type === 'admin' ? 'admin' : 'normal';

        const user = await User.create({
            fullName: fullName.trim(),
            age: Number(age),
            gender,
            email: normalizedEmail,
            passwordHash,
            type: userType
        });

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            data: user
        });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const token = jwt.sign(
            { id: user._id, type: user.type },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
        );

        const userData = user.toJSON();

        res.status(200).json({
            success: true,
            message: 'Logged in successfully',
            token,
            user: userData,
            data: {
                token,
                user: userData
            }
        });
    } catch (error) {
        next(error);
    }
};

const getMe = async (req, res) => {
    res.status(200).json({
        success: true,
        data: req.user
    });
};

module.exports = {
    register,
    login,
    getMe
};
