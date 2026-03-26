// src/types/servicos.ts
export type Periodicidade = 'mensal' | 'trimestral' | 'semestral' | 'anual';

export interface Servico {
  id: string;
  nome: string;
  descricao: string | null;
  categoria: string;
  preco: number;
  recorrente: boolean;
  periodicidade: Periodicidade | null;
  ativo: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export interface ServicoFormPayload {
  nome: string;
  descricao: string | null;
  categoria: string;
  preco: number;
  recorrente: boolean;
  periodicidade: Periodicidade | null;
  ativo: boolean;
}
