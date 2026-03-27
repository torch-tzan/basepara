import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { z } from "zod";
import logo from "@/assets/basepara-logo-dark.svg";
import logoMobile from "@/assets/basepara-logo-mobile.svg";
import logoMobileDark from "@/assets/basepara-logo-mobile-dark.svg";
import loginBg from "@/assets/login-bg.jpg";
import { useAuth, shouldForcePasswordChange } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";

const loginSchema = z.object({
  email: z.string().trim().min(1, {
    message: "請輸入電子信箱"
  }).email({
    message: "請輸入有效的電子信箱格式"
  }).max(255, {
    message: "電子信箱長度不得超過 255 個字元"
  }),
  password: z.string().min(1, {
    message: "請輸入密碼"
  })
});

type LoginFormData = z.infer<typeof loginSchema>;

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

const Login = () => {
  const navigate = useNavigate();
  const { login, session, authUser, isLoading: authLoading } = useAuth();
  const { resolvedTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{
    email: boolean;
    password: boolean;
  }>({
    email: false,
    password: false
  });

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && session && authUser) {
      if (shouldForcePasswordChange(authUser)) {
        navigate("/first-login", { replace: true });
      } else {
        navigate("/schedule", { replace: true });
      }
    }
  }, [session, authLoading, authUser, navigate]);

  const validateField = (field: keyof LoginFormData, value: string) => {
    try {
      loginSchema.shape[field].parse(value);
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    } catch (err) {
      if (err instanceof z.ZodError) {
        setErrors(prev => ({
          ...prev,
          [field]: err.errors[0]?.message
        }));
      }
    }
  };

  const handleBlur = (field: keyof LoginFormData) => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));
    validateField(field, field === "email" ? email : password);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate all fields
    const result = loginSchema.safeParse({
      email,
      password
    });

    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.errors.forEach(error => {
        const field = error.path[0] as keyof FormErrors;
        if (!fieldErrors[field]) {
          fieldErrors[field] = error.message;
        }
      });
      setErrors(fieldErrors);
      setTouched({
        email: true,
        password: true
      });
      return;
    }

    setIsLoading(true);

    const loginResult = await login(email, password);
    setIsLoading(false);

    if (loginResult.success) {
      // Navigation will be handled by the useEffect watching authUser
    } else {
      setErrors({ general: loginResult.error || "帳號或密碼錯誤，請重新確認" });
    }
  };

  // Don't render form if already logged in or still loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Image with Ken Burns effect */}
        <img src={loginBg} alt="Baseball Training Facility" className="absolute inset-0 w-full h-full object-cover animate-ken-burns" />
        {/* Overlay - darker for better logo visibility */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-primary/60 to-primary/40" />
        {/* Content */}
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

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background px-[24px]">
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
              <CardTitle className="text-2xl font-semibold text-center">歡迎回來</CardTitle>
              <CardDescription className="text-center">
                請輸入您的帳號密碼登入系統
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                {/* General Error */}
                {errors.general && (
                  <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{errors.general}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">電子信箱</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="請輸入電子信箱"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      if (touched.email) validateField("email", e.target.value);
                    }}
                    onBlur={() => handleBlur("email")}
                    aria-invalid={touched.email && !!errors.email}
                    className={`h-11 ${touched.email && errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                  {touched.email && errors.email && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">密碼</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="請輸入密碼"
                      value={password}
                      onChange={e => {
                        setPassword(e.target.value);
                        if (touched.password) validateField("password", e.target.value);
                      }}
                      onBlur={() => handleBlur("password")}
                      aria-invalid={touched.password && !!errors.password}
                      className={`h-11 pr-10 ${touched.password && errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {touched.password && errors.password && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-input text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-sm text-muted-foreground">記住我</span>
                  </label>
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                    忘記密碼？
                  </Link>
                </div>

                <Button type="submit" className="w-full h-11" disabled={isLoading}>
                  {isLoading ? "登入中..." : "登入"}
                </Button>
              </form>
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

export default Login;
