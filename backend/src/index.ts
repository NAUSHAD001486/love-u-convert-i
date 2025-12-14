import dotenv from 'dotenv';
import app from './app';

dotenv.config();

const PORT = (process.env.PORT || 3000) as number;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

