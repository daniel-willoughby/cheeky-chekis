export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Render the selected crop region to a canvas and return a JPEG blob.
export async function getCroppedBlob(src: string, crop: PixelCrop): Promise<Blob> {
  const image = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no 2d context');
  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('crop failed'))),
      'image/jpeg',
      0.9,
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
