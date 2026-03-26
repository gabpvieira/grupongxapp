import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface EvolucaoMensalProps {
  data: {
    mes: string;
    valor: number;
  }[];
  meta: number;
}

const EvolucaoMensal = ({ data, meta }: EvolucaoMensalProps) => {
  return (
    <div className="bg-[#0d0d0d] border border-white/5 rounded-xl p-6 flex flex-col gap-6 h-[400px]">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-lg tracking-tight flex items-center gap-2">
          <TrendingUp className="text-[#a3e635]" size={20} />
          Evolução de Vendas
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#a3e635]" />
            <span className="text-white/20 text-[10px] font-bold uppercase">Real</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full border border-white/20 border-dashed" />
            <span className="text-white/20 text-[10px] font-bold uppercase">Meta</span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="rgba(255,255,255,0.04)" 
            />
            <XAxis 
              dataKey="mes" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10, fontWeight: 600 }}
              dy={10}
            />
            <YAxis 
              hide 
            />
            <Tooltip 
              cursor={{ fill: 'rgba(163,230,53,0.03)' }}
              contentStyle={{ 
                backgroundColor: '#1a1a1a', 
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '12px'
              }}
              itemStyle={{ color: '#a3e635', fontWeight: 'bold' }}
              labelStyle={{ color: 'rgba(255,255,255,0.4)', marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase' }}
              formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Vendas']}
            />
            <ReferenceLine 
              y={meta} 
              stroke="rgba(163,230,53,0.3)" 
              strokeDasharray="4 4" 
              label={{ 
                position: 'right', 
                value: 'META', 
                fill: 'rgba(163,230,53,0.4)', 
                fontSize: 9, 
                fontWeight: 800 
              }} 
            />
            <Bar 
              dataKey="valor" 
              fill="#a3e635" 
              radius={[4, 4, 0, 0]} 
              barSize={32}
              animationDuration={1500}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EvolucaoMensal;
