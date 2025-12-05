"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadEnv = loadEnv;
exports.getEnv = getEnv;
function loadEnv() {
    const required = [
        'CLOUDINARY_CLOUD_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET',
    ];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0 && process.env.NODE_ENV !== 'development') {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}
function getEnv(key, defaultValue) {
    const value = process.env[key];
    if (value === undefined) {
        if (defaultValue !== undefined) {
            return defaultValue;
        }
        throw new Error(`Environment variable ${key} is not set`);
    }
    return value;
}
//# sourceMappingURL=env.js.map