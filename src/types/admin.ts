
export interface UserData {
  id: string;
  nome: string;
  email?: string;
  cpf?: string;
  papel?: 'consumidor' | 'profissional' | 'lojista' | 'vendedor';
  tipo_perfil?: 'consumidor' | 'profissional' | 'lojista' | 'vendedor';
  saldoPontos: number;
  status?: string;
  avatar?: string;
  codigo?: string;
}
