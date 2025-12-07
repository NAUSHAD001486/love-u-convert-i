import cloudinary from '../config/cloudinary';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

interface UploadResult {
  public_id: string;
  secure_url: string;
  bytes: number;
  format: string;
}

export const cloudinaryService = {
  async uploadAndConvertStream(
    stream: Readable,
    filename: string,
    targetFormat: string,
    ctx?: any
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      // Determine resource type based on file extension
      const ext = filename.split('.').pop()?.toLowerCase() || '';
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
      
      const options: any = {
        folder: 'love-u-convert',
        use_filename: true,
        unique_filename: true,
        resource_type: isImage ? 'image' : 'auto',
      };

      // Only apply format conversion for images
      if (isImage && targetFormat) {
        options.format = targetFormat; // format takes priority
        
        // Special handling for ICO format
        if (targetFormat === 'ico') {
          options.transformation = [
            {
              format: targetFormat,
              width: 256,
              height: 256,
              crop: 'pad',
              background: 'white',
            },
          ];
        }
        // Special handling for SVG format
        else if (targetFormat === 'svg') {
          options.transformation = [
            {
              format: targetFormat,
              effect: 'vectorize',
              colors: 16,
            },
          ];
        }
        // Global transformation rules for all other formats
        else {
          options.transformation = [
            {
              format: targetFormat, // format takes priority
              quality: 'auto:good', // Auto quality optimization (good balance)
              fetch_format: targetFormat, // Ensure output format matches target
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
              format: result.format || targetFormat || ext,
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
