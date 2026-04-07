// src/types/propostas.ts

export interface Proposta {
  id: string;
  slug: string;
  titulo: string;
  html_content: string;
  ativa: boolean;
  visualizacoes: number;
  created_at: string;
  updated_at: string;
}

export interface PropostaFormPayload {
  slug: string;
  titulo: string;
  html_content: string;
  ativa?: boolean;
}
