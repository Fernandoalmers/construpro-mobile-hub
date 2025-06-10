
import { useState, useCallback } from 'react';
import { parseImageData } from '@/utils/imageParser';

interface ImageDiagnostic {
  productId: string;
  productName: string;
  imageUrl: string | null;
  isValid: boolean;
  errorMessage?: string;
  responseTime?: number;
  parseErrors?: string[];
  needsCorrection?: boolean;
  originalFormat?: string;
  httpStatus?: number;
  contentType?: string;
  connectivity: 'testing' | 'accessible' | 'inaccessible' | 'timeout' | 'invalid_format';
}

export const useImageDiagnostics = () => {
  const [diagnostics, setDiagnostics] = useState<ImageDiagnostic[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const checkImageConnectivity = useCallback(async (url: string): Promise<{
    isValid: boolean;
    errorMessage?: string;
    responseTime: number;
    httpStatus?: number;
    contentType?: string;
    connectivity: 'accessible' | 'inaccessible' | 'timeout' | 'invalid_format';
  }> => {
    if (!url || url.trim() === '') {
      return { 
        isValid: false, 
        errorMessage: 'URL vazia', 
        responseTime: 0,
        connectivity: 'inaccessible'
      };
    }

    // Check for blob URLs (temporary URLs that shouldn't be in database)
    if (url.startsWith('blob:')) {
      return { 
        isValid: false, 
        errorMessage: 'URL temporária (blob)', 
        responseTime: 0,
        connectivity: 'invalid_format'
      };
    }

    const startTime = Date.now();
    
    try {
      console.log(`[ImageDiagnostics] Testing connectivity for: ${url}`);
      
      // Create AbortController for timeout functionality
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout
      
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache', // Force fresh request to avoid cache issues
        mode: 'cors' // Explicitly handle CORS
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      const contentType = response.headers.get('content-type');
      
      console.log(`[ImageDiagnostics] Response for ${url}:`, {
        status: response.status,
        contentType,
        responseTime
      });
      
      if (!response.ok) {
        return { 
          isValid: false, 
          errorMessage: `HTTP ${response.status}: ${response.statusText}`,
          responseTime,
          httpStatus: response.status,
          contentType: contentType || undefined,
          connectivity: 'inaccessible'
        };
      }

      if (!contentType || !contentType.startsWith('image/')) {
        return { 
          isValid: false, 
          errorMessage: `Tipo de conteúdo inválido: ${contentType || 'desconhecido'}`,
          responseTime,
          httpStatus: response.status,
          contentType: contentType || undefined,
          connectivity: 'invalid_format'
        };
      }

      return { 
        isValid: true, 
        responseTime,
        httpStatus: response.status,
        contentType,
        connectivity: 'accessible'
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      console.error(`[ImageDiagnostics] Error testing ${url}:`, error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        return { 
          isValid: false, 
          errorMessage: 'Timeout - imagem demorou muito para responder (>12s)',
          responseTime,
          connectivity: 'timeout'
        };
      }
      
      // Enhanced error detection
      let errorMessage = 'Erro desconhecido';
      let connectivity: 'inaccessible' | 'timeout' = 'inaccessible';
      
      if (error instanceof Error) {
        if (error.message.includes('CORS')) {
          errorMessage = 'Erro de CORS - bucket pode não estar público';
        } else if (error.message.includes('network')) {
          errorMessage = 'Erro de rede - URL inacessível';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Timeout na conexão';
          connectivity = 'timeout';
        } else {
          errorMessage = error.message;
        }
      }
      
      return { 
        isValid: false, 
        errorMessage,
        responseTime,
        connectivity
      };
    }
  }, []);

  const runDiagnostics = useCallback(async (products: any[]) => {
    console.log(`[ImageDiagnostics] Starting diagnostics for ${products.length} products`);
    setIsRunning(true);
    setDiagnostics([]);

    const results: ImageDiagnostic[] = [];

    for (const product of products) {
      console.log(`[ImageDiagnostics] Processing product ${product.id}: ${product.nome}`);
      
      // Use the enhanced parser to analyze image data
      const parseResult = parseImageData(product.imagens);
      
      if (parseResult.urls.length === 0) {
        results.push({
          productId: product.id,
          productName: product.nome,
          imageUrl: null,
          isValid: false,
          errorMessage: 'Nenhuma imagem válida encontrada',
          parseErrors: parseResult.errors,
          needsCorrection: parseResult.errors.length > 0,
          originalFormat: parseResult.originalFormat,
          connectivity: 'inaccessible'
        });
        continue;
      }

      // Test the first available URL with enhanced connectivity check
      const firstUrl = parseResult.urls[0];
      const connectivityResult = await checkImageConnectivity(firstUrl);
      
      results.push({
        productId: product.id,
        productName: product.nome,
        imageUrl: firstUrl,
        isValid: connectivityResult.isValid,
        errorMessage: connectivityResult.errorMessage,
        responseTime: connectivityResult.responseTime,
        httpStatus: connectivityResult.httpStatus,
        contentType: connectivityResult.contentType,
        parseErrors: parseResult.errors,
        needsCorrection: parseResult.errors.length > 0,
        originalFormat: parseResult.originalFormat,
        connectivity: connectivityResult.connectivity
      });
    }

    console.log(`[ImageDiagnostics] Completed diagnostics. Results:`, {
      total: results.length,
      valid: results.filter(r => r.isValid).length,
      invalid: results.filter(r => !r.isValid).length,
      needsCorrection: results.filter(r => r.needsCorrection).length
    });

    setDiagnostics(results);
    setIsRunning(false);
  }, [checkImageConnectivity]);

  const getProblematicImages = useCallback(() => {
    return diagnostics.filter(d => !d.isValid);
  }, [diagnostics]);

  const getImagesThatNeedCorrection = useCallback(() => {
    return diagnostics.filter(d => d.needsCorrection);
  }, [diagnostics]);

  const getConnectivityIssues = useCallback(() => {
    return diagnostics.filter(d => d.connectivity === 'inaccessible' || d.connectivity === 'timeout');
  }, [diagnostics]);

  const getStatistics = useCallback(() => {
    const total = diagnostics.length;
    const valid = diagnostics.filter(d => d.isValid).length;
    const invalid = total - valid;
    const needsCorrection = diagnostics.filter(d => d.needsCorrection).length;
    const parseErrors = diagnostics.filter(d => d.parseErrors && d.parseErrors.length > 0).length;
    const connectivityIssues = diagnostics.filter(d => d.connectivity === 'inaccessible' || d.connectivity === 'timeout').length;
    const formatIssues = diagnostics.filter(d => d.connectivity === 'invalid_format').length;
    
    const validImages = diagnostics.filter(d => d.isValid && d.responseTime && d.responseTime > 0);
    const avgResponseTime = validImages.length > 0 
      ? validImages.reduce((acc, d) => acc + (d.responseTime || 0), 0) / validImages.length 
      : 0;

    return {
      total,
      valid,
      invalid,
      needsCorrection,
      parseErrors,
      connectivityIssues,
      formatIssues,
      validPercentage: total > 0 ? Math.round((valid / total) * 100) : 0,
      avgResponseTime: Math.round(avgResponseTime)
    };
  }, [diagnostics]);

  return {
    diagnostics,
    isRunning,
    runDiagnostics,
    getProblematicImages,
    getImagesThatNeedCorrection,
    getConnectivityIssues,
    getStatistics,
    checkImageConnectivity
  };
};
