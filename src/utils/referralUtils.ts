
/**
 * Generate a random referral code
 * @param length Length of the code to generate
 * @returns A random alphanumeric code
 */
export function generateReferralCode(length: number = 6): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing characters like I, O, 0, 1
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

/**
 * Format a date string to local date format
 * @param dateString Date string to format
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR');
}
