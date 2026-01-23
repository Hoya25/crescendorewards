/**
 * Image validation utilities for file uploads
 */

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MIN_DIMENSION = 600; // Minimum 600px on shortest side
const ALLOWED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  dimensions?: { width: number; height: number };
}

/**
 * Validates an image file for format and size (synchronous checks only)
 */
export function validateImageFile(file: File): ImageValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Image size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`,
    };
  }

  // Check file type
  if (!ALLOWED_FORMATS.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `Invalid image format. Allowed formats: ${ALLOWED_EXTENSIONS.join(', ').toUpperCase()}`,
    };
  }

  // Check file extension as fallback
  const fileExt = file.name.split('.').pop()?.toLowerCase();
  if (!fileExt || !ALLOWED_EXTENSIONS.includes(fileExt)) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ').toUpperCase()}`,
    };
  }

  return { valid: true };
}

/**
 * Validates image dimensions asynchronously
 * Returns a promise that resolves with validation result including dimensions
 */
export function validateImageDimensions(file: File): Promise<ImageValidationResult> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const width = img.width;
      const height = img.height;
      const shortestSide = Math.min(width, height);

      if (shortestSide < MIN_DIMENSION) {
        resolve({
          valid: false,
          error: `Image quality too low. Minimum ${MIN_DIMENSION}px on shortest side required. Your image is ${width}×${height}px.`,
          dimensions: { width, height },
        });
      } else {
        resolve({
          valid: true,
          dimensions: { width, height },
        });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        valid: false,
        error: 'Failed to load image. Please try a different file.',
      });
    };

    img.src = objectUrl;
  });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
