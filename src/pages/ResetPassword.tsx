import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import logo from "@/assets/basepara-logo-dark.svg";
import loginBg from "@/assets/login-bg.jpg";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  // Check if user arrived via password reset link
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      // User should have a session if they clicked the reset link
      setIsValidSession(!!session);
    };
    checkSession();
  }, []);

  // Password validation
  const passwordChecks = {
    length: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasLetter: /[a-zA-Z]/.test(password),
    match: password === confirmPassword && password.length > 0,
  };

  const isPasswordValid = passwordChecks.length && passwordChecks.hasNumber && passwordChecks.hasLetter;
  const canSubmit = isPasswordValid && passwordChecks.match;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSubmit) {
      setError("請確認密碼符合所有要求");
      return;
    }

    setIsLoading(true);
    setError("");
    
    const result = await updatePassword(password);
    setIsLoading(false);
    
    if (result.success) {
      setIsSuccess(true);
    } else {
      setError(result.error || "更新密碼失敗，請稍後再試");
    }
  };

  // Still checking session
  if (isValidSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Invalid or missing session
  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardHeader className="space-y-1 pb-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl font-semibold text-center">連結無效</CardTitle>
            <CardDescription className="text-center">
              此重設密碼連結已失效或不正確。請重新申請重設密碼。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/forgot-password" className="block">
              <Button className="w-full">重新申請</Button>
            </Link>
            <Link to="/login" className="block">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回登入
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Image with Ken Burns effect */}
        <img 
          src={loginBg}
          alt="Baseball Training Facility"
          className="absolute inset-0 w-full h-full object-cover animate-ken-burns"
        />
        {/* Overlay - darker for better logo visibility */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-primary/60 to-primary/40" />
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <img 
            src={logo}
            alt="Basepara Logo"
            className="h-24 mb-8"
          />
          <h1 className="text-4xl font-bold mb-4 text-center drop-shadow-lg">棒球訓練管理平台</h1>
          <p className="text-lg text-white/90 text-center max-w-md drop-shadow">
            專業的棒球訓練數據管理系統，助您提升球員表現與訓練效率
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-8 lg:p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img 
              src={logo}
              alt="Basepara Logo"
              className="h-12"
            />
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-semibold text-center">
                {isSuccess ? "密碼重設成功" : "重設密碼"}
              </CardTitle>
              <CardDescription className="text-center">
                {isSuccess 
                  ? "您的密碼已成功更新，請使用新密碼登入"
                  : "請輸入您的新密碼"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSuccess ? (
                <div className="space-y-6">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => navigate("/login")}
                  >
                    前往登入
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">新密碼</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="請輸入新密碼"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Password requirements */}
                  <div className="space-y-1.5 text-sm">
                    <p className="text-muted-foreground mb-2">密碼需符合以下要求：</p>
                    <div className={`flex items-center gap-2 ${passwordChecks.length ? "text-primary" : "text-muted-foreground"}`}>
                      {passwordChecks.length ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border border-current" />}
                      至少 8 個字元
                    </div>
                    <div className={`flex items-center gap-2 ${passwordChecks.hasLetter ? "text-primary" : "text-muted-foreground"}`}>
                      {passwordChecks.hasLetter ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border border-current" />}
                      包含英文字母
                    </div>
                    <div className={`flex items-center gap-2 ${passwordChecks.hasNumber ? "text-primary" : "text-muted-foreground"}`}>
                      {passwordChecks.hasNumber ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border border-current" />}
                      包含數字
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">確認新密碼</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="請再次輸入新密碼"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {confirmPassword && !passwordChecks.match && (
                      <p className="text-sm text-destructive">密碼不一致</p>
                    )}
                  </div>

                  {error && (
                    <p className="text-sm text-destructive text-center">{error}</p>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11"
                    disabled={isLoading || !canSubmit}
                  >
                    {isLoading ? "處理中..." : "確認重設"}
                  </Button>

                  <Link to="/login" className="block">
                    <Button variant="ghost" className="w-full">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      返回登入
                    </Button>
                  </Link>
                </form>
              )}
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            © 2026 Basepara. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
