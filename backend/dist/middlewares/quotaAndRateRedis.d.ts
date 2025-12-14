import { Request, Response, NextFunction } from 'express';
interface QuotaMetadata {
    tokensAfter: number;
    newQuota: number;
}
declare global {
    namespace Express {
        interface Request {
            quotaMetadata?: QuotaMetadata;
        }
    }
}
export declare const quotaAndRateRedis: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=quotaAndRateRedis.d.ts.map