import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Upload } from "lucide-react";
import LandownerNavbar from "../components/LandownerNavbar";
import { imageBaseUrl } from "../../../shared/api/client";
import {
  getLandownerListing,
  uploadBoardingHousePhotos,
} from "../api/landownerApi";
import "../styles/add-room.css";

const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

export default function UploadPhotos() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id, propertyId } = useParams();
  const listingId = propertyId || id || "";
  const routeBase = location.pathname.includes("/landowner/edit-room")
    ? "/landowner/edit-room"
    : "/landowner/add-room";

  const [photos, setPhotos] = useState([null, null, null, null]);
  const [previews, setPreviews] = useState([null, null, null, null]);
  const [existingPhotosCount, setExistingPhotosCount] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadExistingPhotos = async () => {
      if (!listingId.trim()) {
        setErrorMessage(
          "Missing propertyId in the route. Check the edit/add room URL."
        );
        return;
      }

      try {
        setErrorMessage("");
        const listing = await getLandownerListing(listingId);
        const existingPhotos = (listing?.photos || [])
          .slice(0, 4)
          .map((photo) => `${imageBaseUrl}${photo.photo_url}`);

        setExistingPhotosCount(existingPhotos.length);
        setPreviews((prev) => {
          const nextPreviews = [...prev];

          existingPhotos.forEach((photoUrl, index) => {
            nextPreviews[index] = photoUrl;
          });

          return nextPreviews;
        });
      } catch (error) {
        console.error("Load existing photos error:", error);
        setErrorMessage(
          error.response?.data?.message || "Failed to load existing photos."
        );
      }
    };

    loadExistingPhotos();
  }, [listingId]);

  const selectedCount = useMemo(
    () => previews.filter(Boolean).length,
    [previews]
  );

  const handlePhotoSelect = (index, file) => {
    if (file && file.size > MAX_PHOTO_SIZE_BYTES) {
      setErrorMessage("Each photo must be 5 MB or smaller.");
      return;
    }

    const updatedPhotos = [...photos];
    const updatedPreviews = [...previews];

    setErrorMessage("");
    updatedPhotos[index] = file || null;
    updatedPreviews[index] = file
      ? URL.createObjectURL(file)
      : updatedPreviews[index];

    setPhotos(updatedPhotos);
    setPreviews(updatedPreviews);
  };

  const handlePrevious = () => {
    if (routeBase === "/landowner/edit-room") {
      navigate(`${routeBase}/${listingId}`);
      return;
    }

    navigate("/landowner/add-room");
  };

  const handleNext = async () => {
    try {
      if (!listingId.trim()) {
        setErrorMessage(
          "Missing propertyId in the route. Check the edit/add room URL."
        );
        return;
      }

      const validFiles = photos.filter(Boolean);

      if (validFiles.length < 1 && existingPhotosCount < 1) {
        setErrorMessage("Please upload at least 1 photo.");
        return;
      }

      setErrorMessage("");
      setIsUploading(true);
      setUploadProgress(0);

      if (validFiles.length > 0) {
        const formData = new FormData();
        validFiles.forEach((file) => {
          formData.append("photos", file);
        });

        const response = await uploadBoardingHousePhotos(listingId, formData, {
          onUploadProgress: (progressEvent) => {
            if (!progressEvent.total) {
              return;
            }

            setUploadProgress(
              Math.min(
                100,
                Math.round((progressEvent.loaded / progressEvent.total) * 100)
              )
            );
          },
        });
        const uploadedUrls = (response?.photo_urls || []).map(
          (photoUrl) => `${imageBaseUrl}${photoUrl}`
        );

        if (uploadedUrls.length > 0) {
          const nextPreviews = [...previews];
          let uploadedIndex = 0;

          photos.forEach((file, index) => {
            if (!file || !uploadedUrls[uploadedIndex]) {
              return;
            }

            nextPreviews[index] = uploadedUrls[uploadedIndex];
            uploadedIndex += 1;
          });

          setPreviews(nextPreviews);
          setExistingPhotosCount((currentCount) => currentCount + uploadedUrls.length);
          setPhotos([null, null, null, null]);
        }
      }

      navigate(`${routeBase}/set-pricing/${listingId}`);
    } catch (error) {
      console.error("Upload photos error:", error);
      const nextError =
        (error.code === "ERR_NETWORK"
          ? "Upload failed before the server responded. Check the Railway API URL and allowed CORS origins."
          : "") ||
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Something went wrong while uploading photos.";

      setErrorMessage(nextError);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="add-room-page">
      <LandownerNavbar />

      <main className="add-room-main">
        <div className="add-room-shell add-room-shell-centered">
          <div className="step-label centered">Step 2 of 4</div>

          <div className="step-progress centered">
            <div className="step-progress-bar active" />
            <div className="step-progress-bar active" />
            <div className="step-progress-bar" />
            <div className="step-progress-bar" />
          </div>

          <section className="add-room-card upload-card">
            <h1 className="upload-title">Upload Photos</h1>
            <div className="upload-subtitle">
              Add high-quality photos to attract more students
            </div>

            {errorMessage ? (
              <div className="form-error-banner">{errorMessage}</div>
            ) : null}

            <div className="form-group">
              <label className="form-label">Property Photos *</label>

              <div className="upload-photo-grid">
                {[0, 1, 2, 3].map((index) => (
                  <label key={index} className="upload-photo-box">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden-file-input"
                      onChange={(e) =>
                        handlePhotoSelect(index, e.target.files?.[0] || null)
                      }
                    />

                    {previews[index] ? (
                      <img
                        src={previews[index]}
                        alt={`Preview ${index + 1}`}
                        className="upload-photo-preview"
                      />
                    ) : (
                      <div className="upload-box-content">
                        <Upload size={34} strokeWidth={2.2} />
                        <span>Photo {index + 1}</span>
                      </div>
                    )}
                  </label>
                ))}
              </div>

              <div className="upload-note">
                Upload at least 1 high-quality photo of the room
              </div>
              <div className="upload-count">Selected: {selectedCount} / 4</div>
              {isUploading ? (
                <div className="upload-count">Upload progress: {uploadProgress}%</div>
              ) : null}
            </div>

            <div className="card-footer">
              <button
                type="button"
                className="secondary-btn"
                onClick={handlePrevious}
                disabled={isUploading}
              >
                Previous
              </button>

              <button
                type="button"
                className="primary-btn"
                onClick={handleNext}
                disabled={isUploading}
              >
                {isUploading ? "Please wait..." : "Next"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
