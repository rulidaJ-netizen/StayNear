import { db } from "../../../shared/db.js";
import { toUploadsUrl } from "../../../shared/config/runtimePaths.js";
import {
  hasValidationErrors,
  sendValidationError,
} from "../../../shared/validation/inputValidation.js";
import { validateRoomBasicsPayload } from "../../../shared/validation/listingValidation.js";

export const createBoardingHouseDraft = (req, res) => {
  const { landowner_id, name, description, contact_number } = req.body;

  if (!landowner_id) {
    return res.status(400).json({ message: "landowner_id is required" });
  }

  const validationErrors = validateRoomBasicsPayload({
    propertyName: name,
    description,
    contactNumber: contact_number,
  });

  if (hasValidationErrors(validationErrors)) {
    return sendValidationError(
      res,
      validationErrors,
      "Please correct the invalid listing fields."
    );
  }

  db.query(
    `
      INSERT INTO boarding_house
      (
        name,
        location,
        availability_status,
        amenities,
        landowner_id,
        description,
        contact_number,
        distance_fron_university,
        reference_map,
        view_count
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      name,
      "",
      "INACTIVE",
      "[]",
      landowner_id,
      description,
      contact_number,
      "",
      "",
      0,
    ],
    (error, result) => {
      if (error) {
        console.error("Create boarding house draft error:", error);
        return res.status(500).json({
          message: "Server error",
          error: error.message,
        });
      }

      return res.status(201).json({
        message: "Draft created successfully",
        boardinghouse_id: result.insertId,
      });
    }
  );
};

export const uploadBoardingHousePhotos = (req, res) => {
  const { id } = req.params;
  const files = req.files || [];

  if (!id) {
    return res.status(400).json({ message: "Boarding house id is required" });
  }

  if (!files.length) {
    return res.status(400).json({ message: "Please upload at least one photo" });
  }

  const uploadedPhotos = files.map((file) => ({
    boardinghouse_id: Number(id),
    photo_url: toUploadsUrl("boardinghouses", file.filename),
    created_at: new Date(),
  }));
  const values = uploadedPhotos.map((photo) => [
    photo.boardinghouse_id,
    photo.photo_url,
    photo.created_at,
  ]);

  db.query(
    `
      INSERT INTO boardinghouse_photos (boardinghouse_id, photo_url, created_at)
      VALUES ?
    `,
    [values],
    (error) => {
      if (error) {
        console.error("Upload boarding house photos error:", error);
        return res.status(500).json({
          message: "Server error",
          error: error.message,
        });
      }

      return res.status(201).json({
        message: "Photos uploaded successfully",
        uploaded_count: uploadedPhotos.length,
        photo_urls: uploadedPhotos.map((photo) => photo.photo_url),
        photos: uploadedPhotos,
      });
    }
  );
};

export const replaceBoardingHousePhoto = (req, res) => {
  const { boardingHouseId, photoId } = req.params;
  const landownerId = Number(req.user?.landowner_id || 0);
  const file = req.file;

  if (!boardingHouseId) {
    return res.status(400).json({ message: "Boarding house id is required" });
  }

  if (!photoId) {
    return res.status(400).json({ message: "Photo id is required" });
  }

  if (!landownerId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!file) {
    return res.status(400).json({ message: "Please upload a photo" });
  }

  const normalizedBoardingHouseId = Number(boardingHouseId);
  const normalizedPhotoId = Number(photoId);
  const createdAt = new Date();
  const nextPhotoUrl = toUploadsUrl("boardinghouses", file.filename);

  if (
    !Number.isInteger(normalizedBoardingHouseId) ||
    normalizedBoardingHouseId <= 0
  ) {
    return res.status(400).json({ message: "Invalid boarding house id" });
  }

  if (!Number.isInteger(normalizedPhotoId) || normalizedPhotoId <= 0) {
    return res.status(400).json({ message: "Invalid photo id" });
  }

  db.beginTransaction((transactionError) => {
    if (transactionError) {
      console.error("Replace boarding house photo transaction error:", transactionError);
      return res.status(500).json({
        message: "Server error",
        error: transactionError.message,
      });
    }

    db.query(
      `
        SELECT p.photo_id, p.boardinghouse_id
        FROM boardinghouse_photos p
        INNER JOIN boarding_house b
          ON b.boardinghouse_id = p.boardinghouse_id
        WHERE p.photo_id = ? AND p.boardinghouse_id = ? AND b.landowner_id = ?
        LIMIT 1
      `,
      [normalizedPhotoId, normalizedBoardingHouseId, landownerId],
      (lookupError, rows) => {
        if (lookupError) {
          console.error("Validate boarding house photo replace error:", lookupError);
          return db.rollback(() =>
            res.status(500).json({
              message: "Server error",
              error: lookupError.message,
            })
          );
        }

        if (!rows.length) {
          return db.rollback(() =>
            res.status(404).json({ message: "Photo not found" })
          );
        }

        db.query(
          `
            DELETE FROM boardinghouse_photos
            WHERE photo_id = ? AND boardinghouse_id = ?
          `,
          [normalizedPhotoId, normalizedBoardingHouseId],
          (deleteError) => {
            if (deleteError) {
              console.error("Delete old boarding house photo error:", deleteError);
              return db.rollback(() =>
                res.status(500).json({
                  message: "Server error",
                  error: deleteError.message,
                })
              );
            }

            db.query(
              `
                INSERT INTO boardinghouse_photos (boardinghouse_id, photo_url, created_at)
                VALUES (?, ?, ?)
              `,
              [normalizedBoardingHouseId, nextPhotoUrl, createdAt],
              (insertError, result) => {
                if (insertError) {
                  console.error("Insert replacement boarding house photo error:", insertError);
                  return db.rollback(() =>
                    res.status(500).json({
                      message: "Server error",
                      error: insertError.message,
                    })
                  );
                }

                db.commit((commitError) => {
                  if (commitError) {
                    console.error("Commit replacement boarding house photo error:", commitError);
                    return db.rollback(() =>
                      res.status(500).json({
                        message: "Server error",
                        error: commitError.message,
                      })
                    );
                  }

                  return res.json({
                    message: "Photo replaced successfully",
                    photo: {
                      photo_id: result.insertId,
                      boardinghouse_id: normalizedBoardingHouseId,
                      photo_url: nextPhotoUrl,
                      created_at: createdAt,
                    },
                  });
                });
              }
            );
          }
        );
      }
    );
  });
};

export const deleteBoardingHousePhotos = (req, res) => {
  const { id } = req.params;
  const landownerId = Number(req.user?.landowner_id || 0);

  if (!id) {
    return res.status(400).json({ message: "Boarding house id is required" });
  }

  if (!landownerId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  db.query(
    `
      SELECT boardinghouse_id
      FROM boarding_house
      WHERE boardinghouse_id = ? AND landowner_id = ?
      LIMIT 1
    `,
    [id, landownerId],
    (lookupError, rows) => {
      if (lookupError) {
        console.error("Validate boarding house photo delete error:", lookupError);
        return res.status(500).json({
          message: "Server error",
          error: lookupError.message,
        });
      }

      if (!rows.length) {
        return res.status(404).json({ message: "Boarding house not found" });
      }

      db.query(
        "DELETE FROM boardinghouse_photos WHERE boardinghouse_id = ?",
        [id],
        (deleteError, result) => {
          if (deleteError) {
            console.error("Delete boarding house photos error:", deleteError);
            return res.status(500).json({
              message: "Server error",
              error: deleteError.message,
            });
          }

          return res.json({
            message: "Photos deleted successfully",
            deleted_count: result?.affectedRows || 0,
          });
        }
      );
    }
  );
};
