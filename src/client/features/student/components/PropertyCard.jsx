import { Heart, MapPin } from "lucide-react";

export default function PropertyCard({
  property,
  isFavorite = false,
  onFavoriteToggle,
  onView,
  disabled = false,
}) {
  const handleView = () => {
    onView?.(property.id ?? property.boardinghouse_id);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleView();
    }
  };

  return (
    <div
      className={`property-card ${onView ? "clickable" : ""}`}
      onClick={onView ? handleView : undefined}
      onKeyDown={onView ? handleKeyDown : undefined}
      role={onView ? "button" : undefined}
      tabIndex={onView ? 0 : undefined}
    >
      <div className="property-image-wrap">
        <img
          src={property.image}
          alt={property.title}
          className="property-image"
        />

        <button
          className={`favorite-btn ${isFavorite ? "favorited" : ""}`}
          onClick={(event) => {
            event.stopPropagation();
            onFavoriteToggle?.(property);
          }}
          type="button"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          disabled={disabled}
        >
          <Heart
            size={18}
            className={isFavorite ? "text-red-500" : undefined}
            fill={isFavorite ? "currentColor" : "none"}
          />
        </button>

        <div className="availability-badge">
          {property.available} Available
        </div>
      </div>

      <div className="property-body">
        <h3>{property.title}</h3>

        <div className="property-location">
          <MapPin size={14} />
          <span>{property.location}</span>
        </div>

        <div className="property-price">
          PHP {Number(property.price || 0).toLocaleString()}
          <span>/mo</span>
        </div>

        <div className="property-tags">
          {property.wifi && <span className="tag">WiFi</span>}
          {property.kitchen && <span className="tag">Shared Kitchen</span>}
        </div>
      </div>
    </div>
  );
}
