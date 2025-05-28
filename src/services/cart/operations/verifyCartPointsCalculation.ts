
import { CartItem } from '@/types/cart';
import { getProductPoints, calculateCartPoints } from '@/utils/pointsCalculations';

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
  userType: 'consumidor' | 'profissional' | 'lojista' | 'vendedor' = 'consumidor'
) {
  const calculatedTotal = calculateCartPoints(cartItems, userType);
  const itemsWithIssues: Array<{
    productId: string;
    productName: string;
    expectedPoints: number;
    actualPoints: number;
  }> = [];

  // Calculate points based on product-specific values
  cartItems.forEach(item => {
    if (!item.produto) return;
    
    const expectedPointsPerUnit = getProductPoints(item.produto, userType);
    const expectedItemPoints = expectedPointsPerUnit * item.quantidade;
    
    // Check if there's a discrepancy in how points were recorded
    const actualItemPoints = (item.produto.pontos || 0) * item.quantidade;
    if (expectedItemPoints !== actualItemPoints && userType === 'profissional') {
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
      ? `Found ${itemsWithIssues.length} products with points calculation issues for ${userType} user`
      : `All product points appear to be calculated correctly for ${userType} user`
  };
}

/**
 * Add this function to check points whenever adding a product to cart
 * to detect issues early
 */
export function logPointsCalculationWarnings(cartItems: CartItem[], userType: 'consumidor' | 'profissional' | 'lojista' | 'vendedor' = 'consumidor') {
  const verification = verifyCartPointsCalculation(cartItems, userType);
  
  if (verification.hasDiscrepancies) {
    console.warn(`⚠️ Points calculation discrepancies detected for ${userType}:`, verification.diagnosticMessage);
    verification.itemsWithIssues.forEach(issue => {
      console.warn(`Product "${issue.productName}": Expected ${issue.expectedPoints} points, but got ${issue.actualPoints}`);
    });
  } else {
    console.log(`✅ Points calculation verified for ${userType} user:`, verification.calculatedPoints, 'total points');
  }
  
  return verification;
}
