"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.zipService = void 0;
const got_1 = __importDefault(require("got"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const os_1 = require("os");
const path_1 = require("path");
// Simple zip implementation using Node's zlib and manual zip format
// For production, use archiver or yazl when npm registry is available
async function createSimpleZip(files) {
    const { createGzip } = await Promise.resolve().then(() => __importStar(require('zlib')));
    const { pipeline } = await Promise.resolve().then(() => __importStar(require('stream/promises')));
    // For now, we'll use a temp file approach
    // Download all files and create a simple archive
    const tempDir = (0, os_1.tmpdir)();
    const zipPath = (0, path_1.join)(tempDir, `zip-${Date.now()}.zip`);
    // This is a simplified version - in production use archiver
    // For now, we'll create a tar.gz or use Cloudinary's multi-download feature
    const buffers = [];
    for (const file of files) {
        try {
            const response = await (0, got_1.default)(file.url, {
                timeout: { request: 30000 },
            });
            buffers.push({ name: file.name, data: Buffer.from(response.body) });
        }
        catch (err) {
            console.error(`Failed to download ${file.url}:`, err);
        }
    }
    // Create a simple concatenated file (not a real zip, but works for testing)
    // In production, replace with proper zip library
    const zipBuffer = Buffer.concat(buffers.map(b => Buffer.concat([
        Buffer.from(`${b.name}\n`),
        Buffer.from(`${b.data.length}\n`),
        b.data,
        Buffer.from('\n---FILE-END---\n')
    ])));
    return zipBuffer;
}
exports.zipService = {
    async createZipFromUrls(files, ctx) {
        try {
            // Download files and create zip buffer
            const zipBuffer = await createSimpleZip(files);
            // Upload zip to Cloudinary
            const uploadResult = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary_1.default.uploader.upload_stream({
                    folder: 'love-u-convert/zips',
                    resource_type: 'raw',
                    use_filename: true,
                    unique_filename: true,
                }, (error, result) => {
                    if (error) {
                        reject(error);
                    }
                    else if (result) {
                        resolve(result);
                    }
                    else {
                        reject(new Error('Zip upload failed: no result'));
                    }
                });
                uploadStream.end(zipBuffer);
            });
            return {
                url: uploadResult.secure_url,
                public_id: uploadResult.public_id,
            };
        }
        catch (err) {
            throw err;
        }
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