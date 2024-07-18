"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authRouter_1 = __importDefault(require("./authRouter"));
const photoRouter_1 = __importDefault(require("./photoRouter"));
const profileRouter_1 = __importDefault(require("./profileRouter"));
const router = (0, express_1.Router)();
// Public routes
router.use('/auth', authRouter_1.default);
router.use('/photo', photoRouter_1.default);
router.use('/profile', profileRouter_1.default);
exports.default = router;
