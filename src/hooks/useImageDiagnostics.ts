
import { useState, useCallback } from 'react';

interface ImageDiagnostic {
  productId: string;
  productName: string;
  imageUrl: string | null;
  isValid: boolean;
  errorMessage?: string;
  responseTime?: number;
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
      const response = await fetch(url, { 
        method: 'HEAD',
        timeout: 10000 // 10 second timeout
      });
      
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
      const imageUrl = product.imagemUrl || (Array.isArray(product.imagens) && product.imagens.length > 0 ? product.imagens[0] : null);
      
      if (!imageUrl) {
        results.push({
          productId: product.id,
          productName: product.nome,
          imageUrl: null,
          isValid: false,
          errorMessage: 'Nenhuma imagem definida'
        });
        continue;
      }

      const { isValid, errorMessage, responseTime } = await checkImageValidity(imageUrl);
      
      results.push({
        productId: product.id,
        productName: product.nome,
        imageUrl,
        isValid,
        errorMessage,
        responseTime
      });
    }

    setDiagnostics(results);
    setIsRunning(false);
  }, [checkImageValidity]);

  const getProblematicImages = useCallback(() => {
    return diagnostics.filter(d => !d.isValid);
  }, [diagnostics]);

  const getStatistics = useCallback(() => {
    const total = diagnostics.length;
    const valid = diagnostics.filter(d => d.isValid).length;
    const invalid = total - valid;
    const avgResponseTime = diagnostics
      .filter(d => d.responseTime && d.responseTime > 0)
      .reduce((acc, d) => acc + (d.responseTime || 0), 0) / total;

    return {
      total,
      valid,
      invalid,
      validPercentage: total > 0 ? Math.round((valid / total) * 100) : 0,
      avgResponseTime: Math.round(avgResponseTime)
    };
  }, [diagnostics]);

  return {
    diagnostics,
    isRunning,
    runDiagnostics,
    getProblematicImages,
    getStatistics,
    checkImageValidity
  };
};
