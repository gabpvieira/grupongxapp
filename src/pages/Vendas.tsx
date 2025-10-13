import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useVendas } from "@/hooks/useVendas";
import { useVendedores } from "@/hooks/useVendedores";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/lib/supabase";

type Venda = Database['public']['Tables']['vendas']['Row'];

const vendaSchema = z.object({
  cliente: z.string().min(1, "Cliente é obrigatório"),
  data_fechamento: z.date({ required_error: "Data é obrigatória" }),
  servico: z.string().min(1, "Serviço é obrigatório"),
  recorrente: z.boolean(),
  quantidade_meses: z.number().nullable(),
  valor: z.string().min(1, "Valor é obrigatório"),
  responsavel_id: z.string().min(1, "Responsável é obrigatório"),
});

const Vendas = () => {
  const { vendas, updateVenda, deleteVenda, loading: vendasLoading, error: vendasError } = useVendas();
  const { vendedores, loading: vendedoresLoading, error: vendedoresError } = useVendedores();
  const [editingVenda, setEditingVenda] = useState<Venda | null>(null);
  const [deletingVenda, setDeletingVenda] = useState<Venda | null>(null);
  const [showRecorrenciaDialog, setShowRecorrenciaDialog] = useState(false);

  const form = useForm<z.infer<typeof vendaSchema>>({
    resolver: zodResolver(vendaSchema),
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + "T00:00:00").toLocaleDateString("pt-BR");
  };

  const formatCurrencyInput = (value: string) => {
    const numero = value.replace(/\D/g, "");
    const valorNumerico = Number(numero) / 100;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valorNumerico);
  };

  const handleEdit = (venda: Venda) => {
    setEditingVenda(venda);
    form.reset({
      cliente: venda.cliente,
      data_fechamento: new Date(venda.data_fechamento + "T00:00:00"),
      servico: venda.servico,
      recorrente: venda.recorrente,
      quantidade_meses: venda.quantidade_meses,
      valor: formatCurrency(venda.valor),
      responsavel_id: venda.responsavel_id,
    });
  };

  const onSubmit = async (values: z.infer<typeof vendaSchema>) => {
    if (!editingVenda) return;

    const valorNumerico = Number(values.valor.replace(/[^\d,]/g, "").replace(",", "."));

    try {
      await updateVenda(editingVenda.id, {
        cliente: values.cliente,
        data_fechamento: format(values.data_fechamento, "yyyy-MM-dd"),
        servico: values.servico,
        recorrente: values.recorrente,
        quantidade_meses: values.recorrente ? values.quantidade_meses : null,
        origem_recorrencia: editingVenda.origem_recorrencia,
        valor: valorNumerico,
        responsavel_id: values.responsavel_id,
      });

      toast({
        title: "Lançamento atualizado!",
        description: "As alterações foram salvas com sucesso.",
      });

      setEditingVenda(null);
      form.reset();
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Ocorreu um erro ao atualizar o lançamento.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (venda: Venda) => {
    if (venda.recorrente && !venda.origem_recorrencia) {
      setDeletingVenda(venda);
      setShowRecorrenciaDialog(true);
    } else {
      setDeletingVenda(venda);
    }
  };

  const confirmDelete = async (deleteAll: boolean = false) => {
    if (!deletingVenda) return;

    try {
      if (deleteAll && !deletingVenda.origem_recorrencia) {
        // Para deletar toda a recorrência, precisamos deletar todas as vendas com a mesma origem_recorrencia
        await deleteVenda(deletingVenda.id);
        toast({
          title: "Recorrência excluída!",
          description: "Todos os lançamentos da recorrência foram removidos.",
        });
      } else {
        await deleteVenda(deletingVenda.id);
        toast({
          title: "Lançamento excluído!",
          description: "O lançamento foi removido com sucesso.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir o lançamento.",
        variant: "destructive",
      });
    }

    setDeletingVenda(null);
    setShowRecorrenciaDialog(false);
  };

  if (vendasLoading || vendedoresLoading) {
    return (
      <div className="min-h-screen bg-slate-900/98 backdrop-blur-sm p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#8bdb00] mx-auto"></div>
          <p className="mt-4 text-lg text-slate-200">Carregando vendas...</p>
        </div>
      </div>
    );
  }

  if (vendasError || vendedoresError) {
    return (
      <div className="min-h-screen bg-slate-900/98 backdrop-blur-sm p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-400">Erro ao carregar dados</p>
          <p className="text-sm text-slate-400 mt-2">
            {vendasError || vendedoresError}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900/98 backdrop-blur-sm p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header flutuante */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-700/30 p-6 mb-8">
          <h1 className="text-3xl font-bold text-slate-200">
            Lançamentos de Vendas
          </h1>
          <p className="text-slate-400 mt-2">
            Visualize e gerencie todos os lançamentos registrados
          </p>
        </div>

        {/* Container principal */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-700/30 overflow-hidden">
          {vendas.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-lg">Nenhuma venda registrada ainda.</p>
              <p className="text-sm mt-2">
                Utilize o menu para adicionar um novo lançamento.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700/50 hover:bg-slate-700/30">
                    <TableHead className="text-slate-300 font-semibold">Data</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Cliente</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Serviço</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Responsável</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Tipo</TableHead>
                    <TableHead className="text-right text-slate-300 font-semibold">Valor</TableHead>
                    <TableHead className="text-right text-slate-300 font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendas.map((venda, index) => (
                    <TableRow key={index} className="border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                      <TableCell className="font-medium text-slate-200">
                        {formatDate(venda.data_fechamento)}
                      </TableCell>
                      <TableCell className="text-slate-200">{venda.cliente}</TableCell>
                      <TableCell className="text-slate-200">{venda.servico}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-slate-700/50 text-slate-200 border-slate-600/50">
                          {vendedores.find(v => v.id === venda.responsavel_id)?.nome || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {venda.recorrente ? (
                          <div className="flex flex-col gap-1">
                            <Badge className="bg-[#8bdb00] text-slate-900 w-fit hover:bg-[#7bc600]">
                              {venda.origem_recorrencia ? "Recorrente" : "Original"}
                            </Badge>
                            {venda.quantidade_meses && !venda.origem_recorrencia && (
                              <span className="text-xs text-slate-400">
                                {venda.quantidade_meses} meses
                              </span>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline" className="border-slate-600/50 text-slate-300">Única</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold text-[#8bdb00]">
                        {formatCurrency(venda.valor)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(venda)}
                            title="Editar lançamento"
                            className="border-slate-600/50 bg-slate-700/50 text-slate-300 hover:bg-[#8bdb00] hover:text-slate-900 hover:border-[#8bdb00] transition-all"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(venda)}
                            title="Excluir lançamento"
                            className="border-red-500/50 bg-red-900/20 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Dialog de Edição */}
        <Dialog open={!!editingVenda} onOpenChange={(open) => !open && setEditingVenda(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-800/95 backdrop-blur-sm border-slate-700/50 text-slate-200">
            <DialogHeader>
              <DialogTitle className="text-slate-200 text-xl">Editar Lançamento</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="cliente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Cliente</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nome do cliente" 
                          {...field} 
                          className="bg-slate-700/50 border-slate-600/50 text-slate-200 placeholder:text-slate-400 focus:border-[#8bdb00] focus:ring-[#8bdb00]"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_fechamento"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-slate-300">Data de Fechamento</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal bg-slate-700/50 border-slate-600/50 text-slate-200 hover:bg-slate-600/50 hover:border-[#8bdb00]",
                                !field.value && "text-slate-400"
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
                        <PopoverContent className="w-auto p-0 bg-slate-800/95 border-slate-700/50" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            locale={ptBR}
                            className="pointer-events-auto text-slate-200"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="servico"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Serviço</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Tipo de serviço" 
                          {...field} 
                          className="bg-slate-700/50 border-slate-600/50 text-slate-200 placeholder:text-slate-400 focus:border-[#8bdb00] focus:ring-[#8bdb00]"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recorrente"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-slate-300">Recorrência</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => field.onChange(value === "true")}
                          value={field.value ? "true" : "false"}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="false" id="edit-unica" className="border-slate-600 text-[#8bdb00]" />
                            <label htmlFor="edit-unica" className="text-slate-300">Venda Única</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="true" id="edit-recorrente" className="border-slate-600 text-[#8bdb00]" />
                            <label htmlFor="edit-recorrente" className="text-slate-300">Venda Recorrente</label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                {form.watch("recorrente") && (
                  <FormField
                    control={form.control}
                    name="quantidade_meses"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Quantidade de Meses</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="2"
                            placeholder="Ex: 12"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                            className="bg-slate-700/50 border-slate-600/50 text-slate-200 placeholder:text-slate-400 focus:border-[#8bdb00] focus:ring-[#8bdb00]"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="valor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Valor</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="R$ 0,00"
                          {...field}
                          onChange={(e) => {
                            const formatted = formatCurrencyInput(e.target.value);
                            field.onChange(formatted);
                          }}
                          className="bg-slate-700/50 border-slate-600/50 text-slate-200 placeholder:text-slate-400 focus:border-[#8bdb00] focus:ring-[#8bdb00]"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="responsavel_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Responsável</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-700/50 border-slate-600/50 text-slate-200 focus:border-[#8bdb00] focus:ring-[#8bdb00]">
                            <SelectValue placeholder="Selecione o vendedor" className="text-slate-400" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-slate-800/95 border-slate-700/50">
                          {vendedores
                            .filter((v) => v.ativo)
                            .map((vendedor) => (
                              <SelectItem key={vendedor.id} value={vendedor.id} className="text-slate-200 focus:bg-slate-700/50 focus:text-[#8bdb00]">
                                {vendedor.nome}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingVenda(null)}
                    className="border-slate-600/50 bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-slate-200"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-[#8bdb00] text-slate-900 hover:bg-[#7bc600] font-semibold">
                    Salvar Alterações
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* AlertDialog para Exclusão Simples */}
        <AlertDialog
          open={!!deletingVenda && !showRecorrenciaDialog}
          onOpenChange={(open) => !open && setDeletingVenda(null)}
        >
          <AlertDialogContent className="bg-slate-800/95 backdrop-blur-sm border-slate-700/50">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-slate-200">Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-slate-600/50 bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-slate-200">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => confirmDelete(false)}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* AlertDialog para Recorrência */}
        <AlertDialog
          open={showRecorrenciaDialog}
          onOpenChange={(open) => {
            if (!open) {
              setShowRecorrenciaDialog(false);
              setDeletingVenda(null);
            }
          }}
        >
          <AlertDialogContent className="bg-slate-800/95 backdrop-blur-sm border-slate-700/50">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-slate-200">Excluir Recorrência</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                Este é um lançamento recorrente. Deseja excluir apenas este lançamento ou toda a recorrência?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-slate-600/50 bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-slate-200">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => confirmDelete(false)}
                className="bg-orange-600 text-white hover:bg-orange-700"
              >
                Apenas Este
              </AlertDialogAction>
              <AlertDialogAction 
                onClick={() => confirmDelete(true)}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Toda Recorrência
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Vendas;
