"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const response_1 = require("../utils/response");
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    return (0, response_1.errorResponse)(res, err, 500);
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map