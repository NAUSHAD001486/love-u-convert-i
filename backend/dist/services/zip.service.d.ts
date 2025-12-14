interface ZipResult {
    url: string;
}
export declare const zipService: {
    createZipFromPublicIds(publicIds: string[], ctx?: {
        requestId?: string;
    }): Promise<ZipResult>;
    createZip(files: Array<{
        name: string;
        buffer: Buffer;
    }>): Promise<Buffer<ArrayBuffer>>;
    extractZip(buffer: Buffer): Promise<never[]>;
};
export {};
//# sourceMappingURL=zip.service.d.ts.map