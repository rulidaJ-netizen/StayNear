import { Route } from "react-router-dom";
import ProtectedRoute from "../../shared/components/ProtectedRoute";

import AddRoom from "./pages/AddRoom";
import DeleteRoom from "./pages/DeleteRoom";
import EditRoom from "./pages/EditRoom";

import LandownerDashboard from "./pages/LandownerDashboard";
import LandownerFavorites from "./pages/LandownerFavorites";
import LandownerProfile from "./pages/LandownerProfile";
import LandownerSecuritySettings from "./pages/LandownerSecuritySettings";

import LocationDetails from "./pages/LocationDetails";
import SetPricingAvailability from "./pages/SetPricingAvailability";
import UploadPhotos from "./pages/UploadPhotos";

export const landownerRoutes = (
  <>
    <Route
      path="/landowner/dashboard"
      element={
        <ProtectedRoute role="landowner">
          <LandownerDashboard />
        </ProtectedRoute>
      }
    />

    <Route
      path="/landowner/profile"
      element={
        <ProtectedRoute role="landowner">
          <LandownerProfile />
        </ProtectedRoute>
      }
    />

    <Route
      path="/landowner/favorites"
      element={
        <ProtectedRoute role="landowner">
          <LandownerFavorites />
        </ProtectedRoute>
      }
    />

    <Route
      path="/landowner/security"
      element={
        <ProtectedRoute role="landowner">
          <LandownerSecuritySettings />
        </ProtectedRoute>
      }
    />

    <Route
      path="/landowner/add-room"
      element={
        <ProtectedRoute role="landowner">
          <AddRoom />
        </ProtectedRoute>
      }
    />

    <Route
      path="/landowner/add-room/upload-photos/:id"
      element={
        <ProtectedRoute role="landowner">
          <UploadPhotos />
        </ProtectedRoute>
      }
    />

    <Route
      path="/landowner/add-room/set-pricing/:id"
      element={
        <ProtectedRoute role="landowner">
          <SetPricingAvailability />
        </ProtectedRoute>
      }
    />

    <Route
      path="/landowner/add-room/location-details/:id"
      element={
        <ProtectedRoute role="landowner">
          <LocationDetails />
        </ProtectedRoute>
      }
    />

    <Route
      path="/landowner/edit-room/:propertyId"
      element={
        <ProtectedRoute role="landowner">
          <EditRoom />
        </ProtectedRoute>
      }
    />

    <Route
      path="/landowner/edit-room/upload-photos/:propertyId"
      element={
        <ProtectedRoute role="landowner">
          <UploadPhotos />
        </ProtectedRoute>
      }
    />

    <Route
      path="/landowner/edit-room/set-pricing/:propertyId"
      element={
        <ProtectedRoute role="landowner">
          <SetPricingAvailability />
        </ProtectedRoute>
      }
    />

    <Route
      path="/landowner/edit-room/location-details/:propertyId"
      element={
        <ProtectedRoute role="landowner">
          <LocationDetails />
        </ProtectedRoute>
      }
    />

    <Route
      path="/landowner/delete-room/:id"
      element={
        <ProtectedRoute role="landowner">
          <DeleteRoom />
        </ProtectedRoute>
      }
    />
  </>
);
