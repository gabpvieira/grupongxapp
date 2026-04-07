import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const KpiCard = ({ title, value, icon: Icon, description, trend }: KpiCardProps) => {
  return (
    <div className="bg-[#0d0d0d] border border-white/5 rounded-xl p-5 flex flex-col justify-between h-full transition-all hover:border-[#a3e635]/20 group">
      <div className="flex items-center justify-between">
        <span className="text-white/40 text-xs font-semibold uppercase tracking-wider">
          {title}
        </span>
        <div className="p-2 bg-white/5 rounded-lg group-hover:bg-[#a3e635]/10 group-hover:text-[#a3e635] transition-colors">
          <Icon size={18} />
        </div>
      </div>
      
      <div className="flex flex-col gap-1">
        <h3 className="text-2xl font-bold text-white tracking-tight">
          {value}
        </h3>
        {description && (
          <p className="text-white/25 text-xs font-medium">
            {description}
          </p>
        )}
      </div>

      {trend && (
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            trend.isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
          }`}>
            {trend.isPositive ? '+' : '-'}{trend.value}%
          </span>
          <span className="text-white/20 text-[10px]">vs. mês anterior</span>
        </div>
      )}
    </div>
  );
};

export default KpiCard;
