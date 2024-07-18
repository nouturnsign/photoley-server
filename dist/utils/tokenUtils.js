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
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.createRefreshToken = exports.createAccessToken = void 0;
const jose_1 = require("jose");
const config_1 = require("./config");
const fs_1 = require("fs");
// Load RSA private and public keys from files
const privateKey = (0, fs_1.readFileSync)(config_1.config.jwt.privateKeyPath, 'utf8');
const publicKey = (0, fs_1.readFileSync)(config_1.config.jwt.publicKeyPath, 'utf8');
// Create access token
const createAccessToken = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return new jose_1.SignJWT({ userId })
        .setProtectedHeader({ alg: 'RS256' })
        .setExpirationTime('15m')
        .sign(new TextEncoder().encode(privateKey));
});
exports.createAccessToken = createAccessToken;
// Create refresh token
const createRefreshToken = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return new jose_1.SignJWT({ userId })
        .setProtectedHeader({ alg: 'RS256' })
        .setExpirationTime('30d')
        .sign(new TextEncoder().encode(privateKey));
});
exports.createRefreshToken = createRefreshToken;
// Verify token
const verifyToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    const { payload } = yield (0, jose_1.jwtVerify)(token, new TextEncoder().encode(publicKey), {
        algorithms: ['RS256'],
    });
    if (typeof payload.userId !== 'string') {
        throw new Error('Invalid token payload');
    }
    return payload;
});
exports.verifyToken = verifyToken;
