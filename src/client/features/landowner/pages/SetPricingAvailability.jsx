import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import LandownerNavbar from "../components/LandownerNavbar";
import AmenityChip from "../components/AmenityChip";
import ListingFormField from "../components/ListingFormField";
import ListingStepProgress from "../components/ListingStepProgress";
import {
  getLandownerListing,
  savePricingAvailabilityDraft,
} from "../api/landownerApi";
import {
  AMENITY_OPTIONS,
  createPricingAvailabilityForm,
  getPricingAvailabilityStorageKey,
  sanitizeDigitInput,
  toPricingAvailabilityPayload,
  validatePricingAvailabilityForm,
} from "../utils/pricingAvailability";
import "../styles/add-room.css";
import "../styles/listing-draft.css";

const EMPTY_TOUCH_STATE = {
  monthly_rent: false,
  total_rooms: false,
  available_rooms: false,
};

export default function SetPricingAvailability() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id, propertyId } = useParams();
  const listingId = propertyId || id || "";
  const routeBase = location.pathname.includes("/landowner/edit-room")
    ? "/landowner/edit-room"
    : "/landowner/add-room";

  const [listing, setListing] = useState(null);
  const [form, setForm] = useState(createPricingAvailabilityForm());
  const [touched, setTouched] = useState(EMPTY_TOUCH_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [saveError, setSaveError] = useState("");
  const storageKey = getPricingAvailabilityStorageKey(listingId);

  useEffect(() => {
    const loadPricingAvailability = async () => {
      if (!listingId.trim()) {
        setSaveError(
          "Missing propertyId in the route. Check the edit/add room URL."
        );
        setIsLoading(false);
        return;
      }

      try {
        const listingData = await getLandownerListing(listingId);
        const persistedDraft = sessionStorage.getItem(storageKey);
        const baseForm = createPricingAvailabilityForm(listingData);

        if (persistedDraft) {
          try {
            const parsedDraft = JSON.parse(persistedDraft);
            setForm((prev) => ({
              ...prev,
              ...baseForm,
              ...parsedDraft,
            }));
          } catch (error) {
            console.error("Invalid pricing draft state:", error);
            sessionStorage.removeItem(storageKey);
            setForm(baseForm);
          }
        } else {
          setForm(baseForm);
        }

        setListing(listingData);
      } catch (error) {
        console.error("Load pricing availability error:", error);
        setSaveError("Failed to load pricing details.");
      } finally {
        setIsLoading(false);
      }
    };

    loadPricingAvailability();
  }, [listingId, storageKey]);

  useEffect(() => {
    if (isLoading || !listingId.trim()) {
      return;
    }

    sessionStorage.setItem(storageKey, JSON.stringify(form));
  }, [form, isLoading, listingId, storageKey]);

  const errors = useMemo(
    () => validatePricingAvailabilityForm(form),
    [form]
  );

  const shouldShowError = (fieldName) =>
    hasAttemptedSubmit || touched[fieldName];

  const handleNumberChange = (fieldName, value) => {
    setForm((prev) => ({
      ...prev,
      [fieldName]: sanitizeDigitInput(value),
    }));
    setSaveError("");
  };

  const handleFieldBlur = (fieldName) => {
    setTouched((prev) => ({
      ...prev,
      [fieldName]: true,
    }));
  };

  const handleAmenityToggle = (amenity) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((item) => item !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handlePrevious = () => {
    navigate(`${routeBase}/upload-photos/${listingId}`);
  };

  const handleNext = async () => {
    if (!listingId.trim()) {
      setSaveError(
        "Missing propertyId in the route. Check the edit/add room URL."
      );
      return;
    }

    const validationErrors = validatePricingAvailabilityForm(form);

    setHasAttemptedSubmit(true);
    setTouched({
      monthly_rent: true,
      total_rooms: true,
      available_rooms: true,
    });

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      setIsSaving(true);
      setSaveError("");

      await savePricingAvailabilityDraft(
        listingId,
        toPricingAvailabilityPayload(form, listing || {})
      );

      navigate(`${routeBase}/location-details/${listingId}`);
    } catch (error) {
      console.error("Save pricing availability error:", error);
      setSaveError(
        error.response?.data?.message || "Failed to save pricing details."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="add-room-page">
      <LandownerNavbar />

      <main className="add-room-main">
        <div className="listing-draft-shell">
          <ListingStepProgress activeStep={3} />

          <section className="listing-draft-card">
            <h1 className="listing-draft-title">Pricing & Availability</h1>
            <p className="listing-draft-subtitle">
              Set the monthly rent, room inventory, and amenities students can
              expect from your listing.
            </p>

            {isLoading ? (
              <p className="listing-status-text">Loading pricing details...</p>
            ) : (
              <div className="listing-form-layout">
                {saveError ? (
                  <div className="listing-form-error">{saveError}</div>
                ) : null}

                <ListingFormField
                  label="Monthly Rent (PHP)"
                  required
                  error={shouldShowError("monthly_rent") ? errors.monthly_rent : ""}
                >
                  <div className="listing-input-wrap">
                    <span className="listing-input-prefix">₱</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="5000"
                      className={`listing-input with-prefix ${
                        shouldShowError("monthly_rent") && errors.monthly_rent
                          ? "has-error"
                          : ""
                      }`}
                      value={form.monthly_rent}
                      onChange={(e) =>
                        handleNumberChange("monthly_rent", e.target.value)
                      }
                      onBlur={() => handleFieldBlur("monthly_rent")}
                    />
                  </div>
                </ListingFormField>

                <div className="listing-two-column-grid">
                  <ListingFormField
                    label="Total Rooms"
                    required
                    error={shouldShowError("total_rooms") ? errors.total_rooms : ""}
                  >
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="5"
                      className={`listing-input ${
                        shouldShowError("total_rooms") && errors.total_rooms
                          ? "has-error"
                          : ""
                      }`}
                      value={form.total_rooms}
                      onChange={(e) =>
                        handleNumberChange("total_rooms", e.target.value)
                      }
                      onBlur={() => handleFieldBlur("total_rooms")}
                    />
                  </ListingFormField>

                  <ListingFormField
                    label="Available Rooms"
                    required
                    error={
                      shouldShowError("available_rooms")
                        ? errors.available_rooms
                        : ""
                    }
                  >
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="2"
                      className={`listing-input ${
                        shouldShowError("available_rooms") &&
                        errors.available_rooms
                          ? "has-error"
                          : ""
                      }`}
                      value={form.available_rooms}
                      onChange={(e) =>
                        handleNumberChange("available_rooms", e.target.value)
                      }
                      onBlur={() => handleFieldBlur("available_rooms")}
                    />
                  </ListingFormField>
                </div>

                <ListingFormField label="Amenities">
                  <div className="listing-chip-wrap">
                    {AMENITY_OPTIONS.map((amenity) => (
                      <AmenityChip
                        key={amenity}
                        label={amenity}
                        selected={form.amenities.includes(amenity)}
                        onToggle={() => handleAmenityToggle(amenity)}
                      />
                    ))}
                  </div>
                </ListingFormField>
              </div>
            )}

            <div className="listing-draft-footer">
              <button
                type="button"
                className="listing-footer-btn secondary"
                onClick={handlePrevious}
                disabled={isSaving}
              >
                Previous
              </button>

              <button
                type="button"
                className="listing-footer-btn primary"
                onClick={handleNext}
                disabled={isLoading || isSaving}
              >
                {isSaving ? "Saving..." : "Next"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
