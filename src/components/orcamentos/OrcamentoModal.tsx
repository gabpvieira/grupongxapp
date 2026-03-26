// src/components/orcamentos/OrcamentoModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  FileText, 
  Users, 
  Settings, 
  Calendar, 
  AlertCircle 
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { FilterSelect } from '@/components/ui/FilterSelect';
import { NgxDatePicker } from '@/components/ui/NgxDatePicker';
import { useServicos } from '@/hooks/useServicos';
import { supabase } from '@/lib/supabase';
import type { 
  Orcamento, 
  OrcamentoItem, 
  OrcamentoFormPayload, 
  StatusOrcamento 
} from '@/types/orcamentos';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface OrcamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: OrcamentoFormPayload) => Promise<boolean>;
  orcamentoParaEditar?: Orcamento | null;
  fetchItens?: (id: string) => Promise<OrcamentoItem[]>;
}

export const OrcamentoModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  orcamentoParaEditar,
  fetchItens 
}: OrcamentoModalProps) => {
  const { servicos } = useServicos();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [vendedores, setVendedores] = useState<{ value: string; label: string }[]>([]);

  // Estado do formulário
  const [titulo, setTitulo] = useState('');
  const [clienteNome, setClienteNome] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [descricaoProjeto, setDescricaoProjeto] = useState('');
  const [observacoes, setObservacoes] = useState('');
  
  const [responsavelId, setResponsavelId] = useState<string>('');
  const [validade, setValidade] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusOrcamento>('rascunho');
  const [desconto, setDesconto] = useState<number>(0);

  const [itens, setItens] = useState<OrcamentoItem[]>([
    { nome: '', descricao: '', quantidade: 1, preco_unitario: 0, servico_id: null, ordem: 0 }
  ]);

  // Carregar vendedores
  useEffect(() => {
    const fetchVendedores = async () => {
      const { data, error } = await supabase
        .from('vendedores')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');
      if (!error && data) {
        setVendedores(data.map(p => ({ value: p.id, label: p.nome || 'Sem nome' })));
      }
    };
    fetchVendedores();
  }, []);

  // Carregar dados para edição
  useEffect(() => {
    if (orcamentoParaEditar && isOpen) {
      setTitulo(orcamentoParaEditar.titulo);
      setClienteNome(orcamentoParaEditar.cliente_nome);
      setClienteEmail(orcamentoParaEditar.cliente_email || '');
      setClienteTelefone(orcamentoParaEditar.cliente_telefone || '');
      setDescricaoProjeto(orcamentoParaEditar.descricao_projeto || '');
      setObservacoes(orcamentoParaEditar.observacoes || '');
      setResponsavelId(orcamentoParaEditar.responsavel_id || '');
      setValidade(orcamentoParaEditar.validade);
      setStatus(orcamentoParaEditar.status);
      setDesconto(orcamentoParaEditar.desconto || 0);

      if (fetchItens) {
        fetchItens(orcamentoParaEditar.id).then(loadedItens => {
          if (loadedItens.length > 0) {
            setItens(loadedItens);
          }
        });
      }
    } else if (isOpen) {
      // Reset para novo
      setTitulo('');
      setClienteNome('');
      setClienteEmail('');
      setClienteTelefone('');
      setDescricaoProjeto('');
      setObservacoes('');
      setResponsavelId('');
      setValidade(null);
      setStatus('rascunho');
      setDesconto(0);
      setItens([{ nome: '', descricao: '', quantidade: 1, preco_unitario: 0, servico_id: null, ordem: 0 }]);
    }
  }, [orcamentoParaEditar, isOpen, fetchItens]);

  // Cálculos
  const subtotal = useMemo(() => {
    return itens.reduce((sum, item) => sum + (item.quantidade * item.preco_unitario), 0);
  }, [itens]);

  const total = subtotal - desconto;

  // Handlers de Itens
  const adicionarItem = () => {
    setItens([...itens, { nome: '', descricao: '', quantidade: 1, preco_unitario: 0, servico_id: null, ordem: itens.length }]);
  };

  const removerItem = (index: number) => {
    if (itens.length === 1) return;
    setItens(itens.filter((_, i) => i !== index));
  };

  const atualizarItem = (index: number, updates: Partial<OrcamentoItem>) => {
    const novosItens = [...itens];
    novosItens[index] = { ...novosItens[index], ...updates };
    setItens(novosItens);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !clienteNome) {
      toast({ title: 'Campos obrigatórios faltando', variant: 'destructive' });
      return;
    }

    const itensValidos = itens.filter(it => it.nome.trim() !== '');
    if (itensValidos.length === 0) {
      toast({ title: 'Adicione pelo menos um item ao orçamento', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const success = await onSubmit({
      titulo,
      cliente_nome: clienteNome,
      cliente_email: clienteEmail || null,
      cliente_telefone: clienteTelefone || null,
      descricao_projeto: descricaoProjeto || null,
      observacoes: observacoes || null,
      status,
      desconto,
      validade,
      responsavel_id: responsavelId || null,
      itens: itensValidos
    });

    setLoading(false);
    if (success) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border-white/10 p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-6 border-b border-white/5 bg-[#0d0d0d]">
          <DialogTitle className="text-white flex items-center gap-2">
            <FileText className="text-[#a3e635]" size={18} />
            {orcamentoParaEditar ? `Editar ${orcamentoParaEditar.numero}` : 'Novo Orçamento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleManualSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 space-y-8 overflow-y-auto max-h-[calc(90vh-140px)]">
            
            {/* Grid Principal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Coluna Esquerda: Dados do Cliente */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[#a3e635] text-[10px] font-bold uppercase tracking-widest mb-2">
                  <Users size={12} /> Dados do Cliente
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-white/40 ml-1">Título do Orçamento *</label>
                  <input
                    required
                    value={titulo}
                    onChange={e => setTitulo(e.target.value)}
                    placeholder="Ex: Consultoria de Marketing Digital"
                    className="w-full h-11 bg-white/5 border border-white/5 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-[#a3e635]/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-white/40 ml-1">Nome do Cliente *</label>
                  <input
                    required
                    value={clienteNome}
                    onChange={e => setClienteNome(e.target.value)}
                    placeholder="Nome completo ou Empresa"
                    className="w-full h-11 bg-white/5 border border-white/5 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-[#a3e635]/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-white/40 ml-1">E-mail</label>
                    <input
                      type="email"
                      value={clienteEmail}
                      onChange={e => setClienteEmail(e.target.value)}
                      placeholder="cliente@email.com"
                      className="w-full h-11 bg-white/5 border border-white/5 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-[#a3e635]/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-white/40 ml-1">Telefone / WhatsApp</label>
                    <input
                      value={clienteTelefone}
                      onChange={e => setClienteTelefone(e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="w-full h-11 bg-white/5 border border-white/5 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-[#a3e635]/20"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-white/40 ml-1">Descrição do Projeto</label>
                  <textarea
                    value={descricaoProjeto}
                    onChange={e => setDescricaoProjeto(e.target.value)}
                    placeholder="Breve resumo do que será entregue..."
                    maxLength={3000}
                    className="w-full h-24 bg-white/5 border border-white/5 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-[#a3e635]/20 resize-none"
                  />
                </div>
              </div>

              {/* Coluna Direita: Configurações */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[#a3e635] text-[10px] font-bold uppercase tracking-widest mb-2">
                  <Settings size={12} /> Configurações
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-white/40 ml-1">Responsável</label>
                  <FilterSelect
                    value={responsavelId}
                    onChange={setResponsavelId}
                    placeholder="Selecione o vendedor"
                    options={vendedores}
                    className="w-full h-11 border-white/5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-white/40 ml-1">Validade</label>
                    <NgxDatePicker
                      value={validade}
                      onChange={setValidade}
                      placeholder="Prazo da proposta"
                      className="h-11 border-white/5"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-white/40 ml-1">Status</label>
                    <FilterSelect
                      value={status}
                      onChange={(val) => setStatus(val as StatusOrcamento)}
                      options={[
                        { value: 'rascunho', label: 'Rascunho' },
                        { value: 'enviado', label: 'Enviado' },
                        { value: 'aprovado', label: 'Aprovado' },
                        { value: 'assinado', label: 'Assinado' },
                        { value: 'recusado', label: 'Recusado' },
                      ]}
                      className="w-full h-11 border-white/5"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-white/40 ml-1">Desconto Geral</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-xs font-bold">R$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={desconto}
                      onChange={e => setDesconto(Number(e.target.value))}
                      className="w-full h-11 bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 text-sm text-white font-bold focus:outline-none focus:border-[#a3e635]/20"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-white/40 ml-1">Observações Internas</label>
                  <textarea
                    value={observacoes}
                    onChange={e => setObservacoes(e.target.value)}
                    placeholder="Notas que não aparecem para o cliente..."
                    maxLength={2000}
                    className="w-full h-20 bg-white/5 border border-white/5 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-[#a3e635]/20 resize-none"
                  />
                </div>
              </div>

            </div>

            {/* Seção de Itens */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#a3e635] text-[10px] font-bold uppercase tracking-widest">
                  <AlertCircle size={12} /> Itens e Serviços
                </div>
                <button
                  type="button"
                  onClick={adicionarItem}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#a3e635] hover:opacity-80 transition-all bg-[#a3e635]/10 px-3 py-1.5 rounded-lg border border-[#a3e635]/20"
                >
                  <Plus size={12} strokeWidth={3} /> Adicionar Item
                </button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-[1fr,80px,130px,120px,40px] gap-3 px-2">
                  <span className="text-[9px] uppercase font-bold text-white/20 tracking-wider">Item / Descrição</span>
                  <span className="text-[9px] uppercase font-bold text-white/20 tracking-wider text-center">Quant.</span>
                  <span className="text-[9px] uppercase font-bold text-white/20 tracking-wider text-right">Preço Unit.</span>
                  <span className="text-[9px] uppercase font-bold text-white/20 tracking-wider text-right">Subtotal</span>
                  <span></span>
                </div>

                <div className="space-y-2">
                  {itens.map((item, i) => (
                    <div key={i} className="group relative bg-white/[0.02] border border-white/5 rounded-xl p-2.5 transition-all hover:bg-white/[0.04] hover:border-white/10">
                      <div className="grid grid-cols-[1fr,80px,130px,120px,40px] gap-3 items-center">
                        <div className="relative">
                          <input
                            list="servicos-list"
                            placeholder="Nome do serviço..."
                            value={item.nome}
                            onInput={e => {
                              const val = (e.target as HTMLInputElement).value;
                              const match = servicos.find(s => s.nome === val);
                              if (match) {
                                atualizarItem(i, { 
                                  nome: val,
                                  preco_unitario: match.preco, 
                                  servico_id: match.id,
                                  descricao: match.descricao || item.descricao
                                });
                              } else {
                                atualizarItem(i, { nome: val, servico_id: null });
                              }
                            }}
                            className="w-full h-10 bg-black/40 border border-white/5 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-[#a3e635]/30 transition-all"
                          />
                          <datalist id="servicos-list">
                            {servicos.map(s => (
                              <option key={s.id} value={s.nome} />
                            ))}
                          </datalist>
                        </div>

                        <input
                          type="number"
                          min="1"
                          value={item.quantidade}
                          onChange={e => atualizarItem(i, { quantidade: Number(e.target.value) })}
                          className="w-full h-10 bg-black/40 border border-white/5 rounded-lg px-2 text-center text-sm text-white focus:outline-none tabular-nums"
                        />

                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-xs">R$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.preco_unitario}
                            onChange={e => atualizarItem(i, { preco_unitario: Number(e.target.value) })}
                            className="w-full h-10 bg-black/40 border border-white/5 rounded-lg pl-8 pr-3 text-right text-sm text-white focus:outline-none tabular-nums font-bold"
                          />
                        </div>

                        <div className="text-right">
                          <span className="text-[#a3e635] font-black text-sm tabular-nums">
                            {formatCurrency(item.quantidade * item.preco_unitario)}
                          </span>
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => removerItem(i)}
                            disabled={itens.length === 1}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/10 hover:text-red-400 hover:bg-red-400/10 disabled:opacity-0 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      {/* Campo opcional de descrição do item */}
                      <input
                        placeholder="Adicionar detalhe ao item (opcional)..."
                        value={item.descricao || ''}
                        onChange={e => atualizarItem(i, { descricao: e.target.value })}
                        className="w-full mt-2 bg-transparent text-[11px] text-white/30 italic px-1 focus:outline-none hover:text-white/50 transition-all"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumo de Totais */}
              <div className="flex flex-col gap-2 items-end border-t border-white/5 pt-6 mt-4">
                <div className="flex items-center gap-20 text-[11px] font-bold text-white/20 uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span className="text-white/60 tabular-nums">{formatCurrency(subtotal)}</span>
                </div>
                {desconto > 0 && (
                  <div className="flex items-center gap-20 text-[11px] font-bold text-red-400 uppercase tracking-widest">
                    <span>Desconto</span>
                    <span className="tabular-nums">-{formatCurrency(desconto)}</span>
                  </div>
                )}
                <div className="flex items-center gap-20 pt-2 text-sm font-black text-[#a3e635] uppercase tracking-[0.2em]">
                  <span>Total Final</span>
                  <span className="text-xl tabular-nums drop-shadow-[0_0_10px_rgba(163,230,53,0.3)]">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 border-t border-white/5 bg-[#0d0d0d]">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-white/5 text-white/40 font-bold text-sm hover:bg-white/5 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2.5 rounded-xl bg-[#a3e635] hover:opacity-90 disabled:opacity-50 text-black font-black text-sm transition-all shadow-[0_0_30px_rgba(163,230,53,0.2)]"
            >
              {loading ? 'Salvando...' : orcamentoParaEditar ? 'Atualizar Orçamento' : 'Salvar Proposta'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
