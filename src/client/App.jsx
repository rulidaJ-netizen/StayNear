import { Routes, Route, Navigate } from "react-router-dom";
import { authRoutes } from "./features/auth/routes";
import { studentRoutes } from "./features/student/routes";
import { landownerRoutes } from "./features/landowner/routes";
import ProtectedRoute from "./shared/components/ProtectedRoute";
import RoomDetail from "./shared/pages/RoomDetail";

export default function App() {
  return (
    <Routes>
      {authRoutes}
      {studentRoutes}
      {landownerRoutes}
      <Route
        path="/room/:id"
        element={
          <ProtectedRoute>
            <RoomDetail />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
