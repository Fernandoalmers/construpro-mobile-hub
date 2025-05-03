
/**
 * Get color for store status badge
 */
export const getStoreBadgeColor = (status: string): string => {
  switch (status) {
    case 'aprovado':
      return 'bg-green-100 text-green-800';
    case 'ativa':
      return 'bg-green-100 text-green-800';
    case 'pendente':
      return 'bg-yellow-100 text-yellow-800';
    case 'inativo':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
