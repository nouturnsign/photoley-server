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
exports.getPhotos = exports.uploadPhoto = void 0;
const photoModel_1 = __importDefault(require("../models/photoModel"));
const cloudinary_1 = require("cloudinary");
const config_1 = require("../utils/config");
// Configure Cloudinary
cloudinary_1.v2.config({
    cloud_name: config_1.config.cloudinary.cloudName,
    api_key: config_1.config.cloudinary.apiKey,
    api_secret: config_1.config.cloudinary.apiSecret,
});
const uploadPhoto = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { photo, location } = req.body;
    const userId = res.locals.userId;
    try {
        const result = yield cloudinary_1.v2.uploader.upload(photo, {
            folder: 'photos',
            use_filename: true,
        });
        const newPhoto = new photoModel_1.default({
            photoUrl: result.secure_url,
            location,
            userId,
        });
        yield newPhoto.save();
        res.status(201).json(newPhoto);
    }
    catch (err) {
        res.status(500).json({ message: 'Failed to upload photo' });
    }
});
exports.uploadPhoto = uploadPhoto;
const getPhotos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const photos = yield photoModel_1.default.find().populate('userId', 'username profilePicture');
        res.json(photos);
    }
    catch (err) {
        res.status(500).json({ message: 'Failed to retrieve photos' });
    }
});
exports.getPhotos = getPhotos;
