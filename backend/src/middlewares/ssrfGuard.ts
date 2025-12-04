import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response';
import { isAllowedUrl } from '../utils/ip';

export const ssrfGuard = (req: Request, res: Response, next: NextFunction) => {
  // TODO: Implement SSRF protection
  const url = req.body?.url || req.query?.url;
  
  if (url && !isAllowedUrl(url)) {
    return errorResponse(res, new Error('URL not allowed'), 403);
  }
  
  next();
};

