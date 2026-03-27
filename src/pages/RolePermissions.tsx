import { useState, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Info, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAccounts } from "@/contexts/AccountsContext";
import { permissionModules, type PermissionModuleId, type ModulePermission } from "@/data/accountsData";

const RolePermissions = () => {
  const navigate = useNavigate();
  const { roleId } = useParams<{ roleId: string }>();
  const { toast } = useToast();
  const { 
    getRoleById, 
    addRole, 
    updateRole, 
    deleteRole,
    createDefaultPermissions,
    getAccountCountByRole,
  } = useAccounts();
  
  const isNewRole = roleId === "new";
  const roleData = roleId && !isNewRole ? getRoleById(roleId) : null;
  
  const initialPermissions = isNewRole ? createDefaultPermissions() : (roleData?.permissions || createDefaultPermissions());
  const [permissions, setPermissions] = useState<Record<PermissionModuleId, ModulePermission>>(
    initialPermissions
  );
  const [roleName, setRoleName] = useState(isNewRole ? "" : (roleData?.name || ""));
  const [roleDescription, setRoleDescription] = useState(isNewRole ? "" : (roleData?.description || ""));
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [errors, setErrors] = useState<{ roleName?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Refs for uncontrolled inputs to avoid IME issues
  const roleNameRef = useRef<HTMLInputElement>(null);
  const roleDescriptionRef = useRef<HTMLTextAreaElement>(null);

  const hasUnsavedChanges = useMemo(() => {
    // For uncontrolled inputs, we check the ref values
    const currentName = roleNameRef.current?.value ?? roleName;
    const currentDescription = roleDescriptionRef.current?.value ?? roleDescription;
    
    if (isNewRole) {
      return currentName !== "" || currentDescription !== "";
    }
    return (
      JSON.stringify(permissions) !== JSON.stringify(initialPermissions) ||
      currentName !== roleData?.name ||
      currentDescription !== roleData?.description
    );
  }, [permissions, initialPermissions, roleName, roleDescription, roleData, isNewRole]);

  const isAdmin = roleId === "admin";
  const isSystemRole = roleData?.isSystem;
  const userCount = roleId && !isNewRole ? getAccountCountByRole(roleId) : 0;

  if (!isNewRole && !roleData) {
    return (
      <AppLayout title="角色權限設定">
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          找不到該角色
        </div>
      </AppLayout>
    );
  }

  const togglePermission = (moduleId: PermissionModuleId, permType: "view" | "edit" | "fullSite") => {
    if (isAdmin) return;
    
    const module = permissionModules.find(m => m.id === moduleId);
    if (module?.lockView && permType === "view") return;
    if (module?.lockEdit && permType === "edit") return;
    
    setPermissions((prev) => {
      const currentPerms = prev[moduleId] || { view: false, edit: false, fullSite: false };
      const newPerms = {
        ...currentPerms,
        [permType]: !currentPerms[permType],
      };
      // If turning off view, also turn off edit and fullSite
      if (permType === "view" && currentPerms.view) {
        newPerms.edit = false;
        newPerms.fullSite = false;
      }
      // For syncEditWithView modules, sync edit with view
      if (module?.syncEditWithView && permType === "view") {
        newPerms.edit = newPerms.view;
      }
      return {
        ...prev,
        [moduleId]: newPerms,
      };
    });
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setCancelDialogOpen(true);
    } else {
      navigate("/accounts?tab=roles");
    }
  };

  const handleConfirmCancel = () => {
    setCancelDialogOpen(false);
    navigate("/accounts?tab=roles");
  };

  const validateForm = () => {
    const newErrors: { roleName?: string } = {};
    const currentName = roleNameRef.current?.value ?? "";
    
    if (!currentName.trim()) {
      newErrors.roleName = "請輸入角色名稱";
    } else if (currentName.trim().length > 50) {
      newErrors.roleName = "角色名稱不能超過 50 字";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    const currentName = roleNameRef.current?.value ?? "";
    const currentDescription = roleDescriptionRef.current?.value ?? "";
    
    setIsSubmitting(true);
    try {
      if (isNewRole) {
        await addRole({
          name: currentName.trim(),
          description: currentDescription.trim(),
          permissions,
        });
        toast({
          title: "已新增角色",
          description: `${currentName} 角色已成功新增`,
        });
      } else if (roleId) {
        await updateRole(roleId, {
          name: currentName.trim(),
          description: currentDescription.trim(),
          permissions,
        });
        toast({
          title: "已儲存",
          description: `${currentName} 的權限設定已更新`,
        });
      }
      navigate("/accounts?tab=roles");
    } catch (error) {
      console.error("Save role error:", error);
      toast({
        title: "儲存失敗",
        description: error instanceof Error ? error.message : "請稍後再試",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!roleId || isSystemRole) return;
    
    deleteRole(roleId);
    setDeleteDialogOpen(false);
    toast({
      title: "角色已刪除",
      description: `已成功刪除角色：${roleData?.name}`,
    });
    navigate("/accounts?tab=roles");
  };

  const pageTitle = isNewRole ? "新增角色權限" : "角色權限設定";

  return (
    <AppLayout
      title={pageTitle}
      headerAction={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isNewRole ? "新增中..." : "儲存中..."}
              </>
            ) : (
              "完成"
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Breadcrumb */}
        <PageBreadcrumb
          items={[
            { label: "帳號管理", path: "/accounts?tab=roles" },
            { label: isNewRole ? "新增角色" : (roleData?.name || "角色設定") },
          ]}
        />

        {/* Role Info */}
        <div className="bg-card rounded-lg border border-border p-6 space-y-4">
          {/* Role Name */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">角色名稱</label>
            <Input
              ref={roleNameRef}
              defaultValue={roleName}
              className="max-w-sm text-lg font-semibold"
              placeholder="輸入角色名稱"
              disabled={isAdmin}
            />
            {errors.roleName && (
              <p className="text-sm text-destructive">{errors.roleName}</p>
            )}
          </div>
          
          {/* Role Description */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">角色描述</label>
            <Textarea
              ref={roleDescriptionRef}
              defaultValue={roleDescription}
              className="max-w-lg resize-none"
              rows={2}
              placeholder="輸入角色描述"
              disabled={isAdmin}
            />
          </div>
        </div>

        {/* Permissions Table */}
        <div className="bg-card rounded-lg border border-border">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-medium text-foreground">功能權限</h3>
            <p className="text-sm text-muted-foreground mt-1">
              設定此角色可存取的功能模組
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">功能模組</TableHead>
                <TableHead>說明</TableHead>
                <TableHead className="text-center w-[100px]">檢視</TableHead>
                <TableHead className="text-center w-[100px]">編輯</TableHead>
                <TableHead className="text-center w-[140px]">
                  <div className="flex items-center justify-center gap-1">
                    全站資料
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>設定可檢視全站資料，或僅能檢視有管理權限的資料</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissionModules.filter(m => !m.hidden).map((module) => {
                const perms = permissions[module.id] || { view: false, edit: false, fullSite: false };
                const isViewLocked = module.lockView;
                const isEditLocked = module.lockEdit;
                return (
                  <TableRow key={module.id}>
                    <TableCell className="font-medium">{module.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {module.description}
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={perms.view}
                        onCheckedChange={() => togglePermission(module.id, "view")}
                        disabled={isAdmin || isViewLocked}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={perms.edit}
                        onCheckedChange={() => togglePermission(module.id, "edit")}
                        disabled={isAdmin || isEditLocked || !perms.view || module.syncEditWithView}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={perms.fullSite}
                        onCheckedChange={() => togglePermission(module.id, "fullSite")}
                        disabled={isAdmin || !perms.view}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {isAdmin && (
          <p className="text-sm text-muted-foreground text-center">
            Admin 角色擁有所有權限，無法修改
          </p>
        )}

        {/* Delete Role Section */}
        {!isNewRole && (
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-medium text-foreground">刪除角色</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  刪除後無法復原，請謹慎操作
                </p>
                {isSystemRole && (
                  <p className="text-sm text-destructive mt-2">
                    系統內建角色無法刪除
                  </p>
                )}
                {!isSystemRole && userCount > 0 && (
                  <p className="text-sm text-destructive mt-2">
                    目前有 {userCount} 個帳號使用此角色，刪除前請先變更這些帳號的角色
                  </p>
                )}
              </div>
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                className="gap-2"
                disabled={isSystemRole || userCount > 0}
              >
                <Trash2 className="w-4 h-4" />
                刪除角色
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>尚未儲存變更</AlertDialogTitle>
            <AlertDialogDescription>
              您有尚未儲存的變更，確定要離開嗎？所有變更將會遺失。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel}>
              確認離開
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除此角色嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作無法復原。角色「{roleData?.name}」將被永久刪除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              確定刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default RolePermissions;
