import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

import { Check, X, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "next-themes";
import logo from "@/assets/basepara-logo-dark.svg";
import logoMobile from "@/assets/basepara-logo-mobile.svg";
import logoMobileDark from "@/assets/basepara-logo-mobile-dark.svg";
import loginBg from "@/assets/login-bg.jpg";

const calculatePasswordStrength = (password: string): { score: number; label: string; color: string } => {
  if (!password) return { score: 0, label: "", color: "bg-muted" };
  let score = 0;
  if (password.length >= 8) score += 20;
  if (password.length >= 10) score += 10;
  if (password.length >= 12) score += 10;
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/\d/.test(password)) score += 15;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 15;
  if (score <= 30) return { score, label: "弱", color: "bg-destructive" };
  if (score <= 50) return { score, label: "中等", color: "bg-orange-500" };
  if (score <= 75) return { score, label: "強", color: "bg-yellow-500" };
  return { score: Math.min(score, 100), label: "非常強", color: "bg-green-500" };
};

const TERMS_CONTENT = `BasePara 棒球訓練管理平台使用條款

第一條 總則
歡迎使用 BasePara 棒球訓練管理平台（以下簡稱「本平台」）。本條款係規範您使用本平台所提供之各項服務時的權利與義務。當您使用本平台時，即表示您已閱讀、瞭解並同意接受本條款之所有內容。

第二條 帳號管理
1. 您應妥善保管帳號及密碼，不得轉讓或授權他人使用。
2. 您應於首次登入後立即變更預設密碼，以確保帳號安全。
3. 如發現帳號遭未經授權使用，應立即通知本平台管理員。
4. 因帳號管理不當所導致之損失，由使用者自行負責。

第三條 個人資料保護
1. 本平台蒐集之個人資料，僅限於提供服務所需之範圍內使用。
2. 本平台將依相關法令規定，採取適當之安全措施保護您的個人資料。
3. 未經您的同意，本平台不會將您的個人資料提供予第三人。
4. 您有權要求查閱、更正或刪除您的個人資料。

第四條 訓練數據使用
1. 您透過本平台所上傳之訓練數據，其所有權歸屬於數據提供者。
2. 本平台僅作為數據管理工具，不對訓練數據之準確性負責。
3. 訓練數據僅供訓練管理及分析之用途，不得作為其他商業用途。
4. 教練及管理人員應依據其權限範圍內使用訓練數據。

第五條 智慧財產權
1. 本平台之所有內容，包括但不限於文字、圖片、程式碼、介面設計等，均受智慧財產權法律保護。
2. 未經本平台書面同意，不得以任何方式複製、修改、散布本平台之內容。

第六條 使用規範
1. 使用者不得利用本平台從事違法行為或損害他人權益之行為。
2. 使用者不得以任何方式干擾本平台之正常運作。
3. 使用者不得上傳含有病毒或惡意程式之檔案。
4. 違反本條款者，本平台有權暫停或終止其使用權限。

第七條 免責聲明
1. 本平台不保證服務不會中斷或沒有錯誤。
2. 因不可抗力因素導致服務中斷，本平台不負任何責任。
3. 使用者依據本平台提供之資訊所做之決策，由使用者自行負責。

第八條 條款修改
本平台保留隨時修改本條款之權利。修改後之條款將公告於本平台，繼續使用本平台即視為同意修改後之條款。

第九條 適用法律
本條款之解釋與適用，以中華民國法律為準據法。`;

