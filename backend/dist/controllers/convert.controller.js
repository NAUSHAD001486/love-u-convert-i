"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertFile = void 0;
const convert_service_1 = require("../services/convert.service");
const response_1 = require("../utils/response");
const convertFile = async (req, res) => {
    const requestId = req.id || 'unknown';
    try {
        const result = await convert_service_1.convertService.convert(req);
        // Return the result directly (it already has status field)
        return res.status(200).json(result);
    }
    catch (error) {
        console.error(`[${requestId}] Conversion error:`, error);
        const err = error;
        return (0, response_1.errorResponse)(res, err, 500);
    }
};
exports.convertFile = convertFile;
//# sourceMappingURL=convert.controller.js.map