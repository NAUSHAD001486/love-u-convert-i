import { Request, Response, NextFunction } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getRedisClient } from '../config/redis';
import { errorResponse } from '../utils/response';
import { getClientIp } from '../utils/ip';
import { getDateYYYYMMDD } from '../utils/time';
import got from 'got';

// Load Lua script
function loadLuaScript(): string {
  // Try multiple paths for development and production
  const paths = [
    join(__dirname, '../scripts/redis-lua/quota_and_tokens.lua'),
    join(__dirname, '../../src/scripts/redis-lua/quota_and_tokens.lua'),
    join(process.cwd(), 'src/scripts/redis-lua/quota_and_tokens.lua'),
    join(process.cwd(), 'backend/src/scripts/redis-lua/quota_and_tokens.lua'),
  ];

  for (const path of paths) {
    try {
      return readFileSync(path, 'utf-8');
    } catch (error) {
      // Try next path
    }
  }

  throw new Error('Failed to load Lua script from any path');
}

const luaScript = loadLuaScript();

interface QuotaMetadata {
  tokensAfter: number;
  newQuota: number;
}

declare global {
  namespace Express {
    interface Request {
      quotaMetadata?: QuotaMetadata;
    }
  }
}

async function getRequestBytes(req: Request): Promise<number> {
  // Check for file uploads
  const files = (req as any).files;
  if (files && Array.isArray(files) && files.length > 0) {
    return files.reduce((sum: number, file: any) => {
      return sum + (file.size || 0);
    }, 0);
  }

  // Check for single file
  const file = (req as any).file;
  if (file && file.size) {
    return file.size;
  }

  // Check for URLs (image-from-url endpoint)
  const urls = req.body?.urls;
  if (urls && Array.isArray(urls) && urls.length > 0) {
    let totalBytes = 0;
    for (const url of urls) {
      try {
        const response = await got.head(url, {
          timeout: { request: 5000 },
          retry: { limit: 0 } as any,
        });
        const contentLength = response.headers['content-length'];
        if (contentLength) {
          totalBytes += parseInt(contentLength, 10) || 0;
        }
      } catch (error) {
        // If HEAD fails, assume 0 bytes
        console.warn(`Failed to get content-length for ${url}:`, error);
      }
    }
    return totalBytes;
  }

  return 0;
}

function getRequestedFiles(req: Request): number {
  const files = (req as any).files;
  if (files && Array.isArray(files)) {
    return files.length;
  }

  const file = (req as any).file;
  if (file) {
    return 1;
  }

  const urls = req.body?.urls;
  if (urls && Array.isArray(urls)) {
    return urls.length;
  }

  return 1; // Default to 1 file
}

export const quotaAndRateRedis = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const client = getRedisClient();
    const ip = getClientIp(req);
    const date = getDateYYYYMMDD();

    // Compute keys
    const tokensKey = `tokens:${date}:${ip}`;
    const quotaKey = `quota:${date}:${ip}`;

    // Get request parameters
    const requestedFiles = getRequestedFiles(req);
    const requestBytes = await getRequestBytes(req);

    // Token bucket parameters
    const capacity = 5;
    const refillRate = 5 / 1000; // 5 tokens per 1000ms = 0.005 tokens/ms
    // Use integer math: refillPerMs as micro-tokens per ms (multiply by 1000000 for precision)
    const refillPerMs = refillRate; // Keep as decimal, Lua will handle it

    // Daily quota
    const dailyBytesLimit = parseInt(
      process.env.DAILY_BYTES_LIMIT || '1610612736',
      10
    );

    // TTL: 24 hours + 1 hour buffer = 25 hours
    const quotaTtlSeconds = 25 * 60 * 60;

    // Current time in milliseconds
    const nowMillis = Date.now();

    // Call Lua script
    const result = await client.eval(
      luaScript,
      2,
      tokensKey,
      quotaKey,
      nowMillis.toString(),
      requestedFiles.toString(),
      requestBytes.toString(),
      capacity.toString(),
      refillPerMs.toString(),
      dailyBytesLimit.toString(),
      quotaTtlSeconds.toString()
    );

    // Parse result (Lua script returns JSON string)
    const parsed = JSON.parse(result as string);
    const [status, ...args] = parsed;

    if (status === 'RATE_LIMIT_EXCEEDED') {
      const remainingTokens = args[0];
      const retryAfterMs = Math.ceil((requestedFiles - remainingTokens) / refillRate);
      
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_PER_SECOND',
          message: 'Max 5 files/sec exceeded',
          retryAfterMs,
        },
      });
    }

    if (status === 'DAILY_LIMIT_EXCEEDED') {
      const newQuota = args[0];
      
      return res.status(429).json({
        success: false,
        error: {
          code: 'DAILY_LIMIT_REACHED',
          message: 'Daily 1.5GB limit reached',
          quota: newQuota,
        },
      });
    }

    if (status === 'OK') {
      const tokensAfter = args[0];
      const newQuota = args[1];

      // Attach metadata to request
      req.quotaMetadata = {
        tokensAfter,
        newQuota,
      };

      return next();
    }

    // Unknown status
    throw new Error(`Unknown status from Lua script: ${status}`);
  } catch (error) {
    console.error('Quota and rate limit error:', error);
    return errorResponse(res, error as Error, 500);
  }
};

