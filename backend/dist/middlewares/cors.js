"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cors = void 0;
const cors_1 = __importDefault(require("cors"));
exports.cors = (0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
});
//# sourceMappingURL=cors.js.map