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
      
      const result = await cloudinaryService.uploadAndConvertStream(
        file.stream as any,
        file.filename,
        targetFormat,
        { requestId }
      );

      return {
        status: 'success',
        mode: 'single',
        downloadUrl: result.secure_url,
        meta: {
          originalName: file.filename,
          convertedName: result.public_id,
          convertedSizeBytes: result.bytes,
        },
      };
    }

    // Multiple files - convert all and create zip
    console.log(`[${requestId}] Converting ${files.length} files to ${targetFormat}`);
    
    const convertedFiles: Array<{ name: string; url: string }> = [];

    for (const file of files) {
      try {
        const result = await cloudinaryService.uploadAndConvertStream(
          file.stream as any,
          file.filename,
          targetFormat,
          { requestId }
        );

        // Determine file extension for converted file
        const extension = result.format || targetFormat;
        const convertedName = `${file.filename.replace(/\.[^/.]+$/, '')}.${extension}`;

        convertedFiles.push({
          name: convertedName,
          url: result.secure_url,
        });
      } catch (error) {
        console.error(`[${requestId}] Failed to convert ${file.filename}:`, error);
        // Continue with other files
      }
    }

    if (convertedFiles.length === 0) {
      throw new Error('Failed to convert any files');
    }

    // Create zip from converted files
    console.log(`[${requestId}] Creating zip from ${convertedFiles.length} converted files`);
    const zipResult = await zipService.createZipFromUrls(convertedFiles, { requestId });

    return {
      status: 'success',
      mode: 'multi',
      zipUrl: zipResult.url,
      meta: {
        totalFiles: convertedFiles.length,
      },
    };
  },
};