const FirstLoginPasswordChange = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updatePassword, user } = useAuth();
  const { resolvedTheme } = useTheme();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [hasReadToBottom, setHasReadToBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasMinLength = newPassword.length >= 8;
  const hasMaxLength = newPassword.length <= 12;
  const hasNumber = /\d/.test(newPassword);
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const isValidPassword = hasMinLength && hasMaxLength && hasNumber && hasLetter;

  const passwordStrength = useMemo(() => calculatePasswordStrength(newPassword), [newPassword]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 2) {
      setHasReadToBottom(true);
    }
  };

  const handleAgreeTerms = () => {
    setAgreedToTerms(true);
    setPopoverOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPassword || !passwordsMatch || !agreedToTerms) return;

    setIsSubmitting(true);
    try {
      const result = await updatePassword(newPassword);
      if (result.success) {
        // Update password_changed in profiles
        if (user) {
          await supabase
            .from("profiles")
            .update({ password_changed: true } as any)
            .eq("user_id", user.id);
        }
        toast({ title: "密碼已更新", description: "您的密碼已成功變更，歡迎使用系統" });
        // Force reload authUser data
        window.location.href = "/schedule";
      } else {
        toast({ title: "密碼更新失敗", description: result.error || "請稍後再試", variant: "destructive" });
      }
    } catch {
      toast({ title: "發生錯誤", description: "請稍後再試", variant: "destructive" });
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
    <div className="min-h-screen flex">
      {/* Left side - Branding Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src={loginBg} alt="Baseball Training Facility" className="absolute inset-0 w-full h-full object-cover animate-ken-burns" />
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-primary/60 to-primary/40" />
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <img src={logo} alt="Basepara Logo" className="h-24 mb-8" />
          <h1 className="text-4xl font-bold mb-4 text-center drop-shadow-lg">棒球訓練管理平台</h1>
          <p className="text-lg text-white/90 text-center max-w-md drop-shadow">
            專業的訓練數據管理系統
            <br />
            全面提升球員表現與訓練效率
          </p>
        </div>
      </div>

      {/* Right side - Password Change Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background px-[24px] relative overflow-hidden">
        <div className="w-full max-w-md">
          {/* Mobile/Tablet Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img
              src={resolvedTheme === 'dark' ? logoMobileDark : logoMobile}
              alt="Basepara Logo"
              className="h-20 w-auto"
            />
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-1 pb-6">
              <div className="flex items-start">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 -ml-2 -mt-1"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    navigate("/login");
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </div>
              <CardTitle className="text-2xl font-semibold text-center">修改預設密碼</CardTitle>
              <CardDescription className="text-center">
                首次登入需修改預設密碼，才能繼續使用系統
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword">新密碼 <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="請輸入新密碼"
                      autoComplete="new-password"
                      className="h-11 pr-20"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {newPassword && (
                        <button
                          type="button"
                          onClick={() => setNewPassword("")}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Password Strength */}
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
                  </div>
                )}

                {/* Password Requirements */}
                <div className="space-y-2 p-3 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium mb-2">密碼格式要求：</p>
                  <ValidationItem valid={hasMinLength} text="至少 8 個字元" />
                  <ValidationItem valid={hasMaxLength || newPassword.length === 0} text="最多 12 個字元" />
                  <ValidationItem valid={hasLetter} text="包含英文字母" />
                  <ValidationItem valid={hasNumber} text="包含數字" />
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">確認新密碼 <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="請再次輸入新密碼"
                      autoComplete="new-password"
                      className="h-11 pr-20"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {confirmPassword && (
                        <button
                          type="button"
                          onClick={() => setConfirmPassword("")}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  {confirmPassword && !passwordsMatch && (
                    <p className="text-sm text-destructive">密碼不一致</p>
                  )}
                </div>

                {/* Terms Checkbox */}
                <div className="space-y-2">
                  <div className="flex items-start gap-3 select-none">
                    <Checkbox
                      id="terms"
                      checked={agreedToTerms}
                      disabled={!agreedToTerms}
                      className="mt-0.5"
                      onCheckedChange={(checked) => {
                        setAgreedToTerms(checked as boolean);
                        if (!checked) setHasReadToBottom(false);
                      }}
                    />
                    <span className="text-sm text-muted-foreground leading-relaxed">
                      我已閱讀並同意{" "}
                      <button
                        type="button"
                        className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                        onClick={() => setPopoverOpen(true)}
                      >
                        BasePara 使用條款
                      </button>
                    </span>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={!isValidPassword || !passwordsMatch || !agreedToTerms || isSubmitting}
                >
                  {isSubmitting ? "更新中..." : "確認修改密碼"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            © 2026 Basepara. All rights reserved.
          </p>
        </div>

        {/* Terms Overlay */}
        {popoverOpen && (
          <>
            <div
              className="absolute inset-0 z-40 bg-black/50"
              onClick={() => setPopoverOpen(false)}
            />
            <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
              <div
                className="w-[90%] max-w-[420px] rounded-lg border border-border bg-popover text-popover-foreground shadow-lg pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-border">
                  <h4 className="font-semibold text-sm">BasePara 使用條款</h4>
                  <p className="text-xs text-muted-foreground mt-1">請閱讀完整條款內容後，方可同意</p>
                </div>
                <div
                  ref={scrollRef}
                  className="h-[280px] overflow-y-auto p-4"
                  onScroll={handleScroll}
                >
                  <div className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                    {TERMS_CONTENT}
                  </div>
                </div>
                <div className="p-4 border-t border-border">
                  <Button
                    type="button"
                    size="sm"
                    className="w-full"
                    disabled={!hasReadToBottom}
                    onClick={handleAgreeTerms}
                  >
                    {hasReadToBottom ? "我已確認並同意以上條款" : "請先閱讀完整條款內容"}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FirstLoginPasswordChange;
