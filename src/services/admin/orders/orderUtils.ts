
export const getOrderStatusBadgeColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'concluído':
    case 'concluido':
    case 'entregue':
      return 'bg-green-100 text-green-800';
    case 'pendente':
    case 'processando':
      return 'bg-yellow-100 text-yellow-800';
    case 'cancelado':
      return 'bg-red-100 text-red-800';
    case 'enviado':
    case 'em transporte':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
