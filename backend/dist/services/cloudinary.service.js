"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinaryService = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
exports.cloudinaryService = {
    async uploadAndConvertStream(stream, filename, targetFormat, ctx) {
        return new Promise((resolve, reject) => {
            // Determine resource type based on file extension
            const ext = filename.split('.').pop()?.toLowerCase() || '';
            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
            const options = {
                folder: 'love-u-convert',
                use_filename: true,
                unique_filename: true,
                resource_type: isImage ? 'image' : 'auto',
            };
            // Only apply format conversion for images
            if (isImage && targetFormat) {
                options.format = targetFormat;
                options.transformation = [
                    {
                        format: targetFormat,
                    },
                ];
            }
            const uploadStream = cloudinary_1.default.uploader.upload_stream(options, (error, result) => {
                if (error) {
                    reject(error);
                }
                else if (result) {
                    resolve({
                        public_id: result.public_id,
                        secure_url: result.secure_url,
                        bytes: result.bytes || 0,
                        format: result.format || targetFormat || ext,
                    });
                }
                else {
                    reject(new Error('Upload failed: no result'));
                }
            });
            stream.pipe(uploadStream);
        });
    },
    async upload(buffer, options) {
        return new Promise((resolve, reject) => {
            cloudinary_1.default.uploader.upload_stream(options, (error, result) => {
                if (error)
                    reject(error);
                else
                    resolve(result);
            }).end(buffer);
        });
    },
    async download(url) {
        return { url };
    },
};
//# sourceMappingURL=cloudinary.service.js.map