import { Request, Response, NextFunction } from 'express';
import busboy from 'busboy';
import { getEnv } from '../config/env';
import { Readable } from 'stream';

interface FileInfo {
  fieldname: string;
  filename: string;
  mimeType: string;
  stream: Readable;
  size: number;
  tooLarge: boolean;
}

export const uploadStream = (req: Request, res: Response, next: NextFunction) => {
  // Check if request is multipart
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    return next();
  }

  const MAX_FILE_SIZE_BYTES = parseInt(getEnv('MAX_FILE_SIZE_BYTES', '104857600'), 10);
  const files: FileInfo[] = [];
  let hasTooLargeFile = false;
  const requestId = (req as any).id || 'unknown';

  const bb = busboy({
    headers: req.headers,
  });

  bb.on('file', (fieldname, file, info) => {
    const { filename, encoding, mimeType } = info;
    let bytesReceived = 0;
    let tooLarge = false;
    const chunks: Buffer[] = [];

    file.on('data', (chunk: Buffer) => {
      if (tooLarge) {
        return; // Ignore further data
      }

      bytesReceived += chunk.length;

      if (bytesReceived > MAX_FILE_SIZE_BYTES) {
        tooLarge = true;
        hasTooLargeFile = true;
        file.resume(); // Drain the stream
        (file as any)._tooLarge = true;
        console.warn(`[${requestId}] File ${filename} exceeded size limit: ${bytesReceived} > ${MAX_FILE_SIZE_BYTES}`);
        return;
      }

      // Only collect chunks up to the limit
      chunks.push(chunk);
    });

    file.on('end', () => {
      const size = bytesReceived;
      const stream = Readable.from(chunks.length > 0 ? Buffer.concat(chunks) : Buffer.alloc(0));

      files.push({
        fieldname,
        filename: filename || 'unknown',
        mimeType: mimeType || 'application/octet-stream',
        stream,
        size,
        tooLarge: tooLarge || false,
      });
    });

    file.on('error', (err) => {
      console.error(`[${requestId}] File stream error for ${filename}:`, err);
    });
  });

  bb.on('field', (name, value) => {
    if (!(req as any).body) {
      (req as any).body = {};
    }
    (req as any).body[name] = value;
  });

  bb.on('finish', () => {
    if (hasTooLargeFile) {
      console.error(`[${requestId}] Request rejected: one or more files exceeded size limit`);
      return res.status(413).json({
        status: 'error',
        code: 'FILE_TOO_LARGE',
        message: 'One or more files exceeded the maximum allowed size.',
      });
    }

    // Attach files to request
    (req as any).files = files;
    next();
  });

  bb.on('error', (err) => {
    console.error(`[${requestId}] Busboy error:`, err);
    return res.status(400).json({
      status: 'error',
      code: 'PARSE_ERROR',
      message: 'Failed to parse multipart form data.',
    });
  });

  req.pipe(bb);
};
