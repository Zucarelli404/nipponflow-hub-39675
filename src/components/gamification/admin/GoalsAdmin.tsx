import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, Target } from "lucide-react";
import { z } from "zod";
import { format } from "date-fns";

const goalSchema = z.object({
  titulo: z.string().trim().min(1, "Título é obrigatório").max(100, "Título deve ter no máximo 100 caracteres"),
  descricao: z.string().trim().max(500, "Descrição deve ter no máximo 500 caracteres").optional(),
  tipo: z.enum(["individual", "equipe", "geral"]),
  categoria: z.enum(["vendas", "visitas", "leads", "conversao"]),
  meta_valor: z.number().positive("Valor da meta deve ser positivo"),
  unidade: z.string().trim().min(1, "Unidade é obrigatória").max(20),
  pontos_recompensa: z.number().int().min(0, "Pontos devem ser >= 0"),
  premio_descricao: z.string().trim().max(200, "Prêmio deve ter no máximo 200 caracteres").optional(),
  data_inicio: z.string().min(1, "Data de início é obrigatória"),
  data_fim: z.string().min(1, "Data de fim é obrigatória"),
});

interface Goal {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  categoria: string;
  meta_valor: number;
  valor_atual: number;
  unidade: string;
  pontos_recompensa: number;
  premio_descricao: string | null;
  data_inicio: string;
  data_fim: string;
  status: string;
}

