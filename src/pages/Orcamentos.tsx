// src/pages/Orcamentos.tsx
import React, { useState, useMemo } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { 
  FileText, 
  Plus, 
  Search, 
  ScrollText, 
  CheckCircle, 
  Archive, 
  Eye, 
  Pencil, 
  MoreHorizontal,
  Trash2,
  Clock,
  ExternalLink,
  FileCheck,
  Send
} from 'lucide-react';
import { useOrcamentos } from '@/hooks/useOrcamentos';
import { FilterSelect } from '@/components/ui/FilterSelect';
import { StatusBadgeOrcamento } from '@/components/orcamentos/StatusBadgeOrcamento';
import { OrcamentoModal } from '@/components/orcamentos/OrcamentoModal';
import { format, isPast, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Orcamento, StatusOrcamento, OrcamentoFormPayload } from '@/types/orcamentos';

const TABS = [
  { id: 'orcamentos', label: 'Orçamentos',         icon: FileText    },
  { id: 'contratos',  label: 'Contratos',           icon: ScrollText  },
  { id: 'aprovacao',  label: 'Página de Aprovação', icon: CheckCircle },
];

export default function Orcamentos() {
  const [mostrarArquivados, setMostrarArquivados] = useState(false);
  const { 
    orcamentos, 
    loading, 
    mudarStatus, 
    arquivarOrcamento, 
    deletarOrcamento,
    criarOrcamento,
    editarOrcamento,
    fetchItens
  } = useOrcamentos(mostrarArquivados);

  const [activeTab, setActiveTab] = useState('orcamentos');
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('');

  const [idParaDeletar, setIdParaDeletar] = useState<string | null>(null);

  // Estado do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orcamentoParaEditar, setOrcamentoParaEditar] = useState<Orcamento | null>(null);

  // Estado da Aba de Aprovação
  const [orcamentoPreviewId, setOrcamentoPreviewId] = useState<string>('');
  const [itensPreview, setItensPreview] = useState<any[]>([]);
  const [loadingItens, setLoadingItens] = useState(false);

  // Orçamento selecionado para preview
  const orcamentoSelecionado = useMemo(() => {
    return orcamentos.find(o => o.id === orcamentoPreviewId);
  }, [orcamentos, orcamentoPreviewId]);

  // Carregar itens do preview
  React.useEffect(() => {
    if (orcamentoPreviewId && activeTab === 'aprovacao') {
      setLoadingItens(true);
      fetchItens(orcamentoPreviewId).then(data => {
        setItensPreview(data || []);
        setLoadingItens(false);
      });
    }
  }, [orcamentoPreviewId, activeTab, fetchItens]);

  // Filtragem (Tabela)
  const dadosFiltrados = useMemo(() => {
    return orcamentos.filter(o => {
      // Filtro de Aba
      if (activeTab === 'contratos' && o.status !== 'assinado') return false;
      
      const matchBusca = !busca || 
        o.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        o.numero.toLowerCase().includes(busca.toLowerCase()) ||
        o.cliente_nome.toLowerCase().includes(busca.toLowerCase());
      
      const matchStatus = !filtroStatus || o.status === filtroStatus;

      return matchBusca && matchStatus;
    });
  }, [orcamentos, activeTab, busca, filtroStatus]);

  // KPIs
  const kpis = useMemo(() => {
    const rascunhos = orcamentos.filter(o => o.status === 'rascunho').length;
    const enviados = orcamentos.filter(o => o.status === 'enviado').length;
    const aprovados = orcamentos.filter(o => o.status === 'aprovado' || o.status === 'assinado').length;
    const valorAprovado = orcamentos
      .filter(o => o.status === 'aprovado' || o.status === 'assinado')
      .reduce((sum, o) => sum + o.valor_final, 0);

    return { rascunhos, enviados, aprovados, valorAprovado };
  }, [orcamentos]);

  const currencyFormatter = Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleOpenNovo = () => {
    setOrcamentoParaEditar(null);
    setIsModalOpen(true);
  };

  const handleOpenEditar = (o: Orcamento) => {
    setOrcamentoParaEditar(o);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (payload: OrcamentoFormPayload) => {
    if (orcamentoParaEditar) {
      return await editarOrcamento(orcamentoParaEditar.id, payload);
    } else {
      return await criarOrcamento(payload);
    }
  };

  return (
    <PageLayout className="bg-[#000]">
      <PageHeader
        icon={<FileText size={18} />}
        title="Gestão de Orçamentos"
        subtitle="Gerencie todos os seus orçamentos em um só lugar"
        action={
          <button 
            onClick={handleOpenNovo}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl
            bg-[#a3e635] hover:opacity-90 text-black font-bold text-sm
            transition-all shadow-[0_0_20px_rgba(163,230,53,0.15)] active:scale-[0.98]">
            <Plus size={15} strokeWidth={2.5} /> Novo Orçamento
          </button>
        }
      />

      {/* Navegação de Abas */}
      <div className="flex items-center gap-6 px-6 border-b border-white/5">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 py-4 text-xs font-bold uppercase tracking-widest transition-all relative
              ${activeTab === tab.id ? 'text-[#a3e635]' : 'text-white/30 hover:text-white/50'}
            `}
          >
            <tab.icon size={14} />
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#a3e635] shadow-[0_0_10px_#a3e635]" />
            )}
          </button>
        ))}
      </div>

      <div className="p-6 space-y-6">
        {activeTab === 'aprovacao' ? (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-[#0d0d0d] border border-white/5 p-4 rounded-2xl">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-3 ml-1">Preview de Proposta</p>
              <FilterSelect
                value={orcamentoPreviewId}
                onChange={setOrcamentoPreviewId}
                placeholder="Selecionar orçamento para visualizar..."
                options={orcamentos
                  .filter(o => o.status !== 'rascunho' && !o.arquivado)
                  .map(o => ({ value: o.id, label: `${o.numero} — ${o.titulo}` }))}
                className="w-full"
              />
            </div>

            {orcamentoSelecionado ? (
              <div className="bg-[#0d0d0d] border border-white/8 rounded-2xl p-8 max-w-2xl mx-auto mt-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <p className="text-[#a3e635] text-[10px] font-mono font-black mb-1.5 uppercase tracking-widest bg-[#a3e635]/10 px-2 py-0.5 rounded w-fit">
                      {orcamentoSelecionado.numero}
                    </p>
                    <h2 className="text-white text-2xl font-black tracking-tight">{orcamentoSelecionado.titulo}</h2>
                    <p className="text-white/40 text-sm mt-1 font-medium">{orcamentoSelecionado.cliente_nome}</p>
                    {orcamentoSelecionado.validade && (
                      <p className="text-white/20 text-[10px] font-bold uppercase tracking-tighter mt-2 flex items-center gap-1.5">
                        <Clock size={10} /> Válido até {format(parseISO(orcamentoSelecionado.validade), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                  <StatusBadgeOrcamento status={orcamentoSelecionado.status} />
                </div>

                {/* Descrição do projeto */}
                {orcamentoSelecionado.descricao_projeto && (
                  <div className="mb-8 p-5 bg-black/40 rounded-2xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#a3e635]/20 group-hover:bg-[#a3e635]/40 transition-all" />
                    <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.2em] mb-3">
                      Sobre o Projeto
                    </p>
                    <p className="text-white/60 text-sm leading-relaxed antialiased">{orcamentoSelecionado.descricao_projeto}</p>
                  </div>
                )}

                {/* Itens */}
                <div className="mb-8">
                  <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.2em] mb-4">
                    Serviços Incluídos
                  </p>
                  <div className="flex flex-col">
                    {loadingItens ? (
                      <div className="py-8 flex flex-col items-center justify-center opacity-20">
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mb-2" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Carregando itens...</span>
                      </div>
                    ) : itensPreview.map(item => (
                      <div key={item.id}
                        className="flex items-center justify-between py-4 border-b border-white/5 last:border-0 group hover:bg-white/[0.01] px-2 rounded-lg transition-all">
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="text-white/80 text-sm font-bold truncate group-hover:text-white transition-colors">{item.nome}</p>
                          {item.descricao && <p className="text-white/25 text-xs mt-0.5 line-clamp-1">{item.descricao}</p>}
                          {item.quantidade > 1 && (
                            <p className="text-white/15 text-[10px] font-medium mt-1 uppercase tracking-wider">
                              {item.quantidade} x {formatCurrency(item.preco_unitario)}
                            </p>
                          )}
                        </div>
                        <span className="text-[#a3e635] font-black text-sm ml-6 flex-shrink-0 tabular-nums">
                          {formatCurrency(item.subtotal || (item.quantidade * item.preco_unitario))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totais */}
                <div className="border-t border-white/8 pt-6 flex flex-col gap-2 items-end bg-white/[0.02] -mx-8 -mb-8 p-8 rounded-b-2xl mt-4">
                  <div className="flex items-center gap-20 text-[11px] font-bold uppercase tracking-widest">
                    <span className="text-white/20">Subtotal</span>
                    <span className="text-white/40 tabular-nums">{formatCurrency(orcamentoSelecionado.valor_total)}</span>
                  </div>
                  {orcamentoSelecionado.desconto > 0 && (
                    <div className="flex items-center gap-20 text-[11px] font-bold uppercase tracking-widest">
                      <span className="text-white/20">Desconto</span>
                      <span className="text-red-400 tabular-nums font-black">- {formatCurrency(orcamentoSelecionado.desconto)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-20 pt-2 text-base font-black uppercase tracking-[0.2em] mt-2 border-t border-white/5 w-full justify-end">
                    <span className="text-white/60">Total Final</span>
                    <span className="text-[#a3e635] text-2xl tabular-nums drop-shadow-[0_0_15px_rgba(163,230,53,0.3)]">
                      {formatCurrency(orcamentoSelecionado.valor_final)}
                    </span>
                  </div>

                  {/* Ações de mudança de status */}
                  <div className="w-full mt-10 pt-6 border-t border-white/5">
                    {/* Enviado → Aprovado ou Recusado */}
                    {orcamentoSelecionado.status === 'enviado' && (
                      <div className="flex gap-4">
                        <button onClick={() => mudarStatus(orcamentoSelecionado.id, 'aprovado')}
                          className="flex-[2] h-12 rounded-xl bg-[#a3e635] hover:opacity-90 active:scale-[0.98]
                            text-black font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(163,230,53,0.3)] transition-all flex items-center justify-center gap-2">
                          <CheckCircle size={16} strokeWidth={3} /> Aprovar Proposta
                        </button>
                        <button onClick={() => mudarStatus(orcamentoSelecionado.id, 'recusado')}
                          className="flex-1 h-12 rounded-xl border border-red-500/20 text-red-400
                            hover:bg-red-500/10 text-[10px] font-bold uppercase tracking-widest transition-all">
                          Recusar
                        </button>
                      </div>
                    )}

                    {/* Aprovado → Assinado */}
                    {orcamentoSelecionado.status === 'aprovado' && (
                      <button onClick={() => mudarStatus(orcamentoSelecionado.id, 'assinado')}
                        className="w-full h-12 rounded-xl bg-[#a3e635]/10 border border-[#a3e635]/20
                          text-[#a3e635] font-black text-xs uppercase tracking-widest hover:bg-[#a3e635]/20 active:scale-[0.98] transition-all
                          flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(163,230,53,0.1)]">
                        <FileCheck size={16} strokeWidth={2.5} /> Marcar como Assinado
                      </button>
                    )}

                    {/* Rascunho → Enviado (extra, caso selecione rascunho de alguma forma) */}
                    {orcamentoSelecionado.status === 'rascunho' && (
                      <button onClick={() => mudarStatus(orcamentoSelecionado.id, 'enviado')}
                        className="w-full h-12 rounded-xl bg-blue-500/10 border border-blue-500/20
                          text-blue-400 font-black text-xs uppercase tracking-widest hover:bg-blue-500/20 active:scale-[0.98] transition-all
                          flex items-center justify-center gap-2">
                        <Send size={16} strokeWidth={2.5} /> Marcar como Enviado
                      </button>
                    )}

                    {/* Status final — informativo */}
                    {['assinado', 'recusado', 'arquivado'].includes(orcamentoSelecionado.status) && (
                      <div className="flex flex-col items-center gap-1 py-2">
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.1em]">
                          {orcamentoSelecionado.status === 'assinado' && `✓ Proposta Assinada em ${format(parseISO(orcamentoSelecionado.assinado_em!), "dd/MM/yyyy", { locale: ptBR })}`}
                          {orcamentoSelecionado.status === 'recusado' && '✗ Proposta recusada pelo cliente'}
                          {orcamentoSelecionado.status === 'arquivado' && '⚐ Orçamento arquivado'}
                        </p>
                        <p className="text-white/10 text-[9px] uppercase tracking-widest">Este documento não pode mais ser alterado</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 gap-6 bg-[#0d0d0d]/30 border border-dashed border-white/5 rounded-[40px] animate-in fade-in duration-700">
                <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center shadow-inner relative group">
                  <div className="absolute inset-0 bg-[#a3e635]/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <FileText size={32} className="text-white/10 group-hover:text-[#a3e635]/20 transition-colors" />
                </div>
                <p className="text-white/20 text-xs text-center font-bold uppercase tracking-[0.2em] leading-relaxed">
                  Selecione um orçamento acima<br />para visualizar a proposta final
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Rascunhos', value: kpis.rascunhos, color: 'text-white/40' },
                { label: 'Enviados', value: kpis.enviados, color: 'text-blue-400' },
                { label: 'Aprovados', value: kpis.aprovados, color: 'text-[#a3e635]' },
                { label: 'Valor Aprovado', value: formatCurrency(kpis.valorAprovado), color: 'text-[#a3e635]' },
              ].map((kpi, i) => (
                <div key={i} className="bg-[#0d0d0d] border border-white/5 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">{kpi.label}</p>
                  <p className={`text-xl font-black ${kpi.color}`}>{kpi.value}</p>
                </div>
              ))}
            </div>

            {/* Barra de Filtros */}
            <div className="flex flex-col md:flex-row items-center gap-4 bg-[#0d0d0d] border border-white/5 p-4 rounded-2xl">
              <div className="relative flex-1 w-full">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
                <input
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  placeholder="Buscar por número, cliente ou título..."
                  className="w-full h-10 bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#a3e635]/20 transition-all"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <FilterSelect
                  value={filtroStatus}
                  onChange={setFiltroStatus}
                  placeholder="Filtrar Status"
                  options={[
                    { value: '', label: 'Todos os status' },
                    { value: 'rascunho', label: 'Rascunho' },
                    { value: 'enviado', label: 'Enviado' },
                    { value: 'aprovado', label: 'Aprovado' },
                    { value: 'assinado', label: 'Assinado' },
                    { value: 'recusado', label: 'Recusado' },
                  ]}
                  className="flex-1 md:w-48"
                />

                <button
                  onClick={() => setMostrarArquivados(!mostrarArquivados)}
                  className={`
                    flex items-center gap-2 h-10 px-4 rounded-xl text-xs font-bold transition-all border
                    ${mostrarArquivados 
                      ? 'bg-[#a3e635]/10 border-[#a3e635]/20 text-[#a3e635]' 
                      : 'bg-white/5 border-white/5 text-white/40 hover:text-white/60'}
                  `}
                >
                  <Archive size={14} />
                  {mostrarArquivados ? 'Ver Ativos' : 'Arquivados'}
                </button>
              </div>
            </div>

            {/* Tabela */}
            <div className="bg-[#0d0d0d] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-white/5">
                      <th className="px-6 py-4 text-[10px] font-bold text-white/20 uppercase tracking-widest">Número</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-white/20 uppercase tracking-widest">Título / Cliente</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-white/20 uppercase tracking-widest">Valor Final</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-white/20 uppercase tracking-widest text-center">Status</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-white/20 uppercase tracking-widest">Criado em</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                        {activeTab === 'contratos' ? 'Assinado em' : 'Validade'}
                      </th>
                      <th className="px-6 py-4 text-[10px] font-bold text-white/20 uppercase tracking-widest text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-20 text-center">
                          <div className="w-8 h-8 border-2 border-[#a3e635]/20 border-t-[#a3e635] rounded-full animate-spin mx-auto mb-2" />
                          <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest">Carregando...</p>
                        </td>
                      </tr>
                    ) : dadosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-20 text-center text-white/20 italic text-sm">
                          Nenhum orçamento encontrado.
                        </td>
                      </tr>
                    ) : dadosFiltrados.map(o => {
                      const isExpired = o.validade && isPast(parseISO(o.validade)) && o.status === 'enviado';
                      
                      return (
                        <tr key={o.id} className="group hover:bg-white/[0.01] transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-white/40 text-[11px] font-mono font-bold bg-white/5 px-2 py-1 rounded">
                              {o.numero}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-white/80 text-sm font-bold leading-tight line-clamp-1">{o.titulo}</p>
                            <p className="text-white/30 text-[11px] mt-0.5">{o.cliente_nome}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-white/80 text-sm font-black tabular-nums">
                              {formatCurrency(o.valor_final)}
                            </p>
                            {o.desconto > 0 && (
                              <p className="text-red-500/50 text-[10px] font-bold">-{formatCurrency(o.desconto)}</p>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <StatusBadgeOrcamento status={o.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-white/30 text-[11px]">
                              <Clock size={12} />
                              {format(parseISO(o.created_at), "dd/MM/yy", { locale: ptBR })}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {activeTab === 'contratos' ? (
                              <p className="text-white/60 text-[11px] font-medium">
                                {o.assinado_em ? format(parseISO(o.assinado_em), "dd 'de' MMM", { locale: ptBR }) : '—'}
                              </p>
                            ) : (
                              <p className={`text-[11px] font-bold ${isExpired ? 'text-red-400' : 'text-white/20'}`}>
                                {o.validade ? format(parseISO(o.validade), "dd/MM/yyyy") : 'S/ Validade'}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                onClick={() => {
                                  setOrcamentoPreviewId(o.id);
                                  setActiveTab('aprovacao');
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="w-8 h-8 rounded-lg border border-white/5 text-white/30 hover:border-white/20 hover:text-white/60 flex items-center justify-center transition-all bg-white/5"
                              >
                                <Eye size={12} />
                              </button>
                              <button 
                                onClick={() => handleOpenEditar(o)}
                                className="w-8 h-8 rounded-lg border border-white/5 text-white/30 hover:border-white/20 hover:text-white/60 flex items-center justify-center transition-all bg-white/5"
                              >
                                <Pencil size={12} />
                              </button>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger className="w-8 h-8 rounded-lg border border-white/5 text-white/20 hover:border-white/10 hover:text-white/40 flex items-center justify-center transition-all bg-white/5 focus:outline-none">
                                  <MoreHorizontal size={14} />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#0a0a0a] border-white/10 text-white min-w-[160px]">
                                  {o.status === 'rascunho' && (
                                    <DropdownMenuItem onClick={() => mudarStatus(o.id, 'enviado')} className="gap-2 text-xs focus:bg-[#a3e635] focus:text-black">
                                      <ExternalLink size={14} /> Marcar como Enviado
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => arquivarOrcamento(o.id, !o.arquivado)} className="gap-2 text-xs focus:bg-white/10">
                                    <Archive size={14} /> {o.arquivado ? 'Restaurar' : 'Arquivar'}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-white/5" />
                                  <DropdownMenuItem onClick={() => setIdParaDeletar(o.id)} className="gap-2 text-xs text-red-400 focus:bg-red-500/20 focus:text-red-400">
                                    <Trash2 size={14} /> Excluir permanentemente
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <OrcamentoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        orcamentoParaEditar={orcamentoParaEditar}
        onSubmit={handleModalSubmit}
        fetchItens={fetchItens}
      />

      <AlertDialog open={!!idParaDeletar} onOpenChange={(open) => !open && setIdParaDeletar(null)}>
        <AlertDialogContent className="bg-[#0a0a0a] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Deseja apagar este orçamento?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              Esta ação é irreversível e removerá todos os dados e itens vinculados a este orçamento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => idParaDeletar && deletarOrcamento(idParaDeletar)}
              className="bg-red-500 hover:bg-red-600 text-white border-none"
            >
              Sim, apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}
