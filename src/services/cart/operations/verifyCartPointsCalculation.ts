
import { CartItem } from '@/types/cart';

/**
 * Utility function to verify that cart points are being calculated correctly
 * based on the product-specific points.
 * 
 * @param cartItems The cart items to verify
 * @param userType The type of user (consumer or professional)
 * @returns An object with calculated points and any discrepancies found
 */
export function verifyCartPointsCalculation(
  cartItems: CartItem[], 
  userType: 'consumidor' | 'profissional' = 'consumidor'
) {
  let calculatedTotal = 0;
  const itemsWithIssues: Array<{
    productId: string;
    productName: string;
    expectedPoints: number;
    actualPoints: number;
  }> = [];

  // Calculate points based on product-specific values
  cartItems.forEach(item => {
    if (!item.produto) return;
    
    // Determine which points value to use based on user type
    const pointsPerUnit = userType === 'profissional'
      ? (item.produto.pontos_profissional || item.produto.pontos || 0)
      : (item.produto.pontos || 0);
    
    const expectedItemPoints = pointsPerUnit * item.quantidade;
    calculatedTotal += expectedItemPoints;
    
    // Check if there's a discrepancy in how points were recorded
    const actualItemPoints = item.produto.pontos * item.quantidade;
    if (expectedItemPoints !== actualItemPoints) {
      itemsWithIssues.push({
        productId: item.produto_id,
        productName: item.produto.nome || 'Unknown Product',
        expectedPoints: expectedItemPoints,
        actualPoints: actualItemPoints
      });
    }
  });
  
  return {
    calculatedPoints: calculatedTotal,
    hasDiscrepancies: itemsWithIssues.length > 0,
    itemsWithIssues,
    diagnosticMessage: itemsWithIssues.length > 0 
      ? `Found ${itemsWithIssues.length} products with points calculation issues`
      : 'All product points appear to be calculated correctly'
  };
}

/**
 * Add this function to check points whenever adding a product to cart
 * to detect issues early
 */
export function logPointsCalculationWarnings(cartItems: CartItem[], userType: 'consumidor' | 'profissional' = 'consumidor') {
  const verification = verifyCartPointsCalculation(cartItems, userType);
  
  if (verification.hasDiscrepancies) {
    console.warn('⚠️ Points calculation discrepancies detected:', verification.diagnosticMessage);
    verification.itemsWithIssues.forEach(issue => {
      console.warn(`Product "${issue.productName}": Expected ${issue.expectedPoints} points, but got ${issue.actualPoints}`);
    });
  }
  
  return verification;
}
