import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import logo from "@/assets/basepara-logo-dark.svg";
import loginBg from "@/assets/login-bg.jpg";
import { useAuth } from "@/contexts/AuthContext";

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    const result = await resetPassword(email);
    setIsLoading(false);
    
    if (result.success) {
      setIsSubmitted(true);
    } else {
      setError(result.error || "發送失敗，請稍後再試");
    }
  };

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
                {isSubmitted ? "郵件已發送" : "忘記密碼"}
              </CardTitle>
              <CardDescription className="text-center">
                {isSubmitted 
                  ? "請查看您的電子信箱以完成密碼重設"
                  : "請輸入您的電子信箱，我們將寄送重設密碼連結"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSubmitted ? (
                <div className="space-y-6">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      重設密碼連結已發送至
                    </p>
                    <p className="font-medium">{email}</p>
                    <p className="text-sm text-muted-foreground">
                      連結有效時間為 1 小時
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setIsSubmitted(false)}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      使用其他信箱
                    </Button>
                    <Link to="/login" className="block">
                      <Button variant="ghost" className="w-full">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        返回登入
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <p className="text-sm text-destructive text-center">{error}</p>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email">電子信箱</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="請輸入您註冊時使用的電子信箱"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11"
                    disabled={isLoading}
                  >
                    {isLoading ? "發送中..." : "發送重設連結"}
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

export default ForgotPassword;
