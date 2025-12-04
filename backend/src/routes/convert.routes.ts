import { Router } from 'express';
import { convertFile } from '../controllers/convert.controller';
import { ssrfGuard } from '../middlewares/ssrfGuard';
import { uploadStream } from '../middlewares/uploadStream';
import { dailyQuotaRedis } from '../middlewares/dailyQuotaRedis';
import { speedLimiterRedis } from '../middlewares/speedLimiterRedis';

const router = Router();

router.post(
  '/',
  speedLimiterRedis,
  dailyQuotaRedis,
  ssrfGuard,
  uploadStream,
  convertFile
);

export default router;

