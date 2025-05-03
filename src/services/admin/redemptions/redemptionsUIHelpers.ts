
/**
 * Get badge color for redemption status
 */
export const getRedemptionStatusBadgeColor = (status: string): string => {
  switch (status) {
    case 'aprovado':
      return 'bg-green-100 text-green-800';
    case 'pendente':
      return 'bg-amber-100 text-amber-800';
    case 'recusado':
      return 'bg-red-100 text-red-800';
    case 'entregue':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
