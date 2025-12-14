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
            // Check file size before uploading to Cloudinary (10MB limit on free tier)
            const CLOUDINARY_MAX_SIZE = 10 * 1024 * 1024; // 10MB
            if (file.size > CLOUDINARY_MAX_SIZE) {
                // Special message for PSD files
                if (targetFormat.toLowerCase() === 'psd') {
                    throw new Error(`PSD file "${file.filename}" is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Cloudinary free tier limit is 10MB per file. Please use a smaller PSD file or upgrade your Cloudinary plan.`);
                }
                throw new Error(`File "${file.filename}" is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Cloudinary free tier limit is 10MB per file.`);
            }
            const result = await cloudinary_service_1.cloudinaryService.uploadAndConvertStream(file.stream, file.filename, targetFormat, { requestId, mimeType: file.mimeType });
            // Get user-facing format (jpeg stays jpeg, not jpg)
            const outputFormat = result.userFacingFormat || result.format || targetFormat;
            // Generate clean download filename
            const getCleanFilename = (originalName, format) => {
                // Extract base name from original filename
                let baseName = originalName;
                // Remove directory path if present
                if (baseName.includes('/')) {
                    baseName = baseName.split('/').pop() || baseName;
                }
                if (baseName.includes('\\')) {
                    baseName = baseName.split('\\').pop() || baseName;
                }
                // Remove extension
                const lastDot = baseName.lastIndexOf('.');
                if (lastDot > 0) {
                    baseName = baseName.substring(0, lastDot);
                }
                // Clean up weird characters and normalize
                // Keep alphanumerics, dash, underscore
                baseName = baseName
                    .replace(/[^a-zA-Z0-9_-]/g, '-') // Replace special chars with dash
                    .replace(/-+/g, '-') // Replace multiple dashes with single
                    .replace(/^-|-$/g, ''); // Remove leading/trailing dashes
                // Use fallback if name is empty or too weird
                if (!baseName || baseName.length < 1 || baseName.toLowerCase().includes('no content')) {
                    baseName = 'converted-image';
                }
                // Ensure extension is appended correctly
                return `${baseName}.${format}`;
            };
            const downloadName = getCleanFilename(file.filename, outputFormat);
            return {
                status: 'success',
                mode: 'single',
                downloadUrl: result.secure_url,
                meta: {
                    originalName: file.filename,
                    convertedName: result.public_id,
                    convertedSizeBytes: result.bytes,
                    targetFormat: targetFormat, // Original request format
                    outputFormat: outputFormat, // User-facing format
                    downloadName: downloadName, // Clean filename for download
                },
            };
        }
        // Multiple files - convert all and create zip
        console.log(`[${requestId}] Converting ${files.length} files to ${targetFormat}`);
        const fileResults = [];
        const successfulPublicIds = [];
        for (const file of files) {
            const fileResult = {
                originalName: file.filename,
                success: false,
            };
            try {
                // Check file size before uploading
                const CLOUDINARY_MAX_SIZE = 10 * 1024 * 1024; // 10MB
                if (file.size > CLOUDINARY_MAX_SIZE) {
                    fileResult.errorCode = 'FILE_TOO_LARGE';
                    fileResult.errorMessage = `File is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Cloudinary free tier limit is 10MB per file.`;
                    fileResults.push(fileResult);
                    continue; // Continue with other files
                }
                const result = await cloudinary_service_1.cloudinaryService.uploadAndConvertStream(file.stream, file.filename, targetFormat, { requestId, mimeType: file.mimeType });
                // Success
                fileResult.success = true;
                fileResult.publicId = result.public_id;
                fileResult.url = result.secure_url;
                successfulPublicIds.push(result.public_id);
            }
            catch (error) {
                console.error(`[${requestId}] Failed to convert ${file.filename}:`, error);
                // Determine error code and message
                if (error?.message?.includes('File size too large') || error?.message?.includes('10485760') || error?.message?.includes('Maximum is')) {
                    fileResult.errorCode = 'FILE_TOO_LARGE';
                    fileResult.errorMessage = error.message || 'File too large for Cloudinary free tier';
                }
                else if (error?.message?.includes('Unsupported')) {
                    fileResult.errorCode = 'UNSUPPORTED_FORMAT';
                    fileResult.errorMessage = error.message || 'Unsupported format';
                }
                else {
                    fileResult.errorCode = 'CONVERSION_FAILED';
                    fileResult.errorMessage = error.message || 'Conversion failed';
                }
                // Continue with other files - do NOT stop multi-file flow
            }
            fileResults.push(fileResult);
        }
        // If all files failed, throw error
        if (successfulPublicIds.length === 0) {
            const failedDetails = fileResults.filter(r => !r.success).map(r => ({
                file: r.originalName,
                error: r.errorMessage,
            }));
            throw new Error(`Failed to convert any files. Details: ${JSON.stringify(failedDetails)}`);
        }
        // Extract failed files details
        const failedFiles = fileResults.filter(r => !r.success).map(r => r.originalName);
        const failedDetails = fileResults.filter(r => !r.success).map(r => ({
            file: r.originalName,
            errorCode: r.errorCode,
            errorMessage: r.errorMessage,
        }));
        // Create zip from successful conversions only
        const publicIds = successfulPublicIds;
        // Create zip from converted files using Cloudinary archive API
        console.log(`[${requestId}] Creating zip from ${publicIds.length} converted files using Cloudinary archive API`);
        const zipResult = await zip_service_1.zipService.createZipFromPublicIds(publicIds, { requestId });
        return {
            status: 'success',
            mode: 'multi',
            zipUrl: zipResult.url,
            meta: {
                totalFiles: files.length,
                convertedFiles: successfulPublicIds.length,
                failedFiles: failedFiles.length,
                failedDetails: failedDetails,
            },
        };
    },
};
//# sourceMappingURL=convert.service.js.map