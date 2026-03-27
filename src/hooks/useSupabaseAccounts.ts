import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type RoleRow = Tables<"roles">;
export type RolePermissionRow = Tables<"role_permissions">;
export type AccountRow = Tables<"accounts">;
export type AccountTeamRow = Tables<"account_teams">;

export interface RoleWithPermissions extends RoleRow {
  permissions: RolePermissionRow[];
}

export interface AccountWithTeams extends AccountRow {
  teams: string[];
}

// ============= Roles =============

export const useRoles = () => {
  return useQuery({
    queryKey: ["roles"],
    queryFn: async (): Promise<RoleWithPermissions[]> => {
      const { data: roles, error: rolesError } = await supabase
        .from("roles")
        .select("*")
        .order("name");

      if (rolesError) throw rolesError;

      const { data: permissions, error: permError } = await supabase
        .from("role_permissions")
        .select("*");

      if (permError) throw permError;

      return (roles || []).map((role) => ({
        ...role,
        permissions: (permissions || []).filter((p) => p.role_id === role.id),
      }));
    },
  });
};

export const useRoleById = (id: string | undefined) => {
  return useQuery({
    queryKey: ["roles", id],
    queryFn: async (): Promise<RoleWithPermissions | null> => {
      if (!id) return null;

      const { data: role, error } = await supabase
        .from("roles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!role) return null;

      const { data: permissions, error: permError } = await supabase
        .from("role_permissions")
        .select("*")
        .eq("role_id", id);

      if (permError) throw permError;

      return { ...role, permissions: permissions || [] };
    },
    enabled: !!id,
  });
};

export const useAddRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      description?: string;
      is_system?: boolean;
      permissions: Array<{
        module: RolePermissionRow["module"];
        can_view: boolean;
        can_edit: boolean;
        full_site: boolean;
      }>;
    }) => {
      // Insert role
      const { error: roleError } = await supabase
        .from("roles")
        .insert({
          id: data.id,
          name: data.name,
          description: data.description,
          is_system: data.is_system || false,
        });

      if (roleError) throw roleError;

      // Insert permissions
      if (data.permissions.length > 0) {
        const { error: permError } = await supabase
          .from("role_permissions")
          .insert(
            data.permissions.map((p) => ({
              role_id: data.id,
              module: p.module,
              can_view: p.can_view,
              can_edit: p.can_edit,
              full_site: p.full_site,
            }))
          );

        if (permError) throw permError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      name?: string;
      description?: string;
      permissions?: Array<{
        module: RolePermissionRow["module"];
        can_view: boolean;
        can_edit: boolean;
        full_site: boolean;
      }>;
    }) => {
      // Update role if name or description provided
      if (data.name !== undefined || data.description !== undefined) {
        const updates: { name?: string; description?: string } = {};
        if (data.name !== undefined) updates.name = data.name;
        if (data.description !== undefined) updates.description = data.description;

        const { error: roleError } = await supabase
          .from("roles")
          .update(updates)
          .eq("id", data.id);

        if (roleError) throw roleError;
      }

      // Update permissions if provided
      if (data.permissions !== undefined) {
        // Delete existing permissions
        const { error: deleteError } = await supabase
          .from("role_permissions")
          .delete()
          .eq("role_id", data.id);

        if (deleteError) throw deleteError;

        // Insert new permissions
        if (data.permissions.length > 0) {
          const { error: insertError } = await supabase
            .from("role_permissions")
            .insert(
              data.permissions.map((p) => ({
                role_id: data.id,
                module: p.module,
                can_view: p.can_view,
                can_edit: p.can_edit,
                full_site: p.full_site,
              }))
            );

          if (insertError) throw insertError;
        }
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["roles", variables.id] });
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("roles").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
};

// ============= Accounts =============

export const useAccounts = () => {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: async (): Promise<AccountWithTeams[]> => {
      const { data: accounts, error: accountsError } = await supabase
        .from("accounts")
        .select("*")
        .order("name");

      if (accountsError) throw accountsError;

      const { data: accountTeams, error: atError } = await supabase
        .from("account_teams")
        .select("*");

      if (atError) throw atError;

      return (accounts || []).map((account) => ({
        ...account,
        teams: (accountTeams || [])
          .filter((at) => at.account_id === account.id)
          .map((at) => at.team_id),
      }));
    },
  });
};

export const useAccountById = (id: string | undefined) => {
  return useQuery({
    queryKey: ["accounts", id],
    queryFn: async (): Promise<AccountWithTeams | null> => {
      if (!id) return null;

      const { data: account, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!account) return null;

      const { data: accountTeams, error: atError } = await supabase
        .from("account_teams")
        .select("team_id")
        .eq("account_id", id);

      if (atError) throw atError;

      return {
        ...account,
        teams: (accountTeams || []).map((at) => at.team_id),
      };
    },
    enabled: !!id,
  });
};

export const useAddAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      email: string;
      role_id: string;
      active?: boolean;
      teams?: string[];
    }) => {
      // Insert account
      const { error: accountError } = await supabase
        .from("accounts")
        .insert({
          id: data.id,
          name: data.name,
          email: data.email,
          role_id: data.role_id,
          active: data.active ?? true,
        });

      if (accountError) throw accountError;

      // Insert team assignments
      if (data.teams && data.teams.length > 0) {
        const { error: atError } = await supabase
          .from("account_teams")
          .insert(
            data.teams.map((teamId) => ({
              account_id: data.id,
              team_id: teamId,
            }))
          );

        if (atError) throw atError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
};

export const useUpdateAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      name?: string;
      email?: string;
      role_id?: string;
      active?: boolean;
      teams?: string[];
    }) => {
      // Build update object
      const updates: Partial<AccountRow> = {};
      if (data.name !== undefined) updates.name = data.name;
      if (data.email !== undefined) updates.email = data.email;
      if (data.role_id !== undefined) updates.role_id = data.role_id;
      if (data.active !== undefined) updates.active = data.active;

      if (Object.keys(updates).length > 0) {
        const { error: accountError } = await supabase
          .from("accounts")
          .update(updates)
          .eq("id", data.id);

        if (accountError) throw accountError;
      }

      // Update team assignments if provided
      if (data.teams !== undefined) {
        // Delete existing assignments
        const { error: deleteError } = await supabase
          .from("account_teams")
          .delete()
          .eq("account_id", data.id);

        if (deleteError) throw deleteError;

        // Insert new assignments
        if (data.teams.length > 0) {
          const { error: insertError } = await supabase
            .from("account_teams")
            .insert(
              data.teams.map((teamId) => ({
                account_id: data.id,
                team_id: teamId,
              }))
            );

          if (insertError) throw insertError;
        }
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["accounts", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["teams"] }); // Coach assignments may have changed
    },
  });
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("accounts").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
};

export const useToggleAccountActive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("accounts")
        .update({ active })
        .eq("id", id);

      if (error) throw error;
      return { id, active };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["accounts", variables.id] });
    },
  });
};
