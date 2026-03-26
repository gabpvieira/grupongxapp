import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVendedores } from "@/hooks/useVendedores";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseISO, isValid } from "date-fns";
import { NgxDatePicker } from "@/components/ui/NgxDatePicker";
import { Switch } from "@/components/ui/switch";
import { useEffect } from "react";

const vendaSchema = z.object({
  cliente: z.string().min(1, "Cliente é obrigatório").max(100, "Máximo 100 caracteres"),
  servico: z.string().min(1, "Serviço é obrigatório").max(150, "Máximo 150 caracteres"),
  valor: z.string().min(1, "Valor é obrigatório"),
  data_fechamento: z.date({ required_error: "Data é obrigatória" }),
  responsavel_id: z.string().min(1, "Responsável é obrigatório"),
  recorrente: z.boolean().default(false),
  quantidade_meses: z.number().min(1).max(60).nullable().optional(),
}).refine((data) => {
  if (data.recorrente && !data.quantidade_meses) return false;
  return true;
}, {
  message: "Quantidade de meses é obrigatória para vendas recorrentes",
  path: ["quantidade_meses"],
});

type VendaFormValues = z.infer<typeof vendaSchema>;

interface LancamentoFormProps {
  initialData?: any;
  onSubmit: (values: any) => Promise<void>;
  loading?: boolean;
}

const LancamentoForm = ({ initialData, onSubmit, loading }: LancamentoFormProps) => {
  const { vendedores, loading: loadingVendedores } = useVendedores();
  
  const form = useForm<VendaFormValues>({
    resolver: zodResolver(vendaSchema),
    defaultValues: {
      cliente: initialData?.cliente || "",
      servico: initialData?.servico || "",
      responsavel_id: initialData?.responsavel_id || "",
      recorrente: initialData?.recorrente || false,
      quantidade_meses: initialData?.quantidade_meses || 12,
      valor: initialData?.valor ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(initialData.valor) : "",
      data_fechamento: initialData?.data_fechamento ? new Date(initialData.data_fechamento + "T00:00:00") : new Date(),
    },
  });

  const formatCurrencyInput = (value: string) => {
    const numero = value.replace(/\D/g, "");
    const valorNumerico = Number(numero) / 100;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valorNumerico);
  };

  const handleFormSubmit = async (values: VendaFormValues) => {
    // Converter valor formatado para number
    const valorNumerico = Number(values.valor.replace(/[^\d,]/g, "").replace(",", "."));
    
    const payload = {
      ...values,
      valor: valorNumerico,
      data_fechamento: format(values.data_fechamento, "yyyy-MM-dd"),
      quantidade_meses: values.recorrente ? values.quantidade_meses : null,
    };

    await onSubmit(payload);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="cliente"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/60">Cliente</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Nome do cliente" 
                    {...field} 
                    className="bg-white/5 border-white/10 text-white focus:border-[#a3e635] focus:ring-[#a3e635]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="servico"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/60">Serviço</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Descrição do serviço" 
                    {...field} 
                    className="bg-white/5 border-white/10 text-white focus:border-[#a3e635] focus:ring-[#a3e635]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="valor"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/60">Valor</FormLabel>
                <FormControl>
                  <Input
                    placeholder="R$ 0,00"
                    {...field}
                    onChange={(e) => {
                      const formatted = formatCurrencyInput(e.target.value);
                      field.onChange(formatted);
                    }}
                    className="bg-white/5 border-white/10 text-white focus:border-[#a3e635] focus:ring-[#a3e635]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="data_fechamento"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-white/60">Data de Fechamento</FormLabel>
                <FormControl>
                  <NgxDatePicker
                    value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                    onChange={(date) => {
                      if (!date) return;
                      field.onChange(new Date(date + "T00:00:00"));
                    }}
                    maxDate={format(new Date(), 'yyyy-MM-dd')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />


          <FormField
            control={form.control}
            name="responsavel_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/60">Responsável</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-[#a3e635] focus:ring-[#a3e635]">
                      <SelectValue placeholder="Selecione o vendedor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-black border-white/10">
                    {vendedores
                      .filter((v) => v.ativo)
                      .map((vendedor) => (
                        <SelectItem key={vendedor.id} value={vendedor.id} className="text-white focus:bg-[#a3e635] focus:text-black">
                          {vendedor.nome}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col gap-4">
             <FormField
              control={form.control}
              name="recorrente"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/10 p-4 bg-white/5">
                  <div className="space-y-0.5">
                    <FormLabel className="text-white">Venda Recorrente</FormLabel>
                    <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
                      Gerar lançamentos mensais
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-[#a3e635]"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch("recorrente") && (
              <FormField
                control={form.control}
                name="quantidade_meses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/60">Quantidade de Meses</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="60"
                        placeholder="Ex: 12"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        className="bg-white/5 border-white/10 text-white focus:border-[#a3e635] focus:ring-[#a3e635]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full md:w-auto bg-[#a3e635] text-black hover:bg-[#bef264] font-bold px-8 py-6 rounded-xl transition-all shadow-lg shadow-[#a3e635]/10 group"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Salvar Lançamento"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default LancamentoForm;
