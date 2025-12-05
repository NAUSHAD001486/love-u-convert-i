import { Request, Response } from 'express';

export const healthCheck = async (req: Request, res: Response) => {
  return res.json({ status: 'ok', time: new Date().toISOString() });
};

