import { useEffect, useState } from "react";

interface CircularGaugeProps {
  value: number;
  max: number;
  label: string;
}

export const CircularGauge = ({ value, max, label }: CircularGaugeProps) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const percentage = Math.min((value / max) * 100, 100);
  const width = 500;
  const height = 300;
  const strokeWidth = 45;
  const radius = 180;
  const centerX = width / 2;
  const centerY = height - 30;
  
  // Semicircle path (180 degrees)
  const startAngle = Math.PI; // Start at left (180 degrees)
  const endAngle = 2 * Math.PI; // End at right (360 degrees = 0 degrees)
  const arcLength = Math.PI * radius; // Half circumference
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const createArcPath = (startAngle: number, endAngle: number, radius: number) => {
    const start = {
      x: centerX + radius * Math.cos(startAngle),
      y: centerY + radius * Math.sin(startAngle),
    };
    const end = {
      x: centerX + radius * Math.cos(endAngle),
      y: centerY + radius * Math.sin(endAngle),
    };
    const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };

  const fillEndAngle = startAngle + (animatedPercentage / 100) * Math.PI;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width={width} height={height} className="overflow-visible">
          {/* Background arc - subtle border */}
          <path
            d={createArcPath(startAngle, endAngle, radius)}
            fill="none"
            stroke="rgba(255, 255, 255, 0.03)"
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
          />
          
          {/* Filled arc (vibrant green) */}
          <path
            d={createArcPath(startAngle, fillEndAngle, radius)}
            fill="none"
            stroke="#a3e635"
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            style={{
              transition: "d 1s ease-in-out",
              filter: "drop-shadow(0 0 12px rgba(163, 230, 53, 0.3))",
            }}
          />
        </svg>
        
        {/* Text overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-8">
          <p className="text-[10px] font-extrabold text-white/20 uppercase tracking-[0.2em] mb-1">
            {label}
          </p>
          <div className="w-8 h-[1px] bg-white/10" />
        </div>
      </div>
    </div>
  );
};
