/**
 * Logo-specific compression utilities
 * Optimized for crisp edges, transparency support, and high-quality output
 */

// Logo-specific parameters - optimized for web display
const LOGO_MAX_WIDTH = 512;
const LOGO_MAX_HEIGHT = 512;
const LOGO_QUALITY = 0.92; // Higher quality for crisp logo edges
const MAX_INPUT_SIZE_MB = 10; // Accept up to 10MB input
const SUPPORTED_FORMATS = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml', 'image/bmp', 'image/tiff'];

export interface LogoCompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  originalDimensions: { width: number; height: number };
  finalDimensions: { width: number; height: number };
  hasTransparency: boolean;
}

export interface LogoValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a logo file before processing
 */
export function validateLogoFile(file: File): LogoValidationResult {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Please select an image file (PNG, JPG, WebP, GIF, or SVG)' };
  }

  // Check supported formats
  if (!SUPPORTED_FORMATS.includes(file.type.toLowerCase())) {
    return { valid: false, error: `Unsupported format. Please use: PNG, JPG, WebP, GIF, or SVG` };
  }

  // Check file size
  if (file.size > MAX_INPUT_SIZE_MB * 1024 * 1024) {
    return { valid: false, error: `File too large. Maximum size is ${MAX_INPUT_SIZE_MB}MB` };
  }

  return { valid: true };
}

/**
 * Detects if an image has transparency
 */
function detectTransparency(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  try {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Check alpha channel (every 4th byte starting at index 3)
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 255) {
        return true;
      }
    }
    return false;
  } catch {
    // If we can't read image data (CORS), assume no transparency
    return false;
  }
}

/**
 * Compresses a logo file with optimal settings for web display
 * - Preserves transparency (outputs PNG if transparent, JPEG if not)
 * - Maintains crisp edges with high quality compression
 * - Scales to optimal web dimensions
 */
export async function compressLogo(file: File): Promise<LogoCompressionResult> {
  return new Promise((resolve, reject) => {
    // Validate first
    const validation = validateLogoFile(file);
    if (!validation.valid) {
      reject(new Error(validation.error));
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read file'));

    reader.onload = (e) => {
      const img = new Image();

      img.onerror = () => reject(new Error('Failed to load image. Please try a different file.'));

      img.onload = () => {
        try {
          const originalWidth = img.width;
          const originalHeight = img.height;

          // Calculate new dimensions while maintaining aspect ratio
          let width = originalWidth;
          let height = originalHeight;

          // Only downscale, never upscale
          if (width > LOGO_MAX_WIDTH || height > LOGO_MAX_HEIGHT) {
            const aspectRatio = width / height;
            
            if (width > height) {
              width = LOGO_MAX_WIDTH;
              height = Math.round(width / aspectRatio);
            } else {
              height = LOGO_MAX_HEIGHT;
              width = Math.round(height * aspectRatio);
            }
          }

          // Create canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to create canvas context'));
            return;
          }

          // High quality rendering settings
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw image
          ctx.drawImage(img, 0, 0, width, height);

          // Detect transparency to choose output format
          const hasTransparency = detectTransparency(ctx, width, height);
          
          // Choose format: PNG for transparency, JPEG for solid backgrounds
          const outputFormat = hasTransparency ? 'image/png' : 'image/jpeg';
          const quality = hasTransparency ? undefined : LOGO_QUALITY; // PNG doesn't use quality param

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              // Generate filename with correct extension
              const baseName = file.name.replace(/\.[^/.]+$/, '');
              const extension = hasTransparency ? 'png' : 'jpg';
              const fileName = `${baseName}.${extension}`;

              const compressedFile = new File([blob], fileName, {
                type: outputFormat,
                lastModified: Date.now(),
              });

              resolve({
                file: compressedFile,
                originalSize: file.size,
                compressedSize: compressedFile.size,
                originalDimensions: { width: originalWidth, height: originalHeight },
                finalDimensions: { width, height },
                hasTransparency,
              });
            },
            outputFormat,
            quality
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
 * Format bytes for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Get compression summary for display
 */
export function getCompressionSummary(result: LogoCompressionResult): string {
  const savings = ((1 - result.compressedSize / result.originalSize) * 100).toFixed(0);
  const format = result.hasTransparency ? 'PNG (transparent)' : 'JPEG';
  
  if (result.originalSize <= result.compressedSize) {
    return `Optimized to ${formatFileSize(result.compressedSize)} • ${format}`;
  }
  
  return `Compressed ${savings}% (${formatFileSize(result.originalSize)} → ${formatFileSize(result.compressedSize)}) • ${format}`;
}
