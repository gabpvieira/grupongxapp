import { createClient } from '@supabase/supabase-js'

// Use environment variables in production, fallback to hardcoded values for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tlxlzucmbamkfqlskohc.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRseGx6dWNtYmFta2ZxbHNrb2hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNDg3MjksImV4cCI6MjA3NTgyNDcyOX0.Pjsih2V-dCRElAAeeBuOznP_I1ptwRf-to-yWZzo_JU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para TypeScript
export interface Database {
  public: {
    Tables: {
      vendedores: {
        Row: {
          id: string
          nome: string
          email: string
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          email: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          email?: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      vendas: {
        Row: {
          id: string
          cliente: string
          cliente_id: string | null
          data_fechamento: string

          servico: string
          recorrente: boolean
          quantidade_meses: number | null
          origem_recorrencia: string | null
          valor: number
          responsavel_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cliente: string
          cliente_id?: string | null
          data_fechamento: string

          servico: string
          recorrente?: boolean
          quantidade_meses?: number | null
          origem_recorrencia?: string | null
          valor: number
          responsavel_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cliente?: string
          cliente_id?: string | null
          data_fechamento?: string

          servico?: string
          recorrente?: boolean
          quantidade_meses?: number | null
          origem_recorrencia?: string | null
          valor?: number
          responsavel_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      tarefas: {
        Row: {
          id: string
          titulo: string
          descricao: string | null
          prioridade: 'baixa' | 'media' | 'alta'
          data_vencimento: string | null
          status: 'a-fazer' | 'em-andamento' | 'concluido'
          tempo_rastreado: number
          esta_executando: boolean
          inicio_execucao: string | null
          responsavel_id: string | null
          lembrete_enviado: boolean
          reminder: string
          hora_lembrete: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          titulo: string
          descricao?: string | null
          prioridade?: 'baixa' | 'media' | 'alta'
          data_vencimento?: string | null
          status?: 'a-fazer' | 'em-andamento' | 'concluido'
          tempo_rastreado?: number
          esta_executando?: boolean
          inicio_execucao?: string | null
          responsavel_id?: string | null
          lembrete_enviado?: boolean
          reminder?: string
          hora_lembrete?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          titulo?: string
          descricao?: string | null
          prioridade?: 'baixa' | 'media' | 'alta'
          data_vencimento?: string | null
          status?: 'a-fazer' | 'em-andamento' | 'concluido'
          tempo_rastreado?: number
          esta_executando?: boolean
          inicio_execucao?: string | null
          responsavel_id?: string | null
          lembrete_enviado?: boolean
          reminder?: string
          hora_lembrete?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tarefa_checklist: {
        Row: {
          id: string
          tarefa_id: string
          texto: string
          concluido: boolean
          ordem: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tarefa_id: string
          texto: string
          concluido?: boolean
          ordem?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tarefa_id?: string
          texto?: string
          concluido?: boolean
          ordem?: number
          created_at?: string
          updated_at?: string
        }
      }
      metricas_semanais: {
        Row: {
          id: string
          semana_inicio: string
          semana_fim: string
          data_salvamento: string
          total_metas: number
          metas_atingidas: number
          metas_ultrapassadas: number
          metas_nao_atingidas: number
          parciais: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          semana_inicio: string
          semana_fim: string
          data_salvamento?: string
          total_metas?: number
          metas_atingidas?: number
          metas_ultrapassadas?: number
          metas_nao_atingidas?: number
          parciais?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          semana_inicio?: string
          semana_fim?: string
          data_salvamento?: string
          total_metas?: number
          metas_atingidas?: number
          metas_ultrapassadas?: number
          metas_nao_atingidas?: number
          parciais?: number
          created_at?: string
          updated_at?: string
        }
      }
      metricas_individuais: {
        Row: {
          id: string
          metrica_semanal_id: string
          nome: string
          meta: string | null
          valor_real: string | null
          status: 'meta-ultrapassada' | 'meta-atingida' | 'parcial' | 'nao-atingida' | 'sem-meta'
          ordem: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          metrica_semanal_id: string
          nome: string
          meta?: string | null
          valor_real?: string | null
          status?: 'meta-ultrapassada' | 'meta-atingida' | 'parcial' | 'nao-atingida' | 'sem-meta'
          ordem?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          metrica_semanal_id?: string
          nome?: string
          meta?: string | null
          valor_real?: string | null
          status?: 'meta-ultrapassada' | 'meta-atingida' | 'parcial' | 'nao-atingida' | 'sem-meta'
          ordem?: number
          created_at?: string
          updated_at?: string
        }
      }
      configuracoes: {
        Row: {
          id: string
          chave: string
          valor: string
          tipo: string
          descricao: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          chave: string
          valor: string
          tipo?: string
          descricao?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          chave?: string
          valor?: string
          tipo?: string
          descricao?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      vendas_completas: {
        Row: {
          id: string
          cliente: string
          data_fechamento: string
          servico: string
          recorrente: boolean
          quantidade_meses: number | null
          origem_recorrencia: string | null
          valor: number
          created_at: string
          updated_at: string
          responsavel_nome: string
          responsavel_email: string
        }
      }
      resumo_mensal_vendas: {
        Row: {
          mes: string
          total_vendas: number
          valor_total: number
          valor_medio: number
          vendedores_ativos: number
        }
      }
      tarefas_completas: {
        Row: {
          id: string
          titulo: string
          descricao: string | null
          prioridade: 'baixa' | 'media' | 'alta'
          data_vencimento: string | null
          status: 'a-fazer' | 'em-andamento' | 'concluido'
          tempo_rastreado: number
          esta_executando: boolean
          inicio_execucao: string | null
          created_at: string
          updated_at: string
          responsavel_nome: string | null
          responsavel_email: string | null
          total_checklist: number
          checklist_concluidos: number
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}