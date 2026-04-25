import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, MapPin, Navigation, Phone } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getStoredUser } from "../../features/auth/api/authApi";
import { getLandownerListing } from "../../features/landowner/api/landownerApi";
import {
  getStudentListingById,
  recordStudentRoomView,
} from "../../features/student/api/studentApi";
import { imageBaseUrl } from "../api/client";
import { parseAmenities } from "../utils/amenities";
import { normalizeReferenceMapField } from "../utils/inputValidation";
import styles from "./RoomDetail.module.css";

const FALLBACK_IMAGE =
  "https://via.placeholder.com/1200x760?text=StayNear+Property";

const normalizePhotoUrl = (value) => {
  if (!value) {
    return FALLBACK_IMAGE;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `${imageBaseUrl}${value}`;
};

const normalizeListing = (data) => {
  const amenities = parseAmenities(data?.amenities_list ?? data?.amenities);
  const photos =
    Array.isArray(data?.photos) && data.photos.length > 0
      ? data.photos.map((photo, index) => ({
          id: photo.photo_id ?? photo.id ?? index,
          src: normalizePhotoUrl(photo.photo_url ?? photo.url),
        }))
      : [
          {
            id: "fallback",
            src: normalizePhotoUrl(data?.photo_url),
          },
        ];

  return {
    id: data?.boardinghouse_id ?? data?.id ?? "",
    name: data?.name ?? data?.property_name ?? "Property Details",
    description: data?.description ?? "No description available.",
    contactNumber: data?.contact_number ?? data?.contactNumber ?? "Not provided",
    viewCount: Number(data?.view_count ?? data?.viewCount ?? 0),
    location: data?.location ?? "",
    price: Number(data?.monthly_rent ?? data?.min_price ?? 0),
    availabilityStatus: String(data?.availability_status ?? "unavailable"),
    availableRooms: Number(data?.available_rooms ?? 0),
    totalRooms: Number(data?.total_rooms ?? 0),
    amenities,
    photos,
    distanceFromUniversity: data?.distance_from_university ?? "",
    referenceMap: data?.reference_map ?? "",
    roomType: data?.room_type ?? "",
    capacity: data?.capacity ?? "",
  };
};

export default function RoomDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const user = getStoredUser();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadListing = async () => {
      if (!id?.trim()) {
        setErrorMessage("Missing room id in the URL.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");

        const data =
          user?.account_type === "landowner"
            ? await getLandownerListing(id)
            : await getStudentListingById(id);

        setListing(normalizeListing(data));

        if (user?.account_type === "student") {
          recordStudentRoomView(id)
            .then((response) => {
              if (typeof response?.view_count === "number") {
                setListing((currentListing) =>
                  currentListing
                    ? {
                        ...currentListing,
                        viewCount: Number(response.view_count),
                      }
                    : currentListing
                );
              }
            })
            .catch((error) => {
              console.error("Failed to record room view:", error);
            });
        }
      } catch (error) {
        console.error("Load room detail error:", error);
        setErrorMessage(
          error.response?.data?.message || "Failed to load room details."
        );
      } finally {
        setLoading(false);
      }
    };

    loadListing();
  }, [id, user?.account_type]);

  const mapUrl = useMemo(() => {
    const referenceMap = String(listing?.referenceMap || "").trim();

    if (referenceMap) {
      try {
        return normalizeReferenceMapField(referenceMap);
      } catch (error) {
        console.error("Invalid saved reference map URL:", error);
      }
    }

    const query = listing?.location?.trim();

    if (!query) {
      return "";
    }

    return `https://maps.google.com/?q=${encodeURIComponent(query)}`;
  }, [listing?.location, listing?.referenceMap]);

  const isFromFavorites =
    user?.account_type === "student" && location.state?.from === "favorites";
  const backLabel = isFromFavorites
    ? "Back to Favorites"
    : "Back to dashboard";

  const handleBack = () => {
    if (user?.account_type === "landowner") {
      navigate("/landowner/dashboard");
      return;
    }

    if (isFromFavorites) {
      navigate("/student/favorites");
      return;
    }

    navigate("/student/dashboard");
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.card}>
            <p className={styles.statusText}>Loading room details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.card}>
            <button
              type="button"
              className={styles.backButton}
              onClick={handleBack}
            >
              <ArrowLeft size={18} />
              <span>{isFromFavorites ? "Back to Favorites" : "Back"}</span>
            </button>

            <p className={styles.errorText}>
              {errorMessage || "Room details could not be loaded."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isAvailable = listing.availabilityStatus === "available";

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <button
          type="button"
          className={styles.backButton}
          onClick={handleBack}
        >
          <ArrowLeft size={18} />
          <span>{backLabel}</span>
        </button>

        <section className={styles.card}>
          <div className={styles.hero}>
            <img
              src={listing.photos[0]?.src || FALLBACK_IMAGE}
              alt={listing.name}
              className={styles.heroImage}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              width="1200"
              height="760"
            />

            <div className={styles.heroContent}>
              <div className={styles.headingRow}>
                <div>
                  <h1 className={styles.title}>{listing.name}</h1>
                  <div className={styles.locationRow}>
                    <MapPin size={16} />
                    <span>{listing.location || "Location not provided"}</span>
                  </div>
                </div>

                <div
                  className={`${styles.availabilityBadge} ${
                    isAvailable ? styles.available : styles.unavailable
                  }`}
                >
                  {isAvailable
                    ? `${listing.availableRooms} of ${listing.totalRooms} rooms available`
                    : "Currently unavailable"}
                </div>
              </div>

              <div className={styles.priceRow}>
                PHP {listing.price.toLocaleString()}
                <span>/ month</span>
              </div>

              <div className={styles.metaGrid}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Contact</span>
                  <span className={styles.metaValue}>
                    <Phone size={15} />
                    {listing.contactNumber}
                  </span>
                </div>

                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Room Type</span>
                  <span className={styles.metaValue}>
                    {listing.roomType || "Standard Room"}
                  </span>
                </div>

                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Capacity</span>
                  <span className={styles.metaValue}>
                    {listing.capacity ? `${listing.capacity} person(s)` : "Not specified"}
                  </span>
                </div>

                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Distance</span>
                  <span className={styles.metaValue}>
                    {listing.distanceFromUniversity || "Not provided"}
                  </span>
                </div>

                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Views</span>
                  <span className={styles.metaValue}>
                    {listing.viewCount.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className={styles.actionRow}>
                <button
                  type="button"
                  className={styles.mapButton}
                  onClick={() => window.open(mapUrl, "_blank", "noopener,noreferrer")}
                  disabled={!mapUrl}
                >
                  <Navigation size={16} />
                  <span>Open in Google Maps</span>
                </button>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Description</h2>
            <p className={styles.description}>{listing.description}</p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Amenities</h2>
            <div className={styles.amenities}>
              {listing.amenities.length > 0 ? (
                listing.amenities.map((amenity) => (
                  <span key={amenity} className={styles.amenityChip}>
                    {amenity}
                  </span>
                ))
              ) : (
                <p className={styles.emptyText}>No amenities listed.</p>
              )}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Photos</h2>
            <div className={styles.photoGrid}>
              {listing.photos.map((photo) => (
                <img
                  key={photo.id}
                  src={photo.src}
                  alt={listing.name}
                  className={styles.photo}
                  loading="lazy"
                  decoding="async"
                  width="800"
                  height="600"
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
