import { useEffect, useState } from "react";
import { Heart, MapPin } from "lucide-react";
import FeedbackToast from "../../../shared/components/FeedbackToast";
import { imageBaseUrl } from "../../../shared/api/client";
import { getStoredUser } from "../../auth/api/authApi";
import { useAuthSession } from "../../auth/context/useAuthSession";
import LandownerNavbar from "../components/LandownerNavbar";
import { getLandownerFavoritesOverview } from "../api/landownerApi";
import "../styles/landowner-profile.css";

const PLACEHOLDER_IMAGE =
  "https://via.placeholder.com/700x420?text=StayNear+Property";

export default function LandownerFavorites() {
  const fallbackUser = getStoredUser();
  const { user, patchUser } = useAuthSession();
  const sessionUser = user || fallbackUser;
  const landownerId = sessionUser?.landowner_id;

  const [summary, setSummary] = useState({
    total_favorites: Number(sessionUser?.favorites_count || 0),
    listings: [],
  });
  const [isLoading, setIsLoading] = useState(true);
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
    const loadFavorites = async () => {
      if (!landownerId) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await getLandownerFavoritesOverview(landownerId);
        setSummary(data);
        patchUser({
          favorites_count: data.total_favorites,
        });
      } catch (error) {
        console.error("Load landowner favorites overview error:", error);
        setToast({
          type: "error",
          message:
            error.response?.data?.message || "Failed to load favorite activity.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadFavorites();
  }, [landownerId, patchUser]);

  return (
    <div className="landowner-favorites-page">
      <FeedbackToast type={toast.type} message={toast.message} />

      <LandownerNavbar
        favoritesCount={summary.total_favorites}
        showLogout={false}
      />

      <main className="landowner-profile-main">
        <section className="landowner-favorites-hero">
          <div>
            <h1 className="landowner-favorites-title">Favorites</h1>
            <p className="landowner-favorites-subtitle">
              See how many students have saved each of your listings.
            </p>
          </div>

          <div className="landowner-favorites-summary-card">
            <div className="landowner-favorites-summary-label">
              Total Favorites
            </div>
            <div className="landowner-favorites-summary-value">
              {summary.total_favorites}
            </div>
          </div>
        </section>

        {isLoading ? (
          <div className="landowner-empty-card">
            <h2>Loading favorites...</h2>
            <p>Please wait while we fetch your favorite activity.</p>
          </div>
        ) : summary.listings.length === 0 ? (
          <div className="landowner-empty-card">
            <h2>No favorite activity yet</h2>
            <p>
              Once students start saving your properties, they will appear here.
            </p>
          </div>
        ) : (
          <section className="landowner-favorites-grid">
            {summary.listings.map((listing) => (
              <article
                className="landowner-favorite-card"
                key={listing.boardinghouse_id}
              >
                <div className="landowner-favorite-image-wrap">
                  <img
                    src={
                      listing.photo_url
                        ? `${imageBaseUrl}${listing.photo_url}`
                        : PLACEHOLDER_IMAGE
                    }
                    alt={listing.name}
                    className="landowner-favorite-image"
                    loading="lazy"
                    decoding="async"
                    width="700"
                    height="420"
                  />

                  <div className="landowner-favorite-badge">
                    <Heart size={14} />
                    <span>{listing.favorite_count}</span>
                  </div>
                </div>

                <div className="landowner-favorite-content">
                  <div className="landowner-favorite-title-row">
                    <div>
                      <h2 className="landowner-favorite-title">{listing.name}</h2>
                      <div className="landowner-favorite-location">
                        <MapPin size={15} />
                        <span>{listing.location}</span>
                      </div>
                    </div>

                    <span
                      className={`landowner-favorite-status ${
                        listing.availability_status === "available"
                          ? "available"
                          : "unavailable"
                      }`}
                    >
                      {listing.availability_status}
                    </span>
                  </div>

                  <p className="landowner-favorite-copy">
                    Saved by {listing.favorite_count} student
                    {listing.favorite_count === 1 ? "" : "s"}.
                  </p>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
