"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTodayKey = getTodayKey;
exports.getDateYYYYMMDD = getDateYYYYMMDD;
exports.getTimestamp = getTimestamp;
exports.getExpirySeconds = getExpirySeconds;
function getTodayKey() {
    const now = new Date();
    return `day:${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
function getDateYYYYMMDD() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}
function getTimestamp() {
    return Date.now();
}
function getExpirySeconds(ttl) {
    return Math.floor(ttl / 1000);
}
//# sourceMappingURL=time.js.map