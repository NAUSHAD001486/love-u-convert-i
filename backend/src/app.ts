import express from 'express';
import healthRoutes from './routes/health.routes';
import convertRoutes from './routes/convert.routes';
import { requestId } from './middlewares/requestId';
import { cors } from './middlewares/cors';
import { errorHandler } from './middlewares/errorHandler';
import { notFound } from './middlewares/notFound';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestId);
app.use(cors);

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Backend running' });
});

app.use('/api/health', healthRoutes);
app.use('/api/convert', convertRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;

