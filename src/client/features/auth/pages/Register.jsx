import "../styles/auth.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Home,
    UserRound,
    Mail,
    Calendar,
    User,
    Phone,
    MapPin,
    Lock,
  } from "lucide-react";
import { registerUser } from "../api/authApi";
import { useAuthSession } from "../context/useAuthSession";

export default function Register() {
  const navigate = useNavigate();
  const { setUser } = useAuthSession();
  const [role, setRole] = useState("student");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");   // <-- new error state

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
    password: "",
    confirmPassword: "",
    address: "",
    gender: "",
    birthdate: "",
    mobile_no: "",
  });

  const handleChange = (e) => {
    setError("");   // clear error when user starts typing
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.email.trim() ||
      !form.password.trim() ||
      !form.confirmPassword.trim() ||
      !form.address.trim() ||
      !form.gender.trim() ||
      !form.birthdate.trim() ||
      !form.mobile_no.trim()
    ) {
      setError("Please fill in all required fields");
      return false;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting || !validateForm()) {
      return;
    }

    const payload = {
      account_type: role.toUpperCase(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      middleName: form.middleName.trim() || null,
      email: form.email.trim().toLowerCase(),
      password: form.password,
      address: form.address.trim(),
      gender: form.gender,
      birthdate: form.birthdate,
      mobileNo: form.mobile_no.trim(),
    };

    try {
      setIsSubmitting(true);
      const data = await registerUser(payload);
      const user = setUser(data?.user);

      if (!user) {
        setError(data?.message || "Registration failed");
        return;
      }

      navigate(
        user.account_type === "landowner"
          ? "/landowner/dashboard"
          : "/student/dashboard"
      );
    } catch (error) {
      console.error("Register error:", error);
      setError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Something went wrong during registration"
      );
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
              <Home size={30} strokeWidth={2.4} />
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
                <Home size={26} />
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
                <UserRound size={26} />
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
            <form onSubmit={handleSubmit} className="auth-card">

              <div className="auth-title">Create Account</div>
              <div className="auth-subtitle">
                Fill in your details to get started
              </div>

              {/* ERROR BOX - uses CSS class from auth.css */}
              {error && <div className="error-box">{error}</div>}

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

              <div className="form-grid">
                {/* First Name */}
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    className="form-input"
                    value={form.firstName}
                    onChange={handleChange}
                  />
                </div>

                {/* Last Name */}
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    className="form-input"
                    value={form.lastName}
                    onChange={handleChange}
                  />
                </div>

                {/* Middle Name */}
                <div className="form-group">
                  <label className="form-label">Middle Name</label>
                  <div className="input-wrap">
                    <UserRound className="input-icon" size={18} />
                    <input
                      type="text"
                      name="middleName"
                      className="form-input has-icon"
                      value={form.middleName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div className="input-wrap">
                    <Mail className="input-icon" size={18} />
                    <input
                      type="email"
                      name="email"
                      className="form-input has-icon"
                      value={form.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Birthday */}
                <div className="form-group">
                  <label className="form-label">Birthday</label>
                  <div className="input-wrap">
                    <Calendar className="input-icon" size={18} />
                    <input
                      type="date"
                      name="birthdate"
                      className="form-input has-icon"
                      value={form.birthdate}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Gender */}
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <div className="input-wrap">
                    <User className="input-icon " size={18} />
                    <select
                      name="gender"
                      className="form-select has-icon"   
                      value={form.gender}
                      onChange={handleChange}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Contact */}
                <div className="form-group">
                  <label className="form-label">Contact No.</label>
                  <div className="input-wrap">
                    <Phone className="input-icon" size={18} />
                    <input
                      type="text"
                      name="mobile_no"
                      className="form-input has-icon"
                      value={form.mobile_no}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <div className="input-wrap">
                    <MapPin className="input-icon" size={18} />
                    <input
                      type="text"
                      name="address"
                      className="form-input has-icon"
                      value={form.address}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="form-group">
                  <label className="form-label">Create Password</label>
                  <div className="input-wrap">
                    <Lock className="input-icon" size={18} />
                    <input
                      type="password"
                      name="password"
                      className="form-input has-icon"
                      value={form.password}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <div className="input-wrap">
                    <Lock className="input-icon" size={18} />
                    <input
                      type="password"
                      name="confirmPassword"
                      className="form-input has-icon"
                      value={form.confirmPassword}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? "Registering..." : "Register"}
              </button>

              <div className="auth-link-row">
                Already have an account?{" "}
                <button
                  type="button"
                  className="auth-link auth-link-btn"
                  onClick={() => navigate("/")}
                >
                  Login here
                </button>
              </div>
            </form>

            <div className="auth-footer-note">
              Secure and professional boarding house registration platform
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}