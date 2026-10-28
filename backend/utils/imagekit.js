import ImageKit from 'imagekit';
import dotenv from 'dotenv';

let imagekitInstance = null;
let currentPrivateKey = null;

export function getImageKit() {
  dotenv.config();
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY?.trim();
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY?.trim();
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT?.trim();

  if (publicKey && privateKey && urlEndpoint) {
    if (!imagekitInstance || currentPrivateKey !== privateKey) {
      currentPrivateKey = privateKey;
      imagekitInstance = new ImageKit({
        publicKey,
        privateKey,
        urlEndpoint
      });
    }
  }
  return imagekitInstance;
}

export function isImageKitConfigured() {
  dotenv.config();
  return Boolean(
    process.env.IMAGEKIT_PUBLIC_KEY &&
    process.env.IMAGEKIT_PRIVATE_KEY &&
    process.env.IMAGEKIT_URL_ENDPOINT
  );
}

/**
 * Upload an image (base64 string or binary buffer) to ImageKit.io
 * @param {string|Buffer} file - Base64 string or buffer
 * @param {string} fileName - File name with extension
 * @param {object} options - Optional folder, tags, customMetadata
 * @returns {Promise<object>} Upload metadata (url, fileId, name, size, etc.)
 */
export async function uploadToImageKit(file, fileName, options = {}) {
  const ik = getImageKit();
  if (!ik) {
    throw new Error('ImageKit is not configured. Please set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT in your environment.');
  }

  const { folder = '/murugan_canvass/visits', tags = [] } = options;

  const cleanFileName = (fileName || `visit_photo_${Date.now()}.jpg`)
    .replace(/[^a-zA-Z0-9._-]/g, '_');

  const uploadResponse = await ik.upload({
    file, // Can be base64 string, URL, or buffer
    fileName: cleanFileName,
    folder,
    tags: Array.isArray(tags) ? tags : [tags],
    useUniqueFileName: true
  });

  return {
    fileId: uploadResponse.fileId,
    name: uploadResponse.name,
    url: uploadResponse.url,
    thumbnailUrl: uploadResponse.thumbnailUrl || uploadResponse.url,
    size: uploadResponse.size,
    height: uploadResponse.height,
    width: uploadResponse.width,
    fileType: uploadResponse.fileType,
    uploadedAt: new Date().toISOString()
  };
}

/**
 * Delete a file from ImageKit.io by fileId
 * @param {string} fileId
 */
export async function deleteFromImageKit(fileId) {
  if (!fileId) return;
  const ik = getImageKit();
  if (!ik) return;

  try {
    await ik.deleteFile(fileId);
  } catch (err) {
    console.warn(`[ImageKit] Warning: Failed to delete fileId ${fileId}:`, err.message);
  }
}
