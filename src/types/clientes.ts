// src/types/clientes.ts

export type TipoDocumento = 'cpf' | 'cnpj';

export type StatusCliente = 'ativo' | 'inativo' | 'prospecto' | 'churned';

export interface Cliente {
  id: string;
  nome: string;
  tipo_documento: TipoDocumento;
  documento: string | null;
  telefone: string | null;
  email: string | null;
  instagram: string | null; // handle sem o @
  site: string | null;
  cidade: string | null;
  estado: string | null;
  data_inicio: string | null; // ISO date string
  segmento: string | null;
  responsavel_id: string | null;
  status: StatusCliente;
  informacoes_adicionais: string | null;
  created_at: string;
  updated_at: string;
}

export type ClienteInsert = Omit<Cliente, 'id' | 'created_at' | 'updated_at'>;
export type ClienteUpdate = Partial<ClienteInsert>;
