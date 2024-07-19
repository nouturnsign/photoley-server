import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
// TODO: get keys for https server

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const config = {
  cloudinary: {
    profilePictureTransformation: [
      { width: 400, height: 400, crop: 'fill' }, // Standardize dimensions
      { quality: 'auto' }, // Optimize quality
      { fetch_format: 'auto' }, // Optimize format
    ],
    photoTransformation: [
      { width: 1200, height: 1200, crop: 'fill' }, // Standardize dimensions
      { quality: 'auto' }, // Optimize quality
      { fetch_format: 'auto' }, // Optimize format
    ],
  },
  jwt: {
    privateKeyPath: './keys/private.pem',
    publicKeyPath: './keys/public.pem',
  },
  mongoDB: {
    uri: process.env.MONGO_URI as string,
    autoIndex: isProduction ? true : false,
  },
  port: isProduction ? process.env.PORT : 3000,
  tls: {
    keyPath: isProduction
      ? './keys/localhost-key.pem'
      : './keys/localhost-key.pem',
    certPath: isProduction ? './keys/localhost.pem' : './keys/localhost.pem',
  },
};

export { config, isProduction };
