import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useMetricas } from "@/hooks/useMetricas";
import { 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Minus,
  Rocket,
  Calendar,
  BarChart3,
  Eye,
  ArrowLeft,
  Save
} from "lucide-react";

// Tipos de dados
interface Metric {
  id: string;
  name: string;
  target: string;
  real: string;
  status: 'meta-ultrapassada' | 'meta-atingida' | 'parcial' | 'nao-atingida' | 'sem-meta';
}

interface WeekSummary {
  totalMetas: number;
  metasAtingidas: number;
  metasUltrapassadas: number;
  metasNaoAtingidas: number;
  parciais: number;
}

interface WeekData {
  dateRange: string;
  metrics: Metric[];
  summary: WeekSummary;
  savedAt: string;
}

interface WeeklyMetricsData {
  [weekKey: string]: WeekData;
}

// Componente de Input controlado para evitar interferências de estado
const ControlledInput = ({ metric, onUpdate }: { metric: Metric, onUpdate: (id: string, value: string) => void }) => {
  const [localValue, setLocalValue] = useState(metric.real);
  
  useEffect(() => {
    setLocalValue(metric.real);
  }, [metric.real]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalValue(value);
    onUpdate(metric.id, value);
  };
  
  return (
    <Input
      value={localValue}
      onChange={handleChange}
      className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-[#8bdb00] focus:ring-[#8bdb00]/20 max-w-32"
      placeholder="Digite o valor"
    />
  );
};

const MetricasSemana: React.FC = () => {
  const {
    currentMetrics,
    setCurrentMetrics,
    weeklyHistory,
    loading,
    error,
    saveCurrentWeek: saveWeek,
    loadWeeklyHistory,
    getCurrentWeekKey,
    getMostRecentWeekKey,
    getWeekRange
  } = useMetricas();
  
  const [viewMode, setViewMode] = useState<'current' | 'history' | 'detail'>('current');
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [showNotification, setShowNotification] = useState(false);

  // O carregamento agora é gerenciado automaticamente pelo hook useMetricas

  // Função para calcular status baseado na meta e valor real
  const calculateStatus = (target: string, real: string): Metric['status'] => {
    if (!real || real.trim() === '') return 'sem-meta';
    if (target === '-') return 'sem-meta';

    const realValue = parseFloat(real.replace(/[^\d.,]/g, '').replace(',', '.'));
    
    if (isNaN(realValue)) return 'sem-meta';

    // Verificar se é uma faixa (ex: "2-3", "40-50h")
    if (target.includes('-')) {
      const rangeParts = target.split('-');
      const minValue = parseFloat(rangeParts[0]);
      const maxValue = parseFloat(rangeParts[1].replace(/[^\d.,]/g, '').replace(',', '.'));
      
      if (realValue >= minValue && realValue <= maxValue) {
        return 'meta-atingida';
      } else if (realValue > maxValue) {
        return 'meta-ultrapassada';
      } else if (realValue < minValue) {
        // Verificar se está próximo (parcial)
        const tolerance = (maxValue - minValue) * 0.2; // 20% de tolerância
        if (realValue >= minValue - tolerance) {
          return 'parcial';
        }
        return 'nao-atingida';
      }
    }
    
    // Verificar se é um valor mínimo (ex: "100+")
    if (target.includes('+')) {
      const minValue = parseFloat(target.replace(/[^\d.,]/g, '').replace(',', '.'));
      if (realValue >= minValue) {
        return realValue > minValue * 1.2 ? 'meta-ultrapassada' : 'meta-atingida';
      } else {
        return realValue >= minValue * 0.8 ? 'parcial' : 'nao-atingida';
      }
    }
    
    // Valor exato
    const targetValue = parseFloat(target.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (realValue >= targetValue) {
      return realValue > targetValue * 1.2 ? 'meta-ultrapassada' : 'meta-atingida';
    } else {
      return realValue >= targetValue * 0.8 ? 'parcial' : 'nao-atingida';
    }
  };

  // Atualizar valor real de uma métrica
  const updateMetricReal = useCallback((id: string, value: string) => {
    setCurrentMetrics(prev => prev.map(metric => {
      if (metric.id === id) {
        const newStatus = calculateStatus(metric.target, value);
        return { ...metric, real: value, status: newStatus };
      }
      return metric;
    }));
  }, []);

  // Calcular resumo da semana
  const calculateSummary = (metrics: Metric[]): WeekSummary => {
    const summary = {
      totalMetas: 0,
      metasAtingidas: 0,
      metasUltrapassadas: 0,
      metasNaoAtingidas: 0,
      parciais: 0
    };

    metrics.forEach(metric => {
      if (metric.target !== '-' && metric.real.trim() !== '') {
        summary.totalMetas++;
        switch (metric.status) {
          case 'meta-atingida':
            summary.metasAtingidas++;
            break;
          case 'meta-ultrapassada':
            summary.metasUltrapassadas++;
            break;
          case 'nao-atingida':
            summary.metasNaoAtingidas++;
            break;
          case 'parcial':
            summary.parciais++;
            break;
        }
      }
    });

    return summary;
  };

  // Salvar semana atual
  const saveCurrentWeek = async () => {
    try {
      await saveWeek();
      
      // Mostrar notificação
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar semana:', error);
      // Aqui você pode adicionar uma notificação de erro se desejar
    }
  };

  // Obter ícone e cor do status
  const getStatusDisplay = (status: Metric['status']) => {
    switch (status) {
      case 'meta-ultrapassada':
        return { 
          icon: <Rocket className="w-4 h-4" />, 
          color: 'bg-green-600 text-green-100 border-green-500',
          text: 'Meta ultrapassada'
        };
      case 'meta-atingida':
        return { 
          icon: <CheckCircle className="w-4 h-4" />, 
          color: 'bg-[#8bdb00] text-black border-[#7bc700]',
          text: 'Meta atingida'
        };
      case 'parcial':
        return { 
          icon: <AlertTriangle className="w-4 h-4" />, 
          color: 'bg-yellow-600 text-yellow-100 border-yellow-500',
          text: 'Parcialmente atingida'
        };
      case 'nao-atingida':
        return { 
          icon: <XCircle className="w-4 h-4" />, 
          color: 'bg-red-600 text-red-100 border-red-500',
          text: 'Meta não atingida'
        };
      default:
        return { 
          icon: <Minus className="w-4 h-4" />, 
          color: 'bg-slate-600 text-slate-300 border-slate-500',
          text: 'Sem meta definida'
        };
    }
  };

  // Renderizar tabela de métricas
  const renderMetricsTable = (metrics: Metric[], isReadOnly = false) => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700/50">
            <th className="text-left p-3 text-slate-300 font-medium">MÉTRICA</th>
            <th className="text-left p-3 text-slate-300 font-medium">META</th>
            <th className="text-left p-3 text-slate-300 font-medium">REAL</th>
            <th className="text-left p-3 text-slate-300 font-medium">STATUS</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((metric) => {
            const statusDisplay = getStatusDisplay(metric.status);
            return (
              <tr key={metric.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                <td className="p-3 text-slate-200 font-medium">{metric.name}</td>
                <td className="p-3 text-slate-300">{metric.target}</td>
                <td className="p-3">
                  {isReadOnly ? (
                    <span className="text-slate-200">{metric.real || '-'}</span>
                  ) : (
                    <ControlledInput
                      metric={metric}
                      onUpdate={updateMetricReal}
                    />
                  )}
                </td>
                <td className="p-3">
                  <Badge className={`${statusDisplay.color} flex items-center gap-1 w-fit`}>
                    {statusDisplay.icon}
                    <span className="hidden sm:inline">{statusDisplay.text}</span>
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  // Renderizar legenda de status
  const renderStatusLegend = () => (
    <Card className="bg-slate-800/60 border-slate-700/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-slate-200 text-sm">Legenda de Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { status: 'meta-ultrapassada', label: 'Meta ultrapassada' },
            { status: 'meta-atingida', label: 'Meta atingida' },
            { status: 'parcial', label: 'Parcialmente atingida' },
            { status: 'nao-atingida', label: 'Meta não atingida' },
            { status: 'sem-meta', label: 'Sem meta definida' }
          ].map(({ status, label }) => {
            const display = getStatusDisplay(status as Metric['status']);
            return (
              <div key={status} className="flex items-center gap-2">
                <Badge className={`${display.color} flex items-center gap-1`}>
                  {display.icon}
                </Badge>
                <span className="text-slate-300 text-xs">{label}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  // Renderizar histórico
  const renderHistory = () => {
    const sortedWeeks = Object.entries(weeklyHistory)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime());

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-200 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#8bdb00]" />
            Histórico de Registros
          </h2>
          <Button 
            onClick={() => setViewMode('current')}
            variant="outline"
            className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white hover:border-[#8bdb00]/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>

        {sortedWeeks.length === 0 ? (
          <Card className="bg-slate-800/60 border-slate-700/50 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <BarChart3 className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">Nenhuma semana registrada ainda.</p>
              <p className="text-slate-500 text-sm mt-2">
                Registre sua primeira semana para começar a acompanhar seu progresso!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sortedWeeks.map(([weekKey, weekData]) => (
              <Card key={weekKey} className="bg-slate-800/60 border-slate-700/50 hover:bg-slate-800/80 transition-all duration-200 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-slate-200 font-semibold">
                        Semana de {weekData.dateRange}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-[#8bdb00]">
                          {weekData.summary.metasAtingidas + weekData.summary.metasUltrapassadas}/{weekData.summary.totalMetas} metas atingidas
                        </span>
                        {weekData.summary.metasUltrapassadas > 0 && (
                          <span className="text-green-400 flex items-center gap-1">
                            <Rocket className="w-3 h-3" />
                            {weekData.summary.metasUltrapassadas} ultrapassadas
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedWeek(weekKey);
                        setViewMode('detail');
                      }}
                      variant="outline"
                      size="sm"
                      className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white hover:border-[#8bdb00]/50"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Visualizar Desempenho
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Renderizar detalhes da semana
  const renderWeekDetail = () => {
    const weekData = weeklyHistory[selectedWeek];
    if (!weekData) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-200">
            Desempenho da Semana — {weekData.dateRange}
          </h2>
          <Button 
            onClick={() => setViewMode('history')}
            variant="outline"
            className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white hover:border-[#8bdb00]/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Histórico
          </Button>
        </div>

        {/* Resumo da semana */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-green-900/20 border-green-600/50 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">
                {weekData.summary.metasUltrapassadas}
              </div>
              <div className="text-green-300 text-sm">Ultrapassadas</div>
            </CardContent>
          </Card>
          <Card className="bg-[#8bdb00]/10 border-[#8bdb00]/30 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[#8bdb00]">
                {weekData.summary.metasAtingidas}
              </div>
              <div className="text-[#8bdb00]/80 text-sm">Atingidas</div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-900/20 border-yellow-600/50 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {weekData.summary.parciais}
              </div>
              <div className="text-yellow-300 text-sm">Parciais</div>
            </CardContent>
          </Card>
          <Card className="bg-red-900/20 border-red-600/50 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-400">
                {weekData.summary.metasNaoAtingidas}
              </div>
              <div className="text-red-300 text-sm">Não Atingidas</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de métricas (somente leitura) */}
        <Card className="bg-slate-800/60 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-slate-200">Métricas Detalhadas</CardTitle>
          </CardHeader>
          <CardContent>
            {renderMetricsTable(weekData.metrics, true)}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Renderizar conteúdo principal
  const renderCurrentWeek = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-200 flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-[#8bdb00]" />
          Métricas da Semana
        </h1>
        <Button 
          onClick={() => setViewMode('history')}
          variant="outline"
          className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white hover:border-[#8bdb00]/50"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Ver Histórico
        </Button>
      </div>

      <Card className="bg-slate-800/60 border-slate-700/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-slate-200">
            Semana de {getWeekRange(getMostRecentWeekKey())}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderMetricsTable(currentMetrics)}
          
          <div className="mt-6 flex justify-center">
            <Button 
              onClick={saveCurrentWeek}
              disabled={loading}
              className="bg-[#8bdb00] hover:bg-[#7bc700] text-black font-semibold px-8 py-2 disabled:opacity-50 transition-all duration-200"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar Semana'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {renderStatusLegend()}

      {/* Notificação de sucesso */}
      {showNotification && (
        <div className="fixed top-4 right-4 bg-[#8bdb00] text-black px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 backdrop-blur-sm">
          <CheckCircle className="w-5 h-5" />
          ✅ Semana salva com sucesso!
        </div>
      )}
      
      {/* Notificação de erro */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 backdrop-blur-sm">
          <XCircle className="w-5 h-5" />
          ❌ Erro: {error}
        </div>
      )}
    </div>
  );

  // Renderizar baseado no modo de visualização
  return (
    <div className="min-h-screen bg-slate-900/98 backdrop-blur-sm p-6">
      <div className="max-w-6xl mx-auto">
        {viewMode === 'current' && renderCurrentWeek()}
        {viewMode === 'history' && renderHistory()}
        {viewMode === 'detail' && renderWeekDetail()}
      </div>
    </div>
  );
};

export default MetricasSemana;