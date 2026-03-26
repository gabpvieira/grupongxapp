export type StatusPagamento = 'pendente' | 'pago' | 'atrasado' | 'cancelado';
export type TipoAjuste = 'desconto' | 'acrescimo';

export interface VendaCompleta {
  id: string;
  cliente: string;
  servico: string;
  data_fechamento: string;
  recorrente: boolean;
  quantidade_meses: number | null;
  origem_recorrencia: string | null;
  valor: number;
  responsavel_id: string;
  responsavel_nome: string | null;
  responsavel_email: string | null;
  created_at: string;
  // novos campos
  status_pagamento: StatusPagamento;
  data_pagamento: string | null;
  valor_ajustado: number | null;
  tipo_ajuste: TipoAjuste | null;
  motivo_ajuste: string | null;
  observacao: string | null;
  valor_efetivo: number;
}

export interface UpdateParcelaPayload {
  status_pagamento: StatusPagamento;
  data_pagamento: string | null;
  valor_ajustado: number | null;
  tipo_ajuste: TipoAjuste | null;
  motivo_ajuste: string | null;
  observacao: string | null;
}
