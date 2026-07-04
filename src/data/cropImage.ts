export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Render the selected region of a displayed <img> to a canvas and return a
// JPEG blob. The crop is in the image's *displayed* pixels, so we scale up to
// the natural resolution before drawing.
export async function getCroppedBlob(image: HTMLImageElement, crop: PixelCrop): Promise<Blob> {
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(crop.width * scaleX));
  canvas.height = Math.max(1, Math.floor(crop.height * scaleY));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no 2d context');
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('crop failed'))),
      'image/jpeg',
      0.9,
    );
  });
}
