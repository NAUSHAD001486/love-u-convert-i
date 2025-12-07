import cloudinary from '../config/cloudinary';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

interface UploadResult {
  public_id: string;
  secure_url: string;
  bytes: number;
  format: string;
  userFacingFormat?: string; // For jpeg → jpg mapping (for frontend filename only)
}

// Format mapping: normalize user input to Cloudinary format
const FORMAT_MAP: Record<string, string> = {
  jpeg: 'jpg',
  jpg: 'jpg',
  png: 'png',
  webp: 'webp',
  gif: 'gif',
  ico: 'ico',
  psd: 'psd',
  eps: 'eps',
  svg: 'svg',
  tga: 'tga',
  tiff: 'tiff',
  bmp: 'bmp',
};

const SUPPORTED_FORMATS = new Set(Object.keys(FORMAT_MAP));

export const cloudinaryService = {
  async uploadAndConvertStream(
    stream: Readable,
    filename: string,
    targetFormat: string,
    ctx?: any
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      // Normalize target format (jpeg → jpg for Cloudinary, but keep user-facing format)
      const targetFormatLower = targetFormat.toLowerCase();
      
      // Check if target format is supported
      if (!SUPPORTED_FORMATS.has(targetFormatLower)) {
        reject(new Error(`Unsupported target format: ${targetFormat}. Supported formats: ${Array.from(SUPPORTED_FORMATS).join(', ')}`));
        return;
      }
      
      const normalizedFormat = FORMAT_MAP[targetFormatLower];
      const userFacingFormat = targetFormatLower; // Keep original for filename
      
      // Accept ANY image/* input - no strict validation on input format
      // Only validate target format
      const ext = filename.split('.').pop()?.toLowerCase() || '';
      const isImage = true; // Accept any file, let Cloudinary handle it
      
      // Generate simple public_id WITHOUT extension - let Cloudinary handle it
      const baseName = filename.replace(/\.[^/.]+$/, '') || 'file';
      const cleanName = baseName
        .replace(/[^a-zA-Z0-9_-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'file';
      const uniqueId = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const publicIdBase = `love-u-convert/${cleanName}_${uniqueId}`;
      
      const options: any = {
        folder: 'love-u-convert',
        public_id: publicIdBase, // No extension - Cloudinary will add based on format
        resource_type: 'image', // Always use image resource type
      };

      // Apply format conversion
      if (normalizedFormat) {
        options.format = normalizedFormat; // Use normalized format for Cloudinary
        
        // Special handling for ICO format (256×256, stable)
        if (normalizedFormat === 'ico') {
          options.transformation = [
            {
              format: normalizedFormat,
              width: 256,
              height: 256,
              crop: 'pad',
              background: 'white',
            },
          ];
        }
        // Special handling for SVG format (sharper vectorization, less blur, closer to raster)
        // SVG must NOT get global transforms (quality, width, height)
        else if (normalizedFormat === 'svg') {
          options.transformation = [
            {
              format: normalizedFormat,
              effect: 'vectorize',
              colors: 256, // Maximum colors for better color fidelity (was 128)
              detail: 5.0, // Maximum detail for sharper output, closer to raster (was 3.0)
              threshold: 0.1, // Lower threshold to preserve more detail (was 0.3)
              despeckle: 0, // Disable despeckle to avoid blur
              corners: 40, // Smooth corners for better quality
            },
          ];
        }
        // Special handling for PSD (graceful error handling will be in convert.service)
        else if (normalizedFormat === 'psd') {
          options.transformation = [
            {
              format: normalizedFormat,
              quality: 'auto:good',
              fetch_format: normalizedFormat,
            },
          ];
        }
        // Global transformation rules for all other formats
        else {
          options.transformation = [
            {
              format: normalizedFormat, // Use normalized format
              quality: 'auto:good', // Auto quality optimization (good balance)
              fetch_format: normalizedFormat, // Ensure output format matches target
              crop: 'limit', // Maintain aspect ratio, only resize if larger
              width: 3000,
              height: 3000,
            },
          ];
        }
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            // Use Cloudinary's public_id EXACTLY as returned - no manipulation
            resolve({
              public_id: result.public_id, // Use exactly as Cloudinary returns it
              secure_url: result.secure_url, // Use exactly as Cloudinary returns it
              bytes: result.bytes || 0,
              format: result.format || normalizedFormat || ext,
              userFacingFormat: userFacingFormat, // Return user-facing format (jpeg stays jpeg) for frontend filename only
            });
          } else {
            reject(new Error('Upload failed: no result'));
          }
        }
      );

      stream.pipe(uploadStream);
    });
  },

  async upload(buffer: Buffer, options?: any) {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }).end(buffer);
    });
  },

  async download(url: string) {
    return { url };
  },
};
