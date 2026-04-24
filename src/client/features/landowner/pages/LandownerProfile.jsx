import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  LogOut,
  Mail,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import FeedbackToast from "../../../shared/components/FeedbackToast";
import { getStoredUser } from "../../auth/api/authApi";
import { useAuthSession } from "../../auth/context/useAuthSession";
import LandownerNavbar from "../components/LandownerNavbar";
import {
  getLandownerProfile,
  updateLandownerProfile,
  uploadLandownerAvatar,
} from "../api/landownerApi";
import { validateLandownerProfileForm } from "../utils/profileValidation";
import "../styles/landowner-profile.css";
import {
  calculateAgeFromBirthdate,
  getBirthdateInputBounds,
} from "../../../../shared/utils/birthdate.js";

const createProfileForm = (profile = {}) => ({
  full_name: profile.full_name || "",
  email: profile.email || "",
  birthdate: profile.birthdate || "",
});

export default function LandownerProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const fallbackUser = getStoredUser();
  const { user, patchUser, clearUser } = useAuthSession();
  const sessionUser = user || fallbackUser;
  const landownerId = sessionUser?.landowner_id;

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(createProfileForm());
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [toast, setToast] = useState({ type: "", message: "" });
  const birthdateBounds = useMemo(() => getBirthdateInputBounds(), []);

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
      if (!landownerId) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await getLandownerProfile(landownerId);
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
        console.error("Load landowner profile error:", error);
        setToast({
          type: "error",
          message: error.response?.data?.message || "Failed to load profile.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [landownerId, patchUser]);

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

  const favoritesCount = useMemo(
    () => Number(profile?.favorites_count ?? sessionUser?.favorites_count ?? 0),
    [profile?.favorites_count, sessionUser?.favorites_count]
  );

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
    const validationErrors = validateLandownerProfileForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0 || !landownerId) {
      return;
    }

    try {
      setIsSaving(true);

      const updateResponse = await updateLandownerProfile({
        landowner_id: landownerId,
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        birthdate: form.birthdate,
      });

      let nextProfile = updateResponse.profile;
      let feedbackMessage = "Profile updated successfully.";
      let hasAvatarUploadError = false;

      if (selectedAvatarFile) {
        try {
          const avatarResponse = await uploadLandownerAvatar(
            landownerId,
            selectedAvatarFile
          );
          nextProfile = {
            ...nextProfile,
            avatar_url: avatarResponse.avatar_url,
          };
        } catch (avatarError) {
          console.error("Upload landowner avatar error:", avatarError);
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
      console.error("Save landowner profile error:", error);
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

  const displayName = form.full_name || profile?.full_name || "Landowner";
  const displayEmail = form.email || profile?.email || sessionUser?.email || "";
  const calculatedAge = useMemo(() => {
    const derivedAge = calculateAgeFromBirthdate(form.birthdate);

    if (derivedAge !== null) {
      return derivedAge;
    }

    const storedAge = Number(profile?.age || 0);
    return storedAge > 0 ? storedAge : "";
  }, [form.birthdate, profile?.age]);

  return (
    <div className="landowner-profile-page">
      <FeedbackToast type={toast.type} message={toast.message} />

      <LandownerNavbar favoritesCount={favoritesCount} showLogout={false} />

      <main className="landowner-profile-main">
        <div className="landowner-profile-grid">
          <aside className="landowner-profile-sidebar">
            <div className="landowner-avatar-shell">
              <div className="landowner-avatar">
                {avatarPreview ? (
                  <img src={avatarPreview} alt={displayName} />
                ) : (
                  <User size={62} strokeWidth={2.1} />
                )}
              </div>

              <button
                type="button"
                className="landowner-avatar-trigger"
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
              <h1 className="landowner-profile-name">{displayName}</h1>
            </div>

            <span className="landowner-role-pill">Landowner</span>
            <div className="landowner-profile-email">{displayEmail}</div>
          </aside>

          <section className="landowner-profile-content">
            <article className="landowner-profile-card">
              <div className="landowner-profile-card-header">
                <div className="landowner-profile-card-title">
                  <div className="landowner-profile-card-icon">
                    <User size={22} />
                  </div>
                  <div>
                    <h1>Edit Profile</h1>
                  </div>
                </div>

                {!isLoading ? (
                  <button
                    type="button"
                    className="landowner-profile-edit-btn"
                    onClick={handleStartEdit}
                    disabled={isEditing}
                  >
                    Edit
                  </button>
                ) : null}
              </div>

              {isLoading ? (
                <div className="landowner-profile-status">Loading profile...</div>
              ) : (
                <div className="landowner-profile-form">
                  <div className="landowner-profile-field">
                    <label htmlFor="landowner-full-name">Full Name</label>
                    <input
                      id="landowner-full-name"
                      type="text"
                      className={`landowner-profile-input ${
                        errors.full_name ? "has-error" : ""
                      }`}
                      value={form.full_name}
                      onChange={(event) =>
                        handleChange("full_name", event.target.value)
                      }
                      readOnly={!isEditing}
                    />
                    {errors.full_name ? (
                      <div className="landowner-profile-error">
                        {errors.full_name}
                      </div>
                    ) : null}
                  </div>

                  <div className="landowner-profile-field">
                    <label htmlFor="landowner-email-address">Email Address</label>
                    <div className="landowner-profile-input-wrap">
                      <Mail size={18} className="landowner-profile-input-icon" />
                      <input
                        id="landowner-email-address"
                        type="email"
                        className={`landowner-profile-input with-icon ${
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
                      <div className="landowner-profile-error">{errors.email}</div>
                    ) : null}
                  </div>

                  <div className="landowner-profile-field">
                    <label htmlFor="landowner-birthdate">Birthdate</label>
                    <input
                      id="landowner-birthdate"
                      type="date"
                      className={`landowner-profile-input ${
                        errors.birthdate ? "has-error" : ""
                      }`}
                      value={form.birthdate}
                      min={birthdateBounds.min}
                      max={birthdateBounds.max}
                      onChange={(event) =>
                        handleChange("birthdate", event.target.value)
                      }
                      readOnly={!isEditing}
                    />
                    {errors.birthdate ? (
                      <div className="landowner-profile-error">
                        {errors.birthdate}
                      </div>
                    ) : null}
                  </div>

                  <div className="landowner-profile-field">
                    <label htmlFor="landowner-age">Age</label>
                    <input
                      id="landowner-age"
                      type="text"
                      className="landowner-profile-input"
                      value={calculatedAge}
                      readOnly
                    />
                  </div>

                  {isEditing ? (
                    <div className="landowner-profile-actions">
                      <button
                        type="button"
                        className="landowner-profile-secondary-btn"
                        onClick={handleCancel}
                        disabled={isSaving}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="landowner-profile-primary-btn"
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

           

            <div className="landowner-profile-logout-wrap">
              <button
                type="button"
                className="landowner-profile-logout-btn"
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
