interface FileInfo {
    name: string;
    url: string;
}
interface ZipResult {
    url: string;
    public_id: string;
}
export declare const zipService: {
    createZipFromUrls(files: FileInfo[], ctx?: any): Promise<ZipResult>;
    createZip(files: Array<{
        name: string;
        buffer: Buffer;
    }>): Promise<Buffer<ArrayBuffer>>;
    extractZip(buffer: Buffer): Promise<never[]>;
};
export {};
//# sourceMappingURL=zip.service.d.ts.map