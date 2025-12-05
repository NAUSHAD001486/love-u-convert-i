import { Response } from 'express';
export declare function successResponse(res: Response, data: any, statusCode?: number): Response<any, Record<string, any>>;
export declare function errorResponse(res: Response, error: Error, statusCode?: number): Response<any, Record<string, any>>;
//# sourceMappingURL=response.d.ts.map