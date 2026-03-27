import React, { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  useAccounts as useSupabaseAccountsQuery,
  useRoles as useSupabaseRolesQuery,
  useUpdateAccount,
  useDeleteAccount,
  useToggleAccountActive,
  useAddRole,
  useUpdateRole,
  useDeleteRole,
  type AccountWithTeams,
  type RoleWithPermissions,
  type RolePermissionRow,
} from "@/hooks/useSupabaseAccounts";
import { useCreateAccount } from "@/hooks/useCreateAccount";
import { permissionModules, type PermissionModuleId, type ModulePermission } from "@/data/accountsData";

// Re-export types for backward compatibility
export type { PermissionModuleId, ModulePermission };

// AccountData type for backward compatibility
export interface AccountData {
  id: string;
  name: string;
  email: string;
  roleId: string;
  active: boolean;
  createdAt: string;
  teams?: string[];
}

// RoleData type for backward compatibility
export interface RoleData {
  id: string;
  name: string;
  description: string;
  permissions: Record<PermissionModuleId, ModulePermission>;
  isSystem?: boolean;
}

// Helper to convert database role to frontend format
const convertRole = (role: RoleWithPermissions): RoleData => {
  const permissions: Record<string, ModulePermission> = {};
  
  // Initialize all modules with defaults
  permissionModules.forEach((module) => {
    permissions[module.id] = {
      view: module.lockView,
      edit: module.lockEdit,
      fullSite: false,
    };
  });
  
  // Apply database permissions
  role.permissions.forEach((p) => {
    permissions[p.module] = {
      view: p.can_view ?? false,
      edit: p.can_edit ?? false,
      fullSite: p.full_site ?? false,
    };
  });
  
  return {
    id: role.id,
    name: role.name,
    description: role.description || "",
    permissions: permissions as Record<PermissionModuleId, ModulePermission>,
    isSystem: role.is_system ?? false,
  };
};

// Helper to convert database account to frontend format
const convertAccount = (account: AccountWithTeams): AccountData => ({
  id: account.id,
  name: account.name,
  email: account.email,
  roleId: account.role_id,
  active: account.active ?? true,
  createdAt: new Date(account.created_at).toLocaleDateString("zh-TW"),
  teams: account.teams,
});

// Create default permissions function
export const createDefaultPermissions = (): Record<PermissionModuleId, ModulePermission> => {
  const permissions: Record<string, ModulePermission> = {};
  permissionModules.forEach((module) => {
    permissions[module.id] = {
      view: module.lockView,
      edit: module.lockEdit,
      fullSite: false,
    };
  });
  return permissions as Record<PermissionModuleId, ModulePermission>;
};

interface AccountsContextType {
  // Data
  accounts: AccountData[];
  roles: RoleData[];
  isLoading: boolean;
  
