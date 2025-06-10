
/**
 * Enhanced image parser to handle malformed arrays and various data formats
 * Specifically designed to handle the inconsistent image data formats in the database
 */

export interface ImageParseResult {
  urls: string[];
  errors: string[];
  originalFormat: string;
  isValid: boolean;
}

/**
 * Robust image parser that handles various malformed formats including escaped JSON strings
 */
export function parseImageData(imageData: any): ImageParseResult {
  const result: ImageParseResult = {
    urls: [],
    errors: [],
    originalFormat: typeof imageData,
    isValid: false
  };

  if (!imageData) {
    result.errors.push('No image data provided');
    return result;
  }

  console.log('[ImageParser] Processing:', { 
    type: typeof imageData, 
    value: imageData,
    stringified: JSON.stringify(imageData).substring(0, 100)
  });

  // Handle string input
  if (typeof imageData === 'string') {
    return parseStringImageData(imageData, result);
  }

  // Handle array input
  if (Array.isArray(imageData)) {
    return parseArrayImageData(imageData, result);
  }

  // Handle object input
  if (imageData && typeof imageData === 'object') {
    return parseObjectImageData(imageData, result);
  }

  result.errors.push(`Unsupported data type: ${typeof imageData}`);
  return result;
}

function parseStringImageData(imageData: string, result: ImageParseResult): ImageParseResult {
  result.originalFormat = 'string';
  
  // Direct URL check
  if (isValidUrl(imageData)) {
    result.urls.push(imageData);
    result.isValid = true;
    return result;
  }

  // FIXED: Enhanced handling for escaped JSON strings like "[\"url\"]"
  if (imageData.startsWith('["') && imageData.endsWith('"]')) {
    try {
      // This handles the escaped JSON format
      const parsed = JSON.parse(imageData);
      if (Array.isArray(parsed)) {
        result.urls = parsed.filter(url => isValidUrl(url));
        result.isValid = result.urls.length > 0;
        if (result.urls.length > 0) {
          result.errors.push('Converted from escaped JSON string format');
        }
        return result;
      }
    } catch (error) {
      result.errors.push('Failed to parse escaped JSON string: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  // Try to parse as regular JSON
  try {
    const parsed = JSON.parse(imageData);
    if (Array.isArray(parsed)) {
      return parseArrayImageData(parsed, result);
    } else if (typeof parsed === 'string' && isValidUrl(parsed)) {
      result.urls.push(parsed);
      result.isValid = true;
      return result;
    }
  } catch (error) {
    // Not valid JSON, try regex extraction for malformed arrays
    const extractedUrls = extractUrlsFromMalformedString(imageData);
    if (extractedUrls.length > 0) {
      result.urls.push(...extractedUrls);
      result.isValid = true;
      result.errors.push('Extracted URLs from malformed string');
      return result;
    }
    result.errors.push(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

function parseArrayImageData(imageData: any[], result: ImageParseResult): ImageParseResult {
  result.originalFormat = 'array';
  
  for (let i = 0; i < imageData.length; i++) {
    const item = imageData[i];
    
    if (typeof item === 'string') {
      const trimmed = item.trim();
      if (trimmed && isValidUrl(trimmed)) {
        result.urls.push(trimmed);
      } else if (trimmed) {
        result.errors.push(`Invalid URL at index ${i}: ${trimmed.substring(0, 50)}`);
      }
    } else if (Array.isArray(item)) {
      // Handle nested arrays
      const nestedResult = parseArrayImageData(item, { ...result, urls: [], errors: [] });
      result.urls.push(...nestedResult.urls);
      result.errors.push(...nestedResult.errors);
    } else if (item && typeof item === 'object') {
      const objectResult = parseObjectImageData(item, { ...result, urls: [], errors: [] });
      result.urls.push(...objectResult.urls);
      result.errors.push(...objectResult.errors);
    }
  }

  result.isValid = result.urls.length > 0;
  return result;
}

function parseObjectImageData(imageData: any, result: ImageParseResult): ImageParseResult {
  result.originalFormat = 'object';
  
  const possibleKeys = ['url', 'path', 'src', 'imageUrl', 'imagemUrl'];
  
  for (const key of possibleKeys) {
    const value = imageData[key];
    if (value && typeof value === 'string' && isValidUrl(value)) {
      result.urls.push(value);
    }
  }

  result.isValid = result.urls.length > 0;
  
  if (result.urls.length === 0) {
    result.errors.push('No valid URL properties found in object');
  }

  return result;
}

/**
 * Extract URLs from malformed JSON strings using regex
 * Handles cases like: [http://example.com/image.jpg, http://example.com/image2.jpg]
 */
function extractUrlsFromMalformedString(str: string): string[] {
  const urls: string[] = [];
  
  // Remove array brackets if present
  const cleanStr = str.replace(/^\[|\]$/g, '');
  
  // Regex to match URLs (http/https/blob/data URLs)
  const urlRegex = /(https?:\/\/[^\s,\]]+|blob:[^\s,\]]+|data:image\/[^\s,\]]+)/g;
  const matches = cleanStr.match(urlRegex);
  
  if (matches) {
    for (const match of matches) {
      const cleanUrl = match.trim().replace(/[",\]]/g, '');
      if (isValidUrl(cleanUrl)) {
        urls.push(cleanUrl);
      }
    }
  }

  return urls;
}

/**
 * Enhanced URL validation
 */
function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  const trimmed = url.trim();
  if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return false;
  
  // Check for valid URL patterns
  const urlPattern = /^(https?:\/\/|blob:|data:image\/|\/)/i;
  return urlPattern.test(trimmed);
}

/**
 * ENHANCED: Generate corrected JSON string from malformed data
 */
export function generateCorrectedImageData(originalData: any): string | null {
  const parseResult = parseImageData(originalData);
  
  if (parseResult.urls.length === 0) {
    return null;
  }

  // Return properly formatted JSON array (not escaped string)
  return JSON.stringify(parseResult.urls);
}

/**
 * Validate if image data needs correction
 */
export function needsCorrection(imageData: any): boolean {
  if (!imageData) return false;
  
  // Check for escaped JSON string format
  if (typeof imageData === 'string' && imageData.startsWith('["') && imageData.endsWith('"]')) {
    return true;
  }
  
  const parseResult = parseImageData(imageData);
  return parseResult.errors.length > 0 && parseResult.urls.length > 0;
}
