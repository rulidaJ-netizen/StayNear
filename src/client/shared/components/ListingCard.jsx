import { Heart, MapPin, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { imageBaseUrl } from "../api/client";
import { parseAmenities } from "../utils/amenities";

export default function ListingCard({
  listing,
  isFavorite = false,
  onToggleFavorite,
  onToggleAvailability,
  onDelete,
  showOwnerActions = false,
}) {
  const navigate = useNavigate();

  const amenities = parseAmenities(listing.amenities_list ?? listing.amenities);

  const price = listing.starting_price ?? listing.min_price ?? 0;
  const availableRooms = Number(listing.available_rooms || 0);
  const totalRooms = Number(listing.total_rooms || 0);
  const isAvailable = listing.availability_status === "available";

  return (
    <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
      <div className="relative h-64 bg-gray-200">
        <img
          src={
            listing.photo_url
              ? `${imageBaseUrl}${listing.photo_url}`
              : "https://via.placeholder.com/600x400?text=No+Image"
          }
          alt={listing.name}
          className="w-full h-full object-cover"
        />

        {!showOwnerActions && (
          <button
            type="button"
            onClick={() => onToggleFavorite?.(listing.boardinghouse_id)}
            className="absolute top-4 left-4 bg-white w-14 h-14 rounded-full grid place-items-center shadow"
          >
            <Heart
              className={isFavorite ? "text-red-500 fill-red-500" : "text-gray-600"}
            />
          </button>
        )}

        <div
          className={`absolute top-4 right-4 text-white px-5 py-2 rounded-full font-semibold ${
            isAvailable ? "bg-emerald-500" : "bg-gray-500"
          }`}
        >
          {availableRooms} Available
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900">
              {listing.name}
            </h3>

            <div className="flex items-center gap-2 text-gray-500 mt-3">
              <MapPin size={18} />
              <span>{listing.distance_from_university || listing.location}</span>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-3xl font-bold text-blue-500">
              PHP {Number(price).toLocaleString()}
            </div>
            <div className="text-gray-500">/mo</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {amenities.slice(0, 2).map((amenity) => (
            <span
              key={amenity}
              className="bg-gray-100 px-4 py-2 rounded-full text-gray-700"
            >
              {amenity}
            </span>
          ))}
        </div>

        {showOwnerActions && (
          <>
            <div className="mt-4 text-gray-600 font-medium">
              {availableRooms} / {totalRooms} available
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                className={`px-4 py-2 rounded-full font-medium border transition ${
                  isAvailable
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "bg-gray-500 text-white border-gray-500"
                }`}
                onClick={() =>
                  onToggleAvailability?.(
                    listing.boardinghouse_id,
                    listing.availability_status
                  )
                }
              >
                {isAvailable ? "Available" : "Unavailable"}
              </button>

              <button
                type="button"
                className="px-4 py-2 rounded-full border border-blue-500 text-blue-500 font-medium flex items-center gap-2 hover:bg-blue-50 transition"
                onClick={() =>
                  navigate(`/landowner/edit-room/${listing.boardinghouse_id}`)
                }
              >
                <Pencil size={15} />
                Edit
              </button>

              <button
                type="button"
                className="px-4 py-2 rounded-full border border-red-500 text-red-500 font-medium flex items-center gap-2 hover:bg-red-50 transition"
                onClick={() => onDelete?.(listing.boardinghouse_id)}
              >
                <Trash2 size={15} />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
