import express from 'express';
import mongoose from 'mongoose';
import v1Router from './routes/v1';
import dotenv from 'dotenv';
import https from 'https';
import fs from 'fs';

dotenv.config();

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGO_URI as string)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Apply routes
app.use('/api/v1', v1Router);

// Setup HTTPS
const httpsOptions = {
  key: fs.readFileSync("./keys/localhost-key.pem", "utf-8"),
  cert: fs.readFileSync("./keys/localhost.pem", "utf-8"),
};

https.createServer(httpsOptions, app).listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
});
