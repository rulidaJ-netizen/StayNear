import { useEffect, useRef, useState } from "react";
import {
  Camera,
  LogOut,
  Mail,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import StudentNavbar from "../components/StudentNavbar";
import FeedbackToast from "../../../shared/components/FeedbackToast";
import { getStoredUser } from "../../auth/api/authApi";
import { useAuthSession } from "../../auth/context/useAuthSession";
import { useStudentFavorites } from "../context/useStudentFavorites";
import {
  getUserProfile,
  updateUserProfile,
  uploadUserAvatar,
} from "../api/studentApi";
import { validateProfileForm } from "../utils/profileValidation";
import "../styles/student-profile.css";

const createProfileForm = (profile = {}) => ({
  full_name: profile.full_name || "",
  email: profile.email || "",
});

export default function StudentProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const fallbackUser = getStoredUser();
  const { user, patchUser, clearUser } = useAuthSession();
  const { favoritesCount } = useStudentFavorites();
  const sessionUser = user || fallbackUser;
  const studentId = sessionUser?.student_id;

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(createProfileForm());
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [toast, setToast] = useState({ type: "", message: "" });

  useEffect(() => {
    if (!toast.message) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setToast({ type: "", message: "" });
    }, 2600);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!studentId) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await getUserProfile(studentId);
        setProfile(data);
        setForm(createProfileForm(data));
        setAvatarPreview(data.avatar_url || "");
        patchUser({
          email: data.email,
          full_name: data.full_name,
          avatar_url: data.avatar_url,
          favorites_count: data.favorites_count,
        });
      } catch (error) {
        console.error("Load user profile error:", error);
        setToast({
          type: "error",
          message: error.response?.data?.message || "Failed to load profile.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [patchUser, studentId]);

  useEffect(() => {
    if (!selectedAvatarFile) {
      return undefined;
    }

    const previewUrl = URL.createObjectURL(selectedAvatarFile);
    setAvatarPreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [selectedAvatarFile]);

  const handleChange = (fieldName, value) => {
    setForm((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [fieldName]: "",
    }));
  };

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    setSelectedAvatarFile(null);
    setForm(createProfileForm(profile));
    setAvatarPreview(profile?.avatar_url || "");
  };

  const handleAvatarButtonClick = () => {
    if (!isEditing) {
      setIsEditing(true);
    }

    fileInputRef.current?.click();
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setToast({
        type: "error",
        message: "Please select an image file only.",
      });
      event.target.value = "";
      return;
    }

    setSelectedAvatarFile(file);
    setToast({ type: "", message: "" });
  };

  const handleSave = async () => {
    const validationErrors = validateProfileForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0 || !studentId) {
      return;
    }

    try {
      setIsSaving(true);

      const updateResponse = await updateUserProfile({
        student_id: studentId,
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
      });

      let nextProfile = updateResponse.profile;
      let feedbackMessage = "Profile updated successfully.";
      let hasAvatarUploadError = false;

      if (selectedAvatarFile) {
        try {
          const avatarResponse = await uploadUserAvatar(
            studentId,
            selectedAvatarFile
          );
          nextProfile = {
            ...nextProfile,
            avatar_url: avatarResponse.avatar_url,
          };
        } catch (avatarError) {
          console.error("Upload avatar error:", avatarError);
          hasAvatarUploadError = true;
          feedbackMessage =
            avatarError.response?.data?.message ||
            "Profile details were saved, but the avatar upload failed.";
        }
      }

      setProfile(nextProfile);
      setForm(createProfileForm(nextProfile));
      setSelectedAvatarFile(null);
      setIsEditing(false);
      setAvatarPreview(nextProfile.avatar_url || "");

      patchUser({
        email: nextProfile.email,
        full_name: nextProfile.full_name,
        avatar_url: nextProfile.avatar_url,
        favorites_count: nextProfile.favorites_count,
      });

      setToast({
        type: hasAvatarUploadError ? "error" : "success",
        message: feedbackMessage,
      });
    } catch (error) {
      console.error("Save user profile error:", error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
      setToast({
        type: "error",
        message: error.response?.data?.message || "Failed to update profile.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    clearUser();
    navigate("/");
  };

  const displayName = form.full_name || profile?.full_name || "Student";
  const displayEmail = form.email || profile?.email || sessionUser?.email || "";

  return (
    <div className="student-profile-page">
      <FeedbackToast type={toast.type} message={toast.message} />

      <StudentNavbar favoritesCount={favoritesCount} showLogout={false} />

      <main className="student-profile-main">
        <div className="student-profile-grid">
          <aside className="student-profile-sidebar">
            <div className="student-avatar-shell">
              <div className="student-avatar">
                {avatarPreview ? (
                  <img src={avatarPreview} alt={displayName} />
                ) : (
                  <User size={62} strokeWidth={2.1} />
                )}
              </div>

              <button
                type="button"
                className="student-avatar-trigger"
                onClick={handleAvatarButtonClick}
                aria-label="Upload profile image"
              >
                <Camera size={18} />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleAvatarChange}
              />
            </div>

            <div>
              <h1 className="student-profile-name">{displayName}</h1>
            </div>

            <span className="student-role-pill">Student</span>
            <div className="student-profile-email">{displayEmail}</div>
          </aside>

          <section className="student-profile-content">
            <article className="student-profile-card">
              <div className="student-profile-card-header">
                <div className="student-profile-card-title">
                  <div className="student-profile-card-icon">
                    <User size={22} />
                  </div>
                  <div>
                    <h1>Edit Profile</h1>
                  </div>
                </div>

                {!isLoading ? (
                  <button
                    type="button"
                    className="student-profile-edit-btn"
                    onClick={handleStartEdit}
                    disabled={isEditing}
                  >
                    Edit
                  </button>
                ) : null}
              </div>

              {isLoading ? (
                <div className="student-profile-status">Loading profile...</div>
              ) : (
                <div className="student-profile-form">
                  <div className="student-profile-field">
                    <label htmlFor="student-full-name">Full Name</label>
                    <input
                      id="student-full-name"
                      type="text"
                      className={`student-profile-input ${
                        errors.full_name ? "has-error" : ""
                      }`}
                      value={form.full_name}
                      onChange={(event) =>
                        handleChange("full_name", event.target.value)
                      }
                      readOnly={!isEditing}
                    />
                    {errors.full_name ? (
                      <div className="student-profile-error">
                        {errors.full_name}
                      </div>
                    ) : null}
                  </div>

                  <div className="student-profile-field">
                    <label htmlFor="student-email-address">Email Address</label>
                    <div className="student-profile-input-wrap">
                      <Mail size={18} className="student-profile-input-icon" />
                      <input
                        id="student-email-address"
                        type="email"
                        className={`student-profile-input with-icon ${
                          errors.email ? "has-error" : ""
                        }`}
                        value={form.email}
                        onChange={(event) =>
                          handleChange("email", event.target.value)
                        }
                        readOnly={!isEditing}
                      />
                    </div>
                    {errors.email ? (
                      <div className="student-profile-error">{errors.email}</div>
                    ) : null}
                  </div>

                  {isEditing ? (
                    <div className="student-profile-actions">
                      <button
                        type="button"
                        className="student-profile-secondary-btn"
                        onClick={handleCancel}
                        disabled={isSaving}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="student-profile-primary-btn"
                        onClick={handleSave}
                        disabled={isSaving}
                      >
                        {isSaving ? "Saving..." : "Save"}
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </article>

          

            <div className="student-profile-logout-wrap">
              <button
                type="button"
                className="student-profile-logout-btn"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
