const fs = require('fs-extra');
const path = require('path');
const cloudinary = require('cloudinary').v2;

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const CERTIFICATES_DIR = path.join(UPLOADS_DIR, 'certificates');
const TEMPLATES_DIR = path.join(UPLOADS_DIR, 'templates');
const BATCHES_DIR = path.join(UPLOADS_DIR, 'batches');

// Ensure local directories exist as fallback
try {
  fs.ensureDirSync(UPLOADS_DIR);
  fs.ensureDirSync(CERTIFICATES_DIR);
  fs.ensureDirSync(TEMPLATES_DIR);
  fs.ensureDirSync(BATCHES_DIR);
} catch (e) {
  // Ignored in read-only serverless environments
}

// Cloudinary Configuration
const getCloudinaryConfig = () => {
  const cloud_name = process.env.CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUD_API_KEY || process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUD_API_SECRET || process.env.CLOUDINARY_API_SECRET;

  if (cloud_name && api_key && api_secret) {
    return { cloud_name, api_key, api_secret };
  }
  return null;
};

const isCloudinaryConfigured = () => {
  const config = getCloudinaryConfig();
  if (config) {
    cloudinary.config({
      cloud_name: config.cloud_name,
      api_key: config.api_key,
      api_secret: config.api_secret,
      secure: true
    });
    return true;
  }
  return false;
};

/**
 * Uploads a Buffer directly to Cloudinary
 */
const uploadBufferToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    uploadStream.end(buffer);
  });
};

/**
 * Save certificate PDF file buffer (Cloudinary or local)
 */
const saveCertificatePdf = async (filename, pdfBuffer) => {
  if (isCloudinaryConfigured()) {
    const cleanPublicId = filename.replace(/\.[^/.]+$/, '');
    const result = await uploadBufferToCloudinary(pdfBuffer, {
      folder: 'certify/certificates',
      resource_type: 'raw',
      public_id: `${cleanPublicId}-${Date.now()}`
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      isCloudinary: true
    };
  }

  // Local storage fallback
  const filePath = path.join(CERTIFICATES_DIR, filename);
  await fs.writeFile(filePath, pdfBuffer);
  return {
    filePath,
    url: `/uploads/certificates/${filename}`,
    publicId: null,
    isCloudinary: false
  };
};

/**
 * Delete certificate PDF file (from Cloudinary or local)
 */
const deleteCertificatePdf = async (publicId, url) => {
  try {
    if (publicId && isCloudinaryConfigured()) {
      // PDF uploaded as raw resource in Cloudinary
      let res = await cloudinary.uploader.destroy(publicId, { resource_type: 'raw', invalidate: true });
      if (res.result !== 'ok') {
        // Attempt image resource type fallback
        res = await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
      }
      return { success: true, result: res };
    }

    if (url && (url.startsWith('/uploads/') || url.includes('/uploads/'))) {
      const relativePath = url.includes('/uploads/') ? url.substring(url.indexOf('/uploads/')) : url;
      const filePath = path.join(__dirname, '..', relativePath);
      if (await fs.pathExists(filePath)) {
        await fs.unlink(filePath);
      }
      return { success: true };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting certificate PDF:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Save template image file buffer (Cloudinary or local)
 */
const saveTemplateImage = async (filename, imageBuffer) => {
  if (isCloudinaryConfigured()) {
    const cleanPublicId = filename.replace(/\.[^/.]+$/, '');
    const result = await uploadBufferToCloudinary(imageBuffer, {
      folder: 'certify/templates',
      resource_type: 'image',
      public_id: `${cleanPublicId}-${Date.now()}`
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      isCloudinary: true
    };
  }

  // Local storage fallback
  const filePath = path.join(TEMPLATES_DIR, filename);
  await fs.writeFile(filePath, imageBuffer);
  return {
    filePath,
    url: `/uploads/templates/${filename}`,
    publicId: null,
    isCloudinary: false
  };
};

/**
 * Delete template image file (from Cloudinary or local)
 */
const deleteTemplateImage = async (publicId, url) => {
  try {
    if (publicId && isCloudinaryConfigured()) {
      const res = await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
      return { success: true, result: res };
    }

    if (url && (url.startsWith('/uploads/') || url.includes('/uploads/'))) {
      const relativePath = url.includes('/uploads/') ? url.substring(url.indexOf('/uploads/')) : url;
      const filePath = path.join(__dirname, '..', relativePath);
      if (await fs.pathExists(filePath)) {
        await fs.unlink(filePath);
      }
      return { success: true };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting template image:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  UPLOADS_DIR,
  CERTIFICATES_DIR,
  TEMPLATES_DIR,
  BATCHES_DIR,
  isCloudinaryConfigured,
  saveCertificatePdf,
  deleteCertificatePdf,
  saveTemplateImage,
  deleteTemplateImage
};
