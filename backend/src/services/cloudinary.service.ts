import cloudinary from '../config/cloudinary';

export const cloudinaryService = {
  async upload(buffer: Buffer, options?: any) {
    // TODO: Implement Cloudinary upload
    return new Promise((resolve) => {
      cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error) throw error;
        resolve(result);
      }).end(buffer);
    });
  },

  async download(url: string) {
    // TODO: Implement Cloudinary download
    return { url };
  },
};

