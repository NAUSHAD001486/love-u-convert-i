import { Request, Response, NextFunction } from 'express';
import corsMiddleware from 'cors';

export const cors = corsMiddleware({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
});

