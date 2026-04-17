import { ChevronRight, Lock, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LandownerNavbar from "../components/LandownerNavbar";
import "../styles/landowner-profile.css";

export default function LandownerSecuritySettings() {
  const navigate = useNavigate();

  return (
    <div className="landowner-profile-page">
      <LandownerNavbar showLogout={false} />

      <main className="landowner-profile-main">
        <div className="landowner-profile-grid">
          <section className="landowner-profile-sidebar">
            <div className="landowner-avatar-shell">
              <div className="landowner-avatar">
                <Shield size={58} strokeWidth={2.1} />
              </div>
            </div>

            <h1 className="landowner-profile-name">Security Settings</h1>
            <span className="landowner-role-pill">Landowner</span>
            <p className="landowner-profile-email">
              Password & authentication settings
            </p>
          </section>

          <section className="landowner-profile-content">
            <article className="landowner-profile-card">
              <div className="landowner-profile-card-header">
                <div className="landowner-profile-card-title">
                  <div className="landowner-profile-card-icon">
                    <Lock size={22} />
                  </div>
                  <div>
                    <h1>Security Settings</h1>
                  </div>
                </div>
              </div>

              <p className="landowner-security-page-copy">
                This section is ready for password and authentication controls.
                The navigation is already in place, so you can add your future
                password-change flow here without affecting the landowner
                dashboard or profile page.
              </p>

              <div className="landowner-security-card">
                <div className="landowner-security-card-left">
                  <div className="landowner-security-icon">
                    <Shield size={22} />
                  </div>
                  <div className="landowner-security-copy">
                    <h2>Password & authentication</h2>
                    <p>Security options will live here.</p>
                  </div>
                </div>

                <div className="landowner-security-chevron">
                  <ChevronRight size={22} />
                </div>
              </div>

              <div className="landowner-security-page-actions">
                <button
                  type="button"
                  className="landowner-profile-primary-btn"
                  onClick={() => navigate("/landowner/profile")}
                >
                  Back to Profile
                </button>
              </div>
            </article>
          </section>
        </div>
      </main>
    </div>
  );
}
