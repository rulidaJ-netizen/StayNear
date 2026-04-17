import { useNavigate, useLocation } from "react-router-dom";
import { Home, Heart, User, LogOut, Search } from "lucide-react";
import { getStoredUser } from "../../auth/api/authApi";
import { useAuthSession } from "../../auth/context/useAuthSession";

export default function StudentNavbar({
  favoritesCount,
  showLogout = true,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearUser } = useAuthSession();
  const sessionUser = user || getStoredUser();

  const isProfileSection =
    location.pathname === "/student/profile" ||
    location.pathname === "/student/security";

  const isActive = (path) => {
    if (path === "/student/profile") {
      return isProfileSection;
    }

    return location.pathname === path;
  };

  const handleLogout = () => {
    clearUser();
    navigate("/");
  };

  const resolvedFavoritesCount =
    favoritesCount ?? Number(sessionUser?.favorites_count || 0);

  return (
    <header className="student-header">
      <div className="brand-wrap">
        <div className="brand-icon">
          <Home size={22} />
        </div>
        <div>
          <div className="brand-title">StayNear</div>
          <div className="brand-role">
            {sessionUser?.account_type === "student" ? "Student" : ""}
          </div>
        </div>
      </div>

      <nav className="student-nav">
        <button
          onClick={() => navigate("/student/dashboard")}
          className={`nav-btn ${isActive("/student/dashboard") ? "active" : ""}`}
        >
          <Search size={16} />
          <span>Search</span>
        </button>

        <button
          onClick={() => navigate("/student/favorites")}
          className={`nav-btn ${isActive("/student/favorites") ? "active" : ""}`}
        >
          <span className="nav-inline">
            <Heart size={16} />
            <span>Favorites</span>
            {resolvedFavoritesCount > 0 && (
              <span className="favorites-badge">{resolvedFavoritesCount}</span>
            )}
          </span>
        </button>

        <button
          onClick={() => navigate("/student/profile")}
          className={`nav-btn ${isActive("/student/profile") ? "active" : ""}`}
        >
          <User size={16} />
          <span>Profile</span>
        </button>

        {showLogout ? (
          <button onClick={handleLogout} className="nav-btn logout">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        ) : null}
      </nav>
    </header>
  );
}
