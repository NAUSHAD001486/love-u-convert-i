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
            targetFormat: string;
            outputFormat: string;
            downloadName: string;
            totalFiles?: undefined;
            convertedFiles?: undefined;
            failedFiles?: undefined;
            failedDetails?: undefined;
        };
        zipUrl?: undefined;
    } | {
        status: string;
        mode: string;
        zipUrl: string;
        meta: {
            totalFiles: number;
            convertedFiles: number;
            failedFiles: number;
            failedDetails: {
                file: string;
                errorCode: string | undefined;
                errorMessage: string | undefined;
            }[];
            originalName?: undefined;
            convertedName?: undefined;
            convertedSizeBytes?: undefined;
            targetFormat?: undefined;
            outputFormat?: undefined;
            downloadName?: undefined;
        };
        downloadUrl?: undefined;
    }>;
};
//# sourceMappingURL=convert.service.d.ts.map