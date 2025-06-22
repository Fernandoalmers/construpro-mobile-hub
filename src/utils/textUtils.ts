
/**
 * Truncates text intelligently for product names
 * @param text - The text to truncate
 * @param maxLength - Maximum length for mobile (default: 60)
 * @param maxLengthDesktop - Maximum length for desktop (default: 80)
 * @returns Truncated text with ellipsis if needed
 */
export const truncateProductName = (text: string, maxLength: number = 60, maxLengthDesktop: number = 80): string => {
  if (!text) return '';
  
  // For mobile screens, use shorter limit
  const isMobile = window.innerWidth < 640; // sm breakpoint
  const limit = isMobile ? maxLength : maxLengthDesktop;
  
  if (text.length <= limit) {
    return text;
  }
  
  // Find the last space before the limit to avoid cutting words
  let truncateAt = limit;
  const lastSpaceIndex = text.lastIndexOf(' ', limit - 3); // -3 to account for "..."
  
  if (lastSpaceIndex > limit * 0.7) { // Only break at space if it's not too early
    truncateAt = lastSpaceIndex;
  }
  
  return text.substring(0, truncateAt).trim() + '...';
};

/**
 * Truncates text for a specific number of lines
 * @param text - The text to truncate
 * @param maxCharsPerLine - Average characters per line (default: 30)
 * @param maxLines - Maximum number of lines (default: 2)
 * @returns Truncated text with ellipsis if needed
 */
export const truncateTextForLines = (text: string, maxCharsPerLine: number = 30, maxLines: number = 2): string => {
  if (!text) return '';
  
  const maxTotalChars = maxCharsPerLine * maxLines;
  
  if (text.length <= maxTotalChars) {
    return text;
  }
  
  // Find the last space before the limit
  const lastSpaceIndex = text.lastIndexOf(' ', maxTotalChars - 3);
  const truncateAt = lastSpaceIndex > maxTotalChars * 0.7 ? lastSpaceIndex : maxTotalChars - 3;
  
  return text.substring(0, truncateAt).trim() + '...';
};
