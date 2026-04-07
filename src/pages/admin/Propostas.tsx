// src/pages/admin/Propostas.tsx
import React, { useState, useMemo } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { 
  FileText, 
  Plus, 
  Search, 
  Eye, 
  Copy, 
  Trash2, 
  Clock, 
  Globe, 
  Power,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { usePropostas } from '@/hooks/usePropostas';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
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
import { PropostaModal } from '@/components/propostas/PropostaModal';
import type { Proposta, PropostaFormPayload } from '@/types/propostas';

export default function Propostas() {
  const { propostas, loading, addProposta, toggleAtiva, deleteProposta } = usePropostas();
  const [busca, setBusca] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [idParaDeletar, setIdParaDeletar] = useState<string | null>(null);
  const { toast } = useToast();

  const dadosFiltrados = useMemo(() => {
    return propostas.filter(p => 
      p.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      p.slug.toLowerCase().includes(busca.toLowerCase())
    );
  }, [propostas, busca]);

  const handleCopyLink = (slug: string) => {
    const url = `https://proposta.ngxgrupo.com/${slug}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copiado!",
      description: "O link da proposta foi copiado para a área de transferência.",
    });
  };

  const handleModalSubmit = async (payload: PropostaFormPayload) => {
    return await addProposta(payload);
  };

  return (
    <PageLayout className="bg-[#000]">
      <PageHeader
        icon={<FileText size={18} />}
        title="Propostas Comerciais"
        subtitle="Gerencie e visualize as propostas publicadas para seus clientes."
        action={
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl
            bg-[#a3e635] hover:opacity-90 text-black font-bold text-sm
            transition-all shadow-[0_0_20px_rgba(163,230,53,0.15)] active:scale-[0.98]">
            <Plus size={15} strokeWidth={2.5} /> Nova Proposta
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Barra de Busca */}
        <div className="flex flex-col md:flex-row items-center gap-4 bg-[#0d0d0d] border border-white/5 p-4 rounded-2xl">
          <div className="relative flex-1 w-full">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por título ou slug..."
              className="w-full h-10 bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#a3e635]/20 transition-all"
            />
          </div>
        </div>

        {/* Tabela de Propostas */}
        <div className="bg-[#0d0d0d] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5">
                  <th className="px-6 py-4 text-[10px] font-bold text-white/20 uppercase tracking-widest">Título / Slug</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-white/20 uppercase tracking-widest text-center">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-white/20 uppercase tracking-widest text-center">Visualizações</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-white/20 uppercase tracking-widest">Criada em</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-white/20 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <div className="w-8 h-8 border-2 border-[#a3e635]/20 border-t-[#a3e635] rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest">Carregando...</p>
                    </td>
                  </tr>
                ) : dadosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-white/20 italic text-sm">
                      Nenhuma proposta encontrada.
                    </td>
                  </tr>
                ) : dadosFiltrados.map(p => (
                  <tr key={p.id} className="group hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-white/80 text-sm font-bold leading-tight line-clamp-1">{p.titulo}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Globe size={10} className="text-white/20" />
                        <p className="text-white/30 text-[11px] font-medium break-all">proposta.ngxgrupo.com/{p.slug}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={`
                        inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest
                        ${p.ativa 
                          ? 'bg-[#a3e635]/10 text-[#a3e635]' 
                          : 'bg-white/5 text-white/20'}
                      `}>
                        {p.ativa ? 'Ativa' : 'Inativa'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="text-white font-black text-sm tabular-nums">{p.visualizacoes}</p>
                      <p className="text-[9px] text-white/20 font-bold uppercase tracking-tighter">Views</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-white/30 text-[11px]">
                        <Clock size={12} />
                        {format(parseISO(p.created_at), "dd/MM/yy", { locale: ptBR })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                        <a 
                          href={`https://proposta.ngxgrupo.com/${p.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 rounded-xl border border-white/5 text-white/20 hover:border-white/20 hover:text-white/60 flex items-center justify-center transition-all bg-white/5"
                          title="Ver Proposta"
                        >
                          <ExternalLink size={14} />
                        </a>
                        <button 
                          onClick={() => handleCopyLink(p.slug)}
                          className="w-9 h-9 rounded-xl border border-white/5 text-white/20 hover:border-[#a3e635]/20 hover:text-[#a3e635] flex items-center justify-center transition-all bg-white/5"
                          title="Copiar Link"
                        >
                          <Copy size={14} />
                        </button>
                        <button 
                          onClick={() => toggleAtiva(p.id, p.ativa)}
                          className={`
                            w-9 h-9 rounded-xl border border-white/5 flex items-center justify-center transition-all bg-white/5
                            ${p.ativa ? 'hover:text-amber-400 hover:border-amber-400/20' : 'hover:text-[#a3e635] hover:border-[#a3e635]/20'}
                          `}
                          title={p.ativa ? "Desativar" : "Ativar"}
                        >
                          <Power size={14} />
                        </button>
                        <button 
                          onClick={() => setIdParaDeletar(p.id)}
                          className="w-9 h-9 rounded-xl border border-white/5 text-white/20 hover:border-rose-400 hover:text-rose-400 flex items-center justify-center transition-all bg-white/5"
                          title="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <PropostaModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
      />

      <AlertDialog open={!!idParaDeletar} onOpenChange={(open) => !open && setIdParaDeletar(null)}>
        <AlertDialogContent className="bg-[#0a0a0a] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Deseja apagar esta proposta?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              Esta ação é irreversível e removerá todos os dados desta proposta. O link público deixará de funcionar imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => idParaDeletar && deleteProposta(idParaDeletar)}
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
