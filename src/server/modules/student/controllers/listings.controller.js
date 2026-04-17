import { db } from "../../../shared/db.js";
import {
  mapAvailabilityFields,
  parseAmenityFilters,
  toDbAvailabilityStatus,
} from "../../../shared/utils/listingUtils.js";

export const getPublicListings = (req, res) => {
  const q = req.query.q || "";
  const amenityFilters = parseAmenityFilters(req.query.amenity);
  const availabilityStatus =
    toDbAvailabilityStatus(req.query.availability) || "AVAILABLE";

  let sql = `
    SELECT
      b.boardinghouse_id,
      b.name,
      b.location,
      b.availability_status,
      b.amenities,
      b.description,
      b.contact_number,
      b.distance_fron_university AS distance_from_university,
      b.reference_map,
      b.view_count,
      (
        SELECT photo_url
        FROM boardinghouse_photos p
        WHERE p.boardinghouse_id = b.boardinghouse_id
        ORDER BY p.photo_id ASC
        LIMIT 1
      ) AS photo_url,
      MIN(r.price) AS min_price,
      COUNT(r.room_id) AS total_rooms,
      SUM(CASE WHEN r.availability_status = 'AVAILABLE' THEN 1 ELSE 0 END) AS available_rooms
    FROM boarding_house b
    LEFT JOIN rooms r ON b.boardinghouse_id = r.boardinghouse_id
    WHERE (b.name LIKE ? OR b.location LIKE ? OR b.amenities LIKE ?)
      AND b.availability_status = ?
  `;

  const params = [`%${q}%`, `%${q}%`, `%${q}%`, availabilityStatus];

  amenityFilters.forEach((filter) => {
    sql += " AND b.amenities LIKE ?";
    params.push(`%${filter}%`);
  });

  sql += `
    GROUP BY
      b.boardinghouse_id,
      b.name,
      b.location,
      b.availability_status,
      b.amenities,
      b.description,
      b.contact_number,
      b.distance_fron_university,
      b.reference_map,
      b.view_count
    ORDER BY b.boardinghouse_id DESC
  `;

  db.query(sql, params, (error, data) => {
    if (error) {
      console.error("Fetch public listings error:", error);
      return res.status(500).json({ message: "Failed to fetch listings" });
    }

    return res.json(data.map(mapAvailabilityFields));
  });
};

export const getPublicListingById = (req, res) => {
  const { id } = req.params;

  const listingSql = `
    SELECT
      b.boardinghouse_id,
      b.name,
      b.location,
      b.description,
      b.availability_status,
      b.amenities,
      b.contact_number,
      b.distance_fron_university AS distance_from_university,
      b.reference_map,
      b.view_count,
      MIN(r.price) AS monthly_rent,
      COUNT(r.room_id) AS total_rooms,
      SUM(CASE WHEN r.availability_status = 'AVAILABLE' THEN 1 ELSE 0 END) AS available_rooms,
      MAX(r.capacity) AS capacity,
      MAX(r.room_type) AS room_type
    FROM boarding_house b
    LEFT JOIN rooms r ON b.boardinghouse_id = r.boardinghouse_id
    WHERE b.boardinghouse_id = ?
    GROUP BY
      b.boardinghouse_id,
      b.name,
      b.location,
      b.description,
      b.availability_status,
      b.amenities,
      b.contact_number,
      b.distance_fron_university,
      b.reference_map,
      b.view_count
  `;

  db.query(listingSql, [id], (listingError, data) => {
    if (listingError) {
      console.error("Fetch public listing error:", listingError);
      return res.status(500).json({ message: "Failed to fetch listing" });
    }

    if (data.length === 0) {
      return res.status(404).json({ message: "Listing not found" });
    }

    db.query(
      `
        SELECT photo_id, boardinghouse_id, photo_url, created_at
        FROM boardinghouse_photos
        WHERE boardinghouse_id = ?
        ORDER BY photo_id ASC
      `,
      [id],
      (photoError, photos) => {
        if (photoError) {
          console.error("Fetch public listing photos error:", photoError);
          return res.status(500).json({ message: "Failed to fetch photos" });
        }

        const listing = mapAvailabilityFields(data[0]);

        return res.json({
          ...listing,
          photos,
        });
      }
    );
  });
};
