import cloudinary from '../config/cloudinary';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

interface UploadResult {
  public_id: string;
  secure_url: string;
  bytes: number;
  format: string;
  userFacingFormat?: string; // For jpeg → jpg mapping
  userFacingPublicId?: string; // Public ID with user-facing extension for ZIP
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
      
      // Generate public_id with user-facing extension for JPEG
      // Note: Cloudinary will use the format from options.format, but we'll override public_id extension after upload
      const options: any = {
        folder: 'love-u-convert',
        use_filename: true,
        unique_filename: true,
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
        // Special handling for SVG format (sharper vectorization, less blur)
        // SVG must NOT get global transforms (quality, width, height)
        else if (normalizedFormat === 'svg') {
          options.transformation = [
            {
              format: normalizedFormat,
              effect: 'vectorize',
              colors: 128, // Increased to 128 for sharper vectorization
              detail: 3.0, // Higher detail for sharper output
              threshold: 0.3, // Threshold for vectorization
              despeckle: 0, // Disable despeckle to avoid blur
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
        async (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            // For JPEG, rename public_id to have .jpeg extension instead of .jpg
            let finalPublicId = result.public_id;
            
            if (userFacingFormat === 'jpeg' && normalizedFormat === 'jpg') {
              // Determine user-facing extension
              const userFacingExt = '.jpeg';
              
              // Remove existing extension and add user-facing extension
              const publicIdWithoutExt = finalPublicId.replace(/\.[^/.]+$/, '');
              const desiredPublicId = `${publicIdWithoutExt}${userFacingExt}`;
              
              // Rename the resource in Cloudinary to have .jpeg extension
              try {
                const renameResult = await cloudinary.uploader.rename(
                  result.public_id,
                  desiredPublicId,
                  { resource_type: 'image' }
                );
                finalPublicId = renameResult.public_id;
              } catch (renameError: any) {
                // If rename fails, log but continue with original public_id
                console.warn(`[${ctx?.requestId || 'unknown'}] Failed to rename ${result.public_id} to ${desiredPublicId}:`, renameError);
                // Use desired public_id anyway for ZIP (Cloudinary might still serve it)
                finalPublicId = desiredPublicId;
              }
            } else {
              // For other formats, ensure extension matches user-facing format
              const userFacingExt = `.${userFacingFormat}`;
              if (!finalPublicId.endsWith(userFacingExt)) {
                const publicIdWithoutExt = finalPublicId.replace(/\.[^/.]+$/, '');
                finalPublicId = `${publicIdWithoutExt}${userFacingExt}`;
              }
            }
            
            resolve({
              public_id: finalPublicId, // Use renamed public_id with correct extension
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
