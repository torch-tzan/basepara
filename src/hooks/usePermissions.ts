import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAccounts } from "@/contexts/AccountsContext";
import { PermissionModuleId } from "@/data/accountsData";

export interface ModulePermissions {
  canView: boolean;
  canEdit: boolean;
  fullSite: boolean;
}

export const usePermissions = () => {
  const { authUser } = useAuth();
  const { accounts, getRoleById } = useAccounts();

  // Find the user's account to get their actual role_id from the database
  const userAccount = useMemo(() => {
    if (!authUser?.email) return null;
    return accounts.find((a) => a.email.toLowerCase() === authUser.email.toLowerCase());
  }, [authUser?.email, accounts]);

  // Get the actual role from the accounts table (not from user_roles enum)
  const roleId = userAccount?.roleId || null;
  const role = roleId ? getRoleById(roleId) : null;
  
  // Students have fixed permissions - only view their own data
  const isStudent = authUser?.role === "student";

  const getModulePermissions = useMemo(() => {
    return (moduleId: PermissionModuleId): ModulePermissions => {
      // Not logged in - no permissions
      if (!authUser) {
        return { canView: false, canEdit: false, fullSite: false };
      }
      
      // Fixed student permissions - can only view specific modules
      if (isStudent) {
        const studentViewModules: PermissionModuleId[] = ["home", "students", "schedule", "reports"];
        const canView = studentViewModules.includes(moduleId);
        return { canView, canEdit: false, fullSite: false };
      }
      
      // If we found the user's role in the database, use its permissions
      if (role) {
        const permission = role.permissions[moduleId];
        if (permission) {
          return {
            canView: permission.view,
            canEdit: permission.edit,
            fullSite: permission.fullSite,
          };
        }
      }
      
      // Fallback: if no role found and user is admin enum, grant full access
      if (authUser.role === "admin") {
        return { canView: true, canEdit: true, fullSite: true };
      }
      
      // Default: no permissions
      return { canView: false, canEdit: false, fullSite: false };
    };
  }, [role, isStudent, authUser]);

  // Convenience methods for specific modules
  const permissions = useMemo(() => ({
    home: getModulePermissions("home"),
    students: getModulePermissions("students"),
    teams: getModulePermissions("teams"),
    schedule: getModulePermissions("schedule"),
    reports: getModulePermissions("reports"),
    upload: getModulePermissions("upload"),
    comparison: getModulePermissions("comparison"),
    templates: getModulePermissions("templates"),
    accounts: getModulePermissions("accounts"),
  }), [getModulePermissions]);

  return {
    getModulePermissions,
    permissions,
    currentRole: role,
    userRole: authUser?.role || null,
    userRoleId: roleId,
  };
};
