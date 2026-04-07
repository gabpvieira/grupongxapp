import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Target, 
  Users, 
  SlidersHorizontal, 
  Trash2, 
  UserPlus, 
  Loader2, 
  CheckCircle2, 
  Info,
  AlertCircle
} from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { SettingsSection } from '@/components/configuracoes/SettingsSection';
import { useConfiguracoes } from '@/hooks/useConfiguracoes';
import { useMetas } from '@/hooks/useMetas';
import { toast } from 'sonner';
import { formatCurrency, parseCurrency } from '@/lib/utils';
import { maskBRL, unmaskBRL } from '@/lib/masks';

const Configuracoes: React.FC = () => {
  const {
    loading,
    salvando,
    metaMensal: dbMetaMensal,
    metasSemanais,
    vendedores,
    salvarMetaMensal,
    salvarTodasMetas,
    toggleVendedorAtivo,
    deletarVendedor,
    adicionarVendedor
  } = useConfiguracoes();

  const { getProximasMetas, salvarMetaMes, loading: carregandoMetas } = useMetas();

  const [tabAtiva, setTabAtiva] = useState('geral');
  
  // Estado local para Meta Mensal
  const [localMetaMensal, setLocalMetaMensal] = useState<string>('0');
  
  // Estado local para Metas Semanais
  const [valoresMetas, setValoresMetas] = useState<Record<string, string>>({});
  const [alteracoesMetas, setAlteracoesMetas] = useState<Record<string, string>>({});
  
  // Estado local para Novo Vendedor
  const [novoNome, setNovoNome] = useState('');
  const [novoEmail, setNovoEmail] = useState('');

  // Estado para Metas Mensais
  const [metasMensais, setMetasMensais] = useState<any[]>([]);
  const [editandoMes, setEditandoMes] = useState<string | null>(null);
  const [valorEditando, setValorEditando] = useState<string>('');

  // Sincronizar dados iniciais
  useEffect(() => {
    if (!loading) {
      // Inicializar com máscara (valor vindo do banco é float, converter para base 100 antes de mascarar)
      setLocalMetaMensal(maskBRL(String(Math.round(dbMetaMensal * 100))));
      
      const valObj: Record<string, string> = {};
      metasSemanais.forEach(m => {
        valObj[m.metrica] = m.valor_meta.toString();
      });
      setValoresMetas(valObj);
    }
    
    // Carregar metas mensais
    if (tabAtiva === 'metas') {
      getProximasMetas().then(setMetasMensais);
    }
  }, [loading, dbMetaMensal, metasSemanais, tabAtiva, getProximasMetas]);

  const handleMetaSemanalChange = (metrica: string, valor: string) => {
    setValoresMetas(prev => ({ ...prev, [metrica]: valor }));
    setAlteracoesMetas(prev => ({ ...prev, [metrica]: valor }));
  };

  const onSalvarMetaMensal = () => {
    const valor = unmaskBRL(localMetaMensal);
    if (valor <= 0) {
      toast.error('Valor da meta inválido');
      return;
    }
    salvarMetaMensal(valor);
  };

  const onSalvarTodasMetas = async () => {
    const success = await salvarTodasMetas(alteracoesMetas);
    if (success) {
      setAlteracoesMetas({});
    }
  };

  const onAdicionarVendedor = async () => {
    if (!novoNome.trim() || !novoEmail.trim()) return;
    const success = await adicionarVendedor(novoNome, novoEmail);
    if (success) {
      setNovoNome('');
      setNovoEmail('');
    }
  };

  const handleSalvarMetaMensalEspecifica = async (ano: number, mes: number) => {
    const valor = unmaskBRL(valorEditando);
    if (valor <= 0) {
      toast.error('Valor da meta inválido');
      return;
    }

    const success = await salvarMetaMes(ano, mes, valor);
    if (success) {
      toast.success('Meta atualizada com sucesso');
      setEditandoMes(null);
      getProximasMetas().then(setMetasMensais);
    } else {
      toast.error('Erro ao salvar meta');
    }
  };

  const formatCurrency = (val: string | number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#a3e635]" />
        </div>
      </PageLayout>
    );
  }

  const tabs = [
    { id: 'geral',  label: 'Geral',   icon: SlidersHorizontal },
    { id: 'metas',  label: 'Metas',   icon: Target            },
    { id: 'equipe', label: 'Equipe',  icon: Users             },
  ];

  return (
    <PageLayout>
      <PageHeader
        icon={<Settings className="text-[#a3e635]" size={18} />}
        title="Configurações"
        subtitle="Ajustes de metas, equipe e parâmetros do sistema"
      />

      {/* Tabs Layout */}
      <div className="flex gap-1 border-b border-white/5 px-6 pt-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTabAtiva(id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px outline-none
              ${tabAtiva === id 
                ? 'border-[#a3e635] text-white' 
                : 'border-transparent text-white/30 hover:text-white/50'
              }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div className="p-6 max-w-4xl mx-auto">
        {/* TAB 1: GERAL */}
        {tabAtiva === 'geral' && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
            <SettingsSection
              title="Preferências do Sistema"
              description="Personalize o comportamento geral da plataforma."
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/2 rounded-2xl border border-white/5 opacity-50 cursor-not-allowed group">
                  <div className="flex-1">
                    <p className="text-white/80 text-sm font-bold">Modo Escuro (Padrão)</p>
                    <p className="text-white/30 text-xs font-medium">Otimizado para o padrão NGX.</p>
                  </div>
                  <CheckCircle2 size={18} className="text-[#a3e635]" />
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-[#a3e635]/5 rounded-2xl border border-[#a3e635]/10 border-dashed">
                  <AlertCircle size={16} className="text-[#a3e635]" />
                  <p className="text-[#a3e635] text-xs font-bold leading-relaxed">
                    Novas preferências de interface serão liberadas na próxima atualização.
                  </p>
                </div>
              </div>
            </SettingsSection>
          </div>
        )}

        {/* TAB 2: METAS */}
        {tabAtiva === 'metas' && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 space-y-12">
            <SettingsSection
              title="Meta Padrão Global"
              description="Valor usado como fallback para meses que não possuem uma meta específica definida."
            >
              <div className="flex items-center gap-3 max-w-sm">
                <div className="relative flex-1 group">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={localMetaMensal}
                    onChange={e => setLocalMetaMensal(maskBRL(e.target.value))}
                    placeholder="R$ 0,00"
                    className="w-full h-11 bg-black border-none rounded-xl px-5 text-white text-sm font-bold focus:ring-1 focus:ring-[#a3e635]/30 transition-all placeholder:text-white/10"
                  />
                </div>
                <button
                  onClick={onSalvarMetaMensal}
                  disabled={salvando || unmaskBRL(localMetaMensal) <= 0 || unmaskBRL(localMetaMensal) === dbMetaMensal}
                  className="h-11 px-6 rounded-xl bg-[#a3e635] hover:bg-[#84cc16] text-black text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] shadow-lg shadow-[#a3e635]/10"
                >
                  {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                </button>
              </div>
            </SettingsSection>

            <SettingsSection
              title="Metas de Vendas por Mês"
              description="Defina metas específicas para os próximos meses. Se não definida, o sistema usará a Meta Padrão Global."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {metasMensais.map((m) => {
                  const hoje = new Date();
                  const isAtual = m.ano === hoje.getFullYear() && m.mes === (hoje.getMonth() + 1);

                  return (
                    <div 
                      key={m.key} 
                      className={`p-5 rounded-2xl border transition-all ${
                        isAtual 
                          ? 'bg-[#a3e635]/5 border-[#a3e635]/20' 
                          : 'bg-black/40 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold text-sm capitalize">{m.label}</p>
                          {isAtual && (
                            <span className="px-2 py-0.5 rounded-lg bg-[#a3e635] text-black text-[10px] font-black uppercase tracking-tighter">
                              Atual
                            </span>
                          )}
                        </div>
                        <Target size={14} className="text-white/20" />
                      </div>

                    {editandoMes === m.key ? (
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            inputMode="numeric"
                            autoFocus
                            value={valorEditando}
                            onChange={e => setValorEditando(maskBRL(e.target.value))}
                            className="w-full h-9 bg-black border border-white/10 rounded-lg px-3 text-white text-sm font-bold focus:ring-1 focus:ring-[#a3e635]/30 outline-none"
                          />
                        </div>
                        <button
                          disabled={unmaskBRL(valorEditando) <= 0}
                          onClick={() => handleSalvarMetaMensalEspecifica(m.ano, m.mes)}
                          className="h-9 px-3 rounded-lg bg-[#a3e635] text-black text-[10px] font-black uppercase hover:bg-[#84cc16] transition-all disabled:opacity-30"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => setEditandoMes(null)}
                          className="h-9 px-3 rounded-lg bg-white/5 text-white/40 text-[10px] font-black uppercase hover:bg-white/10 transition-all"
                        >
                          X
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xl font-black text-white tracking-tight">
                            {m.valor ? formatCurrency(m.valor) : <span className="text-white/20 text-sm font-bold uppercase tracking-widest">Usar Padrão</span>}
                          </p>
                          {!m.valor && (
                            <p className="text-[10px] text-white/20 font-medium">Herdando: {formatCurrency(dbMetaMensal)}</p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setEditandoMes(m.key);
                            setValorEditando(maskBRL(String(Math.round((m.valor || dbMetaMensal) * 100))));
                          }}
                          className="h-8 px-4 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 text-[10px] font-bold uppercase transition-all"
                        >
                          Editar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            </SettingsSection>

            <SettingsSection
              title="Metas Semanais"
              description="Valores de referência usados na página de Métricas da Semana. Apenas métricas ativas são exibidas."
            >
              <div className="bg-black/40 rounded-2xl border border-white/5 overflow-hidden">
                <div className="flex flex-col divide-y divide-white/5">
                  {metasSemanais.map(m => (
                    <div key={m.metrica} className="flex items-center gap-4 p-5 hover:bg-white/2 transition-all group">
                      <div className="flex-1">
                        <p className="text-white/90 text-sm font-bold tracking-tight group-hover:text-white transition-colors">
                          {m.metrica.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </p>
                        <p className="text-white/30 text-xs font-medium mt-0.5 line-clamp-1">{m.descricao || 'Sem descrição definida.'}</p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="relative">
                          <input
                            type="number"
                            value={valoresMetas[m.metrica] || ''}
                            onChange={e => handleMetaSemanalChange(m.metrica, e.target.value)}
                            className="w-28 h-10 bg-black/60 border border-white/5 rounded-xl px-4 text-white text-sm font-bold text-right focus:outline-none focus:ring-1 focus:ring-[#a3e635]/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"
                            placeholder="0"
                          />
                        </div>
                        <span className="text-white/20 text-[10px] font-black uppercase w-8 tracking-tighter">
                          {m.unidade || (m.metrica.includes('mrr') || m.metrica.includes('finan') ? 'BRL' : 'UN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-white/2 border-t border-white/5 flex items-center justify-between">
                  <div>
                    {Object.keys(alteracoesMetas).length > 0 && (
                      <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest pl-2">
                        {Object.keys(alteracoesMetas).length} meta{Object.keys(alteracoesMetas).length !== 1 ? 's' : ''} alterada{Object.keys(alteracoesMetas).length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={onSalvarTodasMetas}
                    disabled={Object.keys(alteracoesMetas).length === 0 || salvando}
                    className="h-10 px-6 rounded-xl bg-[#a3e635] hover:bg-[#84cc16] text-black text-sm font-bold transition-all disabled:opacity-20 disabled:cursor-not-allowed active:scale-[0.98] shadow-xl shadow-[#a3e635]/5"
                  >
                    {salvando ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : 'Salvar todas as metas'}
                  </button>
                </div>
              </div>
            </SettingsSection>
          </div>
        )}

        {/* TAB 3: EQUIPE */}
        {tabAtiva === 'equipe' && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
            <SettingsSection
              title="Membros da Equipe"
              description="Gerencie os vendedores e colaboradores com acesso ao painel."
            >
              <div className="flex flex-col gap-3 mb-10">
                {vendedores.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center bg-black/40 rounded-3xl border border-white/5 border-dashed">
                    <Users className="text-white/10 mb-2" size={32} />
                    <p className="text-white/30 text-xs font-bold uppercase tracking-widest">Nenhum membro encontrado</p>
                  </div>
                ) : (
                  vendedores.map(v => (
                    <div key={v.id} className="flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
                      <div className="w-10 h-10 rounded-full bg-[#a3e635]/15 border border-[#a3e635]/25 flex items-center justify-center text-[#a3e635] font-black text-sm flex-shrink-0 group-hover:scale-110 transition-transform">
                        {v.nome[0].toUpperCase()}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-white/90 text-sm font-bold tracking-tight">{v.nome}</p>
                        <p className="text-white/30 text-[11px] font-medium truncate">{v.email}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest
                          ${v.ativo ? 'bg-[#a3e635]/10 text-[#a3e635]' : 'bg-white/5 text-white/30'}
                        `}>
                          {v.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                        
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => toggleVendedorAtivo(v.id, v.ativo)}
                            className="h-8 px-3 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 text-[10px] font-bold uppercase transition-all"
                          >
                            {v.ativo ? 'Desativar' : 'Ativar'}
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Remover ${v.nome} da equipe?`)) {
                                deletarVendedor(v.id);
                              }
                            }}
                            className="w-8 h-8 rounded-lg bg-red-500/5 border border-red-500/10 text-red-400/40 hover:text-red-400 hover:bg-red-500/15 flex items-center justify-center transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-white/5 pt-10">
                <div className="flex items-center gap-2 mb-4">
                  <UserPlus size={14} className="text-[#a3e635]" />
                  <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.2em]">Adicionar Novo Membro</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    placeholder="Nome completo"
                    value={novoNome}
                    onChange={e => setNovoNome(e.target.value)}
                    className="flex-1 h-12 bg-black border-none rounded-xl px-5 text-white text-sm font-medium placeholder:text-white/10 focus:ring-1 focus:ring-[#a3e635]/20 transition-all"
                  />
                  <input
                    placeholder="email@empresa.com"
                    value={novoEmail}
                    onChange={e => setNovoEmail(e.target.value)}
                    className="flex-1 h-12 bg-black border-none rounded-xl px-5 text-white text-sm font-medium placeholder:text-white/10 focus:ring-1 focus:ring-[#a3e635]/20 transition-all"
                  />
                  <button
                    onClick={onAdicionarVendedor}
                    disabled={!novoNome.trim() || !novoEmail.trim() || salvando}
                    className="h-12 px-6 rounded-xl bg-[#a3e635] hover:bg-[#84cc16] text-black text-sm font-black transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-2xl shadow-[#a3e635]/5 group"
                  >
                    {salvando ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : (
                      <>
                        <UserPlus size={16} className="group-hover:scale-125 transition-transform" />
                        Adicionar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </SettingsSection>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Configuracoes;
