"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertService = void 0;
const cloudinary_service_1 = require("./cloudinary.service");
const zip_service_1 = require("./zip.service");
exports.convertService = {
    async convert(req) {
        const files = req.files;
        const targetFormat = req.body?.targetFormat || 'png';
        const requestId = req.id || 'unknown';
        if (!files || files.length === 0) {
            throw new Error('No files provided');
        }
        // Single file conversion
        if (files.length === 1) {
            const file = files[0];
            console.log(`[${requestId}] Converting single file: ${file.filename} to ${targetFormat}`);
            const result = await cloudinary_service_1.cloudinaryService.uploadAndConvertStream(file.stream, file.filename, targetFormat, { requestId });
            return {
                status: 'success',
                mode: 'single',
                downloadUrl: result.secure_url,
                meta: {
                    originalName: file.filename,
                    convertedName: result.public_id,
                    convertedSizeBytes: result.bytes,
                },
            };
        }
        // Multiple files - convert all and create zip
        console.log(`[${requestId}] Converting ${files.length} files to ${targetFormat}`);
        const convertedFiles = [];
        for (const file of files) {
            try {
                const result = await cloudinary_service_1.cloudinaryService.uploadAndConvertStream(file.stream, file.filename, targetFormat, { requestId });
                // Determine file extension for converted file
                const extension = result.format || targetFormat;
                const convertedName = `${file.filename.replace(/\.[^/.]+$/, '')}.${extension}`;
                convertedFiles.push({
                    name: convertedName,
                    url: result.secure_url,
                });
            }
            catch (error) {
                console.error(`[${requestId}] Failed to convert ${file.filename}:`, error);
                // Continue with other files
            }
        }
        if (convertedFiles.length === 0) {
            throw new Error('Failed to convert any files');
        }
        // Create zip from converted files
        console.log(`[${requestId}] Creating zip from ${convertedFiles.length} converted files`);
        const zipResult = await zip_service_1.zipService.createZipFromUrls(convertedFiles, { requestId });
        return {
            status: 'success',
            mode: 'multi',
            zipUrl: zipResult.url,
            meta: {
                totalFiles: convertedFiles.length,
            },
        };
    },
};
//# sourceMappingURL=convert.service.js.map