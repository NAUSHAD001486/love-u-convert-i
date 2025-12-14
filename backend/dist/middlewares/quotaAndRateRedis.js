"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.quotaAndRateRedis = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const redis_1 = require("../config/redis");
const response_1 = require("../utils/response");
const ip_1 = require("../utils/ip");
const time_1 = require("../utils/time");
const got_1 = __importDefault(require("got"));
// Load Lua script
function loadLuaScript() {
    // Try multiple paths for development and production
    const paths = [
        (0, path_1.join)(__dirname, '../scripts/redis-lua/quota_and_tokens.lua'),
        (0, path_1.join)(__dirname, '../../src/scripts/redis-lua/quota_and_tokens.lua'),
        (0, path_1.join)(process.cwd(), 'src/scripts/redis-lua/quota_and_tokens.lua'),
        (0, path_1.join)(process.cwd(), 'backend/src/scripts/redis-lua/quota_and_tokens.lua'),
    ];
    for (const path of paths) {
        try {
            return (0, fs_1.readFileSync)(path, 'utf-8');
        }
        catch (error) {
            // Try next path
        }
    }
    throw new Error('Failed to load Lua script from any path');
}
const luaScript = loadLuaScript();
async function getRequestBytes(req) {
    // Check for file uploads
    const files = req.files;
    if (files && Array.isArray(files) && files.length > 0) {
        return files.reduce((sum, file) => {
            return sum + (file.size || 0);
        }, 0);
    }
    // Check for single file
    const file = req.file;
    if (file && file.size) {
        return file.size;
    }
    // Check for URLs (image-from-url endpoint)
    const urls = req.body?.urls;
    if (urls && Array.isArray(urls) && urls.length > 0) {
        let totalBytes = 0;
        for (const url of urls) {
            try {
                const response = await got_1.default.head(url, {
                    timeout: { request: 5000 },
                    retry: { limit: 0 },
                });
                const contentLength = response.headers['content-length'];
                if (contentLength) {
                    totalBytes += parseInt(contentLength, 10) || 0;
                }
            }
            catch (error) {
                // If HEAD fails, assume 0 bytes
                console.warn(`Failed to get content-length for ${url}:`, error);
            }
        }
        return totalBytes;
    }
    return 0;
}
function getRequestedFiles(req) {
    const files = req.files;
    if (files && Array.isArray(files)) {
        return files.length;
    }
    const file = req.file;
    if (file) {
        return 1;
    }
    const urls = req.body?.urls;
    if (urls && Array.isArray(urls)) {
        return urls.length;
    }
    return 1; // Default to 1 file
}
const quotaAndRateRedis = async (req, res, next) => {
    try {
        const client = (0, redis_1.getRedisClient)();
        const ip = (0, ip_1.getClientIp)(req);
        const date = (0, time_1.getDateYYYYMMDD)();
        // Compute keys
        const tokensKey = `tokens:${date}:${ip}`;
        const quotaKey = `quota:${date}:${ip}`;
        // Get request parameters
        const requestedFiles = getRequestedFiles(req);
        const requestBytes = await getRequestBytes(req);
        // Token bucket parameters
        const capacity = 5;
        const refillRate = 5 / 1000; // 5 tokens per 1000ms = 0.005 tokens/ms
        // Use integer math: refillPerMs as micro-tokens per ms (multiply by 1000000 for precision)
        const refillPerMs = refillRate; // Keep as decimal, Lua will handle it
        // Daily quota
        const dailyBytesLimit = parseInt(process.env.DAILY_BYTES_LIMIT || '1610612736', 10);
        // TTL: 24 hours + 1 hour buffer = 25 hours
        const quotaTtlSeconds = 25 * 60 * 60;
        // Current time in milliseconds
        const nowMillis = Date.now();
        // Call Lua script
        const result = await client.eval(luaScript, 2, tokensKey, quotaKey, nowMillis.toString(), requestedFiles.toString(), requestBytes.toString(), capacity.toString(), refillPerMs.toString(), dailyBytesLimit.toString(), quotaTtlSeconds.toString());
        // Parse result (Lua script returns JSON string)
        const parsed = JSON.parse(result);
        const [status, ...args] = parsed;
        if (status === 'RATE_LIMIT_EXCEEDED') {
            const remainingTokens = args[0];
            const retryAfterMs = Math.ceil((requestedFiles - remainingTokens) / refillRate);
            return res.status(429).json({
                success: false,
                error: {
                    code: 'RATE_LIMIT_PER_SECOND',
                    message: 'Max 5 files/sec exceeded',
                    retryAfterMs,
                },
            });
        }
        if (status === 'DAILY_LIMIT_EXCEEDED') {
            const newQuota = args[0];
            // Calculate limit in GB for error message
            const limitGB = (dailyBytesLimit / (1024 * 1024 * 1024)).toFixed(1);
            return res.status(429).json({
                success: false,
                error: {
                    code: 'DAILY_LIMIT_REACHED',
                    message: `Daily ${limitGB}GB limit reached`,
                    quota: newQuota,
                },
            });
        }
        if (status === 'OK') {
            const tokensAfter = args[0];
            const newQuota = args[1];
            // Attach metadata to request
            req.quotaMetadata = {
                tokensAfter,
                newQuota,
            };
            return next();
        }
        // Unknown status
        throw new Error(`Unknown status from Lua script: ${status}`);
    }
    catch (error) {
        console.error('Quota and rate limit error:', error);
        return (0, response_1.errorResponse)(res, error, 500);
    }
};
exports.quotaAndRateRedis = quotaAndRateRedis;
//# sourceMappingURL=quotaAndRateRedis.js.map