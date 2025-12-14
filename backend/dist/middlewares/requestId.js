"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestId = void 0;
const uuid_1 = require("uuid");
const requestId = (req, res, next) => {
    req.id = req.headers['x-request-id'] || (0, uuid_1.v4)();
    res.setHeader('X-Request-Id', req.id);
    next();
};
exports.requestId = requestId;
//# sourceMappingURL=requestId.js.map