
/**
 * Converts a File object to a Base64 string.
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Compresses and resizes an image file if it exceeds dimensions.
 * Returns Base64 string.
 */
export const compressImage = async (file: File, maxWidth = 1280): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
       const img = new Image();
       img.src = event.target?.result as string;
       img.onload = () => {
         const canvas = document.createElement('canvas');
         let width = img.width;
         let height = img.height;

         // Calculate new dimensions
         if (width > maxWidth || height > maxWidth) {
            if (width > height) {
               height = Math.round((height * maxWidth) / width);
               width = maxWidth;
            } else {
               width = Math.round((width * maxWidth) / height);
               height = maxWidth;
            }
         }

         canvas.width = width;
         canvas.height = height;
         const ctx = canvas.getContext('2d');
         if (!ctx) {
             reject(new Error('Canvas context not available'));
             return;
         }
         
         // High quality scaling
         ctx.imageSmoothingEnabled = true;
         ctx.imageSmoothingQuality = 'high';
         ctx.drawImage(img, 0, 0, width, height);
         
         // Compress to JPEG 0.9
         resolve(canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.9));
       };
       img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

export const getMimeType = (file: File): string => {
  return file.type || 'image/jpeg';
};

/**
 * Loads an image from a source URL
 */
export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
};

/**
 * Crops an image based on offset and zoom.
 * Matches CSS "Object-Fit: Contain" logic.
 */
export const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }, 
  transform: { x: number; y: number; scale: number },
  containerSize: number,
  outputSize: number = 800
): Promise<string> => {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  // Fill white background to prevent transparency in output
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, outputSize, outputSize);

  // Calculate scale relative to the rendered container
  const scaleFactor = outputSize / containerSize;

  // 1. Move origin to Center of Canvas
  ctx.translate(outputSize / 2, outputSize / 2);
  
  // 2. Apply User Pan & Zoom
  ctx.translate(transform.x * scaleFactor, transform.y * scaleFactor);
  ctx.scale(transform.scale, transform.scale);

  // 3. Draw Image Logic: "Contain" the image within the square outputSize
  const naturalRatio = image.naturalWidth / image.naturalHeight;
  let drawWidth, drawHeight;

  if (naturalRatio > 1) {
     // Wide image: Fits width, height is scaled
     drawWidth = outputSize;
     drawHeight = outputSize / naturalRatio;
  } else {
     // Tall/Square image: Fits height, width is scaled
     drawHeight = outputSize;
     drawWidth = outputSize * naturalRatio;
  }

  // Draw centered (relative to the transformed origin)
  ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

  return canvas.toDataURL('image/jpeg', 0.95);
};

/**
 * Main function to process the AI generated hat.
 * Automatically detects if the background is Green or something else (fallback).
 */
export const processHatAsset = async (base64Image: string): Promise<string> => {
  const image = await loadImage(base64Image);
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  if (!ctx) return base64Image;

  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Sample top-left pixel to guess background color
  const r0 = imageData.data[0];
  const g0 = imageData.data[1];
  const b0 = imageData.data[2];

  // Check if it looks like Green Screen (High Green, Low R/B)
  const isGreenScreen = g0 > 150 && r0 < 100 && b0 < 100;

  if (isGreenScreen) {
    return removeGreenBackgroundData(canvas, ctx, imageData);
  } else {
    // Fallback: The AI failed to generate green screen.
    // We assume the top-left color IS the background and remove it.
    return removeSolidColorData(canvas, ctx, imageData, r0, g0, b0);
  }
};

/**
 * Optimized Green Screen Removal with White Protection
 */
const removeGreenBackgroundData = (
  canvas: HTMLCanvasElement, 
  ctx: CanvasRenderingContext2D, 
  imageData: ImageData
): string => {
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Green Dominance: How much stronger is Green vs Max(R, B)?
    const greenDominance = g - Math.max(r, b);
    
    // White Protection (Relaxed Threshold)
    const isBrightOrWhite = r > 70 && b > 70;

    if (greenDominance > 45 && !isBrightOrWhite) {
      data[i + 3] = 0; // Remove
    } else {
      data[i + 3] = 255; // Force Opaque

      // Despill: Neutralize green tint on white fur
      if (greenDominance > 0) {
         data[i + 1] = Math.max(r, b);
      }
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
};

/**
 * Generic Background Removal (Fallback)
 */
const removeSolidColorData = (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  imageData: ImageData,
  bgR: number,
  bgG: number,
  bgB: number
): string => {
  const data = imageData.data;
  const threshold = 40; // Tolerance distance

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const dist = Math.sqrt(
      (r - bgR) ** 2 + 
      (g - bgG) ** 2 + 
      (b - bgB) ** 2
    );

    if (dist < threshold) {
      data[i + 3] = 0;
    } else {
      data[i + 3] = 255; 
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
};

/**
 * Composes the final image with TWO editable layers: Background Photo + Hat
 */
export const composeFinalLayeredImage = async (
  rawBgSrc: string,
  hatSrc: string,
  bgTransform: { x: number; y: number; scale: number },
  hatTransform: { x: number; y: number; scale: number; rotation: number },
  canvasSize: number = 800
): Promise<string> => {
  const bg = await loadImage(rawBgSrc);
  const hat = await loadImage(hatSrc);
  
  const canvas = document.createElement('canvas');
  canvas.width = canvasSize;
  canvas.height = canvasSize; // Strict square
  const ctx = canvas.getContext('2d');
  if(!ctx) return '';

  // 1. Draw Background Layer (Simulate 'Contain' + User Transform)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvasSize, canvasSize);
  
  ctx.save();
  
  // Center origin
  ctx.translate(canvasSize / 2, canvasSize / 2);
  
  // Apply Background Transform (x/y are normalized percentages, so multiply by canvasSize)
  ctx.translate(bgTransform.x * canvasSize, bgTransform.y * canvasSize);
  ctx.scale(bgTransform.scale, bgTransform.scale);
  
  // Draw BG logic: Contain
  const naturalRatio = bg.naturalWidth / bg.naturalHeight;
  let drawWidth, drawHeight;
  if (naturalRatio > 1) {
     drawWidth = canvasSize;
     drawHeight = canvasSize / naturalRatio;
  } else {
     drawHeight = canvasSize;
     drawWidth = canvasSize * naturalRatio;
  }
  ctx.drawImage(bg, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  ctx.restore();

  // 2. Draw Hat Layer
  ctx.save();
  
  const cx = hatTransform.x * canvasSize;
  const cy = hatTransform.y * canvasSize;
  
  ctx.translate(cx, cy);
  ctx.rotate((hatTransform.rotation * Math.PI) / 180);
  ctx.scale(hatTransform.scale, hatTransform.scale);
  
  // Base hat size relative to canvas
  const baseHatSize = canvasSize / 2; 
  const hatH = (hat.height / hat.width) * baseHatSize;
  
  // Shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 5;

  ctx.drawImage(hat, -baseHatSize / 2, -hatH / 2, baseHatSize, hatH);
  
  ctx.restore();

  return canvas.toDataURL('image/png');
};
