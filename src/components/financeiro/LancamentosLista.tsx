import { useState, useMemo } from "react";
import { 
  Search, 
  User, 
  Tag, 
  Pencil, 
  Trash2,
  Edit2,
  CreditCard,
} from "lucide-react";
import { Link } from "react-router-dom";

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVendedores } from "@/hooks/useVendedores";
import type { VendaCompleta } from "@/types/financeiro";
import type { ReactNode } from "react";
import StatusBadge from "./StatusBadge";

interface LancamentosListaProps {
  vendas: VendaCompleta[];
  onEdit: (venda: VendaCompleta) => void;
  onDelete: (venda: VendaCompleta) => void;
  onGerenciar: (venda: VendaCompleta) => void;
  responsavelId: string;
  setResponsavelId: (val: string) => void;
  tipo: 'recorrente' | 'unico' | 'todos';
  setTipo: (val: 'recorrente' | 'unico' | 'todos') => void;
  filtroPeriodo: ReactNode;
  loading?: boolean;
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

const formatDate = (dateString: string) =>
  new Date(dateString + "T00:00:00").toLocaleDateString("pt-BR");

const LancamentosLista = ({ 
  vendas, 
  onEdit, 
  onDelete,
  onGerenciar,
  responsavelId,
  setResponsavelId,
  tipo,
  setTipo,
  filtroPeriodo,
  loading 
}: LancamentosListaProps) => {
  const { vendedores } = useVendedores();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredVendas = useMemo(() => {
    return vendas.filter(v => 
      v.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.servico.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [vendas, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-[#0d0d0d] border border-white/5 p-4 rounded-xl space-y-4">
        {filtroPeriodo}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <Input 
              placeholder="Buscar por cliente ou serviço..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white focus:border-[#a3e635] focus:ring-[#a3e635]"
            />
          </div>

          <Select value={responsavelId} onValueChange={setResponsavelId}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <User className="mr-2 h-4 w-4 opacity-50" />
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent className="bg-black border-white/10">
              <SelectItem value="todos">Todos os responsáveis</SelectItem>
              {vendedores.filter(v => v.ativo).map((v) => (
                <SelectItem key={v.id} value={v.email} className="text-white">
                  {v.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={tipo} onValueChange={(val) => setTipo(val as 'recorrente' | 'unico' | 'todos')}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <Tag className="mr-2 h-4 w-4 opacity-50" />
              <SelectValue placeholder="Tipo de venda" />
            </SelectTrigger>
            <SelectContent className="bg-black border-white/10">
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="recorrente">Recorrente</SelectItem>
              <SelectItem value="unico">Único</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista / Tabela */}
      <div className="bg-[#0d0d0d] border border-white/5 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-white/40 animate-pulse">
            Carregando lançamentos...
          </div>
        ) : filteredVendas.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-white/40 text-lg">Nenhum lançamento encontrado.</p>
            <p className="text-white/20 text-sm mt-1">Refine seus filtros ou adicione um novo registro.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-white/40 uppercase text-[10px] font-black tracking-widest">Cliente / Serviço</TableHead>
                    <TableHead className="text-white/40 uppercase text-[10px] font-black tracking-widest">Responsável</TableHead>
                    <TableHead className="text-white/40 uppercase text-[10px] font-black tracking-widest">Data</TableHead>
                    <TableHead className="text-white/40 uppercase text-[10px] font-black tracking-widest text-right">Valor</TableHead>
                    <TableHead className="text-white/40 uppercase text-[10px] font-black tracking-widest text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendas.map((venda) => (
                    <TableRow key={venda.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {venda.cliente_id ? (
                              <Link 
                                to={`/app/clientes`} 
                                className="text-white font-bold hover:text-[#a3e635] transition-colors"
                              >
                                {venda.cliente}
                              </Link>
                            ) : (
                              <span className="text-white font-bold">{venda.cliente}</span>
                            )}
                            <StatusBadge status={venda.status_pagamento} />

                            {venda.recorrente && (
                              <Badge className="bg-white/5 text-white/40 border-white/10 text-[9px] uppercase">
                                Rec
                              </Badge>
                            )}
                          </div>
                          <span className="text-white/40 text-xs">{venda.servico}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-[#a3e635]/20 flex items-center justify-center text-[#a3e635] text-[10px] font-bold">
                            {venda.responsavel_nome?.charAt(0)}
                          </div>
                          <span className="text-white/70 text-sm">{venda.responsavel_nome}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-white/60 text-sm">
                        {formatDate(venda.data_fechamento)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className={`font-black  ${venda.status_pagamento === 'cancelado' ? 'text-white/30 line-through' : 'text-[#a3e635]'}`}>
                            {formatCurrency(venda.valor_efetivo)}
                          </span>
                          {venda.valor_ajustado !== null && (
                            <span title={`Original: ${formatCurrency(venda.valor)} | ${venda.tipo_ajuste === 'desconto' ? 'Desconto' : 'Acréscimo'}${venda.motivo_ajuste ? ` — ${venda.motivo_ajuste}` : ''}`}>
                              <Edit2 size={11} className="text-white/30 hover:text-white/60 cursor-help" />
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onGerenciar(venda)}
                            title="Gerenciar pagamento"
                            className="h-8 w-8 text-white/40 hover:text-[#a3e635] hover:bg-[#a3e635]/5"
                          >
                            <CreditCard size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(venda)}
                            className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/5"
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(venda)}
                            className="h-8 w-8 text-white/40 hover:text-rose-500 hover:bg-rose-500/5"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-white/5">
              {filteredVendas.map((venda) => (
                <div key={venda.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-col gap-1 min-w-0">
                      {venda.cliente_id ? (
                        <Link 
                          to={`/app/clientes`} 
                          className="text-white font-bold truncate active:text-[#a3e635]"
                        >
                          {venda.cliente}
                        </Link>
                      ) : (
                        <span className="text-white font-bold truncate">{venda.cliente}</span>
                      )}
                      <span className="text-white/40 text-xs">{venda.servico}</span>

                      <StatusBadge status={venda.status_pagamento} className="w-fit" />
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <span className={`font-black  text-sm ${venda.status_pagamento === 'cancelado' ? 'text-white/30 line-through' : 'text-[#a3e635]'}`}>
                          {formatCurrency(venda.valor_efetivo)}
                        </span>
                        {venda.valor_ajustado !== null && (
                          <Edit2 size={10} className="text-white/30" />
                        )}
                      </div>
                      <span className="text-white/30 text-[10px]">
                        {formatDate(venda.data_fechamento)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full bg-[#a3e635]/20 flex items-center justify-center text-[#a3e635] text-[9px] font-bold">
                        {venda.responsavel_nome?.charAt(0)}
                      </div>
                      <span className="text-white/50 text-xs">{venda.responsavel_nome}</span>
                    </div>
                    
                    <div className="flex gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onGerenciar(venda)}
                        className="h-7 px-2 border-[#a3e635]/20 bg-[#a3e635]/5 text-[#a3e635] text-xs"
                      >
                        <CreditCard size={11} className="mr-1" /> Pagar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(venda)}
                        className="h-7 border-white/10 bg-white/5 text-white/60"
                      >
                        <Pencil size={11} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(venda)}
                        className="h-7 border-rose-500/20 bg-rose-500/5 text-rose-500"
                      >
                        <Trash2 size={11} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LancamentosLista;

