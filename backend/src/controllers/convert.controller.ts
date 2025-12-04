import { Request, Response } from 'express';
import { convertService } from '../services/convert.service';
import { successResponse, errorResponse } from '../utils/response';

export const convertFile = async (req: Request, res: Response) => {
  try {
    // TODO: Implement conversion logic
    const result = await convertService.convert(req);
    return successResponse(res, result);
  } catch (error) {
    return errorResponse(res, error as Error);
  }
};

