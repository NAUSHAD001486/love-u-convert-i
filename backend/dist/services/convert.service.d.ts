import { Request } from 'express';
export declare const convertService: {
    convert(req: Request): Promise<{
        status: string;
        mode: string;
        downloadUrl: string;
        meta: {
            originalName: string;
            convertedName: string;
            convertedSizeBytes: number;
            totalFiles?: undefined;
        };
        zipUrl?: undefined;
    } | {
        status: string;
        mode: string;
        zipUrl: string;
        meta: {
            totalFiles: number;
            originalName?: undefined;
            convertedName?: undefined;
            convertedSizeBytes?: undefined;
        };
        downloadUrl?: undefined;
    }>;
};
//# sourceMappingURL=convert.service.d.ts.map