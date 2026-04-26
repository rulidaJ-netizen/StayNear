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
