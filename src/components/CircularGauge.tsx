import { useEffect, useState } from "react";

interface CircularGaugeProps {
  value: number;
  max: number;
  label: string;
  children?: React.ReactNode;
}

export const CircularGauge = ({ value, max, label, children }: CircularGaugeProps) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const percentage = Math.min(value / max, 1); // 0 a 1, cap em 100%
  
  const cx = 150;        // centro X do viewBox 300x160
  const cy = 150;        // centro Y (posicionado na base para semicírculo)
  const raio = 120;      // raio do arco
  const espessura = 28;  // stroke-width (ajustado para visual premium)

  // Circunferência do semicírculo (180°)
  const semicircunferencia = Math.PI * raio;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  // Arco de progresso: dashoffset move de semicircunferencia (0%) até 0 (100%)
  const dashOffset = semicircunferencia * (1 - animatedPercentage);

  return (
    <div className="flex flex-col items-center w-full overflow-hidden">
      <div className="relative w-full flex justify-center">
        <svg 
          viewBox="0 0 300 165" 
          className="w-full h-auto max-w-[500px] overflow-visible"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Trilha de fundo (cinza sutil) */}
          <circle
            cx={cx}
            cy={cy}
            r={raio}
            fill="none"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth={espessura}
            strokeDasharray={`${semicircunferencia} ${semicircunferencia}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            transform={`rotate(-180 ${cx} ${cy})`}
          />
          
          {/* Arco de progresso (lime-400 com brilho) */}
          <circle
            cx={cx}
            cy={cy}
            r={raio}
            fill="none"
            stroke="#a3e635"
            strokeWidth={espessura}
            strokeDasharray={`${semicircunferencia} ${semicircunferencia}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-180 ${cx} ${cy})`}
            style={{
              transition: "stroke-dashoffset 1s ease-in-out",
              filter: "drop-shadow(0 0 8px rgba(163, 230, 53, 0.3))",
            }}
          />
        </svg>
        
        {/* Overlay de Conteúdo e Texto */}
        <div className="absolute inset-x-0 bottom-6 flex flex-col items-center justify-end">
          {children && <div className="mb-3 animate-in zoom-in duration-500">{children}</div>}
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-1.5">
            {label}
          </p>
          <div className="w-10 h-[1px] bg-white/10" />
        </div>
      </div>
    </div>
  );
};
