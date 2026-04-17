import { Navigate } from "react-router-dom";
import { getStoredUser } from "../../features/auth/api/authApi";

export default function ProtectedRoute({ children, role }) {
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const userRole = (user.account_type || "").toLowerCase();
  const requiredRole = (role || "").toLowerCase();

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}
