import { useState } from 'react';
import { format } from 'date-fns';
import { NgxDatePicker } from '@/components/ui/NgxDatePicker';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import StatusBadge from './StatusBadge';
import type { StatusPagamento, TipoAjuste, UpdateParcelaPayload, VendaCompleta } from '@/types/financeiro';

interface ParcelaModalProps {
  isOpen: boolean;
  onClose: () => void;
  venda: VendaCompleta | null;
  onSave: (id: string, payload: UpdateParcelaPayload) => Promise<void>;
  loading?: boolean;
}

const STATUS_OPTIONS: StatusPagamento[] = ['pendente', 'pago', 'atrasado', 'cancelado'];

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const ParcelaModal = ({ isOpen, onClose, venda, onSave, loading }: ParcelaModalProps) => {
  const hoje = format(new Date(), 'yyyy-MM-dd');

  const [status, setStatus] = useState<StatusPagamento>(venda?.status_pagamento || 'pendente');
  const [dataPagamento, setDataPagamento] = useState<string>(venda?.data_pagamento || hoje);
  const [temAjuste, setTemAjuste] = useState(venda?.valor_ajustado !== null && venda?.valor_ajustado !== undefined);
  const [tipoAjuste, setTipoAjuste] = useState<TipoAjuste | ''>(venda?.tipo_ajuste || '');
  const [valorAjustado, setValorAjustado] = useState<string>(venda?.valor_ajustado?.toString() || '');
  const [motivoAjuste, setMotivoAjuste] = useState(venda?.motivo_ajuste || '');
  const [observacao, setObservacao] = useState(venda?.observacao || '');
  const [ajusteExpanded, setAjusteExpanded] = useState(temAjuste);
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  if (!venda) return null;

  const handleStatusChange = (novoStatus: StatusPagamento) => {
    setStatus(novoStatus);
    if (novoStatus !== 'pago') setDataPagamento('');
    else setDataPagamento(hoje);
    setErroLocal(null);
  };

  const handleToggleAjuste = (ativo: boolean) => {
    setTemAjuste(ativo);
    setAjusteExpanded(ativo);
    if (!ativo) {
      setTipoAjuste('');
      setValorAjustado('');
      setMotivoAjuste('');
    }
  };

  const valorAjustadoNum = valorAjustado ? parseFloat(valorAjustado.replace(',', '.')) : null;
  const valorOriginal = venda.valor;
  const diferenca = valorAjustadoNum !== null ? valorAjustadoNum - valorOriginal : null;

  const handleSave = async () => {
    setErroLocal(null);

    if (temAjuste && tipoAjuste === '') {
      setErroLocal('Selecione o tipo de ajuste');
      return;
    }
    if (temAjuste && (valorAjustadoNum === null || isNaN(valorAjustadoNum) || valorAjustadoNum <= 0)) {
      setErroLocal('Valor ajustado deve ser maior que zero');
      return;
    }

    const payload: UpdateParcelaPayload = {
      status_pagamento: status,
      data_pagamento: status === 'pago' ? (dataPagamento || hoje) : null,
      valor_ajustado: temAjuste && valorAjustadoNum ? valorAjustadoNum : null,
      tipo_ajuste: temAjuste && tipoAjuste ? tipoAjuste : null,
      motivo_ajuste: temAjuste && motivoAjuste.trim() ? motivoAjuste.trim() : null,
      observacao: observacao.trim() || null,
    };

    try {
      setSalvando(true);
      await onSave(venda.id, payload);
    } catch (err) {
      setErroLocal('Erro ao salvar. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl bg-black border-white/10 text-white p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/5">
          <DialogTitle className="text-xl font-bold  uppercase tracking-tight">
            Gerenciar Pagamento
          </DialogTitle>
          <DialogDescription className="text-white/40 text-xs mt-1">
            {venda.cliente} — {venda.servico}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[70vh] px-6 py-5 space-y-6">

          {/* ── Seção 1: Status ── */}
          <section className="space-y-3">
            <p className="text-xs font-black uppercase tracking-widest text-white/40">Status de Pagamento</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                    status === s
                      ? 'border-white/20 bg-white/5'
                      : 'border-white/5 hover:border-white/15 hover:bg-white/[0.02]'
                  }`}
                >
                  <StatusBadge status={s} />
                </button>
              ))}
            </div>

            {status === 'pago' && (
              <div className="space-y-1 pt-1 flex flex-col">
                <NgxDatePicker
                  label="Data do Pagamento"
                  value={dataPagamento}
                  onChange={(date) => setDataPagamento(date)}
                  maxDate={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
            )}


            {status === 'cancelado' && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs">
                <AlertTriangle size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                <span>Esta parcela não contará nos totais e KPIs quando cancelada.</span>
              </div>
            )}
          </section>

          {/* ── Seção 2: Ajuste de Valor ── */}
          <section className="space-y-3 border-t border-white/5 pt-5">
            <button
              onClick={() => {
                if (!temAjuste) handleToggleAjuste(true);
                else setAjusteExpanded((v) => !v);
              }}
              className="w-full flex items-center justify-between text-xs font-black uppercase tracking-widest text-white/40 hover:text-white/60 transition-colors"
            >
              <span>Ajuste de Valor {temAjuste && <span className="text-[#a3e635] ml-1">● ATIVO</span>}</span>
              {ajusteExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {!temAjuste && !ajusteExpanded && (
              <button
                onClick={() => handleToggleAjuste(true)}
                className="text-xs text-white/30 hover:text-white/50 transition-colors underline"
              >
                + Registrar ajuste nesta parcela
              </button>
            )}

            {ajusteExpanded && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="temAjuste"
                    checked={temAjuste}
                    onChange={(e) => handleToggleAjuste(e.target.checked)}
                    className="accent-[#a3e635] w-4 h-4"
                  />
                  <label htmlFor="temAjuste" className="text-sm text-white/70">Houve ajuste nesta parcela?</label>
                </div>

                {temAjuste && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-black uppercase tracking-widest text-white/40">Tipo</label>
                        <select
                          value={tipoAjuste}
                          onChange={(e) => setTipoAjuste(e.target.value as TipoAjuste | '')}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#a3e635] transition-colors"
                        >
                          <option value="">Selecionar...</option>
                          <option value="desconto">Desconto</option>
                          <option value="acrescimo">Acréscimo</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-black uppercase tracking-widest text-white/40">Valor Ajustado (R$)</label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={valorAjustado}
                          onChange={(e) => setValorAjustado(e.target.value)}
                          placeholder="0,00"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#a3e635] transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black uppercase tracking-widest text-white/40">Motivo do Ajuste</label>
                        <span className="text-white/20 text-[10px]">{motivoAjuste.length}/500</span>
                      </div>
                      <input
                        type="text"
                        value={motivoAjuste}
                        onChange={(e) => setMotivoAjuste(e.target.value.slice(0, 500))}
                        placeholder="Ex: Desconto por fidelidade..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#a3e635] transition-colors"
                      />
                    </div>

                    {/* Preview de valor */}
                    {valorAjustadoNum !== null && !isNaN(valorAjustadoNum) && valorAjustadoNum > 0 && (
                      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 space-y-1.5 text-sm">
                        <div className="flex justify-between text-white/40">
                          <span>Valor original</span>
                          <span>{formatCurrency(valorOriginal)}</span>
                        </div>
                        <div className="flex justify-between text-white font-semibold">
                          <span>Valor cobrado</span>
                          <span>{formatCurrency(valorAjustadoNum)}</span>
                        </div>
                        {diferenca !== null && (
                          <div className={`flex justify-between font-bold ${diferenca < 0 ? 'text-[#a3e635]' : 'text-red-400'}`}>
                            <span>Diferença</span>
                            <span>
                              {diferenca < 0 ? '-' : '+'}{formatCurrency(Math.abs(diferenca))}
                              <span className="text-xs font-normal ml-1 opacity-70">
                                ({tipoAjuste === 'desconto' ? 'desconto' : 'acréscimo'})
                              </span>
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ── Seção 3: Observação Interna ── */}
          <section className="space-y-2 border-t border-white/5 pt-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-widest text-white/40">Observação Interna</p>
              <span className="text-white/20 text-[10px]">{observacao.length}/1000</span>
            </div>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value.slice(0, 1000))}
              placeholder="Anotações internas sobre esta parcela..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#a3e635] transition-colors resize-none"
            />
          </section>

          {/* Erro local */}
          {erroLocal && (
            <p className="text-rose-400 text-xs font-semibold">{erroLocal}</p>
          )}
        </div>

        {/* Footer com ações */}
        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={salvando}
            className="border-white/10 bg-white/5 text-white hover:bg-white/10 rounded-xl px-5"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={salvando || loading}
            className="bg-[#a3e635] text-black font-bold hover:bg-[#b4f53f] rounded-xl px-5"
          >
            {salvando ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ParcelaModal;

