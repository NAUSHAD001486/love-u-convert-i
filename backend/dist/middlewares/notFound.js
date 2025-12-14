"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = void 0;
const response_1 = require("../utils/response");
const notFound = (req, res, next) => {
    return (0, response_1.errorResponse)(res, new Error('Route not found'), 404);
};
exports.notFound = notFound;
//# sourceMappingURL=notFound.js.map