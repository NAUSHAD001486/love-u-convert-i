"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ssrfGuard = void 0;
const response_1 = require("../utils/response");
const ip_1 = require("../utils/ip");
const ssrfGuard = (req, res, next) => {
    // TODO: Implement SSRF protection
    const url = req.body?.url || req.query?.url;
    if (url && !(0, ip_1.isAllowedUrl)(url)) {
        return (0, response_1.errorResponse)(res, new Error('URL not allowed'), 403);
    }
    next();
};
exports.ssrfGuard = ssrfGuard;
//# sourceMappingURL=ssrfGuard.js.map