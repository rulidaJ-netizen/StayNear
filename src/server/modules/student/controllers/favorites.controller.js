import { db } from "../../../shared/db.js";
import { mapAvailabilityFields } from "../../../shared/utils/listingUtils.js";

export const getFavorites = (req, res) => {
  const { student_id } = req.params;

  if (!student_id) {
    return res.status(400).json({ message: "student_id is required" });
  }

  const query = `
    SELECT
      f.favorite_id,
      f.student_id,
      f.boardinghouse_id,
      f.created_at,
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
        FROM boardinghouse_photos bp
        WHERE bp.boardinghouse_id = b.boardinghouse_id
        ORDER BY bp.photo_id ASC
        LIMIT 1
      ) AS photo_url,
      MIN(r.price) AS min_price,
      COUNT(r.room_id) AS total_rooms,
      SUM(CASE WHEN r.availability_status = 'AVAILABLE' THEN 1 ELSE 0 END) AS available_rooms
    FROM favorites f
    INNER JOIN boarding_house b
      ON f.boardinghouse_id = b.boardinghouse_id
    LEFT JOIN rooms r
      ON b.boardinghouse_id = r.boardinghouse_id
    WHERE f.student_id = ?
    GROUP BY
      f.favorite_id,
      f.student_id,
      f.boardinghouse_id,
      f.created_at,
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
    ORDER BY f.created_at DESC
  `;

  db.query(query, [student_id], (error, results) => {
    if (error) {
      console.error("Get favorites error:", error);
      return res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }

    return res.status(200).json({
      message: "Favorites fetched successfully",
      favorites: results.map(mapAvailabilityFields),
    });
  });
};

export const addFavorite = (req, res) => {
  const { student_id, boardinghouse_id } = req.body;

  if (!student_id || !boardinghouse_id) {
    return res.status(400).json({
      message: "student_id and boardinghouse_id are required",
    });
  }

  const checkQuery = `
    SELECT favorite_id
    FROM favorites
    WHERE student_id = ? AND boardinghouse_id = ?
  `;

  db.query(
    checkQuery,
    [student_id, boardinghouse_id],
    (checkError, checkResults) => {
      if (checkError) {
        console.error("Check favorite error:", checkError);
        return res.status(500).json({
          message: "Server error",
          error: checkError.message,
        });
      }

      if (checkResults.length > 0) {
        return res.status(409).json({ message: "Already in favorites" });
      }

      const insertQuery = `
        INSERT INTO favorites (student_id, boardinghouse_id, created_at)
        VALUES (?, ?, NOW())
      `;

      db.query(
        insertQuery,
        [student_id, boardinghouse_id],
        (insertError, result) => {
          if (insertError) {
            console.error("Add favorite error:", insertError);
            return res.status(500).json({
              message: "Server error",
              error: insertError.message,
            });
          }

          return res.status(201).json({
            message: "Added to favorites",
            favorite_id: result.insertId,
          });
        }
      );
    }
  );
};

export const removeFavorite = (req, res) => {
  const { student_id, boardinghouse_id } = req.params;

  if (!student_id || !boardinghouse_id) {
    return res.status(400).json({
      message: "student_id and boardinghouse_id are required",
    });
  }

  db.query(
    `
      DELETE FROM favorites
      WHERE student_id = ? AND boardinghouse_id = ?
    `,
    [student_id, boardinghouse_id],
    (error, result) => {
      if (error) {
        console.error("Remove favorite error:", error);
        return res.status(500).json({
          message: "Server error",
          error: error.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Favorite not found" });
      }

      return res.status(200).json({ message: "Favorite removed successfully" });
    }
  );
};
