import "../styles/auth.css";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Mail, Lock, UserRound } from "lucide-react";
import { loginUser } from "../api/authApi";
import { useAuthSession } from "../context/useAuthSession";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuthSession();

  const [role, setRole] = useState("student");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    if (!location.state?.registrationSuccess) {
      return;
    }

    setSuccess(location.state.registrationSuccess);
    setError("");
    setForm((prev) => ({
      ...prev,
      email: location.state?.registeredEmail || prev.email,
    }));
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const handleChange = (e) => {
    setError("");
    setSuccess("");
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    setError("");

    if (!form.email.trim() || !form.password.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    if (!form.email.includes("@")) {
      setError("Please include an '@' in the email address.");
      return;
    }

    try {
      setIsSubmitting(true);

      const data = await loginUser({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role,
      });

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      const user = setUser(data?.user);

      if (!user) {
        setError("Login failed");
        return;
      }

      if (user.account_type === "student") {
        navigate("/student/dashboard");
        return;
      }

      if (user.account_type === "landowner") {
        navigate("/landowner/dashboard");
        return;
      }

      setError("Unknown account type");
    } catch (error) {
      console.error("Login error:", error);

      const status = error.response?.status;
      const message = error.response?.data?.message || error.response?.data?.error || "";

      if (status === 401 || message.toLowerCase().includes("password") || message.toLowerCase().includes("credential")) {
        setError("Incorrect Password.");
        return;
      }

      if (status === 404) {
        setError("Account not found. Please register.");
        return;
      }

      setError(message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="brand-panel">
          <div className="brand-logo-row">
            <div className="brand-logo-box">
              <Home size={36} />
            </div>
            <div className="brand-title">StayNear</div>
          </div>

          <div className="brand-subtitle">
            Connecting students with quality boarding houses across the
            Philippines
          </div>

          <div className="feature-list">
            <div className="feature-item">
              <div className="feature-icon student">
                <Home size={24} />
              </div>
              <div>
                <div className="feature-title">For Students</div>
                <div className="feature-text">
                  Find your perfect boarding house near your university
                </div>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon landowner">
                <UserRound size={24} />
              </div>
              <div>
                <div className="feature-title">For Landowners</div>
                <div className="feature-text">
                  List and manage your properties with ease
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-card-wrap">
          <div className="auth-card-container">
            <form className="auth-card" onSubmit={handleLogin} noValidate>
              <div className="auth-title">Welcome Back</div>
              <div className="auth-subtitle">Sign in to continue</div>

              {error && <div className="error-box">{error}</div>}
              {success && <div className="success-box">{success}</div>}

              <div className="role-toggle">
                <button
                  type="button"
                  className={`role-btn ${role === "student" ? "active" : ""}`}
                  onClick={() => setRole("student")}
                >
                  Student
                </button>

                <button
                  type="button"
                  className={`role-btn ${role === "landowner" ? "active" : ""}`}
                  onClick={() => setRole("landowner")}
                >
                  Landowner
                </button>
              </div>

              <div className="form-group full">
                <label className="form-label">Email Address</label>
                <div className="input-wrap">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    name="email"
                    placeholder="your@gmail.com"
                    className="form-input has-icon"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group full">
                <label className="form-label">Password</label>
                <div className="input-wrap">
                  <Lock size={18} className="input-icon" />
                  <input
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    className="form-input has-icon"
                    value={form.password}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Login"}
              </button>

              <div className="auth-link-row">
                Don't have an account?{" "}
                <span
                  className="auth-link"
                  onClick={() => navigate("/register")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      navigate("/register");
                    }
                  }}
                >
                  Register here
                </span>
              </div>
            </form>

            <div className="auth-footer-note">
              Secure and professional boarding house platform
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
