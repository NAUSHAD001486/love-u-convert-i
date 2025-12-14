"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.speedLimiterRedis = void 0;
const redis_1 = require("../config/redis");
const response_1 = require("../utils/response");
const ip_1 = require("../utils/ip");
const speedLimiterRedis = async (req, res, next) => {
    try {
        // TODO: Implement Redis-based rate limiting
        // This will use the quota_and_tokens.lua script
        const client = await (0, redis_1.getRedisClient)();
        const ip = (0, ip_1.getClientIp)(req);
        const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
        const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10', 10);
        // Placeholder: will be replaced with Lua script call
        next();
    }
    catch (error) {
        return (0, response_1.errorResponse)(res, error, 500);
    }
};
exports.speedLimiterRedis = speedLimiterRedis;
//# sourceMappingURL=speedLimiterRedis.js.map