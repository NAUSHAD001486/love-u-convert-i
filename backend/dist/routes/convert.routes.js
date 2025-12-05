"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const convert_controller_1 = require("../controllers/convert.controller");
const ssrfGuard_1 = require("../middlewares/ssrfGuard");
const uploadStream_1 = require("../middlewares/uploadStream");
const quotaAndRateRedis_1 = require("../middlewares/quotaAndRateRedis");
const router = (0, express_1.Router)();
router.post('/', quotaAndRateRedis_1.quotaAndRateRedis, ssrfGuard_1.ssrfGuard, uploadStream_1.uploadStream, convert_controller_1.convertFile);
exports.default = router;
//# sourceMappingURL=convert.routes.js.map