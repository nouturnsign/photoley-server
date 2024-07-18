"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const photoController_1 = require("../controllers/photoController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.get('/', authMiddleware_1.authenticateToken, photoController_1.getPhotos);
router.post('/', authMiddleware_1.authenticateToken, photoController_1.uploadPhoto);
exports.default = router;
