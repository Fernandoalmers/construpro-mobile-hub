
/**
 * Get appropriate badge color based on store status
 */
export const getStoreBadgeColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'aprovado':
    case 'ativa':
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    case 'pendente':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    case 'inativo':
    case 'recusado':
      return 'bg-red-100 text-red-800 hover:bg-red-200';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};
