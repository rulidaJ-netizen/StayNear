import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import LandownerNavbar from "../components/LandownerNavbar";
import ListingFormField from "../components/ListingFormField";
import ListingStepProgress from "../components/ListingStepProgress";
import {
  getLandownerListing,
  saveLocationDetailsDraft,
} from "../api/landownerApi";
import { validateLocationDetailsForm } from "../utils/listingValidation";
import {
  normalizeReferenceMapField,
  validateReferenceMapField,
} from "../../../shared/utils/inputValidation";
import "../styles/add-room.css";
import "../styles/listing-draft.css";

const getStorageKey = (listingId) => `staynear:location-details:${listingId}`;

const createLocationForm = (listing = {}) => ({
  full_address: listing.location || "",
  distance_from_university: listing.distance_from_university || "",
  reference_map: listing.reference_map || "",
});

export default function LocationDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id, propertyId } = useParams();
  const listingId = propertyId || id || "";
  const routeBase = location.pathname.includes("/landowner/edit-room")
    ? "/landowner/edit-room"
    : "/landowner/add-room";

  const [form, setForm] = useState(createLocationForm());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errors, setErrors] = useState({});
  const storageKey = getStorageKey(listingId);

  useEffect(() => {
    const loadLocationDetails = async () => {
      if (!listingId.trim()) {
        setErrorMessage(
          "Missing propertyId in the route. Check the edit/add room URL."
        );
        setIsLoading(false);
        return;
      }

      try {
        const listing = await getLandownerListing(listingId);
        const persistedDraft = sessionStorage.getItem(storageKey);
        const baseForm = createLocationForm(listing);

        if (persistedDraft) {
          try {
            setForm({
              ...baseForm,
              ...JSON.parse(persistedDraft),
            });
          } catch (error) {
            console.error("Invalid location draft state:", error);
            sessionStorage.removeItem(storageKey);
            setForm(baseForm);
          }
        } else {
          setForm(baseForm);
        }
      } catch (error) {
        console.error("Load location details error:", error);
        setErrorMessage("Failed to load location details.");
      } finally {
        setIsLoading(false);
      }
    };

    loadLocationDetails();
  }, [listingId, storageKey]);

  useEffect(() => {
    if (isLoading || !listingId.trim()) {
      return;
    }

    sessionStorage.setItem(storageKey, JSON.stringify(form));
  }, [form, isLoading, listingId, storageKey]);

  const handleChange = (fieldName, value) => {
    setForm((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
    setErrors((prev) => ({
      ...prev,
      [fieldName]: "",
    }));
    setErrorMessage("");
  };

  const handleReferenceMapBlur = () => {
    const rawReferenceMap = form.reference_map.trim();

    if (!rawReferenceMap) {
      setErrors((prev) => ({
        ...prev,
        reference_map: "",
      }));
      return;
    }

    const referenceMapError = validateReferenceMapField(
      rawReferenceMap,
      "Reference Map",
      { required: false }
    );

    if (referenceMapError) {
      setErrors((prev) => ({
        ...prev,
        reference_map: referenceMapError,
      }));
      return;
    }

    const normalizedReferenceMap = normalizeReferenceMapField(rawReferenceMap);

    setForm((prev) => ({
      ...prev,
      reference_map: normalizedReferenceMap,
    }));
    setErrors((prev) => ({
      ...prev,
      reference_map: "",
    }));
  };

  const handlePrevious = () => {
    navigate(`${routeBase}/set-pricing/${listingId}`);
  };

  const handlePublish = async () => {
    if (!listingId.trim()) {
      setErrorMessage(
        "Missing propertyId in the route. Check the edit/add room URL."
      );
      return;
    }

    const validationErrors = validateLocationDetailsForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setErrorMessage("Please fix the highlighted fields before saving.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage("");
      const normalizedReferenceMap = form.reference_map.trim()
        ? normalizeReferenceMapField(form.reference_map)
        : "";

      await saveLocationDetailsDraft(listingId, {
        full_address: form.full_address.trim(),
        distance_from_university: form.distance_from_university.trim(),
        reference_map: normalizedReferenceMap,
      });

      setForm((prev) => ({
        ...prev,
        reference_map: normalizedReferenceMap,
      }));

      navigate("/landowner/dashboard");
    } catch (error) {
      console.error("Save location details error:", error);
      setErrors(error.response?.data?.errors || {});
      setErrorMessage(
        error.response?.data?.message || "Failed to save location details."
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
          <ListingStepProgress activeStep={4} />

          <section className="listing-draft-card">
            <h1 className="listing-draft-title">Location Details</h1>
            <p className="listing-draft-subtitle">
              Help students find your property with accurate address and map
              details.
            </p>

            {isLoading ? (
              <p className="listing-status-text">Loading location details...</p>
            ) : (
              <div className="listing-form-layout">
                {errorMessage ? (
                  <div className="listing-form-error">{errorMessage}</div>
                ) : null}

                <ListingFormField label="Full Address" required>
                  <input
                    type="text"
                    className={`listing-input ${
                      errors.full_address ? "has-error" : ""
                    }`}
                    placeholder="Barangay, Municipality, City"
                    value={form.full_address}
                    onChange={(e) =>
                      handleChange("full_address", e.target.value)
                    }
                  />
                  {errors.full_address ? (
                    <div className="listing-form-error">{errors.full_address}</div>
                  ) : null}
                </ListingFormField>

                <ListingFormField label="Distance from University">
                  <input
                    type="text"
                    className={`listing-input ${
                      errors.distance_from_university ? "has-error" : ""
                    }`}
                    placeholder="Enter in kilometers"
                    value={form.distance_from_university}
                    onChange={(e) =>
                      handleChange("distance_from_university", e.target.value)
                    }
                  />
                  {errors.distance_from_university ? (
                    <div className="listing-form-error">
                      {errors.distance_from_university}
                    </div>
                  ) : null}
                </ListingFormField>

                <ListingFormField
                  label="Reference Map"
                  error={errors.reference_map}
                >
                  <input
                    type="url"
                    inputMode="url"
                    autoComplete="url"
                    className={`listing-input ${
                      errors.reference_map ? "has-error" : ""
                    }`}
                    placeholder="Paste a Google Maps link"
                    value={form.reference_map}
                    onChange={(e) =>
                      handleChange("reference_map", e.target.value)
                    }
                    onBlur={handleReferenceMapBlur}
                  />
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
                onClick={handlePublish}
                disabled={isLoading || isSaving}
              >
                {isSaving
                  ? "Saving..."
                  : routeBase === "/landowner/edit-room"
                    ? "Save Changes"
                    : "Publish Listing"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
