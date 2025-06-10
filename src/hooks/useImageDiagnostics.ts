
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
}

export const useImageDiagnostics = () => {
  const [diagnostics, setDiagnostics] = useState<ImageDiagnostic[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const checkImageValidity = useCallback(async (url: string): Promise<{ isValid: boolean; errorMessage?: string; responseTime: number }> => {
    if (!url || url.trim() === '') {
      return { isValid: false, errorMessage: 'URL vazia', responseTime: 0 };
    }

    // Check for blob URLs (temporary URLs that shouldn't be in database)
    if (url.startsWith('blob:')) {
      return { isValid: false, errorMessage: 'URL temporária (blob)', responseTime: 0 };
    }

    const startTime = Date.now();
    
    try {
      // Create AbortController for timeout functionality
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        return { 
          isValid: false, 
          errorMessage: `HTTP ${response.status}: ${response.statusText}`,
          responseTime 
        };
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) {
        return { 
          isValid: false, 
          errorMessage: `Tipo de conteúdo inválido: ${contentType}`,
          responseTime 
        };
      }

      return { isValid: true, responseTime };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error instanceof Error && error.name === 'AbortError') {
        return { 
          isValid: false, 
          errorMessage: 'Timeout - imagem demorou muito para responder',
          responseTime 
        };
      }
      
      return { 
        isValid: false, 
        errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
        responseTime 
      };
    }
  }, []);

  const runDiagnostics = useCallback(async (products: any[]) => {
    setIsRunning(true);
    setDiagnostics([]);

    const results: ImageDiagnostic[] = [];

    for (const product of products) {
      console.log(`[Diagnostics] Processing product ${product.id}: ${product.nome}`);
      
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
          originalFormat: parseResult.originalFormat
        });
        continue;
      }

      // Test the first available URL
      const firstUrl = parseResult.urls[0];
      const { isValid, errorMessage, responseTime } = await checkImageValidity(firstUrl);
      
      results.push({
        productId: product.id,
        productName: product.nome,
        imageUrl: firstUrl,
        isValid,
        errorMessage,
        responseTime,
        parseErrors: parseResult.errors,
        needsCorrection: parseResult.errors.length > 0,
        originalFormat: parseResult.originalFormat
      });
    }

    setDiagnostics(results);
    setIsRunning(false);
  }, [checkImageValidity]);

  const getProblematicImages = useCallback(() => {
    return diagnostics.filter(d => !d.isValid);
  }, [diagnostics]);

  const getImagesThatNeedCorrection = useCallback(() => {
    return diagnostics.filter(d => d.needsCorrection);
  }, [diagnostics]);

  const getStatistics = useCallback(() => {
    const total = diagnostics.length;
    const valid = diagnostics.filter(d => d.isValid).length;
    const invalid = total - valid;
    const needsCorrection = diagnostics.filter(d => d.needsCorrection).length;
    const parseErrors = diagnostics.filter(d => d.parseErrors && d.parseErrors.length > 0).length;
    
    const avgResponseTime = diagnostics
      .filter(d => d.responseTime && d.responseTime > 0)
      .reduce((acc, d) => acc + (d.responseTime || 0), 0) / total;

    return {
      total,
      valid,
      invalid,
      needsCorrection,
      parseErrors,
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
    getStatistics,
    checkImageValidity
  };
};
