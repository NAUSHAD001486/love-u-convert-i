import { Request, Response, NextFunction } from 'express';
export declare const requestId: (req: Request, res: Response, next: NextFunction) => void;
declare global {
    namespace Express {
        interface Request {
            id?: string;
        }
    }
}
//# sourceMappingURL=requestId.d.ts.map