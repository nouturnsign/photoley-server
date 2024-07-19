import express from 'express';
import mongoose from 'mongoose';
import v1Router from './routes/v1';
import cookieParser from 'cookie-parser';
import https from 'https';
import fs from 'fs';
import { config, isProduction } from './utils/config';

const app = express();
app.use(express.json());
app.use(cookieParser());

mongoose
  .connect(config.mongoDB.uri, { autoIndex: config.mongoDB.autoIndex })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Apply routes
app.use('/api/v1', v1Router);

if (isProduction) {
  app.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
  });
} else {
  // Setup HTTPS locally
  const httpsOptions = {
    key: fs.readFileSync(config.tls.keyPath, 'utf-8'),
    cert: fs.readFileSync(config.tls.certPath, 'utf-8'),
  };

  https.createServer(httpsOptions, app).listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
  });
}
