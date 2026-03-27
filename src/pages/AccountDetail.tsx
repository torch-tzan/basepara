import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { KeyRound, Trash2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/ui/form-field";
import { FormSelect } from "@/components/ui/form-select";
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
import { useToast } from "@/hooks/use-toast";
import { useAccounts } from "@/contexts/AccountsContext";
import { useEmailValidation } from "@/hooks/useEmailValidation";
import { useAuditLog } from "@/hooks/useAuditLog";

const AccountDetail = () => {
  const navigate = useNavigate();
  const { accountId } = useParams<{ accountId: string }>();
  const { toast } = useToast();
  const { getAccountById, updateAccount, deleteAccount, getRoleOptions, getRoleName, isLastAdmin } = useAccounts();
  const { validateEmail } = useEmailValidation();
  const { logAccountUpdated, logAccountDeleted, logRoleChanged, logPasswordResetRequested } = useAuditLog();

  const existingAccount = accountId ? getAccountById(accountId) : null;
  const roleOptions = getRoleOptions();
  
  // Check if this is the last admin account
  const isLastAdminAccount = accountId ? isLastAdmin(accountId) : false;

  const [accountName, setAccountName] = useState(existingAccount?.name || "");
  const [email, setEmail] = useState(existingAccount?.email || "");
  const [selectedRole, setSelectedRole] = useState(existingAccount?.roleId || "");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [errors, setErrors] = useState<{ accountName?: string; email?: string; role?: string }>({}); 

  const [initialState] = useState({
    name: existingAccount?.name || "",
    email: existingAccount?.email || "",
    roleId: existingAccount?.roleId || "",
  });

  // Update form when account data changes
  useEffect(() => {
    if (existingAccount) {
      setAccountName(existingAccount.name);
      setEmail(existingAccount.email);
      setSelectedRole(existingAccount.roleId);
    }
  }, [existingAccount]);

  const hasUnsavedChanges =
    accountName !== initialState.name ||
    email !== initialState.email ||
    selectedRole !== initialState.roleId;

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowCancelDialog(true);
    } else {
      navigate("/accounts");
    }
  };

  const handleConfirmCancel = () => {
    setShowCancelDialog(false);
    navigate("/accounts");
  };

  const validateForm = () => {
    const newErrors: { accountName?: string; email?: string; role?: string } = {};

    if (!accountName.trim()) {
      newErrors.accountName = "請輸入帳號姓名";
    } else if (accountName.trim().length > 100) {
      newErrors.accountName = "帳號姓名不能超過 100 字";
    }

    // Validate email using centralized hook
    const emailResult = validateEmail(email, { excludeAccountId: accountId });
    if (!emailResult.isValid) {
      newErrors.email = emailResult.error;
    }

    if (!selectedRole) {
      newErrors.role = "請選擇角色";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !accountId) {
      return;
    }

    // Check if role changed
    const roleChanged = existingAccount?.roleId !== selectedRole;
    const oldRoleName = existingAccount?.roleId ? getRoleName(existingAccount.roleId) : "";
    const newRoleName = getRoleName(selectedRole);

    await updateAccount(accountId, {
      name: accountName.trim(),
      email: email.trim(),
      roleId: selectedRole,
    });

    // Log the update
    await logAccountUpdated(accountId, accountName.trim(), {
      email: email.trim(),
      roleId: selectedRole,
    });

    // If role changed, log that separately
    if (roleChanged) {
      await logRoleChanged(accountId, accountName.trim(), oldRoleName, newRoleName);
    }

    toast({
      title: "帳號已更新",
      description: `已成功更新帳號：${accountName}`,
    });
    navigate("/accounts");
  };

  const handleResetPassword = async () => {
    if (accountId && existingAccount) {
      await logPasswordResetRequested(accountId, existingAccount.email);
    }
    setShowResetPasswordDialog(false);
    toast({
      title: "密碼重置連結已發送",
      description: `已發送重置密碼連結至 ${email}`,
    });
  };

  const handleDelete = async () => {
    if (!accountId || deleteConfirmName !== existingAccount?.name) return;
    
    // Log before delete
    await logAccountDeleted(accountId, existingAccount?.name || "", {
      email: existingAccount?.email,
      roleId: existingAccount?.roleId,
    });
    
    await deleteAccount(accountId);
    setShowDeleteDialog(false);
    setDeleteConfirmName("");
    toast({
      title: "帳號已刪除",
      description: `已成功刪除帳號：${existingAccount?.name}`,
    });
    navigate("/accounts");
  };

  const handleDeleteDialogChange = (open: boolean) => {
    setShowDeleteDialog(open);
    if (!open) {
      setDeleteConfirmName("");
    }
  };

  const isDeleteConfirmed = deleteConfirmName === existingAccount?.name;

  if (!existingAccount) {
    return (
      <AppLayout title="帳號詳情">
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground">找不到此帳號</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="帳號詳情">
      <div className="space-y-6">
        {/* Breadcrumb */}
        <PageBreadcrumb
          items={[
            { label: "帳號管理", path: "/accounts" },
            { label: existingAccount?.name || "帳號詳情" },
          ]}
        />

        <div className="bg-card rounded-lg border border-border">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-lg font-medium text-foreground">編輯帳號</h2>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleCancel}>
                取消
              </Button>
              <Button onClick={handleSave}>
                儲存變更
              </Button>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-6">
          {/* Account Name */}
          <FormField
            label="帳號姓名"
            required
            placeholder="請輸入帳號姓名"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            error={errors.accountName}
          />

          {/* Email */}
          <FormField
            label="Email"
            required
            type="email"
            placeholder="請輸入 Email（作為登入帳號）"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            description={!errors.email ? "此 Email 將作為登入系統的帳號" : undefined}
          />

          {/* Role Selection */}
          <FormSelect
            label="選擇角色"
            required
            value={selectedRole}
            onValueChange={setSelectedRole}
            placeholder="請選擇角色"
            options={isLastAdminAccount 
              ? roleOptions.filter(opt => opt.value === 'admin') // Only show admin option for last admin
              : roleOptions
            }
            error={errors.role}
            description={isLastAdminAccount ? "此為系統唯一的管理員帳號，無法變更角色" : undefined}
          />

          {/* Reset Password & Delete Buttons */}
          <div className="pt-4 border-t border-border space-y-4">
            <div>
              <Button
                variant="outline"
                onClick={() => setShowResetPasswordDialog(true)}
                className="gap-2"
              >
                <KeyRound className="w-4 h-4" />
                重置密碼
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                點擊後將發送重置密碼連結至使用者的 Email
              </p>
            </div>
            
            <div>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                className="gap-2"
                disabled={isLastAdminAccount}
              >
                <Trash2 className="w-4 h-4" />
                刪除帳號
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                {isLastAdminAccount 
                  ? "此為系統唯一的管理員帳號，無法刪除" 
                  : "刪除後無法復原，請謹慎操作"
                }
              </p>
          </div>
        </div>
        </div>
      </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要取消嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              您有未儲存的變更，離開後將會遺失這些資料。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>繼續編輯</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel}>
              確定取消
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Confirmation Dialog */}
      <AlertDialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要重置密碼嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              系統將發送重置密碼連結至 {email}，使用者可透過連結設定新密碼。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPassword}>
              確定發送
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={handleDeleteDialogChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除此帳號嗎？</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>此操作無法復原。帳號將被永久刪除。</p>
                <div className="space-y-2">
                  <Label htmlFor="delete-confirm" className="text-sm text-muted-foreground">
                    請輸入帳號名稱 <span className="font-semibold text-foreground">「{existingAccount.name}」</span> 以確認刪除：
                  </Label>
                  <Input
                    id="delete-confirm"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="請輸入帳號名稱"
                    className="mt-2"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={!isDeleteConfirmed}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              確定刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default AccountDetail;
