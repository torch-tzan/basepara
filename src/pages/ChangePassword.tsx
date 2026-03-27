import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";

// Password strength calculation
const calculatePasswordStrength = (password: string): { score: number; label: string; color: string } => {
  if (!password) return { score: 0, label: "", color: "bg-muted" };
  
  let score = 0;
  
  // Length scoring
  if (password.length >= 8) score += 20;
  if (password.length >= 10) score += 10;
  if (password.length >= 12) score += 10;
  
  // Character variety scoring
  if (/[a-z]/.test(password)) score += 15; // lowercase
  if (/[A-Z]/.test(password)) score += 15; // uppercase
  if (/\d/.test(password)) score += 15; // numbers
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 15; // special chars
  
  // Determine label and color
  if (score <= 30) return { score, label: "弱", color: "bg-destructive" };
  if (score <= 50) return { score, label: "中等", color: "bg-orange-500" };
  if (score <= 75) return { score, label: "強", color: "bg-yellow-500" };
  return { score: Math.min(score, 100), label: "非常強", color: "bg-green-500" };
};

const ChangePassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updatePassword, verifyCurrentPassword } = useAuth();
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState("");

  // Password validation states
  const hasMinLength = newPassword.length >= 8;
  const hasMaxLength = newPassword.length <= 12;
  const hasNumber = /\d/.test(newPassword);
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const isValidPassword = hasMinLength && hasMaxLength && hasNumber && hasLetter;
  const hasCurrentPassword = currentPassword.length > 0;

  // Calculate password strength
  const passwordStrength = useMemo(() => calculatePasswordStrength(newPassword), [newPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPasswordError("");
    
    if (!hasCurrentPassword) {
      setCurrentPasswordError("請輸入目前密碼");
      return;
    }

    if (!isValidPassword) {
      toast({
        title: "密碼格式錯誤",
        description: "請確認密碼符合所有格式要求",
        variant: "destructive",
      });
      return;
    }

    if (!passwordsMatch) {
      toast({
        title: "密碼不一致",
        description: "新密碼與確認密碼不相符",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // First verify current password
      const verifyResult = await verifyCurrentPassword(currentPassword);
      
      if (!verifyResult.success) {
        setCurrentPasswordError(verifyResult.error || "目前密碼不正確");
        setIsSubmitting(false);
        return;
      }

      // Then update to new password
      const result = await updatePassword(newPassword);
      
      if (result.success) {
        toast({
          title: "密碼已更新",
          description: "您的密碼已成功變更",
        });
        navigate("/schedule");
      } else {
        toast({
          title: "密碼更新失敗",
          description: result.error || "請稍後再試",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "發生錯誤",
        description: "請稍後再試",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const ValidationItem = ({ valid, text }: { valid: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-sm ${valid ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
      {valid ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
      {text}
    </div>
  );

  return (
    <AppLayout title="變更密碼">
      <div className="max-w-md mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              變更密碼
            </CardTitle>
            <CardDescription>
              請先驗證目前密碼，再設定新密碼
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">目前密碼 <span className="text-destructive">*</span></Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setCurrentPasswordError("");
                  }}
                  placeholder="請輸入目前密碼"
                  autoComplete="current-password"
                  aria-invalid={!!currentPasswordError}
                />
                {currentPasswordError && (
                  <p className="text-sm text-destructive">{currentPasswordError}</p>
                )}
              </div>

              <div className="border-t border-border pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">新密碼 <span className="text-destructive">*</span></Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="請輸入新密碼"
                    autoComplete="new-password"
                  />
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">密碼強度</span>
                      <span className={`font-medium ${
                        passwordStrength.score <= 30 ? 'text-destructive' :
                        passwordStrength.score <= 50 ? 'text-orange-500' :
                        passwordStrength.score <= 75 ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-green-600 dark:text-green-400'
                      }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ease-out rounded-full ${passwordStrength.color}`}
                        style={{ width: `${passwordStrength.score}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      提示：使用大小寫字母、數字及特殊符號可提升密碼強度
                    </p>
                  </div>
                )}
              </div>

              {/* Password Requirements */}
              <div className="space-y-2 p-3 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-2">密碼格式要求：</p>
                <ValidationItem valid={hasMinLength} text="至少 8 個字元" />
                <ValidationItem valid={hasMaxLength || newPassword.length === 0} text="最多 12 個字元" />
                <ValidationItem valid={hasLetter} text="包含英文字母" />
                <ValidationItem valid={hasNumber} text="包含數字" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">確認新密碼 <span className="text-destructive">*</span></Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="請再次輸入新密碼"
                  autoComplete="new-password"
                />
                {confirmPassword && !passwordsMatch && (
                  <p className="text-sm text-destructive">密碼不一致</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1"
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={!hasCurrentPassword || !isValidPassword || !passwordsMatch || isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? "驗證中..." : "確認變更"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default ChangePassword;
