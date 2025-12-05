// backend/test_cloudinary.js
// Load .env
require('dotenv').config();

const cloudinary = require('cloudinary').v2;
const path = require('path');

console.log('Using CLOUDINARY env:', {
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? 'SET' : 'MISSING',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? 'SET' : 'MISSING'
});

// configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// file to upload
const filePath = path.resolve('/tmp/test-cloud.txt');

cloudinary.uploader.upload(
  filePath,
  {
    folder: 'love-u-convert/test',
    use_filename: true,
    unique_filename: false,
    resource_type: 'auto'
  },
  function (error, result) {
    if (error) {
      console.error('Upload error:', error);
      process.exit(1);
    } else {
      console.log('Upload OK:', {
        public_id: result.public_id,
        secure_url: result.secure_url,
        bytes: result.bytes
      });
      process.exit(0);
    }
  }
);
