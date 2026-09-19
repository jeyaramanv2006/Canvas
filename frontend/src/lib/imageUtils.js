/**
 * Compresses an image file using an offscreen HTML5 canvas.
 * Reduces raw 5MB-15MB mobile camera photos down to ~150KB-300KB
 * with crisp quality before sending to the server.
 */
export function compressImage(file, maxWidth = 1280, maxHeight = 1280, quality = 0.8) {
  return new Promise((resolve) => {
    // If not an image, resolve with standard FileReader Data URL
    if (!file || !file.type || !file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const img = new window.Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        try {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch {
          // Fallback to original if canvas fails
          resolve(uploadEvent.target.result);
        }
      };

      img.onerror = () => {
        resolve(uploadEvent.target.result);
      };

      img.src = uploadEvent.target.result;
    };

    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}
