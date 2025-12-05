import { Request, Response } from 'express';
import { convertService } from '../services/convert.service';
import { successResponse, errorResponse } from '../utils/response';

export const convertFile = async (req: Request, res: Response) => {
  const requestId = (req as any).id || 'unknown';

  try {
    const result = await convertService.convert(req);
    
    // Return the result directly (it already has status field)
    return res.status(200).json(result);
  } catch (error) {
    console.error(`[${requestId}] Conversion error:`, error);
    
    const err = error as Error;
    return errorResponse(res, err, 500);
  }
};
