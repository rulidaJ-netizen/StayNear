import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getRoomBasicInfoById,
  updateRoomBasicInfo,
} from "../api/landownerApi";
import "../styles/add-room.css";

const CONTACT_NUMBER_PATTERN = /^[+0-9\s-]{10,15}$/;

const normalizeRoomBasicInfo = (response) => {
  const candidates = [
    response?.data?.room,
    response?.data?.boardingHouse,
    response?.data?.listing,
    response?.data,
    response?.room,
    response?.boardingHouse,
    response?.listing,
    response,
  ];

  const source = candidates.find(
    (candidate) => candidate && typeof candidate === "object" && !Array.isArray(candidate)
  );

  if (!source) {
    return null;
  }

  return {
    propertyId:
      source.propertyId ??
      source.boardinghouse_id ??
      source.boardinghouseId ??
      source.id ??
      "",
    propertyName:
      source.propertyName ??
      source.property_name ??
      source.name ??
      "",
    description: source.description ?? "",
    contactNumber:
      source.contactNumber ??
      source.contact_number ??
      "",
  };
};

export default function EditRoom() {
  const navigate = useNavigate();
  const { propertyId } = useParams();

  const [form, setForm] = useState({
    propertyName: "",
    description: "",
    contactNumber: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchRoom() {
      if (!propertyId?.trim()) {
        setErrors({
          general:
            "Missing propertyId in the route. Check /landowner/edit-room/:propertyId.",
        });
        setLoading(false);
        return;
      }

      try {
        setErrors({});
        const room = normalizeRoomBasicInfo(
          await getRoomBasicInfoById(propertyId)
        );

        if (!room) {
          throw new Error("Unexpected room response format.");
        }

        const resolvedPropertyId = String(room.propertyId || "").trim();

        if (
          resolvedPropertyId &&
          resolvedPropertyId !== String(propertyId).trim()
        ) {
          throw new Error(
            `Loaded property ${resolvedPropertyId} does not match requested property ${propertyId}.`
          );
        }

        setForm({
          propertyName: String(room.propertyName || ""),
          description: String(room.description || ""),
          contactNumber: String(room.contactNumber || ""),
        });
      } catch (error) {
        setErrors({
          general:
            error.response?.data?.message ||
            error.message ||
            "Failed to load room information.",
        });
      } finally {
        setLoading(false);
      }
    }

    if (propertyId) fetchRoom();
    else setLoading(false);
  }, [propertyId]);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
      general: "",
    }));
  }

  function validate() {
    const nextErrors = {};

    if (!form.propertyName.trim()) {
      nextErrors.propertyName = "Property name is required";
    }

    if (!form.description.trim()) {
      nextErrors.description = "Description is required";
    }

    if (!form.contactNumber.trim()) {
      nextErrors.contactNumber = "Contact number is required";
    } else if (!CONTACT_NUMBER_PATTERN.test(form.contactNumber.trim())) {
      nextErrors.contactNumber = "Enter a valid contact number";
    }

    return nextErrors;
  }

  async function handleNext(e) {
    e.preventDefault();

    if (!propertyId?.trim()) {
      setErrors({
        general:
          "Missing propertyId in the route. Check /landowner/edit-room/:propertyId.",
      });
      return;
    }

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setSubmitting(true);
      setErrors({});

      const result = await updateRoomBasicInfo(propertyId, {
        propertyName: form.propertyName.trim(),
        description: form.description.trim(),
        contactNumber: form.contactNumber.trim(),
      });

      const nextPropertyId =
        result?.propertyId ||
        result?.boardinghouse_id ||
        result?.boardinghouseId ||
        propertyId;

      navigate(`/landowner/edit-room/upload-photos/${nextPropertyId}`);
    } catch (error) {
      setErrors({
        general:
          error.response?.data?.message ||
          error.message ||
          "Save failed. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handleBack() {
    navigate("/landowner/dashboard");
  }

  if (loading) {
    return (
      <div className="add-room-page">
        <div className="add-room-shell">
          <div className="add-room-card">
            <p>Loading room details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="add-room-page">
      <div className="add-room-shell">

        <button
          type="button"
          className="secondary-btn"
          onClick={handleBack}
        >
          Back to dashboard
        </button>

        <div className="step-label">Step 1 of 4</div>

        <div className="step-progress">
          <div className="step-progress-bar active"></div>
          <div className="step-progress-bar"></div>
          <div className="step-progress-bar"></div>
          <div className="step-progress-bar"></div>
        </div>

        <form className="add-room-card" onSubmit={handleNext}>
          <h2 className="card-title">Edit Basic Information</h2>

          {errors.general && (
            <div className="form-error-banner">
              {errors.general}
            </div>
          )}

          <div className="form-section">

            <div className="form-group">
              <label>Property Name *</label>
              <input
                name="propertyName"
                value={form.propertyName}
                onChange={handleChange}
                className="form-input"
              />
              {errors.propertyName && (
                <small>{errors.propertyName}</small>
              )}
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="form-textarea"
                rows="6"
              />
              {errors.description && (
                <small>{errors.description}</small>
              )}
            </div>

            <div className="form-group">
              <label>Contact Number *</label>
              <input
                name="contactNumber"
                value={form.contactNumber}
                onChange={handleChange}
                className="form-input"
              />
              {errors.contactNumber && (
                <small>{errors.contactNumber}</small>
              )}
            </div>

          </div>

          <div className="card-footer">
            <button
              type="button"
              className="secondary-btn"
              onClick={handleBack}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-btn"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save & Next"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
