/**
 * Image compression utilities for reducing file sizes before upload
 */

const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;
const COMPRESSION_QUALITY = 0.85; // 85% quality for good balance

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Compresses an image file while maintaining aspect ratio
 */
export async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onerror = () => reject(new Error('Failed to load image'));
      
      img.onload = () => {
        try {
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;
          
          if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            if (width > height) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            } else {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }
          
          // Create canvas and draw compressed image
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          // Use better image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Draw image
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert canvas to blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }
              
              // Create new file from blob
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              
              resolve(compressedFile);
            },
            'image/jpeg',
            COMPRESSION_QUALITY
          );
        } catch (error) {
          reject(error);
        }
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses an image and returns detailed compression information
 */
export async function compressImageWithStats(file: File): Promise<CompressionResult> {
  const originalSize = file.size;
  const compressedFile = await compressImage(file);
  const compressedSize = compressedFile.size;
  
  return {
    file: compressedFile,
    originalSize,
    compressedSize,
    compressionRatio: originalSize > 0 ? (1 - compressedSize / originalSize) : 0,
  };
}

/**
 * Format bytes for display
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
