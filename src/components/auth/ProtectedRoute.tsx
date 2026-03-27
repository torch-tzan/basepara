import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, shouldForcePasswordChange } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: ("admin" | "venue_coach" | "team_coach" | "student")[];
}

const ProtectedRoute = ({ children, requiredRoles }: ProtectedRouteProps) => {
  const { session, authUser, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Check if user needs to change default password (Admin 免重設)
  if (authUser && shouldForcePasswordChange(authUser) && location.pathname !== "/first-login") {
    return <Navigate to="/first-login" replace />;
  }

  // Check role requirements if specified
  if (requiredRoles && requiredRoles.length > 0) {
    if (!authUser?.role || !requiredRoles.includes(authUser.role)) {
      return <Navigate to="/schedule" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
