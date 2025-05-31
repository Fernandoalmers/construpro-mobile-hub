
export const getRoleBadgeColor = (role: string): string => {
  switch (role?.toLowerCase()) {
    case 'admin':
      return 'bg-red-100 text-red-800';
    case 'lojista':
    case 'vendedor':
      return 'bg-purple-100 text-purple-800';
    case 'profissional':
      return 'bg-blue-100 text-blue-800';
    case 'consumidor':
    default:
      return 'bg-green-100 text-green-700';
  }
};

export const getStatusBadgeColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'ativo':
      return 'bg-green-100 text-green-800';
    case 'pendente':
      return 'bg-yellow-100 text-yellow-800';
    case 'bloqueado':
    case 'recusado':
      return 'bg-red-100 text-red-800';
    case 'inativo':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
