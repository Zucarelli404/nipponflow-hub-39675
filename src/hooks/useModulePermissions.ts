import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type ModulePermissionsMap = Record<string, boolean>;

/**
 * Centraliza a lógica de permissões por módulo, reutilizável fora do Sidebar.
 */
export function useModulePermissions() {
  const { user, userRole } = useAuth();
  const [modulePermissions, setModulePermissions] = useState<ModulePermissionsMap>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user?.id) {
      setModulePermissions({});
      setLoading(false);
      return;
    }

    const fetch = async () => {
      setLoading(true);
      try {
        // Buscar role_id do usuário (pode estar em role ou role_id)
        const { data: userRoleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role, role_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (roleError || !userRoleData) {
          setModulePermissions({});
          return;
        }

        let roleId = (userRoleData as any).role_id as string | undefined;

        // Se role_id não existe, buscar pelo enum/descrição em roles
        if (!roleId && (userRoleData as any).role) {
          const { data: roleData } = await supabase
            .from("roles" as any)
            .select("id")
            .ilike("nome", (userRoleData as any).role)
            .maybeSingle();
          roleId = (roleData as any)?.id;
        }

        if (!roleId) {
          setModulePermissions({});
          return;
        }

        // Buscar permissões ativas para o role
        const { data: permissions, error: permError } = await supabase
          .from("role_module_permissions" as any)
          .select(`
            module_id,
            can_view,
            modules!inner(codigo)
          `)
          .eq("role_id", roleId)
          .eq("can_view", true);

        if (permError) throw permError;

        const permMap: ModulePermissionsMap = {};
        (permissions as any[])?.forEach((perm: any) => {
          if (perm.modules?.codigo) {
            permMap[perm.modules.codigo] = true;
          }
        });

        setModulePermissions(permMap);
      } catch (error) {
        if (import.meta.env.DEV) console.error("Error fetching permissions:", error);
        setModulePermissions({});
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [user?.id]);

  const hasModulePermission = useMemo(() => {
    return (moduleCode: string) => {
      // Admin sempre tem acesso
      if (userRole === "admin") return true;
      return modulePermissions[moduleCode] === true;
    };
  }, [modulePermissions, userRole]);

  return { loading, modulePermissions, hasModulePermission };
}