import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, Trophy } from "lucide-react";
import { z } from "zod";

const badgeSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório").max(50, "Nome deve ter no máximo 50 caracteres"),
  descricao: z.string().trim().max(200, "Descrição deve ter no máximo 200 caracteres").optional(),
  icone: z.string().trim().min(1, "Ícone é obrigatório"),
  cor: z.string().regex(/^#[0-9A-F]{6}$/i, "Cor deve ser um código hexadecimal válido"),
  tipo: z.enum(["vendas", "visitas", "leads", "nivel", "especial"]),
  meta_valor: z.number().int().positive("Valor da meta deve ser positivo").nullable(),
});

interface BadgeData {
  id: string;
  nome: string;
  descricao: string | null;
  icone: string;
  cor: string;
  tipo: string;
  meta_valor: number | null;
  is_active: boolean;
}

export function BadgesAdmin() {
  const { toast } = useToast();
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<BadgeData | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    icone: "trophy",
    cor: "#3B82F6",
    tipo: "especial",
    meta_valor: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      const { data, error } = await supabase
        .from("badges" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBadges((data as unknown as BadgeData[]) || []);
    } catch (error) {
      toast({
        title: "Erro ao carregar badges",
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
        meta_valor: formData.meta_valor ? parseInt(formData.meta_valor) : null,
      };
      badgeSchema.parse(dataToValidate);
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
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim() || null,
        icone: formData.icone,
        cor: formData.cor,
        tipo: formData.tipo,
        meta_valor: formData.meta_valor ? parseInt(formData.meta_valor) : null,
      };

      if (editingBadge) {
        const { error } = await supabase
          .from("badges" as any)
          .update(dataToSave)
          .eq("id", editingBadge.id);

        if (error) throw error;
        toast({ title: "Badge atualizado com sucesso" });
      } else {
        const { error } = await supabase
          .from("badges" as any)
          .insert(dataToSave);

        if (error) throw error;
        toast({ title: "Badge criado com sucesso" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchBadges();
    } catch (error) {
      toast({
        title: "Erro ao salvar badge",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este badge?")) return;

    try {
      const { error } = await supabase
        .from("badges" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Badge excluído com sucesso" });
      fetchBadges();
    } catch (error) {
      toast({
        title: "Erro ao excluir badge",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (badge: BadgeData) => {
    setEditingBadge(badge);
    setFormData({
      nome: badge.nome,
      descricao: badge.descricao || "",
      icone: badge.icone,
      cor: badge.cor,
      tipo: badge.tipo,
      meta_valor: badge.meta_valor?.toString() || "",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      descricao: "",
      icone: "trophy",
      cor: "#3B82F6",
      tipo: "especial",
      meta_valor: "",
    });
    setEditingBadge(null);
    setErrors({});
  };

  const iconOptions = [
    { value: "trophy", label: "Troféu" },
    { value: "award", label: "Prêmio" },
    { value: "star", label: "Estrela" },
    { value: "medal", label: "Medalha" },
    { value: "crown", label: "Coroa" },
  ];

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Gerenciar Badges</h3>
          <p className="text-sm text-muted-foreground">
            Crie e gerencie conquistas personalizadas
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Badge
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingBadge ? "Editar Badge" : "Criar Novo Badge"}
              </DialogTitle>
              <DialogDescription>
                Configure as propriedades da conquista
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Vendedor Bronze"
                  maxLength={50}
                />
                {errors.nome && <p className="text-sm text-destructive mt-1">{errors.nome}</p>}
              </div>

              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descreva a conquista"
                  maxLength={200}
                />
                {errors.descricao && <p className="text-sm text-destructive mt-1">{errors.descricao}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="icone">Ícone *</Label>
                  <Select value={formData.icone} onValueChange={(value) => setFormData({ ...formData, icone: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="cor">Cor *</Label>
                  <Input
                    id="cor"
                    type="color"
                    value={formData.cor}
                    onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                  />
                  {errors.cor && <p className="text-sm text-destructive mt-1">{errors.cor}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendas">Vendas</SelectItem>
                    <SelectItem value="visitas">Visitas</SelectItem>
                    <SelectItem value="leads">Leads</SelectItem>
                    <SelectItem value="nivel">Nível</SelectItem>
                    <SelectItem value="especial">Especial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="meta_valor">Valor da Meta</Label>
                <Input
                  id="meta_valor"
                  type="number"
                  value={formData.meta_valor}
                  onChange={(e) => setFormData({ ...formData, meta_valor: e.target.value })}
                  placeholder="Ex: 10"
                  min="1"
                />
                {errors.meta_valor && <p className="text-sm text-destructive mt-1">{errors.meta_valor}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  Deixe vazio para badges especiais sem meta numérica
                </p>
              </div>

              <Button onClick={handleSubmit} className="w-full">
                {editingBadge ? "Atualizar" : "Criar"} Badge
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {badges.map((badge) => (
          <Card key={badge.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${badge.cor}20` }}
                  >
                    <Trophy className="h-6 w-6" style={{ color: badge.cor }} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{badge.nome}</CardTitle>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {badge.tipo}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(badge)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(badge.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {badge.descricao && (
                <p className="text-sm text-muted-foreground mb-2">{badge.descricao}</p>
              )}
              {badge.meta_valor && (
                <p className="text-xs text-muted-foreground">
                  Meta: {badge.meta_valor}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
