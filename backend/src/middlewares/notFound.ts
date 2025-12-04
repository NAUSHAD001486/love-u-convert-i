import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response';

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  return errorResponse(res, new Error('Route not found'), 404);
};

