import KpiCard from "@/components/dashboard/KpiCard";
import { DollarSign, Briefcase, Target } from "lucide-react";

interface KpisFinanceiroProps {
  totalVendas: number;
  qtdNegocios: number;
  percentMeta: number;
  metaMensal: number;
  loading?: boolean;
}

const KpisFinanceiro = ({ 
  totalVendas, 
  qtdNegocios, 
  percentMeta, 
  metaMensal,
  loading 
}: KpisFinanceiroProps) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-white/5 rounded-xl border border-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <KpiCard 
        title="Total em Vendas" 
        value={formatCurrency(totalVendas)}
        icon={DollarSign}
        description="Acumulado do mês atual"
      />
      <KpiCard 
        title="Negócios Fechados" 
        value={qtdNegocios}
        icon={Briefcase}
        description="Contratos registrados este mês"
      />
      <KpiCard 
        title="Progresso da Meta" 
        value={`${percentMeta.toFixed(1)}%`}
        icon={Target}
        description={`Meta: ${formatCurrency(metaMensal)}`}
      />
    </div>
  );
};

export default KpisFinanceiro;
