import React, { useState, useEffect } from 'react';
import { Plus, X, Calendar, Loader2, CheckSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useVendedores } from '@/hooks/useVendedores';
import { useToast } from '@/hooks/use-toast';
import { Tarefa, StatusTarefa, PrioridadeTarefa } from '@/types/tarefas';

interface NovaTarefaModalProps {
  tarefa?: Tarefa | null;
  isOpen: boolean;
  onClose: () => void;
  refetch: () => void;
}

export function NovaTarefaModal({ tarefa, isOpen, onClose, refetch }: NovaTarefaModalProps) {
  const [loading, setLoading] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState<PrioridadeTarefa>('media');
  const [status, setStatus] = useState<StatusTarefa>('a-fazer');
  const [dataVencimento, setDataVencimento] = useState('');
  const [responsavelId, setResponsavelId] = useState('');
  const [checklist, setChecklist] = useState<string[]>([]);
  
  const { vendedores } = useVendedores();
  const { toast } = useToast();

  useEffect(() => {
    if (tarefa) {
      setTitulo(tarefa.titulo || '');
      setDescricao(tarefa.descricao || '');
      setPrioridade(tarefa.prioridade || 'media');
      setStatus(tarefa.status || 'a-fazer');
      setDataVencimento(tarefa.data_vencimento || '');
      setResponsavelId(tarefa.responsavel_id || '');
      // Mapeia checklist do objeto tarefa se existir
      if (tarefa.checklist) {
        setChecklist(tarefa.checklist.map(item => item.texto || item.text || ''));
      }
    } else {
      // Reset para nova tarefa
      setTitulo('');
      setDescricao('');
      setPrioridade('media');
      setStatus('a-fazer');
      setDataVencimento('');
      setResponsavelId('');
      setChecklist([]);
    }
  }, [tarefa, isOpen]);

  // Fechar ao pressionar Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const adicionarItem = () => setChecklist([...checklist, '']);
  
  const removerItem = (index: number) => {
    setChecklist(checklist.filter((_, i) => i !== index));
  };

  const atualizarItem = (index: number, valor: string) => {
    const novoChecklist = [...checklist];
    novoChecklist[index] = valor;
    setChecklist(novoChecklist);
  };

  const handleSubmit = async () => {
    if (!titulo.trim()) return;
    setLoading(true);

    const payload = {
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      prioridade,
      status,
      data_vencimento: dataVencimento || null,
      responsavel_id: responsavelId || null,
      tempo_rastreado: tarefa?.tempo_rastreado || 0,
      esta_executando: tarefa?.esta_executando || false,
      inicio_execucao: tarefa?.inicio_execucao || null,
    };

    try {
      let tarefaId = tarefa?.id;

      if (tarefa) {
        // UPDATE
        const { error } = await supabase
          .from('tarefas')
          .update(payload)
          .eq('id', tarefa.id);
        
        if (error) throw error;
      } else {
        // INSERT
        const { data, error } = await supabase
          .from('tarefas')
          .insert(payload)
          .select()
          .single();
        
        if (error) throw error;
        tarefaId = data.id;
      }

      // Sincronizar checklist
      if (tarefaId) {
        // Primeiro remove os antigos se estiver editando
        if (tarefa) {
          await supabase.from('tarefa_checklist').delete().eq('tarefa_id', tarefaId);
        }

        const itensFiltrados = checklist.filter(i => i.trim() !== '');
        if (itensFiltrados.length > 0) {
          const checklistPayload = itensFiltrados.map((texto, ordem) => ({
            tarefa_id: tarefaId,
            texto: texto.trim(),
            concluido: false, // Por padrão falso na criação/resete
            ordem,
          }));
          
          const { error: chkError } = await supabase
            .from('tarefa_checklist')
            .insert(checklistPayload);
          
          if (chkError) throw chkError;
        }
      }

      toast({
        title: tarefa ? 'Tarefa atualizada!' : 'Tarefa criada!',
        variant: 'default',
      });
      onClose();
      refetch();
    } catch (error: any) {
      console.error('Erro ao salvar tarefa:', error);
      toast({
        title: 'Erro ao salvar tarefa',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#0d0d0d] rounded-2xl w-full max-w-2xl shadow-2xl shadow-black/60 flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#344256]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#a3e635]/15 border border-[#a3e635]/25 flex items-center justify-center">
              <Plus size={16} className="text-[#a3e635]" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-none">
                {tarefa ? 'Editar Tarefa' : 'Nova Tarefa'}
              </h2>
              <p className="text-white/35 text-xs mt-0.5">
                {tarefa ? 'Atualize os detalhes da tarefa' : 'Adicione uma nova tarefa ao board'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center text-white/30 hover:text-white/70 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col md:flex-row gap-6 p-6 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* Coluna esquerda */}
          <div className="flex-1 flex flex-col gap-5">
            {/* Título */}
            <div>
              <label className="text-white/45 text-xs font-semibold uppercase tracking-wider mb-2 block">
                Título <span className="text-red-400">*</span>
              </label>
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Criar proposta para cliente X"
                className="w-full h-11 bg-black/50 border-none outline-none focus:ring-0 focus:bg-black/70 rounded-xl px-4 text-white text-sm placeholder:text-white/20 transition-colors"
                autoFocus
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="text-white/45 text-xs font-semibold uppercase tracking-wider mb-2 block">
                Descrição
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={4}
                placeholder="Detalhe o que precisa ser feito..."
                className="w-full bg-black/50 border-none outline-none focus:ring-0 focus:bg-black/70 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 resize-none transition-colors leading-relaxed"
              />
            </div>

            {/* Checklist */}
            <div>
              <label className="text-white/45 text-xs font-semibold uppercase tracking-wider mb-2 block">
                Checklist <span className="text-white/20 font-normal normal-case">(opcional)</span>
              </label>
              <div className="space-y-2">
                {checklist.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 group">
                    <div className="w-4 h-4 rounded border border-[#344256] flex-shrink-0 flex items-center justify-center transition-colors">
                      <div className="w-2 h-2 rounded-sm bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <input
                      value={item}
                      onChange={(e) => atualizarItem(i, e.target.value)}
                      placeholder={`Item ${i + 1}`}
                      className="flex-1 h-9 bg-black/50 border-none outline-none focus:ring-0 focus:bg-black/70 rounded-lg px-3 text-white text-sm placeholder:text-white/20 transition-colors"
                    />
                    <button 
                      onClick={() => removerItem(i)}
                      className="text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={adicionarItem}
                  className="flex items-center gap-2 text-white/30 hover:text-[#a3e635] text-xs transition-colors py-1.5 px-2 rounded-lg hover:bg-white/5"
                >
                  <Plus size={13} /> Adicionar item
                </button>
              </div>
            </div>
          </div>

          {/* Coluna direita */}
          <div className="w-full md:w-60 flex flex-col gap-5 flex-shrink-0">
            
            {/* Prioridade */}
            <div>
              <label className="text-white/45 text-xs font-semibold uppercase tracking-wider mb-2 block">
                Prioridade
              </label>
              <div className="flex gap-1.5">
                {(['baixa', 'media', 'alta'] as const).map(p => (
                  <button 
                    key={p}
                    onClick={() => setPrioridade(p)}
                    className={`flex-1 h-8 rounded-lg text-[10px] font-bold transition-all uppercase tracking-tight
                      ${prioridade === p
                        ? p === 'alta'  ? 'bg-red-500/20 text-red-400'
                        : p === 'media' ? 'bg-amber-500/20 text-amber-400'
                        :                 'bg-white/12 text-white/70'
                        : 'bg-transparent border-none text-white/25 hover:text-white/45 hover:bg-white/5'
                      }`}
                  >
                    {p === 'media' ? 'Média' : p}
                  </button>
                ))}
              </div>
            </div>

            {/* Status inicial */}
            <div>
              <label className="text-white/45 text-xs font-semibold uppercase tracking-wider mb-2 block">
                Status
              </label>
              <div className="flex flex-col gap-1.5">
                {[
                  { value: 'a-fazer',     label: 'A Fazer',      dot: 'bg-white/30'   },
                  { value: 'em-andamento', label: 'Em Progresso', dot: 'bg-blue-400'  },
                  { value: 'concluido',   label: 'Concluído',    dot: 'bg-[#a3e635]'  },
                ].map(s => (
                  <button 
                    key={s.value}
                    onClick={() => setStatus(s.value as StatusTarefa)}
                    className={`flex items-center gap-2.5 h-9 px-3 rounded-lg text-xs font-medium transition-all text-left
                      ${status === s.value
                        ? 'bg-white/8 text-white border-none'
                        : 'border-none text-white/35 hover:text-white/55 hover:bg-white/3'
                      }`}
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Data de Vencimento */}
            <div>
              <label className="text-white/45 text-xs font-semibold uppercase tracking-wider mb-2 block">
                Vencimento
              </label>
              <div className="relative">
                <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                <input 
                  type="date"
                  value={dataVencimento}
                  onChange={(e) => setDataVencimento(e.target.value)}
                  className="w-full h-10 bg-black/50 border-none outline-none focus:ring-0 rounded-xl pl-9 pr-3 text-white/60 text-sm transition-colors [color-scheme:dark] cursor-pointer"
                />
              </div>
            </div>

            {/* Responsável */}
            <div>
              <label className="text-white/45 text-xs font-semibold uppercase tracking-wider mb-2 block">
                Responsável
              </label>
              <div className="relative group">
                <select 
                  value={responsavelId}
                  onChange={(e) => setResponsavelId(e.target.value)}
                  className="w-full h-10 bg-black/50 border-none outline-none focus:ring-0 rounded-xl px-3 text-white/60 text-sm appearance-none cursor-pointer transition-colors"
                >
                  <option value="">Nenhum</option>
                  {vendedores.map(v => (
                    <option key={v.id} value={v.id}>{v.nome}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/20 group-hover:text-white/40 transition-colors">
                  <Plus size={12} className="rotate-45" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#344256] bg-black/40">
          <button 
            onClick={onClose}
            className="h-10 px-5 rounded-xl border border-[#344256] text-white/50 hover:border-white/20 hover:text-white text-sm font-medium transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!titulo.trim() || loading}
            className="h-10 px-6 rounded-xl bg-[#a3e635] hover:bg-[#84cc16] text-black text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] shadow-[0_0_16px_rgba(163,230,53,0.15)]"
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> {tarefa ? 'Salvando...' : 'Criando...'}</>
            ) : (
              <>{tarefa ? <CheckSquare size={16} /> : <Plus size={16} />} {tarefa ? 'Salvar Alterações' : 'Criar Tarefa'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