export function GoalsAdmin() {
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    tipo: "geral",
    categoria: "vendas",
    meta_valor: "",
    unidade: "unidades",
    pontos_recompensa: "",
    premio_descricao: "",
    data_inicio: format(new Date(), "yyyy-MM-dd"),
    data_fim: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from("goals" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGoals((data as unknown as Goal[]) || []);
    } catch (error) {
      toast({
        title: "Erro ao carregar metas",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    try {
      const dataToValidate = {
        ...formData,
        meta_valor: parseFloat(formData.meta_valor),
        pontos_recompensa: parseInt(formData.pontos_recompensa),
      };
      goalSchema.parse(dataToValidate);
      
      // Validação adicional de datas
      if (new Date(formData.data_fim) <= new Date(formData.data_inicio)) {
        setErrors({ data_fim: "Data de fim deve ser posterior à data de início" });
        return false;
      }
      
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const dataToSave = {
        titulo: formData.titulo.trim(),
        descricao: formData.descricao.trim() || null,
        tipo: formData.tipo,
        categoria: formData.categoria,
        meta_valor: parseFloat(formData.meta_valor),
        unidade: formData.unidade.trim(),
        pontos_recompensa: parseInt(formData.pontos_recompensa),
        premio_descricao: formData.premio_descricao.trim() || null,
        data_inicio: formData.data_inicio,
        data_fim: formData.data_fim,
        status: "ativa",
      };

      if (editingGoal) {
        const { error } = await supabase
          .from("goals" as any)
          .update(dataToSave)
          .eq("id", editingGoal.id);

        if (error) throw error;
        toast({ title: "Meta atualizada com sucesso" });
      } else {
        const { error } = await supabase
          .from("goals" as any)
          .insert(dataToSave);

        if (error) throw error;
        toast({ title: "Meta criada com sucesso" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchGoals();
    } catch (error) {
      toast({
        title: "Erro ao salvar meta",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta meta?")) return;

    try {
      const { error } = await supabase
        .from("goals" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Meta excluída com sucesso" });
      fetchGoals();
    } catch (error) {
      toast({
        title: "Erro ao excluir meta",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      titulo: goal.titulo,
      descricao: goal.descricao || "",
      tipo: goal.tipo,
      categoria: goal.categoria,
      meta_valor: goal.meta_valor.toString(),
      unidade: goal.unidade,
      pontos_recompensa: goal.pontos_recompensa.toString(),
      premio_descricao: goal.premio_descricao || "",
      data_inicio: goal.data_inicio,
      data_fim: goal.data_fim,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      titulo: "",
      descricao: "",
      tipo: "geral",
      categoria: "vendas",
      meta_valor: "",
      unidade: "unidades",
      pontos_recompensa: "",
      premio_descricao: "",
      data_inicio: format(new Date(), "yyyy-MM-dd"),
      data_fim: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    });
    setEditingGoal(null);
    setErrors({});
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Gerenciar Metas</h3>
          <p className="text-sm text-muted-foreground">
            Crie e gerencie objetivos para a equipe
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingGoal ? "Editar Meta" : "Criar Nova Meta"}
              </DialogTitle>
              <DialogDescription>
                Configure os detalhes da meta
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Ex: Atingir 50 vendas"
                  maxLength={100}
                />
                {errors.titulo && <p className="text-sm text-destructive mt-1">{errors.titulo}</p>}
              </div>

              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descreva a meta"
                  maxLength={500}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="equipe">Equipe</SelectItem>
                      <SelectItem value="geral">Geral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="categoria">Categoria *</Label>
                  <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vendas">Vendas</SelectItem>
                      <SelectItem value="visitas">Visitas</SelectItem>
                      <SelectItem value="leads">Leads</SelectItem>
                      <SelectItem value="conversao">Conversão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="meta_valor">Valor da Meta *</Label>
                  <Input
                    id="meta_valor"
                    type="number"
                    value={formData.meta_valor}
                    onChange={(e) => setFormData({ ...formData, meta_valor: e.target.value })}
                    placeholder="Ex: 50"
                    min="0.01"
                    step="0.01"
                  />
                  {errors.meta_valor && <p className="text-sm text-destructive mt-1">{errors.meta_valor}</p>}
                </div>

                <div>
                  <Label htmlFor="unidade">Unidade *</Label>
                  <Input
                    id="unidade"
                    value={formData.unidade}
                    onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
                    placeholder="Ex: vendas, visitas"
                    maxLength={20}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="pontos_recompensa">Pontos de Recompensa *</Label>
                <Input
                  id="pontos_recompensa"
                  type="number"
                  value={formData.pontos_recompensa}
                  onChange={(e) => setFormData({ ...formData, pontos_recompensa: e.target.value })}
                  placeholder="Ex: 100"
                  min="0"
                />
                {errors.pontos_recompensa && <p className="text-sm text-destructive mt-1">{errors.pontos_recompensa}</p>}
              </div>

              <div>
                <Label htmlFor="premio_descricao">Descrição do Prêmio</Label>
                <Input
                  id="premio_descricao"
                  value={formData.premio_descricao}
                  onChange={(e) => setFormData({ ...formData, premio_descricao: e.target.value })}
                  placeholder="Ex: Bônus de R$ 500"
                  maxLength={200}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="data_inicio">Data de Início *</Label>
                  <Input
                    id="data_inicio"
                    type="date"
                    value={formData.data_inicio}
                    onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                  />
                  {errors.data_inicio && <p className="text-sm text-destructive mt-1">{errors.data_inicio}</p>}
                </div>

                <div>
                  <Label htmlFor="data_fim">Data de Fim *</Label>
                  <Input
                    id="data_fim"
                    type="date"
                    value={formData.data_fim}
                    onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                  />
                  {errors.data_fim && <p className="text-sm text-destructive mt-1">{errors.data_fim}</p>}
                </div>
              </div>

              <Button onClick={handleSubmit} className="w-full">
                {editingGoal ? "Atualizar" : "Criar"} Meta
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {goals.map((goal) => (
          <Card key={goal.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{goal.titulo}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">{goal.tipo}</Badge>
                    <Badge variant="secondary">{goal.categoria}</Badge>
                    <Badge variant={goal.status === "ativa" ? "default" : "secondary"}>
                      {goal.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(goal)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(goal.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {goal.descricao && (
                <p className="text-sm text-muted-foreground mb-3">{goal.descricao}</p>
              )}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Meta:</span>
                  <span className="font-medium">
                    {goal.meta_valor} {goal.unidade}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Progresso:</span>
                  <span className="font-medium">
                    {goal.valor_atual} / {goal.meta_valor}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recompensa:</span>
                  <span className="font-medium">+{goal.pontos_recompensa} pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Período:</span>
                  <span className="font-medium">
                    {format(new Date(goal.data_inicio), "dd/MM")} -{" "}
                    {format(new Date(goal.data_fim), "dd/MM/yyyy")}
                  </span>
                </div>
                {goal.premio_descricao && (
                  <div className="pt-2 border-t">
                    <span className="text-muted-foreground">Prêmio: </span>
                    <span>{goal.premio_descricao}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
