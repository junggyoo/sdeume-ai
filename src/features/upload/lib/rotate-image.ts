/**
 * Rotate an image by 90-degree increments using Canvas
 *
 * @param file - The image file to rotate
 * @param degrees - Rotation angle: 90 (clockwise), -90 (counter-clockwise), or 180
 * @returns A new File with the rotated image
 */
export async function rotateImage90(
  file: File,
  degrees: 90 | -90 | 180
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('이미지 회전에 실패했습니다: Canvas context unavailable'));
        return;
      }

      const { width, height } = img;

      // Set canvas dimensions based on rotation
      if (degrees === 90 || degrees === -90) {
        // 90° rotations swap width and height
        canvas.width = height;
        canvas.height = width;
      } else {
        // 180° rotation keeps same dimensions
        canvas.width = width;
        canvas.height = height;
      }

      // Apply transformation based on rotation angle
      switch (degrees) {
        case 90:
          // Rotate 90° clockwise
          ctx.translate(height, 0);
          ctx.rotate(Math.PI / 2);
          break;
        case -90:
          // Rotate 90° counter-clockwise
          ctx.translate(0, width);
          ctx.rotate(-Math.PI / 2);
          break;
        case 180:
          // Rotate 180°
          ctx.translate(width, height);
          ctx.rotate(Math.PI);
          break;
      }

      // Draw the image with the applied transformation
      ctx.drawImage(img, 0, 0);

      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('이미지 회전에 실패했습니다: Blob creation failed'));
            return;
          }

          // Create new file with same name and type
          const rotatedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });

          resolve(rotatedFile);
        },
        file.type,
        0.95
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('이미지 로드에 실패했습니다'));
    };

    img.src = url;
  });
}
