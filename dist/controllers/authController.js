"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshToken = exports.logout = exports.login = void 0;
const authUtils_1 = require("../utils/authUtils");
const tokenUtils_1 = require("../utils/tokenUtils");
const userModel_1 = __importDefault(require("../models/userModel"));
// Login endpoint
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }
    try {
        // Find the user by email
        const user = yield userModel_1.default.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Compare the provided password with the stored hash
        const isPasswordValid = yield (0, authUtils_1.comparePassword)(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        // Create access and refresh tokens
        const accessToken = yield (0, tokenUtils_1.createAccessToken)(user.id);
        const refreshToken = yield (0, tokenUtils_1.createRefreshToken)(user.id);
        // Send tokens as response
        res.json({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
            },
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.login = login;
// Logout endpoint
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(200).json({ message: 'Logged out successfully' });
});
exports.logout = logout;
// Refresh token endpoint
const refreshToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required' });
    }
    try {
        // Verify the refresh token
        const payload = yield (0, tokenUtils_1.verifyToken)(refreshToken);
        // Create a new access token
        const newAccessToken = yield (0, tokenUtils_1.createAccessToken)(payload.userId);
        res.json({ accessToken: newAccessToken });
    }
    catch (err) {
        console.error(err);
        res.status(403).json({ message: 'Invalid refresh token' });
    }
});
exports.refreshToken = refreshToken;
