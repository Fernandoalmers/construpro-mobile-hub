
/**
 * Atualiza o favicon do site dinamicamente
 */
export const updateFavicon = (logoUrl: string) => {
  try {
    // Remover favicon existente
    const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
    existingFavicons.forEach(favicon => favicon.remove());

    // Criar novo favicon
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/png';
    favicon.href = logoUrl;

    // Adicionar ao head
    document.head.appendChild(favicon);

    console.log('✅ [FaviconUtils] Favicon atualizado:', logoUrl);
  } catch (error) {
    console.error('❌ [FaviconUtils] Erro ao atualizar favicon:', error);
  }
};

/**
 * Hook para atualizar favicon automaticamente quando a logo mudar
 */
export const useFaviconUpdater = (logoUrl: string | null) => {
  React.useEffect(() => {
    if (logoUrl) {
      updateFavicon(logoUrl);
    }
  }, [logoUrl]);
};
