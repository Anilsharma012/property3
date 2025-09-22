import { ReactNode, useEffect } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { useFirebaseAuth } from "../../hooks/useFirebaseAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredUserTypes?: ("buyer" | "seller" | "agent" | "admin" | "staff")[];
  fallbackPath?: string;
  requireAuth?: boolean;
}

export default function ProtectedRoute({
  children,
  requiredUserTypes = [],
  fallbackPath = "/auth",
  requireAuth = true,
}: ProtectedRouteProps) {
  const { isAuthenticated, user, loading } = useFirebaseAuth();
  const location = useLocation();

  // Show loading spinner while auth state is being determined
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const currentPath = location.pathname + location.search;

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    // Store the attempted location to redirect back after login
    const redirectPath = `${fallbackPath}?redirect=${encodeURIComponent(currentPath)}`;

    // Prevent redirect loops: if we're already on the auth page, render children (or nothing)
    if (location.pathname === fallbackPath || currentPath === redirectPath) {
      return <>{children}</>;
    }

    return <Navigate to={redirectPath} replace />;
  }

  // If user is authenticated but doesn't have required user type
  if (isAuthenticated && user && requiredUserTypes.length > 0) {
    // If user has no userType, send to fallback instead of attempting dashboard redirect
    if (!user.userType) {
      if (location.pathname === fallbackPath) return <>{children}</>;
      return <Navigate to={fallbackPath} replace />;
    }

    if (!requiredUserTypes.includes(user.userType)) {
      // Redirect to appropriate dashboard based on user type
      const dashboardRoutes: Record<string, string> = {
        seller: "/seller-dashboard",
        buyer: "/buyer-dashboard",
        agent: "/agent-dashboard",
        admin: "/admin",
        staff: "/staff-dashboard",
      };

      const userDashboard = dashboardRoutes[user.userType] || "/";

      // Avoid redirecting to the same route which can cause loops
      if (location.pathname === userDashboard) {
        return <>{children}</>;
      }

      return <Navigate to={userDashboard} replace />;
    }
  }

  // User is authenticated and authorized, render the protected content
  return <>{children}</>;
}

// Higher-order component for protecting routes based on user types
export const withAuth = (
  Component: React.ComponentType<any>,
  options: Omit<ProtectedRouteProps, "children"> = {},
) => {
  return function AuthenticatedComponent(props: any) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
};

// Specific protected route components for common use cases
export const SellerProtectedRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requiredUserTypes={["seller"]}>{children}</ProtectedRoute>
);

export const BuyerProtectedRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requiredUserTypes={["buyer"]}>{children}</ProtectedRoute>
);

export const AgentProtectedRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requiredUserTypes={["agent"]}>{children}</ProtectedRoute>
);

export const AdminProtectedRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requiredUserTypes={["admin"]}>{children}</ProtectedRoute>
);

export const StaffProtectedRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requiredUserTypes={["staff"]}>{children}</ProtectedRoute>
);

// Component for redirecting authenticated users away from auth pages
export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, loading } = useFirebaseAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const currentPath = location.pathname + location.search;

  // If user is authenticated, redirect to their dashboard
  if (isAuthenticated && user) {
    const dashboardRoutes: Record<string, string> = {
      seller: "/seller-dashboard",
      buyer: "/buyer-dashboard",
      agent: "/agent-dashboard",
      admin: "/admin",
      staff: "/staff-dashboard",
    };

    const userDashboard = dashboardRoutes[user.userType] || "/";

    // Avoid redirecting to the same route (prevents loops)
    if (location.pathname === userDashboard || currentPath === userDashboard) {
      return <>{children}</>;
    }

    return <Navigate to={userDashboard} replace />;
  }

  // User is not authenticated, show the public page
  return <>{children}</>;
}
