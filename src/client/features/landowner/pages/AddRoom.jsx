import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Phone } from "lucide-react";
import LandownerNavbar from "../components/LandownerNavbar";
import { getStoredUser } from "../../auth/api/authApi";
import { createBoardingHouseDraft } from "../api/landownerApi";
import "../styles/add-room.css";

export default function AddRoom() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    contact_number: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNext = async () => {
    try {
      if (
        !form.name.trim() ||
        !form.description.trim() ||
        !form.contact_number.trim()
      ) {
        alert("Please complete all required fields.");
        return;
      }

      if (!user?.landowner_id) {
        alert("Landowner account not found. Please log in again.");
        return;
      }

      setIsSubmitting(true);

      const response = await createBoardingHouseDraft({
        landowner_id: user.landowner_id,
        name: form.name.trim(),
        description: form.description.trim(),
        contact_number: form.contact_number.trim(),
      });

      const boardinghouseId = response?.boardinghouse_id;

      if (!boardinghouseId) {
        alert("Failed to create property draft.");
        return;
      }

      navigate(`/landowner/add-room/upload-photos/${boardinghouseId}`);
    } catch (error) {
      console.error("Create draft error:", error);
      alert(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Something went wrong"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-room-page">
      <LandownerNavbar />

      <main className="add-room-main">
        <div className="add-room-shell">
          <button
            type="button"
            className="back-link"
            onClick={() => navigate("/landowner/dashboard")}
          >
            <ArrowLeft size={24} />
            <span>Back to dashboard</span>
          </button>

          <div className="step-label">Step 1 of 4</div>

          <div className="step-progress">
            <div className="step-progress-bar active" />
            <div className="step-progress-bar" />
            <div className="step-progress-bar" />
            <div className="step-progress-bar" />
          </div>

          <section className="add-room-card">
            <h1 className="card-title">Add Room</h1>
            <div className="card-subtitle">Basic Information</div>

            <div className="form-section">
              <div className="form-group">
                <label className="form-label">Property Name *</label>
                <div className="input-wrap">
                  <Home size={18} className="input-icon" />
                  <input
                    type="text"
                    name="name"
                    className="form-input has-icon"
                    placeholder="Cozy Student Room near Campus"
                    value={form.name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea
                  name="description"
                  className="form-textarea"
                  placeholder="Describe the room, facilities, and nearby amenities..."
                  value={form.description}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Number *</label>
                <div className="input-wrap">
                  <Phone size={18} className="input-icon" />
                  <input
                    type="text"
                    name="contact_number"
                    className="form-input has-icon"
                    placeholder="+63 917 123 4567"
                    value={form.contact_number}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="card-footer">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => navigate("/landowner/dashboard")}
                disabled={isSubmitting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="primary-btn"
                onClick={handleNext}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Please wait..." : "Next"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
