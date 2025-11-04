import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Course {
  id: string;
  titulo: string;
  descricao: string;
  status: string;
}

interface Role {
  id: string;
  nome: string;
  is_system: boolean;
}

interface CoursePermission {
  course_id: string;
  role_id: string;
}

export function CoursePermissions() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<CoursePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [coursesRes, rolesRes, permissionsRes] = await Promise.all([
        supabase.from("courses" as any).select("*").order("titulo"),
        supabase.from("roles" as any).select("*").order("nome"),
        supabase.from("course_role_permissions" as any).select("*"),
      ]);

      if (coursesRes.error) throw coursesRes.error;
      if (rolesRes.error) throw rolesRes.error;
      if (permissionsRes.error) throw permissionsRes.error;

      setCourses((coursesRes.data as unknown as Course[]) || []);
      setRoles((rolesRes.data as unknown as Role[]) || []);
      setPermissions((permissionsRes.data as unknown as CoursePermission[]) || []);
    } catch (error) {
      toast({
        title: "Erro ao carregar dados",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (courseId: string, roleId: string) => {
    return permissions.some((p) => p.course_id === courseId && p.role_id === roleId);
  };

  const togglePermission = async (courseId: string, roleId: string, checked: boolean) => {
    try {
      if (checked) {
        const { error } = await supabase
          .from("course_role_permissions" as any)
          .insert({ course_id: courseId, role_id: roleId });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("course_role_permissions" as any)
          .delete()
          .eq("course_id", courseId)
          .eq("role_id", roleId);

        if (error) throw error;
      }

      fetchData();
      toast({
        title: "Permissão atualizada",
        description: "A permissão do curso foi atualizada com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar permissão",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permissões de Cursos</CardTitle>
        <CardDescription>
          Defina quais cargos têm acesso a cada curso. Admins sempre têm acesso total.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {courses.map((course) => (
            <div key={course.id} className="border rounded-lg p-4">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium">{course.titulo}</h4>
                  <Badge variant={course.status === "publicado" ? "default" : "secondary"}>
                    {course.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{course.descricao}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {roles.map((role) => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${course.id}-${role.id}`}
                      checked={hasPermission(course.id, role.id)}
                      onCheckedChange={(checked) =>
                        togglePermission(course.id, role.id, checked as boolean)
                      }
                      disabled={role.nome === "Admin"}
                    />
                    <Label
                      htmlFor={`${course.id}-${role.id}`}
                      className={`text-sm ${role.nome === "Admin" ? "text-muted-foreground" : ""}`}
                    >
                      {role.nome}
                      {role.nome === "Admin" && " (sempre ativo)"}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {courses.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              Nenhum curso disponível. Crie cursos para configurar permissões.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
