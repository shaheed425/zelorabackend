const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cloudinary = require('../config/cloudinary');
const env = require('../config/env');

async function downloadAndStoreImage(imageUrl, folderName = 'products', filenamePrefix = 'item') {
  if (!imageUrl || typeof imageUrl !== 'string') return null;

  try {
    const isCloudinaryConfigured = !!(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);

    // If Cloudinary is configured, upload directly from URL
    if (isCloudinaryConfigured) {
      try {
        const uploadResult = await cloudinary.uploader.upload(imageUrl, {
          folder: `zelora/${folderName}`,
        });
        return {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
        };
      } catch (err) {
        console.warn(`Cloudinary upload failed for ${imageUrl}, falling back to local storage: ${err.message}`);
      }
    }

    // Fallback to local storage in public/uploads/
    const targetDir = path.join(__dirname, '../../public/uploads', folderName);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const extMatch = imageUrl.match(/\.(jpg|jpeg|png|webp|svg)/i);
    const ext = extMatch ? extMatch[0].toLowerCase() : '.jpg';
    
    // Sanitize filename prefix
    const cleanPrefix = filenamePrefix.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    const fileName = `${cleanPrefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}${ext}`;
    const filePath = path.join(targetDir, fileName);

    const response = await axios({
      url: imageUrl,
      method: 'GET',
      responseType: 'stream',
      timeout: 10000,
    });

    return new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      writer.on('finish', () => {
        const publicRelativeUrl = `/uploads/${folderName}/${fileName}`;
        resolve({
          url: publicRelativeUrl,
          publicId: fileName,
        });
      });

      writer.on('error', (err) => {
        fs.unlink(filePath, () => {});
        reject(err);
      });
    });

  } catch (error) {
    console.error(`Failed to download image from ${imageUrl}: ${error.message}`);
    // If download failed, return the original URL rather than breaking
    return {
      url: imageUrl,
      publicId: '',
    };
  }
}

module.exports = {
  downloadAndStoreImage,
};