  // Account methods
  getAccountById: (id: string) => AccountData | undefined;
  addAccount: (account: Omit<AccountData, "id" | "createdAt">) => Promise<AccountData>;
  updateAccount: (id: string, updates: Partial<Omit<AccountData, "id">>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  toggleAccountActive: (id: string) => Promise<void>;
  isLastAdmin: (id: string) => boolean;

  // Role methods
  getRoleById: (id: string) => RoleData | undefined;
  getRoleName: (roleId: string) => string;
  getAccountCountByRole: (roleId: string) => number;
  addRole: (role: Omit<RoleData, "id">) => Promise<RoleData>;
  updateRole: (id: string, updates: Partial<Omit<RoleData, "id">>) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;
  getRoleOptions: () => { value: string; label: string }[];
  createDefaultPermissions: () => Record<PermissionModuleId, ModulePermission>;
}

const AccountsContext = createContext<AccountsContextType | undefined>(undefined);

// Generate unique ID
const generateId = (prefix: string): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const AccountsProvider = ({ children }: { children: ReactNode }) => {
  // Fetch data from Supabase
  const { data: accountsData, isLoading: accountsLoading } = useSupabaseAccountsQuery();
  const { data: rolesData, isLoading: rolesLoading } = useSupabaseRolesQuery();
  
  // Mutations
  const createAccountMutation = useCreateAccount();
  const updateAccountMutation = useUpdateAccount();
  const deleteAccountMutation = useDeleteAccount();
  const toggleActiveMutation = useToggleAccountActive();
  const addRoleMutation = useAddRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();
  
  // Convert data to frontend format
  const accounts = useMemo(() => 
    (accountsData || []).map(convertAccount), 
    [accountsData]
  );
  
  const roles = useMemo(() => 
    (rolesData || []).map(convertRole), 
    [rolesData]
  );
  
  const isLoading = accountsLoading || rolesLoading;

  // ============= Account Methods =============
  const getAccountById = (id: string) => accounts.find((a) => a.id === id);

  const addAccount = async (account: Omit<AccountData, "id" | "createdAt">): Promise<AccountData> => {
    const newId = generateId("acc");
    await createAccountMutation.mutateAsync({
      id: newId,
      name: account.name,
      email: account.email,
      role_id: account.roleId,
      active: account.active,
      teams: account.teams,
    });
    return {
      ...account,
      id: newId,
      createdAt: new Date().toLocaleDateString("zh-TW"),
    };
  };

  const updateAccount = async (id: string, updates: Partial<Omit<AccountData, "id">>) => {
    await updateAccountMutation.mutateAsync({
      id,
      name: updates.name,
      email: updates.email,
      role_id: updates.roleId,
      active: updates.active,
      teams: updates.teams,
    });
  };

  const deleteAccount = async (id: string) => {
    await deleteAccountMutation.mutateAsync(id);
  };

  const toggleAccountActive = async (id: string) => {
    const account = accounts.find((a) => a.id === id);
    if (account) {
      await toggleActiveMutation.mutateAsync({ id, active: !account.active });
    }
  };

  const isLastAdmin = (id: string): boolean => {
    const account = accounts.find((a) => a.id === id);
    if (!account || account.roleId !== "admin") return false;
    const adminCount = accounts.filter((a) => a.roleId === "admin").length;
    return adminCount <= 1;
  };

  // ============= Role Methods =============
  const getRoleById = (id: string) => roles.find((r) => r.id === id);

  const getRoleName = (roleId: string): string => {
    const role = roles.find((r) => r.id === roleId);
    return role?.name || "未知角色";
  };

  const getAccountCountByRole = (roleId: string): number => {
    return accounts.filter((a) => a.roleId === roleId).length;
  };

  const addRole = async (role: Omit<RoleData, "id">): Promise<RoleData> => {
    const newId = generateId("role");
    const permissions = Object.entries(role.permissions).map(([module, perm]) => ({
      module: module as RolePermissionRow["module"],
      can_view: perm.view,
      can_edit: perm.edit,
      full_site: perm.fullSite,
    }));
    
    await addRoleMutation.mutateAsync({
      id: newId,
      name: role.name,
      description: role.description,
      is_system: role.isSystem,
      permissions,
    });
    
    return { ...role, id: newId };
  };

  const updateRole = async (id: string, updates: Partial<Omit<RoleData, "id">>) => {
    const permissions = updates.permissions
      ? Object.entries(updates.permissions).map(([module, perm]) => ({
          module: module as RolePermissionRow["module"],
          can_view: perm.view,
          can_edit: perm.edit,
          full_site: perm.fullSite,
        }))
      : undefined;
    
    await updateRoleMutation.mutateAsync({
      id,
      name: updates.name,
      description: updates.description,
      permissions,
    });
  };

  const deleteRole = async (id: string) => {
    // Don't delete system roles
    const role = roles.find((r) => r.id === id);
    if (role?.isSystem) return;
    await deleteRoleMutation.mutateAsync(id);
  };

  const getRoleOptions = () => roles.map((r) => ({ value: r.id, label: r.name }));

  const value = useMemo(
    () => ({
      accounts,
      roles,
      isLoading,
      getAccountById,
      addAccount,
      updateAccount,
      deleteAccount,
      toggleAccountActive,
      isLastAdmin,
      getRoleById,
      getRoleName,
      getAccountCountByRole,
      addRole,
      updateRole,
      deleteRole,
      getRoleOptions,
      createDefaultPermissions,
    }),
    [accounts, roles, isLoading]
  );

  return (
    <AccountsContext.Provider value={value}>
      {children}
    </AccountsContext.Provider>
  );
};

export const useAccounts = () => {
  const context = useContext(AccountsContext);
  if (!context) {
    throw new Error("useAccounts must be used within an AccountsProvider");
  }
  return context;
};
