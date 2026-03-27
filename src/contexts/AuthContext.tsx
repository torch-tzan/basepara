// Supabase Authentication Context
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "admin" | "venue_coach" | "team_coach" | "student";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole | null;
  teamIds: string[];
  passwordChanged: boolean;
}

interface LoginResult {
  success: boolean;
  error?: string;
}

interface SignUpResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  authUser: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  signUp: (email: string, password: string, name: string) => Promise<SignUpResult>;
  logout: (navigate?: (path: string) => void) => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  verifyCurrentPassword: (password: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile, role, and team assignments
  const fetchUserData = useCallback(async (userId: string, userEmail: string) => {
    try {
      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, password_changed")
        .eq("user_id", userId)
        .maybeSingle();

      // Fetch role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      // Fetch team assignments
      const { data: teamAssignments } = await supabase
        .from("user_team_assignments")
        .select("team_id")
        .eq("user_id", userId);

      setAuthUser({
        id: userId,
        email: userEmail,
        name: profile?.name || userEmail.split("@")[0],
        role: (roleData?.role as UserRole) || null,
        teamIds: teamAssignments?.map((t) => t.team_id) || [],
        passwordChanged: profile?.password_changed ?? false,
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      setAuthUser({
        id: userId,
        email: userEmail,
        name: userEmail.split("@")[0],
        role: null,
        teamIds: [],
        passwordChanged: false,
      });
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Use setTimeout to avoid race condition with profile creation trigger
          setTimeout(() => {
            if (isMounted) {
              fetchUserData(session.user.id, session.user.email || "");
            }
          }, 100);
        } else {
          setAuthUser(null);
        }
      }
    );

    // Initial session check
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchUserData(session.user.id, session.user.email || "");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          return { success: false, error: "帳號或密碼錯誤，請重新確認" };
        }
        if (error.message.includes("Email not confirmed")) {
          return { success: false, error: "請先確認您的電子郵件" };
        }
        return { success: false, error: error.message };
      }

      if (data.user) {
        await fetchUserData(data.user.id, data.user.email || "");
      }

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "登入時發生錯誤" };
    }
  }, [fetchUserData]);

  const signUp = useCallback(async (email: string, password: string, name: string): Promise<SignUpResult> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { name },
        },
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          return { success: false, error: "此電子郵件已被註冊" };
        }
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: "註冊失敗" };
      }

      return { success: true };
    } catch (error) {
      console.error("Sign up error:", error);
      return { success: false, error: "註冊時發生錯誤" };
    }
  }, []);

  const logout = useCallback(async (navigate?: (path: string) => void) => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setAuthUser(null);
    if (navigate) {
      navigate("/login");
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Reset password error:", error);
      return { success: false, error: "重設密碼時發生錯誤" };
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Update password error:", error);
      return { success: false, error: "更新密碼時發生錯誤" };
    }
  }, []);

  const verifyCurrentPassword = useCallback(async (password: string) => {
    try {
      if (!user?.email) {
        return { success: false, error: "無法取得使用者資訊" };
      }

      // Re-authenticate by signing in with current credentials
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          return { success: false, error: "目前密碼不正確" };
        }
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Verify password error:", error);
      return { success: false, error: "驗證密碼時發生錯誤" };
    }
  }, [user?.email]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        authUser,
        isLoading,
        login,
        signUp,
        logout,
        resetPassword,
        updatePassword,
        verifyCurrentPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

/** Admin 不需要首次密碼重設，其他角色在 passwordChanged === false 時需要 */
export const shouldForcePasswordChange = (user: AuthUser): boolean => {
  if (user.role === "admin") return false;
  return !user.passwordChanged;
};
