import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Settings, Trash2, Edit, Check, X, Target, Save } from "lucide-react";
import { useConfig, Vendedor } from "@/hooks/useConfig";
import { useVendedores } from "@/hooks/useVendedores";
import { useMetasSemana, METRICAS_DISPONIVEIS } from "@/hooks/useMetasSemana";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const vendedorSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  email: z.string().trim().email("E-mail inválido").max(255, "E-mail muito longo"),
  ativo: z.boolean().default(true),
});

const Configuracoes = () => {
  const {
    config,
    loading: configLoading,
    updateMeta,
  } = useConfig();

  const {
    vendedores,
    loading: vendedoresLoading,
    addVendedor,
    updateVendedor,
    deleteVendedor,
  } = useVendedores();

  const {
    metas,
    loading: metasLoading,
    updateMeta: updateMetaSemanal,
    getMetaValue,
    formatValue,
    metricasDisponiveis
  } = useMetasSemana();

  const [meta, setMeta] = useState("R$ 0,00");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Vendedor | null>(null);
  const [metasSemanais, setMetasSemanais] = useState<Record<string, string>>({});

  // Atualizar meta quando config mudar
  useEffect(() => {
    if (config?.meta !== undefined) {
      const metaValue = config.meta;
      setMeta(metaValue.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }));
    }
  }, [config?.meta]);

  // Inicializar metas semanais apenas uma vez quando carregadas
  useEffect(() => {
    if (metas.length > 0 && Object.keys(metasSemanais).length === 0) {
      const metasObj: Record<string, string> = {};
      metricasDisponiveis.forEach(metrica => {
        const valor = getMetaValue(metrica.key);
        metasObj[metrica.key] = valor > 0 ? formatValue(valor, metrica.format) : '';
      });
      setMetasSemanais(metasObj);
    }
  }, [metas.length]);

  const form = useForm<z.infer<typeof vendedorSchema>>({
    resolver: zodResolver(vendedorSchema),
    defaultValues: {
      nome: "",
      email: "",
      ativo: true,
    },
  });

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    const amount = parseFloat(numbers) / 100;
    return amount.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleMetaChange = (value: string) => {
    const formatted = formatCurrency(value);
    setMeta(formatted);
  };

  const handleMetaSemanalChange = (metricaKey: string, value: string, format?: 'currency' | 'number' | 'hours') => {
    // Permitir digitação livre, sem formatação automática
    setMetasSemanais(prev => ({
      ...prev,
      [metricaKey]: value
    }));
  };

  const handleSaveMetaSemanal = async (metricaKey: string, format?: 'currency' | 'number' | 'hours') => {
    const valorString = metasSemanais[metricaKey] || '';
    
    // Se o campo estiver vazio, salvar como 0 (remove a meta)
    if (valorString.trim() === '') {
      try {
        const result = await updateMetaSemanal(metricaKey, 0);
        if (result.success) {
          toast.success("Meta removida com sucesso!");
          setMetasSemanais(prev => ({
            ...prev,
            [metricaKey]: ''
          }));
        } else {
          toast.error(result.error || "Erro ao remover meta");
        }
      } catch (error) {
        toast.error("Erro ao remover meta");
        console.error("Erro ao remover meta:", error);
      }
      return;
    }

    let valorNumerico = 0;

    if (format === 'currency') {
      // Para moeda, aceitar tanto vírgula quanto ponto como separador decimal
      const cleanValue = valorString.replace(/[^\d,\.]/g, "").replace(",", ".");
      valorNumerico = parseFloat(cleanValue);
    } else if (format === 'hours') {
      // Para horas, extrair apenas números
      const cleanValue = valorString.replace(/[^\d,\.]/g, "").replace(",", ".");
      valorNumerico = parseFloat(cleanValue);
    } else {
      // Para números, aceitar vírgula e ponto
      const cleanValue = valorString.replace(/[^\d,\.]/g, "").replace(",", ".");
      valorNumerico = parseFloat(cleanValue);
    }

    if (isNaN(valorNumerico) || valorNumerico < 0) {
      toast.error("Valor inválido");
      return;
    }

    try {
      const result = await updateMetaSemanal(metricaKey, valorNumerico);
      if (result.success) {
        toast.success("Meta semanal atualizada com sucesso!");
        // Atualizar o valor formatado no estado após salvar
        const valorFormatado = formatValue(valorNumerico, format);
        setMetasSemanais(prev => ({
          ...prev,
          [metricaKey]: valorFormatado
        }));
      } else {
        toast.error(result.error || "Erro ao atualizar meta");
      }
    } catch (error) {
      toast.error("Erro ao atualizar meta semanal");
      console.error("Erro ao atualizar meta semanal:", error);
    }
  };

  const handleSaveMeta = async () => {
    const valorNumerico = parseFloat(
      meta.replace(/[^\d,]/g, "").replace(",", ".")
    );

    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      toast.error("Valor inválido");
      return;
    }

    try {
      await updateMeta(valorNumerico);
      toast.success("Meta mensal atualizada com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar meta mensal");
      console.error("Erro ao atualizar meta:", error);
    }
  };

  const onSubmit = async (values: z.infer<typeof vendedorSchema>) => {
    try {
      await addVendedor({
        nome: values.nome,
        email: values.email,
        ativo: values.ativo,
      });
      toast.success("Vendedor adicionado com sucesso!");
      form.reset();
    } catch (error) {
      toast.error("Erro ao adicionar vendedor");
      console.error("Erro ao adicionar vendedor:", error);
    }
  };

  const handleEdit = (vendedor: Vendedor) => {
    setEditingId(vendedor.id);
    setEditData({ ...vendedor });
  };

  const handleSaveEdit = async () => {
    if (editData && editingId) {
      try {
        await updateVendedor(editingId, editData);
        toast.success("Vendedor atualizado!");
        setEditingId(null);
        setEditData(null);
      } catch (error) {
        toast.error("Erro ao atualizar vendedor");
        console.error("Erro ao atualizar vendedor:", error);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

  const handleRemove = async (id: string) => {
    if (confirm("Deseja realmente remover este vendedor?")) {
      try {
        await deleteVendedor(id);
        toast.success("Vendedor removido!");
      } catch (error) {
        toast.error("Erro ao remover vendedor");
        console.error("Erro ao remover vendedor:", error);
      }
    }
  };

  // Mostrar loading enquanto os dados estão carregando
  if (configLoading || vendedoresLoading || metasLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-lg p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-8">
              <Settings className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
            </div>
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Carregando configurações...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-card rounded-lg p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-8">
            <Settings className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          </div>

          {/* Meta Mensal */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Meta Mensal
            </h2>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm text-muted-foreground mb-2 block">
                  Valor da meta (R$)
                </label>
                <Input
                  value={meta}
                  onChange={(e) => handleMetaChange(e.target.value)}
                  placeholder="R$ 0,00"
                  className="text-lg"
                />
              </div>
              <Button
                onClick={handleSaveMeta}
                className="bg-primary hover:bg-primary/90"
              >
                Salvar Meta
              </Button>
            </div>
          </section>

          {/* Metas Semanais */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Target className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">
                Metas Semanais
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {metricasDisponiveis.map((metrica) => (
                <Card key={metrica.key} className="border border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{metrica.label}</CardTitle>
                    <CardDescription className="text-sm">
                      {metrica.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">
                        Meta {metrica.format === 'currency' ? '(R$)' : metrica.format === 'hours' ? '(horas)' : ''}
                      </label>
                      <Input
                        value={metasSemanais[metrica.key] || ''}
                        onChange={(e) => handleMetaSemanalChange(metrica.key, e.target.value, metrica.format)}
                        placeholder={
                          metrica.format === 'currency' ? 'R$ 0,00' : 
                          metrica.format === 'hours' ? '0h' : '0'
                        }
                        className="text-sm"
                      />
                    </div>
                    <Button
                      onClick={() => handleSaveMetaSemanal(metrica.key, metrica.format)}
                      size="sm"
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Meta
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Vendedores */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Cadastro de Vendedores
            </h2>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 mb-8 p-6 bg-muted/50 rounded-lg"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do vendedor" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="email@exemplo.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="ativo"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Vendedor ativo</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full md:w-auto">
                  Adicionar Vendedor
                </Button>
              </form>
            </Form>

            {/* Tabela de Vendedores */}
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead className="text-center">Ativo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendedores.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Nenhum vendedor cadastrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    vendedores.map((vendedor) => (
                      <TableRow key={vendedor.id}>
                        <TableCell>
                          {editingId === vendedor.id ? (
                            <Input
                              value={editData?.nome || ""}
                              onChange={(e) =>
                                setEditData((prev) =>
                                  prev ? { ...prev, nome: e.target.value } : null
                                )
                              }
                              className="h-8"
                            />
                          ) : (
                            vendedor.nome
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === vendedor.id ? (
                            <Input
                              type="email"
                              value={editData?.email || ""}
                              onChange={(e) =>
                                setEditData((prev) =>
                                  prev ? { ...prev, email: e.target.value } : null
                                )
                              }
                              className="h-8"
                            />
                          ) : (
                            vendedor.email
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {editingId === vendedor.id ? (
                            <Checkbox
                              checked={editData?.ativo || false}
                              onCheckedChange={(checked) =>
                                setEditData((prev) =>
                                  prev ? { ...prev, ativo: checked as boolean } : null
                                )
                              }
                            />
                          ) : (
                            <Checkbox checked={vendedor.ativo} disabled />
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {editingId === vendedor.id ? (
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleSaveEdit}
                                className="h-8 w-8 text-primary hover:text-primary"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleCancelEdit}
                                className="h-8 w-8 text-muted-foreground"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(vendedor)}
                                className="h-8 w-8 text-primary hover:text-primary"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemove(vendedor.id)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Configuracoes;
