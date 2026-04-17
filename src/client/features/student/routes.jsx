import { Route } from "react-router-dom";
import ProtectedRoute from "../../shared/components/ProtectedRoute";
import Favorites from "./pages/Favorites";
import SecuritySettings from "./pages/SecuritySettings";
import StudentDashboard from "./pages/StudentDashboard";
import StudentProfile from "./pages/StudentProfile";

export const studentRoutes = (
  <>
    <Route
      path="/student/dashboard"
      element={
        <ProtectedRoute role="student">
          <StudentDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/student/favorites"
      element={
        <ProtectedRoute role="student">
          <Favorites />
        </ProtectedRoute>
      }
    />
    <Route
      path="/student/profile"
      element={
        <ProtectedRoute role="student">
          <StudentProfile />
        </ProtectedRoute>
      }
    />
    <Route
      path="/student/security"
      element={
        <ProtectedRoute role="student">
          <SecuritySettings />
        </ProtectedRoute>
      }
    />
  </>
);
