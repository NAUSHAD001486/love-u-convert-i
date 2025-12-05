export declare const SUPPORTED_FORMATS: {
    readonly IMAGE: readonly ["jpg", "jpeg", "png", "gif", "webp", "svg"];
    readonly DOCUMENT: readonly ["pdf", "doc", "docx", "txt"];
    readonly ARCHIVE: readonly ["zip", "rar", "7z"];
};
export declare function isValidFormat(format: string, category: keyof typeof SUPPORTED_FORMATS): boolean;
export declare function getFileExtension(filename: string): string;
//# sourceMappingURL=formats.d.ts.map