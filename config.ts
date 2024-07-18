import dotenv from 'dotenv';
import { importPKCS8, importSPKI } from 'jose';

dotenv.config();

if (!process.env.JWT_PRIVATE_KEY || !process.env.JWT_PUBLIC_KEY) {
  throw new Error('Missing required environment variables.');
}

export const config = {
  jwtPrivateKey: process.env.JWT_PRIVATE_KEY as string,
  jwtPublicKey: process.env.JWT_PUBLIC_KEY as string,
};

// Async function to import keys
export async function getKeys() {
  return {
    privateKey: await importPKCS8(config.jwtPrivateKey, 'RS256'),
    publicKey: await importSPKI(config.jwtPublicKey, 'RS256'),
  };
}
