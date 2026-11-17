export interface CompressedImageResult {
  dataUrl: string;
  width: number;
  height: number;
  approxBytes: number;
}

const MAX_DATA_URL_CHARS = 280000;

export async function compressImageToDataUrl(
  file: File,
  maxDimension = 1200
): Promise<CompressedImageResult> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose a valid image file (JPG, PNG, or WebP).');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Unable to read the selected image file.'));
      el.src = objectUrl;
    });

    let targetWidth = img.naturalWidth || img.width;
    let targetHeight = img.naturalHeight || img.height;

    if (targetWidth > maxDimension || targetHeight > maxDimension) {
      if (targetWidth >= targetHeight) {
        targetHeight = Math.round((targetHeight / targetWidth) * maxDimension);
        targetWidth = maxDimension;
      } else {
        targetWidth = Math.round((targetWidth / targetHeight) * maxDimension);
        targetHeight = maxDimension;
      }
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Browser canvas context is unavailable.');
    }

    // Try progressive quality/scale steps until safely under Firestore's field limit
    let scale = 1;
    let bestDataUrl = '';
    let finalWidth = targetWidth;
    let finalHeight = targetHeight;

    for (let pass = 0; pass < 4; pass++) {
      finalWidth = Math.max(320, Math.round(targetWidth * scale));
      finalHeight = Math.max(240, Math.round(targetHeight * scale));
      canvas.width = finalWidth;
      canvas.height = finalHeight;
      ctx.fillStyle = '#121722';
      ctx.fillRect(0, 0, finalWidth, finalHeight);
      ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

      for (const quality of [0.84, 0.72, 0.6, 0.48]) {
        const candidate = canvas.toDataURL('image/jpeg', quality);
        bestDataUrl = candidate;
        if (candidate.length <= MAX_DATA_URL_CHARS) {
          return {
            dataUrl: candidate,
            width: finalWidth,
            height: finalHeight,
            approxBytes: Math.round((candidate.length * 3) / 4),
          };
        }
      }
      scale *= 0.78;
    }

    if (bestDataUrl.length > MAX_DATA_URL_CHARS) {
      throw new Error('Image is still too large after compression. Please choose a smaller image.');
    }

    return {
      dataUrl: bestDataUrl,
      width: finalWidth,
      height: finalHeight,
      approxBytes: Math.round((bestDataUrl.length * 3) / 4),
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
