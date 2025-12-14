"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.zipService = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
exports.zipService = {
    async createZipFromPublicIds(publicIds, ctx) {
        const requestId = ctx?.requestId || `zip-${Date.now()}`;
        console.log(`[${requestId}] Creating zip via Cloudinary archive API for ${publicIds.length} files`);
        const ts = Date.now();
        const random = Math.random().toString(36).slice(2, 8);
        const targetId = `love-u-convert/zips/file_${ts}_${random}`;
        const downloadUrl = cloudinary_1.default.utils.download_archive_url({
            resource_type: 'image',
            type: 'upload',
            public_ids: publicIds,
            target_public_id: targetId,
            flatten_folders: true,
            zip_file_name: 'love-u-convert.zip',
        });
        console.log(`[${requestId}] Generated archive download URL: ${downloadUrl}`);
        return { url: downloadUrl };
    },
    async createZip(files) {
        // Simple implementation
        const buffers = files.map(f => Buffer.concat([
            Buffer.from(`${f.name}\n`),
            Buffer.from(`${f.buffer.length}\n`),
            f.buffer,
        ]));
        return Buffer.concat(buffers);
    },
    async extractZip(buffer) {
        // TODO: Implement ZIP extraction
        return [];
    },
};
//# sourceMappingURL=zip.service.js.map