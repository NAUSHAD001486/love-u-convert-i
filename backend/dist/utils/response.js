"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.successResponse = successResponse;
exports.errorResponse = errorResponse;
function successResponse(res, data, statusCode = 200) {
    return res.status(statusCode).json({
        success: true,
        data,
    });
}
function errorResponse(res, error, statusCode = 500) {
    return res.status(statusCode).json({
        success: false,
        error: {
            message: error.message,
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
        },
    });
}
//# sourceMappingURL=response.js.map