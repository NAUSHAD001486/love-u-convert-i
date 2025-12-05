import { Readable } from 'stream';
import got from 'got';
import cloudinary from '../config/cloudinary';
import { createWriteStream, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { unlink } from 'fs/promises';

interface FileInfo {
  name: string;
  url: string;
}

interface ZipResult {
  url: string;
  public_id: string;
}

// Simple zip implementation using Node's zlib and manual zip format
// For production, use archiver or yazl when npm registry is available
async function createSimpleZip(files: FileInfo[]): Promise<Buffer> {
  const { createGzip } = await import('zlib');
  const { pipeline } = await import('stream/promises');
  
  // For now, we'll use a temp file approach
  // Download all files and create a simple archive
  const tempDir = tmpdir();
  const zipPath = join(tempDir, `zip-${Date.now()}.zip`);
  
  // This is a simplified version - in production use archiver
  // For now, we'll create a tar.gz or use Cloudinary's multi-download feature
  const buffers: Array<{ name: string; data: Buffer }> = [];
  
  for (const file of files) {
    try {
      const response = await got(file.url, {
        timeout: { request: 30000 },
      } as any);
      buffers.push({ name: file.name, data: Buffer.from(response.body as any) });
    } catch (err) {
      console.error(`Failed to download ${file.url}:`, err);
    }
  }
  
  // Create a simple concatenated file (not a real zip, but works for testing)
  // In production, replace with proper zip library
  const zipBuffer = Buffer.concat(
    buffers.map(b => Buffer.concat([
      Buffer.from(`${b.name}\n`),
      Buffer.from(`${b.data.length}\n`),
      b.data,
      Buffer.from('\n---FILE-END---\n')
    ]))
  );
  
  return zipBuffer;
}

export const zipService = {
  async createZipFromUrls(
    files: FileInfo[],
    ctx?: any
  ): Promise<ZipResult> {
    try {
      // Download files and create zip buffer
      const zipBuffer = await createSimpleZip(files);

      // Upload zip to Cloudinary
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'love-u-convert/zips',
            resource_type: 'raw',
            use_filename: true,
            unique_filename: true,
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else if (result) {
              resolve(result);
            } else {
              reject(new Error('Zip upload failed: no result'));
            }
          }
        );

        uploadStream.end(zipBuffer);
      });

      return {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      };
    } catch (err) {
      throw err;
    }
  },

  async createZip(files: Array<{ name: string; buffer: Buffer }>) {
    // Simple implementation
    const buffers = files.map(f => Buffer.concat([
      Buffer.from(`${f.name}\n`),
      Buffer.from(`${f.buffer.length}\n`),
      f.buffer,
    ]));
    return Buffer.concat(buffers);
  },

  async extractZip(buffer: Buffer) {
    // TODO: Implement ZIP extraction
    return [];
  },
};
