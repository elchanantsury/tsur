function readFileAsBase64(file: File | Blob, mediaType: string): Promise<{ blob: Blob; base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve({
        blob: file,
        base64: result.split(',')[1] || '',
        mediaType,
      });
    };
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.readAsDataURL(file);
  });
}

export async function compressImage(
  file: File,
  maxWidth = 1200,
  quality = 0.82
): Promise<{ blob: Blob; base64: string; mediaType: string }> {
  const mediaType = 'image/jpeg';

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxWidth / bitmap.width);
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Failed to compress image'))),
        mediaType,
        quality
      );
    });

    return readFileAsBase64(blob, mediaType);
  } catch {
    return readFileAsBase64(file, file.type || mediaType);
  }
}

export function getStoragePathFromUrl(url: string): string | null {
  const marker = '/storage/v1/object/public/receipts/';
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}
