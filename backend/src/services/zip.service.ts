import cloudinary from '../config/cloudinary';

interface ZipResult {
  url: string;
}

export const zipService = {
  async createZipFromPublicIds(
    publicIds: string[],
    ctx?: { requestId?: string }
  ): Promise<ZipResult> {
    const requestId = ctx?.requestId || `zip-${Date.now()}`;
    console.log(`[${requestId}] Creating zip via Cloudinary archive API for ${publicIds.length} files`);

    const ts = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const targetId = `love-u-convert/zips/file_${ts}_${random}`;

    const downloadUrl = cloudinary.utils.download_archive_url({
      resource_type: 'image',
      type: 'upload',
      public_ids: publicIds,
      target_public_id: targetId,
      flatten_folders: true,
      zip_file_name: `love-u-convert_${ts}.zip`,
    });

    console.log(`[${requestId}] Generated archive download URL: ${downloadUrl}`);

    return { url: downloadUrl };
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
