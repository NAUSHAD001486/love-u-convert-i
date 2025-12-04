import { Router } from 'express';
import { convertFile } from '../controllers/convert.controller';
import { ssrfGuard } from '../middlewares/ssrfGuard';
import { uploadStream } from '../middlewares/uploadStream';
import { quotaAndRateRedis } from '../middlewares/quotaAndRateRedis';

const router = Router();

router.post(
  '/',
  quotaAndRateRedis,
  ssrfGuard,
  uploadStream,
  convertFile
);

export default router;

