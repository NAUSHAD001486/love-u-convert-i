"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadStream = void 0;
const busboy_1 = __importDefault(require("busboy"));
const env_1 = require("../config/env");
const stream_1 = require("stream");
const uploadStream = (req, res, next) => {
    // Check if request is multipart
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
        return next();
    }
    const MAX_FILE_SIZE_BYTES = parseInt((0, env_1.getEnv)('MAX_FILE_SIZE_BYTES', '104857600'), 10);
    const files = [];
    let hasTooLargeFile = false;
    const requestId = req.id || 'unknown';
    const bb = (0, busboy_1.default)({
        headers: req.headers,
    });
    bb.on('file', (fieldname, file, info) => {
        const { filename, encoding, mimeType } = info;
        let bytesReceived = 0;
        let tooLarge = false;
        const chunks = [];
        file.on('data', (chunk) => {
            if (tooLarge) {
                return; // Ignore further data
            }
            bytesReceived += chunk.length;
            if (bytesReceived > MAX_FILE_SIZE_BYTES) {
                tooLarge = true;
                hasTooLargeFile = true;
                file.resume(); // Drain the stream
                file._tooLarge = true;
                console.warn(`[${requestId}] File ${filename} exceeded size limit: ${bytesReceived} > ${MAX_FILE_SIZE_BYTES}`);
                return;
            }
            // Only collect chunks up to the limit
            chunks.push(chunk);
        });
        file.on('end', () => {
            const size = bytesReceived;
            const stream = stream_1.Readable.from(chunks.length > 0 ? Buffer.concat(chunks) : Buffer.alloc(0));
            files.push({
                fieldname,
                filename: filename || 'unknown',
                mimeType: mimeType || 'application/octet-stream',
                stream,
                size,
                tooLarge: tooLarge || false,
            });
        });
        file.on('error', (err) => {
            console.error(`[${requestId}] File stream error for ${filename}:`, err);
        });
    });
    bb.on('field', (name, value) => {
        if (!req.body) {
            req.body = {};
        }
        req.body[name] = value;
    });
    bb.on('finish', () => {
        if (hasTooLargeFile) {
            console.error(`[${requestId}] Request rejected: one or more files exceeded size limit`);
            return res.status(413).json({
                status: 'error',
                code: 'FILE_TOO_LARGE',
                message: 'One or more files exceeded the maximum allowed size.',
            });
        }
        // Attach files to request
        req.files = files;
        next();
    });
    bb.on('error', (err) => {
        console.error(`[${requestId}] Busboy error:`, err);
        return res.status(400).json({
            status: 'error',
            code: 'PARSE_ERROR',
            message: 'Failed to parse multipart form data.',
        });
    });
    req.pipe(bb);
};
exports.uploadStream = uploadStream;
//# sourceMappingURL=uploadStream.js.map