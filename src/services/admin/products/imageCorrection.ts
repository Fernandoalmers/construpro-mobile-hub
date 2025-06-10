
import { supabase } from '@/integrations/supabase/client';
import { parseImageData, generateCorrectedImageData, needsCorrection } from '@/utils/imageParser';
import { toast } from '@/components/ui/sonner';

export interface ImageCorrectionResult {
  totalProcessed: number;
  corrected: number;
  failed: number;
  skipped: number;
  errors: string[];
}

export interface ProductImageIssue {
  id: string;
  nome: string;
  currentData: any;
  suggestedData: string;
  errorType: string;
  canAutoFix: boolean;
}

/**
 * Scan all products for image data issues
 */
export async function scanProductImageIssues(): Promise<ProductImageIssue[]> {
  try {
    console.log('[ImageCorrection] Starting scan for image issues...');
    
    const { data: products, error } = await supabase
      .from('produtos')
      .select('id, nome, imagens')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ImageCorrection] Error fetching products:', error);
      throw error;
    }

    const issues: ProductImageIssue[] = [];

    for (const product of products || []) {
      const parseResult = parseImageData(product.imagens);
      
      if (parseResult.errors.length > 0) {
        const suggestedData = generateCorrectedImageData(product.imagens);
        
        issues.push({
          id: product.id,
          nome: product.nome,
          currentData: product.imagens,
          suggestedData: suggestedData || '[]',
          errorType: parseResult.errors.join(', '),
          canAutoFix: suggestedData !== null
        });
      }
    }

    console.log(`[ImageCorrection] Found ${issues.length} products with image issues`);
    return issues;
  } catch (error) {
    console.error('[ImageCorrection] Error scanning products:', error);
    throw error;
  }
}

/**
 * Auto-correct image data for all products with issues
 */
export async function autoCorrectProductImages(): Promise<ImageCorrectionResult> {
  const result: ImageCorrectionResult = {
    totalProcessed: 0,
    corrected: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };

  try {
    console.log('[ImageCorrection] Starting auto-correction process...');
    
    const issues = await scanProductImageIssues();
    result.totalProcessed = issues.length;

    for (const issue of issues) {
      if (!issue.canAutoFix) {
        result.skipped++;
        result.errors.push(`Cannot auto-fix product ${issue.nome}: ${issue.errorType}`);
        continue;
      }

      try {
        const { error } = await supabase
          .from('produtos')
          .update({ 
            imagens: JSON.parse(issue.suggestedData),
            updated_at: new Date().toISOString()
          })
          .eq('id', issue.id);

        if (error) {
          result.failed++;
          result.errors.push(`Failed to update product ${issue.nome}: ${error.message}`);
          console.error(`[ImageCorrection] Failed to update product ${issue.id}:`, error);
        } else {
          result.corrected++;
          console.log(`[ImageCorrection] ✅ Corrected product ${issue.nome}`);
        }
      } catch (updateError) {
        result.failed++;
        result.errors.push(`Error updating product ${issue.nome}: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`);
      }
    }

    console.log('[ImageCorrection] Auto-correction completed:', result);
    return result;
  } catch (error) {
    console.error('[ImageCorrection] Error in auto-correction process:', error);
    throw error;
  }
}

/**
 * Correct specific product image data
 */
export async function correctProductImage(productId: string, correctedData: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('produtos')
      .update({ 
        imagens: JSON.parse(correctedData),
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);

    if (error) {
      console.error(`[ImageCorrection] Failed to correct product ${productId}:`, error);
      return false;
    }

    console.log(`[ImageCorrection] ✅ Successfully corrected product ${productId}`);
    return true;
  } catch (error) {
    console.error(`[ImageCorrection] Error correcting product ${productId}:`, error);
    return false;
  }
}
