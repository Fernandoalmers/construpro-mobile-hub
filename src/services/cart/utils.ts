
// Utility functions for cart operations

/**
 * Extracts the first image from an images array
 */
export function getFirstImage(imagens: any): string | null {
  if (imagens && Array.isArray(imagens) && imagens.length > 0) {
    return imagens[0];
  }
  return null;
}
