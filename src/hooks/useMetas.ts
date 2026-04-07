import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { startOfMonth, addMonths, format } from 'date-fns';

export interface MetaMes {
  ano: number;
  mes: number;
  valor_meta: number;
  observacao?: string | null;
}

export function useMetas() {
  const [loading, setLoading] = useState(false);

  const getProximasMetas = useCallback(async () => {
    try {
      setLoading(true);
      const now = new Date();
      const currentYear = now.getFullYear();
      const meses = [];
      
      // Gerar IDs para todos os 12 meses do ano atual
      for (let i = 0; i < 12; i++) {
        const d = new Date(currentYear, i, 1);
        meses.push({
          ano: currentYear,
          mes: i + 1,
          label: format(d, 'MMMM yyyy', { locale: (await import('date-fns/locale')).ptBR }),
          key: `${currentYear}-${i + 1}`
        });
      }

      const { data, error } = await supabase
        .from('metas_por_mes')
        .select('*')
        .gte('ano', now.getFullYear());

      if (error) throw error;

      return meses.map(m => {
        const metaSalva = data?.find(d => d.ano === m.ano && d.mes === m.mes);
        return {
          ...m,
          valor: metaSalva?.valor_meta || null,
          observacao: metaSalva?.observacao || null
        };
      });
    } catch (err) {
      console.error('Error fetching metas:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const salvarMetaMes = async (ano: number, mes: number, valor: number) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('metas_por_mes')
        .upsert({
          ano,
          mes,
          valor_meta: valor,
          updated_at: new Date().toISOString()
        }, { onConflict: 'ano, mes' });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error saving meta:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getProximasMetas,
    salvarMetaMes
  };
}
