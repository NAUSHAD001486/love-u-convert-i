"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const health_routes_1 = __importDefault(require("./routes/health.routes"));
const convert_routes_1 = __importDefault(require("./routes/convert.routes"));
const requestId_1 = require("./middlewares/requestId");
const cors_1 = require("./middlewares/cors");
const errorHandler_1 = require("./middlewares/errorHandler");
const notFound_1 = require("./middlewares/notFound");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(requestId_1.requestId);
app.use(cors_1.cors);
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Backend running' });
});
app.use('/api/health', health_routes_1.default);
app.use('/api/convert', convert_routes_1.default);
app.use(notFound_1.notFound);
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map