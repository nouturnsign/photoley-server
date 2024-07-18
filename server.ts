import express from 'express';
import fs from 'fs';
import https from 'https';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRouter from './routes/authRouter';
import profileRouter from './routes/profileRouter';
import photosRouter from './routes/photosRouter';

dotenv.config();

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use('/auth', authRouter);
app.use('/profile', profileRouter);
app.use('/photos', photosRouter);

// HTTPS Configuration
const httpsOptions = {
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem')
};

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/mydatabase');

// Start HTTPS server
https.createServer(httpsOptions, app).listen(port, () => {
  console.log(`Server is running on https://localhost:${port}`);
});
