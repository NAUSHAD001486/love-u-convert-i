import { Readable } from 'stream';
interface UploadResult {
    public_id: string;
    secure_url: string;
    bytes: number;
    format: string;
}
export declare const cloudinaryService: {
    uploadAndConvertStream(stream: Readable, filename: string, targetFormat: string, ctx?: any): Promise<UploadResult>;
    upload(buffer: Buffer, options?: any): Promise<unknown>;
    download(url: string): Promise<{
        url: string;
    }>;
};
export {};
//# sourceMappingURL=cloudinary.service.d.ts.map