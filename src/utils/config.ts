import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

let stickers: { name: string; url: string }[] = [
  {
    name: 'lsqw3m6n0u3csbhtn1fc',
    url: 'https://res.cloudinary.com/dajmwksse/image/upload/v1722126934/stickers/lsqw3m6n0u3csbhtn1fc.svg',
  },
  {
    name: 'meghoo6awu6b2vzb4ey9',
    url: 'https://res.cloudinary.com/dajmwksse/image/upload/v1722127010/stickers/meghoo6awu6b2vzb4ey9.svg',
  },
  {
    name: 'wuyu88gepnipedyq0dat',
    url: 'https://res.cloudinary.com/dajmwksse/image/upload/v1722127030/stickers/wuyu88gepnipedyq0dat.svg',
  },
];

const config = {
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    profilePictureTransformation: [
      { width: 400, height: 400, crop: 'fill' }, // Standardize dimensions
      { quality: 'auto' }, // Optimize quality
      { fetch_format: 'auto' }, // Optimize format
    ],
    photoPreTransformation: [
      { width: 900, height: 1200, crop: 'fill' }, // Standardize dimensions
    ],
    photoPostTransformation: [
      { quality: 'auto' }, // Optimize quality
      { fetch_format: 'auto' }, // Optimize format
    ],
    stickers: stickers,
    stickerSize: 4, // How much to scale sticker pixel sizes by
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
