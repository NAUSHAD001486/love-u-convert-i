import dotenv from 'dotenv';
import app from './app';
import { loadEnv } from './config/env';

dotenv.config();
loadEnv();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all network interfaces for mobile access

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});

