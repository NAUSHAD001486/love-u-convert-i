import { Request } from 'express';
import { cloudinaryService } from './cloudinary.service';
import { zipService } from './zip.service';

interface FileInfo {
  fieldname: string;
  filename: string;
  mimeType: string;
  stream: NodeJS.ReadableStream;
  size: number;
  tooLarge: boolean;
}

export const convertService = {
  async convert(req: Request) {
    const files = (req as any).files as FileInfo[];
    const targetFormat = (req.body?.targetFormat as string) || 'png';
    const requestId = (req as any).id || 'unknown';

    if (!files || files.length === 0) {
      throw new Error('No files provided');
    }

    // Single file conversion
    if (files.length === 1) {
      const file = files[0];
      
      console.log(`[${requestId}] Converting single file: ${file.filename} to ${targetFormat}`);
      
      // Check file size before uploading to Cloudinary (10MB limit on free tier)
      const CLOUDINARY_MAX_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > CLOUDINARY_MAX_SIZE) {
        // Special message for PSD files
        if (targetFormat.toLowerCase() === 'psd') {
          throw new Error(`PSD file "${file.filename}" is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Cloudinary free tier limit is 10MB per file. Please use a smaller PSD file or upgrade your Cloudinary plan.`);
        }
        throw new Error(`File "${file.filename}" is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Cloudinary free tier limit is 10MB per file.`);
      }
      
      const result = await cloudinaryService.uploadAndConvertStream(
        file.stream as any,
        file.filename,
        targetFormat,
        { requestId }
      );

      // Get user-facing format (jpeg stays jpeg, not jpg)
      const outputFormat = result.userFacingFormat || result.format || targetFormat;

      return {
        status: 'success',
        mode: 'single',
        downloadUrl: result.secure_url,
        meta: {
          originalName: file.filename,
          convertedName: result.public_id,
          convertedSizeBytes: result.bytes,
          outputFormat: outputFormat, // Include format for frontend filename
        },
      };
    }

    // Multiple files - convert all and create zip
    console.log(`[${requestId}] Converting ${files.length} files to ${targetFormat}`);
    
    const convertedResults: Array<{ public_id: string; secure_url: string }> = [];

    for (const file of files) {
      try {
        const result = await cloudinaryService.uploadAndConvertStream(
          file.stream as any,
          file.filename,
          targetFormat,
          { requestId }
        );

        convertedResults.push({
          public_id: result.public_id,
          secure_url: result.secure_url,
        });
      } catch (error: any) {
        console.error(`[${requestId}] Failed to convert ${file.filename}:`, error);
        
        // Check if it's a Cloudinary file size limit error
        if (error?.message?.includes('File size too large') || error?.message?.includes('10485760') || error?.message?.includes('Maximum is')) {
          // Special message for PSD files
          if (targetFormat.toLowerCase() === 'psd') {
            throw new Error(`PSD file "${file.filename}" is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Cloudinary free tier limit is 10MB per file. Please use a smaller PSD file or upgrade your Cloudinary plan.`);
          }
          throw new Error(`File "${file.filename}" is too large for Cloudinary free tier (max 10MB). File size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
        }
        
        // Continue with other files for other errors
      }
    }

    if (convertedResults.length === 0) {
      throw new Error('Failed to convert any files');
    }

    // Extract public_ids for archive API
    const publicIds = convertedResults.map(r => r.public_id);

    // Create zip from converted files using Cloudinary archive API
    console.log(`[${requestId}] Creating zip from ${publicIds.length} converted files using Cloudinary archive API`);
    const zipResult = await zipService.createZipFromPublicIds(publicIds, { requestId });

    return {
      status: 'success',
      mode: 'multi',
      zipUrl: zipResult.url,
      meta: {
        totalFiles: convertedResults.length,
      },
    };
  },
};
