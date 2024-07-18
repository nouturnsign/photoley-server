import dotenv from 'dotenv';

dotenv.config();

export const config = {
  jwt: {
    privateKeyPath: 'keys/private.pem',
    publicKeyPath: 'keys/public.pem',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
    apiKey: process.env.CLOUDINARY_API_KEY as string,
    apiSecret: process.env.CLOUDINARY_API_SECRET as string,
  },
  mongoURI: process.env.MONGO_URI as string,
};
