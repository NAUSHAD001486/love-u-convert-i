import cloudinary from '../config/cloudinary';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

interface UploadResult {
  public_id: string;
  secure_url: string;
  bytes: number;
  format: string;
  userFacingFormat?: string; // For jpeg → jpg mapping
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
      const normalizedFormat = FORMAT_MAP[targetFormat.toLowerCase()] || targetFormat.toLowerCase();
      const userFacingFormat = targetFormat.toLowerCase(); // Keep original for filename
      
      // Determine resource type based on file extension
      const ext = filename.split('.').pop()?.toLowerCase() || '';
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'psd', 'eps', 'tga', 'tiff'].includes(ext);
      
      const options: any = {
        folder: 'love-u-convert',
        use_filename: true,
        unique_filename: true,
        resource_type: isImage ? 'image' : 'auto',
      };

      // Only apply format conversion for images
      if (isImage && normalizedFormat) {
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
        // Special handling for SVG format (sharper vectorization)
        else if (normalizedFormat === 'svg') {
          options.transformation = [
            {
              format: normalizedFormat,
              effect: 'vectorize',
              colors: 32, // Increased from 16 for sharper vectorization
              corner_radius: 'max', // Smoother curves
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
            resolve({
              public_id: result.public_id,
              secure_url: result.secure_url,
              bytes: result.bytes || 0,
              format: result.format || normalizedFormat || ext,
              userFacingFormat: userFacingFormat, // Return user-facing format (jpeg stays jpeg)
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
