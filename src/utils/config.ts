import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const config = {
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    profilePictureTransformation: [
      { width: 400, height: 400, crop: 'fill' }, // Standardize dimensions
      { quality: 'auto' }, // Optimize quality
      { fetch_format: 'auto' }, // Optimize format
    ],
    photoTransformation: [
      { width: 900, height: 1200, crop: 'fill' }, // Standardize dimensions
      { quality: 'auto' }, // Optimize quality
      { fetch_format: 'auto' }, // Optimize format
    ],
  },
  deployedAt: new Date(),
  jwt: {
    privateKeyPath: './private.pem',
    publicKeyPath: './public.pem',
  },
  mongoDB: {
    uri: process.env.MONGO_URI as string,
    autoIndex: isProduction ? true : false,
  },
  port: isProduction ? process.env.PORT : 3000,
  tagDuration: 24 * 60 * 60 * 1000, // tag duration in ms
  tls: {
    keyPath: isProduction ? '' : './localhost-key.pem',
    certPath: isProduction ? '' : './localhost.pem',
  },
};

export { config, isProduction };
