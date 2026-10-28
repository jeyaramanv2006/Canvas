import { uploadToImageKit, isImageKitConfigured } from '../utils/imagekit.js';

export async function uploadImage(req, res) {
  try {
    const { image, fileName, schoolName, visitId } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image data (base64 string or URL) is required' });
    }

    const cleanSchoolName = (schoolName || 'general').replace(/[^a-zA-Z0-9_-]/g, '_');
    const folder = `/murugan_canvass/visits/${cleanSchoolName}`;
    const tags = ['visit', cleanSchoolName];
    if (visitId) tags.push(`visit_${visitId}`);

    // If ImageKit is configured, attempt upload to ImageKit cloud
    if (isImageKitConfigured()) {
      try {
        const uploadResult = await uploadToImageKit(image, fileName, { folder, tags });
        console.log('🚀 [ImageKit] Successfully uploaded to cloud:', uploadResult.url);
        return res.json({
          success: true,
          storage: 'imagekit',
          attachment: {
            id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            fileId: uploadResult.fileId,
            name: uploadResult.name,
            url: uploadResult.url,
            thumbnailUrl: uploadResult.thumbnailUrl,
            size: uploadResult.size,
            width: uploadResult.width,
            height: uploadResult.height,
            type: 'image/jpeg',
            uploadedAt: uploadResult.uploadedAt
          }
        });
      } catch (ikError) {
        console.warn('⚠️ [ImageKit] Upload attempt encountered error, activating seamless fallback:', ikError.message);
      }
    }

    // Graceful fallback if ImageKit keys are not provided yet:
    // Store compressed payload metadata so functionality does not fail
    const sizeInBytes = Math.round((image.length * 3) / 4);
    return res.json({
      success: true,
      storage: 'local_fallback',
      attachment: {
        id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: fileName || `visit_photo_${Date.now()}.jpg`,
        url: image, // compressed data URL
        size: sizeInBytes,
        type: 'image/jpeg',
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to upload image' 
    });
  }
}
