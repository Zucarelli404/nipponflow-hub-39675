import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Role {
  id: string;
  nome: string;
  descricao: string | null;
  is_system: boolean;
}

interface Module {
  id: string;
  nome: string;
  codigo: string;
  descricao: string | null;
}

interface Permission {
  module_id: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export function RolesManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState({ nome: "", descricao: "" });
  const { toast } = useToast();

  useEffect(() => {
    fetchRoles();
    fetchModules();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      fetchPermissions(selectedRole.id);
    }
  }, [selectedRole]);

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from("roles" as any)
        .select("*")
        .order("nome");

      if (error) throw error;
      setRoles((data as unknown as Role[]) || []);
    } catch (error) {
      toast({
        title: "Erro ao carregar roles",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async () => {
    try {
      const { data, error } = await supabase
        .from("modules" as any)
        .select("*")
        .order("nome");

      if (error) throw error;
      setModules((data as unknown as Module[]) || []);
    } catch (error) {
      console.error("Error fetching modules:", error);
    }
  };

  const fetchPermissions = async (roleId: string) => {
    try {
      const { data, error } = await supabase
        .from("role_module_permissions" as any)
        .select("*")
        .eq("role_id", roleId);

      if (error) throw error;
      setPermissions((data as unknown as Permission[]) || []);
    } catch (error) {
      console.error("Error fetching permissions:", error);
    }
  };

  const createRole = async () => {
    if (!newRole.nome.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, preencha o nome do cargo",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("roles" as any)
        .insert({
          nome: newRole.nome,
          descricao: newRole.descricao,
          is_system: false,
        });

      if (error) throw error;

      toast({
        title: "Cargo criado",
        description: "O cargo foi criado com sucesso",
      });

      setNewRole({ nome: "", descricao: "" });
      setIsDialogOpen(false);
      fetchRoles();
    } catch (error) {
      toast({
        title: "Erro ao criar cargo",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const deleteRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from("roles" as any)
        .delete()
        .eq("id", roleId);

      if (error) throw error;

      toast({
        title: "Cargo excluído",
        description: "O cargo foi excluído com sucesso",
      });

      if (selectedRole?.id === roleId) {
        setSelectedRole(null);
      }
      fetchRoles();
    } catch (error) {
      toast({
        title: "Erro ao excluir cargo",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const updatePermission = async (
    moduleId: string,
    field: keyof Omit<Permission, "module_id">,
    value: boolean
  ) => {
    if (!selectedRole) return;

    const existingPermission = permissions.find((p) => p.module_id === moduleId);

    try {
      if (existingPermission) {
        const { error } = await supabase
          .from("role_module_permissions" as any)
          .update({ [field]: value })
          .eq("role_id", selectedRole.id)
          .eq("module_id", moduleId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("role_module_permissions" as any)
          .insert({
            role_id: selectedRole.id,
            module_id: moduleId,
            [field]: value,
          });

        if (error) throw error;
      }

      fetchPermissions(selectedRole.id);
      toast({
        title: "Permissão atualizada",
        description: "A permissão foi atualizada com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar permissão",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const getPermission = (moduleId: string) => {
    return permissions.find((p) => p.module_id === moduleId) || {
      module_id: moduleId,
      can_view: false,
      can_create: false,
      can_edit: false,
      can_delete: false,
    };
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Gerenciamento de Cargos</h3>
          <p className="text-sm text-muted-foreground">
            Crie e configure cargos personalizados com permissões específicas
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Cargo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Cargo</DialogTitle>
              <DialogDescription>
                Defina as informações básicas do cargo. As permissões podem ser configuradas depois.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome do Cargo</Label>
                <Input
                  id="nome"
                  value={newRole.nome}
                  onChange={(e) => setNewRole({ ...newRole, nome: e.target.value })}
                  placeholder="Ex: Vendedor"
                />
              </div>
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={newRole.descricao}
                  onChange={(e) => setNewRole({ ...newRole, descricao: e.target.value })}
                  placeholder="Descreva as responsabilidades deste cargo"
                />
              </div>
              <Button onClick={createRole} className="w-full">
                Criar Cargo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Cargos</CardTitle>
            <CardDescription>Selecione um cargo para configurar permissões</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {roles.map((role) => (
              <div
                key={role.id}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-accent ${
                  selectedRole?.id === role.id ? "bg-accent" : ""
                }`}
                onClick={() => setSelectedRole(role)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{role.nome}</span>
                    {role.is_system && (
                      <Badge variant="secondary" className="text-xs">
                        Sistema
                      </Badge>
                    )}
                  </div>
                  {role.descricao && (
                    <p className="text-sm text-muted-foreground mt-1">{role.descricao}</p>
                  )}
                </div>
                {!role.is_system && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteRole(role.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Permissões por Módulo</CardTitle>
            <CardDescription>
              {selectedRole
                ? `Configurando permissões para: ${selectedRole.nome}`
                : "Selecione um cargo para configurar permissões"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedRole ? (
              <div className="space-y-4">
                {modules.map((module) => {
                  const permission = getPermission(module.id);
                  return (
                    <div key={module.id} className="border rounded-lg p-4">
                      <div className="mb-3">
                        <h4 className="font-medium">{module.nome}</h4>
                        {module.descricao && (
                          <p className="text-sm text-muted-foreground">{module.descricao}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`${module.id}-view`}
                            checked={permission.can_view}
                            onCheckedChange={(checked) =>
                              updatePermission(module.id, "can_view", checked as boolean)
                            }
                          />
                          <Label htmlFor={`${module.id}-view`} className="text-sm">
                            Visualizar
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`${module.id}-create`}
                            checked={permission.can_create}
                            onCheckedChange={(checked) =>
                              updatePermission(module.id, "can_create", checked as boolean)
                            }
                          />
                          <Label htmlFor={`${module.id}-create`} className="text-sm">
                            Criar
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`${module.id}-edit`}
                            checked={permission.can_edit}
                            onCheckedChange={(checked) =>
                              updatePermission(module.id, "can_edit", checked as boolean)
                            }
                          />
                          <Label htmlFor={`${module.id}-edit`} className="text-sm">
                            Editar
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`${module.id}-delete`}
                            checked={permission.can_delete}
                            onCheckedChange={(checked) =>
                              updatePermission(module.id, "can_delete", checked as boolean)
                            }
                          />
                          <Label htmlFor={`${module.id}-delete`} className="text-sm">
                            Excluir
                          </Label>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Selecione um cargo da lista ao lado para configurar permissões
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
