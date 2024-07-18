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
exports.getProfile = getProfile;
exports.updateProfile = updateProfile;
const userModel_1 = __importDefault(require("../models/userModel"));
// Get profile
function getProfile(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = yield userModel_1.default.findById(res.locals.userId).select('-password');
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json(user);
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Internal server error' });
        }
    });
}
// Edit profile
function updateProfile(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { username, profilePicture } = req.body;
            const user = yield userModel_1.default.findByIdAndUpdate(res.locals.userId, { username, profilePicture }, { new: true, runValidators: true }).select('-password');
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json(user);
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Internal server error' });
        }
    });
}
