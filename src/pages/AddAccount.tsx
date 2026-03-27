import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
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

const AddAccount = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addAccount, getRoleOptions } = useAccounts();
  const { validateEmail } = useEmailValidation();

  const [accountName, setAccountName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ accountName?: string; email?: string; role?: string }>({});

  const hasUnsavedChanges = accountName || email || selectedRole;
  const roleOptions = getRoleOptions();

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
    const emailResult = validateEmail(email);
    if (!emailResult.isValid) {
      newErrors.email = emailResult.error;
    }

    if (!selectedRole) {
      newErrors.role = "請選擇角色";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await addAccount({
        name: accountName.trim(),
        email: email.trim(),
        roleId: selectedRole,
        active: true,
      });

      toast({
        title: "帳號已建立",
        description: `已成功建立帳號：${accountName}`,
      });
      navigate("/accounts");
    } catch (error) {
      console.error("Create account error:", error);
      toast({
        title: "建立失敗",
        description: error instanceof Error ? error.message : "請稍後再試",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout title="新增帳號">
      <div className="space-y-6">
        {/* Breadcrumb */}
        <PageBreadcrumb
          items={[
            { label: "帳號管理", path: "/accounts" },
            { label: "新增帳號" },
          ]}
        />

        <div className="bg-card rounded-lg border border-border">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-lg font-medium text-foreground">新增帳號</h2>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                取消
              </Button>
              <Button onClick={handleCreate} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    建立中...
                  </>
                ) : (
                  "確認建立"
                )}
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
            options={roleOptions}
            error={errors.role}
          />

          {/* Default Password Note */}
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              預設密碼為 <span className="font-mono font-medium text-foreground">000000</span>，建議使用者首次登入後立即變更密碼。
            </p>
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
    </AppLayout>
  );
};

export default AddAccount;
