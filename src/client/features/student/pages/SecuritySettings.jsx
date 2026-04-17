import { ChevronRight, Lock, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StudentNavbar from "../components/StudentNavbar";
import "../styles/student-profile.css";

export default function SecuritySettings() {
  const navigate = useNavigate();

  return (
    <div className="student-profile-page">
      <StudentNavbar showLogout={false} />

      <main className="student-profile-main">
        <div className="student-profile-grid">
          <section className="student-profile-sidebar">
            <div className="student-avatar-shell">
              <div className="student-avatar">
                <Shield size={58} strokeWidth={2.1} />
              </div>
            </div>

            <h1 className="student-profile-name">Security Settings</h1>
            <span className="student-role-pill">Student</span>
            <p className="student-profile-email">
              Password & authentication settings
            </p>
          </section>

          <section className="student-profile-content">
            <article className="student-profile-card">
              <div className="student-profile-card-header">
                <div className="student-profile-card-title">
                  <div className="student-profile-card-icon">
                    <Lock size={22} />
                  </div>
                  <div>
                    <h1>Security Settings</h1>
                  </div>
                </div>
              </div>

              <p className="student-security-page-copy">
                This section is ready for password and authentication controls.
                The profile navigation now works correctly, and you can plug your
                future password-change flow into this page without affecting the
                rest of the student dashboard.
              </p>

              <div className="student-security-card">
                <div className="student-security-card-left">
                  <div className="student-security-icon">
                    <Shield size={22} />
                  </div>
                  <div className="student-security-copy">
                    <h2>Password & authentication</h2>
                    <p>Security options will live here.</p>
                  </div>
                </div>

                <div className="student-security-chevron">
                  <ChevronRight size={22} />
                </div>
              </div>

              <div className="student-security-page-actions">
                <button
                  type="button"
                  className="student-profile-primary-btn"
                  onClick={() => navigate("/student/profile")}
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
