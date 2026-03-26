// src/types/orcamentos.ts
export type StatusOrcamento = 'rascunho' | 'enviado' | 'aprovado' | 'assinado' | 'recusado' | 'arquivado';

export interface Orcamento {
  id: string;
  numero: string;
  titulo: string;
  cliente_nome: string;
  cliente_email: string | null;
  cliente_telefone: string | null;
  descricao_projeto: string | null;
  status: StatusOrcamento;
  valor_total: number;
  desconto: number;
  valor_final: number;
  validade: string | null;
  responsavel_id: string | null;
  responsavel_nome: string | null;
  observacoes: string | null;
  aprovado_em: string | null;
  assinado_em: string | null;
  arquivado: boolean;
  total_itens: number;
  created_at: string;
  updated_at: string;
}

export interface OrcamentoItem {
  id?: string;
  orcamento_id?: string;
  servico_id: string | null;
  nome: string;
  descricao: string | null;
  quantidade: number;
  preco_unitario: number;
  subtotal?: number;
  ordem: number;
}

export interface OrcamentoFormPayload {
  titulo: string;
  cliente_nome: string;
  cliente_email: string | null;
  cliente_telefone: string | null;
  descricao_projeto: string | null;
  status: StatusOrcamento;
  desconto: number;
  validade: string | null;
  responsavel_id: string | null;
  observacoes: string | null;
  itens: OrcamentoItem[];
}
