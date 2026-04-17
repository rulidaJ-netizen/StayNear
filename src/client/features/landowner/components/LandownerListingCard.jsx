import { Eye, MapPin, Pencil, Trash2 } from "lucide-react";
import { imageBaseUrl } from "../../../shared/api/client";
import styles from "./LandownerListingCard.module.css";

export default function LandownerListingCard({
  listing,
  onToggleAvailability,
  onView,
  onEdit,
  onDelete,
}) {
  const isAvailable = listing.availability_status === "available";
  const viewCount = Number(
    listing.view_count ?? listing.total_views ?? listing.views ?? 0
  );

  const imageSrc = listing.photo_url
    ? `${imageBaseUrl}${listing.photo_url}`
    : "https://via.placeholder.com/600x400?text=No+Image";

  const handleView = () => {
    onView?.(listing.boardinghouse_id);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleView();
    }
  };

  const stopPropagation = (event) => {
    event.stopPropagation();
  };

  return (
    <div
      className={`${styles.card} ${onView ? styles.cardInteractive : ""}`}
      onClick={onView ? handleView : undefined}
      onKeyDown={onView ? handleKeyDown : undefined}
      role={onView ? "button" : undefined}
      tabIndex={onView ? 0 : undefined}
    >
      <div className={styles.imageWrap}>
        <img src={imageSrc} alt={listing.name} className={styles.image} />
      </div>

      <div className={styles.content}>
        <div className={styles.topRow}>
          <div className={styles.titleWrap}>
            <h3>{listing.name}</h3>
            <p className={styles.location}>
              <MapPin size={16} />
              <span>{listing.location}</span>
            </p>
          </div>

          <div className={styles.price}>
            PHP {Number(listing.starting_price || listing.min_price || 0).toLocaleString()}
          </div>
        </div>

        <div className={styles.metaRow}>
          <span className={styles.meta}>
            <Eye size={16} />
            {viewCount} views
          </span>

          <span className={styles.rooms}>
            {Number(listing.available_rooms || 0)} /{" "}
            {Number(listing.total_rooms || 0)} available
          </span>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.statusBtn} ${isAvailable ? styles.on : styles.off}`}
            onClick={(event) => {
              stopPropagation(event);
              onToggleAvailability?.(
                listing.boardinghouse_id,
                listing.availability_status
              );
            }}
          >
            <span className={styles.dot} />
            {isAvailable ? "Available" : "Unavailable"}
          </button>

          <button
            type="button"
            className={styles.editBtn}
            onClick={(event) => {
              stopPropagation(event);
              onEdit?.(listing.boardinghouse_id);
            }}
          >
            <Pencil size={16} />
            Edit
          </button>

          <button
            type="button"
            className={styles.deleteBtn}
            onClick={(event) => {
              stopPropagation(event);
              onDelete?.(listing.boardinghouse_id);
            }}
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
