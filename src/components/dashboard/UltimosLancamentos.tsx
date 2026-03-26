import { List, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UltimosLancamentosProps {
  lancamentos: {
    id: string;
    cliente: string;
    servico: string;
    valor: number;
    data_fechamento: string;
    vendedor_nome: string;
  }[];
}

const UltimosLancamentos = ({ lancamentos }: UltimosLancamentosProps) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  return (
    <div className="bg-[#0d0d0d] border border-white/5 rounded-xl p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-lg tracking-tight flex items-center gap-2">
          <List className="text-[#a3e635]" size={20} />
          Últimos Lançamentos
        </h3>
        <span className="text-white/20 text-xs font-medium">Histórico Recente</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 text-white/20 text-[10px] uppercase font-bold tracking-widest">
              <th className="pb-3 pl-2">Cliente / Serviço</th>
              <th className="pb-3 text-center">Data</th>
              <th className="pb-3 text-center">Responsável</th>
              <th className="pb-3 text-right pr-2">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {lancamentos.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-white/10 text-sm italic">
                  Nenhum registro encontrado
                </td>
              </tr>
            ) : (
              lancamentos.map((v) => (
                <tr key={v.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 pl-2">
                    <p className="text-white font-bold text-sm truncate max-w-[180px]">
                      {v.cliente}
                    </p>
                    <p className="text-white/30 text-[11px] font-medium flex items-center gap-1.5 mt-0.5">
                      <span className="w-1 h-1 rounded-full bg-[#a3e635]/40" />
                      {v.servico}
                    </p>
                  </td>
                  <td className="py-4 text-center">
                    <div className="inline-flex flex-col items-center">
                      <p className="text-white/60 text-xs font-medium">
                        {format(new Date(v.data_fechamento), 'dd/MM', { locale: ptBR })}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 text-center">
                    <div className="inline-flex items-center gap-2 bg-white/5 px-2 py-1 rounded-full">
                      <div className="w-4 h-4 rounded-full bg-[#a3e635]/20 flex items-center justify-center">
                        <User size={10} className="text-[#a3e635]" />
                      </div>
                      <span className="text-[10px] text-white/50 font-bold truncate max-w-[80px]">
                        {v.vendedor_nome}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 text-right pr-2">
                    <p className="text-[#a3e635] font-bold text-sm tabular-nums">
                      {formatCurrency(v.valor)}
                    </p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UltimosLancamentos;
