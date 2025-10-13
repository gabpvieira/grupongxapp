import { useEffect, useState } from "react";
import { CircularGauge } from "@/components/CircularGauge";
import { useVendas } from "@/hooks/useVendas";
import { useConfig } from "@/hooks/useConfig";

const Dashboard = () => {
  const { getVendasPorMes } = useVendas();
  const { config } = useConfig();
  const [totalVendas, setTotalVendas] = useState(0);

  const currentMonth = new Date().toLocaleDateString("pt-BR", {
    month: "long",
  }).toUpperCase();

  useEffect(() => {
    const updateTotal = () => {
      const now = new Date();
      const vendasMes = getVendasPorMes(now.getMonth(), now.getFullYear());
      const total = vendasMes.reduce(
        (sum, v) => sum + (typeof v.valor === 'number' ? v.valor : Number(v.valor)),
        0
      );
      setTotalVendas(total);
    };

    updateTotal();
    const interval = setInterval(updateTotal, 1000);

    return () => clearInterval(interval);
  }, [getVendasPorMes]);

  // Force re-render when config changes
  useEffect(() => {
    // This effect will trigger when config changes
  }, [config]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="flex flex-col items-center gap-8 max-w-4xl w-full">
        {/* Logo */}
        <img
          src="/logo.png"
          alt="NGX Growth"
          className="h-20 object-contain"
        />

        {/* Month */}
        <p className="text-xl text-muted-foreground uppercase tracking-widest font-normal">
          Mês de {currentMonth}
        </p>

        {/* Gauge */}
        <div className="flex flex-col items-center gap-6">
          <CircularGauge
            value={totalVendas}
            max={config?.meta || 50000}
            label="TOTAL EM VENDAS"
          />
          
          {/* Total Value - displayed below gauge */}
          <div className="text-center -mt-2">
            <p className="text-7xl font-bold text-[#acf500] tracking-tight">
              {formatCurrency(totalVendas)}
            </p>
          </div>
        </div>

        {/* Meta info */}
        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1 font-medium">
            Meta Mensal
          </p>
          <p className="text-xl font-semibold text-primary">
            {formatCurrency(config?.meta || 50000)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
