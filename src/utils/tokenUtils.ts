import { SignJWT, jwtVerify, JWTPayload, importPKCS8, importSPKI, KeyLike } from 'jose';
import { config } from './config';
import { readFileSync } from 'fs';

interface UserPayload extends JWTPayload {
  userId: string;
}

// Load RSA private and public keys from files
const privateKey = readFileSync(config.jwt.privateKeyPath, 'utf8');
const publicKey = readFileSync(config.jwt.publicKeyPath, 'utf8');

let privateKeyObject: KeyLike;
let publicKeyObject: KeyLike;
(async () => {
  privateKeyObject = await importPKCS8(privateKey, 'RS256');
  publicKeyObject = await importSPKI(publicKey, 'RS256');
})();

// Create access token
const createAccessToken = async (userId: string) => {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'RS256' })
    .setExpirationTime('15m')
    .sign(privateKeyObject);
}

// Create refresh token
const createRefreshToken = async (userId: string) => {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'RS256' })
    .setExpirationTime('30d')
    .sign(privateKeyObject);
}

// Verify token
const verifyToken = async (token: string) => {
  const { payload } = await jwtVerify(token, publicKeyObject, {
    algorithms: ['RS256'],
  });

  if (typeof payload.userId !== 'string') {
    throw new Error('Invalid token payload');
  }

  return payload as UserPayload;
}

export { createAccessToken, createRefreshToken, verifyToken };
