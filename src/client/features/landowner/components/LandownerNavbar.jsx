import { useEffect} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Heart, LogOut, User } from "lucide-react";   
import { getStoredUser } from "../../auth/api/authApi";
import { useAuthSession } from "../../auth/context/useAuthSession";
import { getLandownerProfile } from "../api/landownerApi";
import styles from "./LandownerNavbar.module.css";

export default function LandownerNavbar({
  showLogout = true,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, patchUser, clearUser } = useAuthSession();
  const sessionUser = user || getStoredUser();
  const landownerId = sessionUser?.landowner_id;

  useEffect(() => {
    if (
      sessionUser?.favorites_count !== undefined &&
      sessionUser?.favorites_count !== null
    ) {
      return;
    }

    if (!landownerId) {
      return;
    }

    let isMounted = true;

    const syncProfileSummary = async () => {
      try {
        const data = await getLandownerProfile(landownerId);

        if (!isMounted) {
          return;
        }

        const nextCount = Number(data.favorites_count || 0);
        
        patchUser({
          email: data.email,
          full_name: data.full_name,
          avatar_url: data.avatar_url,
          favorites_count: nextCount,
        });
      } catch (error) {
        console.error("Sync landowner navbar profile error:", error);
      }
    };

    syncProfileSummary();

    return () => {
      isMounted = false;
    };
  }, [
    landownerId,
    patchUser,
    sessionUser?.favorites_count,
  ]);

  const isProfileSection =
    location.pathname === "/landowner/profile" ||
    location.pathname === "/landowner/security";

  const handleLogout = () => {
    clearUser();
    navigate("/");
  };

  return (
    <header className={styles.navbar}>
      <div
        className={styles.brand}
        onClick={() => navigate("/landowner/dashboard")}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            navigate("/landowner/dashboard");
          }
        }}
      >
        <div className={styles.iconWrap}>
          <Home size={22} />
        </div>

        <div>
          <div className={styles.title}>StayNear</div>
          <div className={styles.role}>
            {sessionUser?.account_type === "landowner" ? "Landowner" : ""}
          </div>
        </div>
      </div>

      <nav className={styles.nav}>

        <button
          type="button"
          className={`${styles.navBtn} ${isProfileSection ? styles.active : ""}`}
          onClick={() => navigate("/landowner/profile")}
        >
          <User size={16} />
          <span>Profile</span>
        </button>

        {showLogout ? (
          <button
            type="button"
            className={`${styles.navBtn} ${styles.logout}`}
            onClick={handleLogout}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        ) : null}
      </nav>
    </header>
  );
}