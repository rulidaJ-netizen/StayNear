import axios from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Upload } from "lucide-react";
import LandownerNavbar from "../components/LandownerNavbar";
import { imageBaseUrl } from "../../../shared/api/client";
import { getLandownerListing } from "../api/landownerApi";
import "../styles/add-room.css";

const MAX_PHOTO_SIZE_BYTES = 20 * 1024 * 1024;
const trimTrailingSlashes = (value) => String(value ?? "").replace(/\/+$/, "");

export default function UploadPhotos() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id, propertyId } = useParams();
  const listingId = propertyId || id || "";
  const routeBase = location.pathname.includes("/landowner/edit-room")
    ? "/landowner/edit-room"
    : "/landowner/add-room";

  const [existingPhotos, setExistingPhotos] = useState([null, null, null, null]);
  const [photos, setPhotos] = useState([null, null, null, null]);
  const [previews, setPreviews] = useState([null, null, null, null]);
  const [existingPhotosCount, setExistingPhotosCount] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRefs = useRef([]);
  const photosSectionRef = useRef(null);

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
        const nextExistingPhotos = [null, null, null, null];
        const nextPreviews = [null, null, null, null];

        (listing?.photos || [])
          .slice(0, 4)
          .forEach((photo, index) => {
            nextExistingPhotos[index] = photo;
            nextPreviews[index] = `${imageBaseUrl}${photo.photo_url}`;
          });

        setExistingPhotos(nextExistingPhotos);
        setExistingPhotosCount(nextExistingPhotos.filter(Boolean).length);
        setPhotos([null, null, null, null]);
        setPreviews(nextPreviews);
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

  const getPhotoRequestContext = () => {
    const configuredApiUrl = String(import.meta.env.VITE_API_URL || "/api").trim();
    const token = localStorage.getItem("token");
    const uploadOrigin = configuredApiUrl.startsWith("http")
      ? trimTrailingSlashes(configuredApiUrl)
      : "";
    const photosBaseUrl = configuredApiUrl.startsWith("http")
      ? `${uploadOrigin}/api/landowner/boarding-houses/${listingId}/photos`
      : `${trimTrailingSlashes(
          configuredApiUrl || "/api"
        )}/landowner/boarding-houses/${listingId}/photos`;

    if (!token) {
      setErrorMessage("Please sign in again before uploading photos.");
      return null;
    }

    if (
      typeof window !== "undefined" &&
      window.location.hostname.endsWith(".vercel.app") &&
      !configuredApiUrl.startsWith("http")
    ) {
      setErrorMessage(
        "Photo uploads require VITE_API_URL to point to the Railway backend in Vercel."
      );
      return null;
    }

    return {
      token,
      uploadOrigin,
      photosBaseUrl,
    };
  };

  const handleReplacePhoto = async (index, currentPhoto, file) => {
    const requestContext = getPhotoRequestContext();

    if (!requestContext) {
      if (fileInputRefs.current[index]) {
        fileInputRefs.current[index].value = "";
      }
      return;
    }

    const { token, uploadOrigin, photosBaseUrl } = requestContext;
    const formData = new FormData();
    formData.append("photo", file);

    try {
      setErrorMessage("");
      setIsUploading(true);
      setUploadProgress(0);

      const response = await axios.put(
        `${photosBaseUrl}/${currentPhoto.photo_id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          onUploadProgress: (progressEvent) => {
            if (!progressEvent.total) {
              setUploadProgress(0);
              return;
            }

            setUploadProgress(
              Math.min(
                100,
                Math.round((progressEvent.loaded / progressEvent.total) * 100)
              )
            );
          },
        }
      );

      const nextPhoto = response?.data?.photo;

      if (!nextPhoto?.photo_id || !nextPhoto?.photo_url) {
        throw new Error("Replace succeeded but no photo payload was returned.");
      }

      const nextPreviewUrl = uploadOrigin
        ? `${uploadOrigin}${nextPhoto.photo_url}`
        : `${imageBaseUrl}${nextPhoto.photo_url}`;

      setExistingPhotos((currentExistingPhotos) => {
        const nextExistingPhotos = [...currentExistingPhotos];
        nextExistingPhotos[index] = nextPhoto;
        return nextExistingPhotos;
      });
      setPreviews((currentPreviews) => {
        const nextPreviews = [...currentPreviews];
        nextPreviews[index] = nextPreviewUrl;
        return nextPreviews;
      });
      setPhotos((currentPhotos) => {
        const nextPhotos = [...currentPhotos];
        nextPhotos[index] = null;
        return nextPhotos;
      });
    } catch (error) {
      console.error("Replace photo error:", error);
      const nextError =
        (error.code === "ERR_NETWORK"
          ? "Upload failed before the server responded. Check the Railway API URL and allowed CORS origins."
          : "") ||
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Something went wrong while replacing the photo.";

      setErrorMessage(nextError);
    } finally {
      if (fileInputRefs.current[index]) {
        fileInputRefs.current[index].value = "";
      }

      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handlePhotoSelect = async (index, file) => {
    if (!file) {
      return;
    }

    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      setErrorMessage("Each photo must be 20 MB or smaller.");
      if (fileInputRefs.current[index]) {
        fileInputRefs.current[index].value = "";
      }
      return;
    }

    const currentPhoto = existingPhotos[index];

    if (
      routeBase === "/landowner/edit-room" &&
      currentPhoto?.photo_id
    ) {
      await handleReplacePhoto(index, currentPhoto, file);
      return;
    }

    const updatedPhotos = [...photos];
    const updatedPreviews = [...previews];

    setErrorMessage("");
    updatedPhotos[index] = file;
    updatedPreviews[index] = URL.createObjectURL(file);

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

  const handlePhotoUpload = async () => {
    try {
      if (!listingId.trim()) {
        setErrorMessage(
          "Missing propertyId in the route. Check the edit/add room URL."
        );
        return;
      }

      const validFiles = photos
        .map((file, index) => ({ file, index }))
        .filter(({ file }) => Boolean(file));

      if (validFiles.length < 1 && existingPhotosCount < 1) {
        setErrorMessage("Please upload at least 1 photo.");
        return;
      }

      setErrorMessage("");
      setIsUploading(true);
      setUploadProgress(0);

      if (validFiles.length > 0) {
        const requestContext = getPhotoRequestContext();

        if (!requestContext) {
          return;
        }

        const { token, uploadOrigin, photosBaseUrl: uploadUrl } = requestContext;

        const totalFiles = validFiles.length;
        let completedFiles = 0;

        for (const { file, index } of validFiles) {
          const formData = new FormData();
          formData.append("photos", file);

          const response = await axios.post(uploadUrl, formData, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            onUploadProgress: (progressEvent) => {
              if (!progressEvent.total) {
                setUploadProgress(
                  Math.round((completedFiles / totalFiles) * 100)
                );
                return;
              }

              const currentFileProgress =
                progressEvent.loaded / progressEvent.total;

              setUploadProgress(
                Math.min(
                  100,
                  Math.round(
                    ((completedFiles + currentFileProgress) / totalFiles) * 100
                  )
                )
              );
            },
          });

          const uploadedUrls = (response?.data?.photo_urls || []).map(
            (photoUrl) =>
              uploadOrigin
                ? `${uploadOrigin}${photoUrl}`
                : `${imageBaseUrl}${photoUrl}`
          );

          if (uploadedUrls.length < 1) {
            throw new Error("Upload succeeded but no photo URL was returned.");
          }

          setPreviews((currentPreviews) => {
            const nextPreviews = [...currentPreviews];
            nextPreviews[index] = uploadedUrls[0];
            return nextPreviews;
          });
          setExistingPhotosCount(
            (currentCount) => currentCount + uploadedUrls.length
          );
          setPhotos((currentPhotos) => {
            const nextPhotos = [...currentPhotos];
            nextPhotos[index] = null;
            return nextPhotos;
          });

          if (fileInputRefs.current[index]) {
            fileInputRefs.current[index].value = "";
          }

          photosSectionRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });

          completedFiles += 1;
          setUploadProgress(
            Math.min(100, Math.round((completedFiles / totalFiles) * 100))
          );
        }
      }

      navigate(`${routeBase}/set-pricing/${listingId}`, {
        state: { photoUploadCompleted: true },
      });
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

            <div ref={photosSectionRef} className="form-group">
              <label className="form-label">Property Photos *</label>

              <div className="upload-photo-grid">
                {[0, 1, 2, 3].map((index) => (
                  <label key={index} className="upload-photo-box">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden-file-input"
                      ref={(element) => {
                        fileInputRefs.current[index] = element;
                      }}
                      onChange={(e) => {
                        void handlePhotoSelect(
                          index,
                          e.target.files?.[0] || null
                        );
                      }}
                    />

                    {previews[index] ? (
                      <img
                        src={previews[index]}
                        alt={`Preview ${index + 1}`}
                        loading="eager"
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
                <div className="upload-count">
                  Upload progress: {uploadProgress}%
                </div>
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
                onClick={handlePhotoUpload}
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
