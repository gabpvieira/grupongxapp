// src/types/crm.ts
export type EtapaLead = 'novo_lead' | 'primeiro_contato' | 'proposta_enviada' | 'negociacao' | 'fechado' | 'perdido';

export type OrigemLead = 'manual' | 'formulario' | 'whatsapp' | 'indicacao' | 'outro';

export type TipoAtividade = 'nota' | 'ligacao' | 'email' | 'reuniao' | 'whatsapp' | 'etapa_alterada';

export interface Lead {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  empresa: string | null;
  origem: OrigemLead;
  etapa: EtapaLead;
  valor_estimado: number | null;
  responsavel_id: string | null;
  responsavel_nome: string | null;
  observacoes: string | null;
  ordem: number;
  total_atividades: number;
  created_at: string;
  updated_at: string;
}

export interface Atividade {
  id: string;
  lead_id: string;
  tipo: TipoAtividade;
  descricao: string;
  responsavel_id: string | null;
  created_at: string;
}

export const ETAPAS: { id: EtapaLead; label: string; cor: string }[] = [
  { id: 'novo_lead',        label: 'Novo Lead',        cor: '#a3e635' },
  { id: 'primeiro_contato', label: 'Primeiro Contato', cor: '#eab308' },
  { id: 'proposta_enviada', label: 'Proposta Enviada', cor: '#8b5cf6' },
  { id: 'negociacao',       label: 'Negociação',       cor: '#f97316' },
  { id: 'fechado',          label: 'Fechado',          cor: '#22c55e' },
];
