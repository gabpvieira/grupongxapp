import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import * as z from "zod";
import { useVendas } from "@/hooks/useVendas";
import { useVendedores } from "@/hooks/useVendedores";
import type { Database } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

const vendaSchema = z.object({
  cliente: z.string().trim().min(1, "Cliente é obrigatório").max(200, "Nome muito longo"),
  data_fechamento: z.date({ required_error: "Data é obrigatória" }),
  servico: z.string().trim().min(1, "Serviço é obrigatório").max(300, "Descrição muito longa"),
  recorrente: z.enum(["sim", "nao"]),
  quantidade_meses: z.string().optional(),
  valor: z.string().min(1, "Valor é obrigatório"),
  responsavel_id: z.string().min(1, "Responsável é obrigatório"),
});

const Lancamento = () => {
  const navigate = useNavigate();
  const { addVenda, loading: vendasLoading, error: vendasError } = useVendas();
  const { vendedores, loading: vendedoresLoading, error: vendedoresError } = useVendedores();
  const [recorrente, setRecorrente] = useState("nao");

  const vendedoresAtivos = vendedores.filter(v => v.ativo);

  const form = useForm<z.infer<typeof vendaSchema>>({
    resolver: zodResolver(vendaSchema),
    defaultValues: {
      cliente: "",
      servico: "",
      recorrente: "nao",
      quantidade_meses: "",
      valor: "",
      responsavel_id: vendedoresAtivos[0]?.id || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof vendaSchema>) => {
    const valorNumerico = parseFloat(
      values.valor.replace(/[^\d,]/g, "").replace(",", ".")
    );

    const quantidadeMeses = values.recorrente === "sim" && values.quantidade_meses
      ? parseInt(values.quantidade_meses)
      : null;

    if (values.recorrente === "sim" && (!quantidadeMeses || quantidadeMeses < 1 || quantidadeMeses > 120)) {
      toast.error("Quantidade de meses deve ser entre 1 e 120");
      return;
    }

    try {
      await addVenda({
        cliente: values.cliente,
        data_fechamento: format(values.data_fechamento, "yyyy-MM-dd"),
        servico: values.servico,
        recorrente: values.recorrente === "sim",
        quantidade_meses: quantidadeMeses,
        origem_recorrencia: null,
        valor: valorNumerico,
        responsavel_id: values.responsavel_id,
      });

      const mensagem = quantidadeMeses && quantidadeMeses > 1
        ? `Venda registrada! ${quantidadeMeses} lançamentos mensais criados.`
        : "Venda registrada com sucesso!";
      
      toast.success(mensagem);
      form.reset();
      setTimeout(() => navigate("/"), 1500);
    } catch (error) {
      toast.error("Erro ao salvar venda. Tente novamente.");
    }
  };

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    const amount = parseFloat(numbers) / 100;
    return amount.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  if (vendedoresLoading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando vendedores...</p>
        </div>
      </div>
    );
  }

  if (vendedoresError) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center text-red-500">
          <p>Erro ao carregar vendedores: {vendedoresError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-card rounded-lg p-8 shadow-lg">
          <h1 className="text-3xl font-bold text-foreground mb-6">
            Novo Lançamento de Venda
          </h1>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="cliente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do cliente" {...field} />
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
                    <FormLabel>Data de Fechamento</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione a data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          locale={ptBR}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="servico"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serviço Contratado</FormLabel>
                    <FormControl>
                      <Input placeholder="Descrição do serviço" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recorrente"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Recorrência?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => {
                          field.onChange(value);
                          setRecorrente(value);
                        }}
                        defaultValue={field.value}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="sim" id="sim" />
                          <label htmlFor="sim" className="cursor-pointer">
                            Sim
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="nao" id="nao" />
                          <label htmlFor="nao" className="cursor-pointer">
                            Não
                          </label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {recorrente === "sim" && (
                <FormField
                  control={form.control}
                  name="quantidade_meses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade de Meses</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          max="120" 
                          placeholder="Ex: 12" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground mt-1">
                        Gerará {field.value || "0"} lançamentos mensais automáticos
                      </p>
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor da Venda (R$)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="R$ 0,00"
                        {...field}
                        onChange={(e) => {
                          const formatted = formatCurrency(e.target.value);
                          field.onChange(formatted);
                        }}
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
                    <FormLabel>Responsável pela Venda</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o responsável" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover z-50">
                        {vendedoresAtivos.length === 0 ? (
                          <SelectItem value="" disabled>
                            Nenhum vendedor ativo
                          </SelectItem>
                        ) : (
                          vendedoresAtivos.map((vendedor) => (
                            <SelectItem key={vendedor.id} value={vendedor.id}>
                              {vendedor.nome}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                size="lg"
              >
                Salvar Venda
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Lancamento;
