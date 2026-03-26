import { Trophy, Medal, User } from 'lucide-react';

interface RankingVendedoresProps {
  ranking: {
    vendedor_id: string;
    nome: string;
    total: number;
    qtd: number;
  }[];
}

const RankingVendedores = ({ ranking }: RankingVendedoresProps) => {
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
          <Trophy className="text-[#a3e635]" size={20} />
          Ranking Mensal
        </h3>
        <span className="text-white/20 text-xs font-medium">Top Performance</span>
      </div>

      <div className="flex flex-col gap-4">
        {ranking.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-20">
            <User size={40} />
            <p className="text-sm">Nenhuma venda este mês</p>
          </div>
        ) : (
          ranking.map((item, index) => {
            const isFirst = index === 0;
            return (
              <div 
                key={item.vendedor_id}
                className={`flex items-center gap-4 p-3 rounded-lg border transition-all ${
                  isFirst 
                    ? 'bg-[#a3e635]/5 border-[#a3e635]/20 ring-1 ring-[#a3e635]/10' 
                    : 'bg-white/5 border-transparent hover:border-white/10'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  isFirst ? 'bg-[#a3e635] text-black' : 'bg-white/10 text-white/40'
                }`}>
                  {index + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={`font-bold truncate ${isFirst ? 'text-white' : 'text-white/80'}`}>
                    {item.nome}
                  </p>
                  <p className="text-xs text-white/30 font-medium">
                    {item.qtd} negócios fechados
                  </p>
                </div>

                <div className="text-right">
                  <p className={`font-bold tracking-tight ${isFirst ? 'text-[#a3e635]' : 'text-white'}`}>
                    {formatCurrency(item.total)}
                  </p>
                  {isFirst && (
                    <span className="text-[10px] text-[#a3e635]/50 font-bold uppercase tracking-tighter">
                      Líder atual
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RankingVendedores;
