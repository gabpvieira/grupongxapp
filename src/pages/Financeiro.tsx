import { useState, useEffect, useCallback } from "react";
import { useFinanceiro, type VendaCompleta } from "@/hooks/useFinanceiro";
import KpisFinanceiro from "@/components/financeiro/KpisFinanceiro";
import LancamentosLista from "@/components/financeiro/LancamentosLista";
import LancamentoForm from "@/components/financeiro/LancamentoForm";
import LancamentoModal from "@/components/financeiro/LancamentoModal";
import ParcelaModal from "@/components/financeiro/ParcelaModal";
import FiltroPeriodo, { resolverPeriodo, type PeriodoFiltro } from "@/components/financeiro/FiltroPeriodo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { toast } from "sonner";
import { Wallet, List, PlusCircle } from "lucide-react";
import type { UpdateParcelaPayload } from "@/types/financeiro";
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';

const Financeiro = () => {
  const { 
    getKpis, 
    getVendas, 
    createVenda, 
    updateVenda, 
    updateParcela,
    deleteVenda,
    loading: hookLoading 
  } = useFinanceiro();

  const [kpis, setKpis] = useState<any>(null);
  const [loadingKpis, setLoadingKpis] = useState(true);
  const [vendas, setVendas] = useState<VendaCompleta[]>([]);
  const [loadingVendas, setLoadingVendas] = useState(true);
  const [responsavelId, setResponsavelId] = useState("todos");
  const [tipo, setTipo] = useState<'recorrente' | 'unico' | 'todos'>("todos");
  const [periodo, setPeriodo] = useState<PeriodoFiltro>({ tipo: 'mes_atual', inicio: null, fim: null });
  const [activeTab, setActiveTab] = useState("historico");
  const [editingVenda, setEditingVenda] = useState<VendaCompleta | null>(null);
  const [deletingVenda, setDeletingVenda] = useState<VendaCompleta | null>(null);
  const [gerenciandoVenda, setGerenciandoVenda] = useState<VendaCompleta | null>(null);

  const periodoResolvido = resolverPeriodo(periodo);

  const fetchKpis = useCallback(async (dataInicio: Date, dataFim: Date) => {
    setLoadingKpis(true);
    const data = await getKpis(dataInicio, dataFim);
    if (data) setKpis(data);
    setLoadingKpis(false);
  }, [getKpis]);

  const fetchVendas = useCallback(async (dataInicio: Date, dataFim: Date) => {
    setLoadingVendas(true);
    const data = await getVendas({ dataInicio, dataFim, responsavelId, tipo });
    setVendas(data);
    setLoadingVendas(false);
  }, [getVendas, responsavelId, tipo]);

  useEffect(() => {
    if (!periodoResolvido) return;
    fetchKpis(periodoResolvido.dataInicio, periodoResolvido.dataFim);
    fetchVendas(periodoResolvido.dataInicio, periodoResolvido.dataFim);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo, responsavelId, tipo]);

  const refetch = () => {
    if (!periodoResolvido) return;
    fetchKpis(periodoResolvido.dataInicio, periodoResolvido.dataFim);
    fetchVendas(periodoResolvido.dataInicio, periodoResolvido.dataFim);
  };

  const handleCreate = async (values: any) => {
    try {
      await createVenda(values);
      toast.success("Lançamento criado com sucesso!");
      refetch();
      setActiveTab("historico");
    } catch {
      toast.error("Erro ao criar lançamento");
    }
  };

  const handleUpdate = async (values: any) => {
    if (!editingVenda) return;
    try {
      await updateVenda(editingVenda.id, values);
      toast.success("Lançamento atualizado com sucesso!");
      refetch();
      setEditingVenda(null);
    } catch {
      toast.error("Erro ao atualizar lançamento");
    }
  };

  const handleDelete = async () => {
    if (!deletingVenda) return;
    try {
      await deleteVenda(deletingVenda.id);
      toast.success("Lançamento excluído!");
      refetch();
      setDeletingVenda(null);
    } catch {
      toast.error("Erro ao excluir lançamento");
    }
  };

  const handleSaveParcela = async (id: string, payload: UpdateParcelaPayload) => {
    await updateParcela(id, payload);
    toast.success("Parcela atualizada!");
    refetch();
    setGerenciandoVenda(null);
  };

  return (
    <PageLayout>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <PageHeader
          icon={<Wallet size={18} className="text-[#a3e635]" />}
          title="Gestão Financeira"
          subtitle="Controle de Lançamentos e Performance"
        >
          <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl h-auto flex justify-start md:inline-flex w-full md:w-auto mt-2">
            <TabsTrigger 
              value="historico" 
              className="rounded-lg data-[state=active]:bg-[#a3e635] data-[state=active]:text-black text-white/40 font-bold px-6 py-2 transition-all flex items-center gap-2"
            >
              <List size={16} /> Lançamentos
            </TabsTrigger>
            <TabsTrigger 
              value="novo" 
              className="rounded-lg data-[state=active]:bg-[#a3e635] data-[state=active]:text-black text-white/40 font-bold px-6 py-2 transition-all flex items-center gap-2"
            >
              <PlusCircle size={16} /> Novo Lançamento
            </TabsTrigger>
          </TabsList>
        </PageHeader>

        <div className="p-6 space-y-8">
          {/* KPIs */}
          <KpisFinanceiro 
            totalVendas={kpis?.totalVendas || 0}
            qtdNegocios={kpis?.qtdNegocios || 0}
            percentMeta={kpis?.percentMeta || 0}
            metaMensal={kpis?.metaMensal || 2500}
            loading={loadingKpis}
          />

          <TabsContent value="historico" className="mt-0 focus-visible:ring-0">
            <LancamentosLista 
              vendas={vendas}
              onEdit={setEditingVenda}
              onDelete={setDeletingVenda}
              onGerenciar={setGerenciandoVenda}
              responsavelId={responsavelId}
              setResponsavelId={setResponsavelId}
              tipo={tipo}
              setTipo={setTipo}
              filtroPeriodo={<FiltroPeriodo value={periodo} onChange={setPeriodo} />}
              loading={loadingVendas}
            />
          </TabsContent>

          <TabsContent value="novo" className="mt-0 focus-visible:ring-0">
            <div className="bg-[#0b0b0b] border border-white/5 rounded-2xl p-6 md:p-10">
              <div className="max-w-3xl mx-auto space-y-8">
                <div className="text-center md:text-left">
                  <h2 className="text-2xl font-bold tracking-tight  uppercase">Novo Lançamento</h2>
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-1">Preencha os dados da venda abaixo</p>
                </div>
                <LancamentoForm onSubmit={handleCreate} loading={hookLoading} />
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Modals e Dialogs permanecem fora do fluxo principal mas dentro do Layout se necessário,
          ou apenas no final do componente */}
      <LancamentoModal 
        isOpen={!!editingVenda}
        onClose={() => setEditingVenda(null)}
        venda={editingVenda}
        onSubmit={handleUpdate}
        loading={hookLoading}
      />

      <ParcelaModal
        isOpen={!!gerenciandoVenda}
        onClose={() => setGerenciandoVenda(null)}
        venda={gerenciandoVenda}
        onSave={handleSaveParcela}
        loading={hookLoading}
      />

      <AlertDialog open={!!deletingVenda} onOpenChange={(open) => !open && setDeletingVenda(null)}>
        <AlertDialogContent className="bg-black border-white/10 text-white p-8">
          <AlertDialogHeader className="mb-4">
            <AlertDialogTitle className="text-xl font-bold  uppercase">
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/40">
              Esta ação removerá permanentemente o lançamento do cliente <strong className="text-white">{deletingVenda?.cliente}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl px-6">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-rose-600 text-white hover:bg-rose-700 rounded-xl px-6 font-bold"
            >
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
};

export default Financeiro;

