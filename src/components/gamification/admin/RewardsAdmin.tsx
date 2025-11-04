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
import { Plus, Trash2, Edit2, Gift, Star } from "lucide-react";
import { z } from "zod";

const rewardSchema = z.object({
  titulo: z.string().trim().min(1, "Título é obrigatório").max(100, "Título deve ter no máximo 100 caracteres"),
  descricao: z.string().trim().max(500, "Descrição deve ter no máximo 500 caracteres").optional(),
  custo_pontos: z.number().int().positive("Custo deve ser positivo"),
  tipo: z.enum(["fisico", "experiencia", "bonus", "folga"]),
  quantidade_disponivel: z.number().int().positive("Quantidade deve ser positiva").nullable(),
  imagem_url: z.string().url("URL inválida").optional().or(z.literal("")),
});

interface Reward {
  id: string;
  titulo: string;
  descricao: string | null;
  custo_pontos: number;
  tipo: string;
  quantidade_disponivel: number | null;
  imagem_url: string | null;
  is_active: boolean;
}

export function RewardsAdmin() {
  const { toast } = useToast();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    custo_pontos: "",
    tipo: "fisico",
    quantidade_disponivel: "",
    imagem_url: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      const { data, error } = await supabase
        .from("rewards" as any)
        .select("*")
        .order("custo_pontos", { ascending: true });

      if (error) throw error;
      setRewards((data as unknown as Reward[]) || []);
    } catch (error) {
      toast({
        title: "Erro ao carregar prêmios",
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
        custo_pontos: parseInt(formData.custo_pontos),
        quantidade_disponivel: formData.quantidade_disponivel 
          ? parseInt(formData.quantidade_disponivel) 
          : null,
        imagem_url: formData.imagem_url || undefined,
      };
      rewardSchema.parse(dataToValidate);
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
        custo_pontos: parseInt(formData.custo_pontos),
        tipo: formData.tipo,
        quantidade_disponivel: formData.quantidade_disponivel 
          ? parseInt(formData.quantidade_disponivel) 
          : null,
        imagem_url: formData.imagem_url.trim() || null,
      };

      if (editingReward) {
        const { error } = await supabase
          .from("rewards" as any)
          .update(dataToSave)
          .eq("id", editingReward.id);

        if (error) throw error;
        toast({ title: "Prêmio atualizado com sucesso" });
      } else {
        const { error } = await supabase
          .from("rewards" as any)
          .insert(dataToSave);

        if (error) throw error;
        toast({ title: "Prêmio criado com sucesso" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchRewards();
    } catch (error) {
      toast({
        title: "Erro ao salvar prêmio",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este prêmio?")) return;

    try {
      const { error } = await supabase
        .from("rewards" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Prêmio excluído com sucesso" });
      fetchRewards();
    } catch (error) {
      toast({
        title: "Erro ao excluir prêmio",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (reward: Reward) => {
    setEditingReward(reward);
    setFormData({
      titulo: reward.titulo,
      descricao: reward.descricao || "",
      custo_pontos: reward.custo_pontos.toString(),
      tipo: reward.tipo,
      quantidade_disponivel: reward.quantidade_disponivel?.toString() || "",
      imagem_url: reward.imagem_url || "",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      titulo: "",
      descricao: "",
      custo_pontos: "",
      tipo: "fisico",
      quantidade_disponivel: "",
      imagem_url: "",
    });
    setEditingReward(null);
    setErrors({});
  };

  const getTypeLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      fisico: "Prêmio Físico",
      experiencia: "Experiência",
      bonus: "Bônus",
      folga: "Folga",
    };
    return labels[tipo] || tipo;
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Gerenciar Prêmios</h3>
          <p className="text-sm text-muted-foreground">
            Crie e gerencie recompensas resgatáveis com pontos
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Prêmio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingReward ? "Editar Prêmio" : "Criar Novo Prêmio"}
              </DialogTitle>
              <DialogDescription>
                Configure os detalhes do prêmio
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Ex: Vale-presente R$ 50"
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
                  placeholder="Descreva o prêmio"
                  maxLength={500}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="custo_pontos">Custo em Pontos *</Label>
                  <Input
                    id="custo_pontos"
                    type="number"
                    value={formData.custo_pontos}
                    onChange={(e) => setFormData({ ...formData, custo_pontos: e.target.value })}
                    placeholder="Ex: 500"
                    min="1"
                  />
                  {errors.custo_pontos && <p className="text-sm text-destructive mt-1">{errors.custo_pontos}</p>}
                </div>

                <div>
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fisico">Prêmio Físico</SelectItem>
                      <SelectItem value="experiencia">Experiência</SelectItem>
                      <SelectItem value="bonus">Bônus</SelectItem>
                      <SelectItem value="folga">Folga</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="quantidade_disponivel">Quantidade Disponível</Label>
                <Input
                  id="quantidade_disponivel"
                  type="number"
                  value={formData.quantidade_disponivel}
                  onChange={(e) => setFormData({ ...formData, quantidade_disponivel: e.target.value })}
                  placeholder="Deixe vazio para ilimitado"
                  min="1"
                />
                {errors.quantidade_disponivel && (
                  <p className="text-sm text-destructive mt-1">{errors.quantidade_disponivel}</p>
                )}
              </div>

              <div>
                <Label htmlFor="imagem_url">URL da Imagem</Label>
                <Input
                  id="imagem_url"
                  value={formData.imagem_url}
                  onChange={(e) => setFormData({ ...formData, imagem_url: e.target.value })}
                  placeholder="https://exemplo.com/imagem.jpg"
                />
                {errors.imagem_url && <p className="text-sm text-destructive mt-1">{errors.imagem_url}</p>}
              </div>

              <Button onClick={handleSubmit} className="w-full">
                {editingReward ? "Atualizar" : "Criar"} Prêmio
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rewards.map((reward) => (
          <Card key={reward.id} className={!reward.is_active ? "opacity-60" : ""}>
            {reward.imagem_url && (
              <div className="h-40 bg-muted rounded-t-lg overflow-hidden">
                <img
                  src={reward.imagem_url}
                  alt={reward.titulo}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">{reward.titulo}</CardTitle>
                  <Badge variant="secondary" className="mt-2">
                    {getTypeLabel(reward.tipo)}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(reward)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(reward.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {reward.descricao && (
                <p className="text-sm text-muted-foreground">{reward.descricao}</p>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="text-lg font-bold">{reward.custo_pontos}</span>
                  <span className="text-sm text-muted-foreground">pontos</span>
                </div>
                {reward.quantidade_disponivel !== null && (
                  <Badge variant="outline">
                    {reward.quantidade_disponivel} disponíveis
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
