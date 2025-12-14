"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = void 0;
const healthCheck = async (req, res) => {
    return res.json({ status: 'ok', time: new Date().toISOString() });
};
exports.healthCheck = healthCheck;
//# sourceMappingURL=health.controller.js.map