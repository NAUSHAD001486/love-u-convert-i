import { Request, Response } from 'express';
import { successResponse } from '../utils/response';

export const healthCheck = async (req: Request, res: Response) => {
  return successResponse(res, { status: 'ok', timestamp: new Date().toISOString() });
};

