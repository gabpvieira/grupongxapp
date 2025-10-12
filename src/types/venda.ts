export interface Venda {
  id: string;
  cliente: string;
  data_fechamento: string;
  servico: string;
  recorrente: boolean;
  quantidade_meses: number | null;
  origem_recorrencia: string | null;
  valor: number;
  responsavel: string;
  created_at: string;
}
