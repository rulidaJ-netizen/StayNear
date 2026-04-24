import { useMemo, useState } from "react";
import { Heart, MapPin, Phone, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";          // added
import StudentNavbar from "../components/StudentNavbar";
import { imageBaseUrl } from "../../../shared/api/client";
import { parseAmenities } from "../../../shared/utils/amenities";
import { recordStudentRoomView } from "../api/studentApi";
import { useStudentFavorites } from "../context/useStudentFavorites";
import "../styles/favorites.css";

const resolvePhotoUrl = (photoUrl) =>
  photoUrl
    ? `${imageBaseUrl}${photoUrl}`
    : "https://via.placeholder.com/700x420?text=StayNear+Property";

const resolveFavoriteImage = (item) =>
  item?.image_url || resolvePhotoUrl(item?.photo_url);

export default function Favorites() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const {
    favorites,
    favoritesCount,
    isLoading,
    isPending,
    toggleFavorite,
  } = useStudentFavorites();

  const filteredFavorites = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return favorites;
    return favorites.filter((item) => {
      const name = item.name?.toLowerCase() || "";
      const location = item.location?.toLowerCase() || "";
      const description = item.description?.toLowerCase() || "";
      const amenities = parseAmenities(item.amenities_list ?? item.amenities)
        .join(" ")
        .toLowerCase();
      return (
        name.includes(keyword) ||
        location.includes(keyword) ||
        description.includes(keyword) ||
        amenities.includes(keyword)
      );
    });
  }, [favorites, search]);

  const handleFavoriteToggle = async (item, e) => {
    e.stopPropagation();   // prevents card click
    const result = await toggleFavorite(item);
    if (!result.ok && result.message) alert(result.message);
  };

  const handleCardClick = (boardinghouseId) => {
    recordStudentRoomView(boardinghouseId).catch((error) => {
      console.error("Failed to record room view:", error);
    });
    navigate(`/room/${boardinghouseId}`);
  };

  return (
    <div className="favorites-page">
      <StudentNavbar favoritesCount={favoritesCount} />

      <main className="favorites-main">
        <section className="favorites-hero">
          <div>
            <h1 className="favorites-title">My Favorites</h1>
            <p className="favorites-subtitle">
              Save and manage your preferred boarding houses in one place.
            </p>
          </div>
          <div className="favorites-summary-card">
            <div className="favorites-summary-label">Saved Properties</div>
            <div className="favorites-summary-value">{favoritesCount}</div>
          </div>
        </section>

        <section className="favorites-toolbar">
          <div className="favorites-search-wrap">
            <Search size={18} className="favorites-search-icon" />
            <input
              type="text"
              className="favorites-search-input"
              placeholder="Search favorites by name, location, amenities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </section>

        {isLoading ? (
          <div className="favorites-empty-card">
            <div className="favorites-empty-title">Loading favorites...</div>
            <div className="favorites-empty-text">
              Please wait while we fetch your saved boarding houses.
            </div>
          </div>
        ) : filteredFavorites.length === 0 ? (
          <div className="favorites-empty-card">
            <Heart size={42} className="favorites-empty-icon" />
            <div className="favorites-empty-title">No favorites yet</div>
            <div className="favorites-empty-text">
              Start browsing boarding houses and save the ones you like most.
            </div>
          </div>
        ) : (
          <section className="favorites-grid">
            {filteredFavorites.map((item) => (
              <article
                className="favorite-card clickable"
                key={item.boardinghouse_id || item.favorite_id}
                onClick={() => handleCardClick(item.boardinghouse_id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleCardClick(item.boardinghouse_id);
                  }
                }}
              >
                <div className="favorite-card-image-wrap">
                  <img
                    src={resolveFavoriteImage(item)}
                    alt={item.name}
                    className="favorite-card-image"
                    loading="lazy"
                    decoding="async"
                    width="700"
                    height="420"
                  />
                  <button
                    type="button"
                    className="favorite-card-toggle"
                    onClick={(e) => handleFavoriteToggle(item, e)}
                    disabled={isPending(item.boardinghouse_id)}
                    aria-label="Remove from favorites"
                  >
                    <Heart size={18} fill="currentColor" />
                  </button>
                </div>

                <div className="favorite-card-content">
                  <div className="favorite-card-top">
                    <div>
                      <h3 className="favorite-card-title">{item.name}</h3>
                      <div className="favorite-card-location">
                        <MapPin size={15} />
                        <span>{item.location}</span>
                      </div>
                    </div>
                    <span
                      className={`favorite-status ${
                        item.availability_status?.toLowerCase() === "available"
                          ? "available"
                          : "unavailable"
                      }`}
                    >
                      {item.availability_status || "Unknown"}
                    </span>
                  </div>

                  <p className="favorite-card-description">
                    {item.description || "No description available."}
                  </p>

                  <div className="favorite-card-meta">
                    <div className="favorite-meta-item">
                      <Phone size={15} />
                      <span>{item.contact_number || "No contact number"}</span>
                    </div>
                    <div className="favorite-meta-item">
                      <span className="favorite-meta-label">Distance:</span>
                      <span>{item.distance_from_university || "N/A"}</span>
                    </div>
                  </div>

                  <div className="favorite-card-amenities">
                    {(parseAmenities(item.amenities_list ?? item.amenities).length
                      ? parseAmenities(item.amenities_list ?? item.amenities)
                      : ["No amenities listed"]
                    )
                      .slice(0, 4)
                      .map((amenity, index) => (
                        <span className="favorite-chip" key={index}>
                          {amenity}
                        </span>
                      ))}
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
