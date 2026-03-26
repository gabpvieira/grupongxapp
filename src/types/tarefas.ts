export type StatusTarefa = 'a-fazer' | 'em-andamento' | 'concluido';
export type PrioridadeTarefa = 'baixa' | 'media' | 'alta';

export interface ChecklistItem {
  id: string;
  tarefa_id: string;
  texto: string;
  concluido: boolean;
  ordem: number;
}

export interface Tarefa {
  id: string;
  titulo: string;
  descricao: string | null;
  prioridade: PrioridadeTarefa;
  data_vencimento: string | null;
  status: StatusTarefa;
  tempo_rastreado: number; // segundos
  esta_executando: boolean;
  inicio_execucao: string | null; // ISO timestamp
  responsavel_id: string | null;
  responsavel_nome?: string | null;
  responsavel_email?: string | null;
  total_checklist: number;
  checklist_concluidos: number;
  checklist?: Array<ChecklistItem & { done: boolean, text: string }>;
  created_at: string;
  updated_at: string;
}
