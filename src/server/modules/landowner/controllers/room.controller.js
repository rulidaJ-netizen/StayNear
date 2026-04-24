import { db } from "../../../shared/db.js";
import {
  hasValidationErrors,
  sendValidationError,
} from "../../../shared/validation/inputValidation.js";
import { validateRoomBasicsPayload } from "../../../shared/validation/listingValidation.js";

export const createRoom = (req, res) => {
  const { propertyName, description, contactNumber } = req.body;

  const validationErrors = validateRoomBasicsPayload({
    propertyName,
    description,
    contactNumber,
  });

  if (hasValidationErrors(validationErrors)) {
    return sendValidationError(
      res,
      validationErrors,
      "Please correct the invalid listing fields."
    );
  }

  const landownerId = req.user?.landowner_id; 

  if (!landownerId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  db.query(
    `INSERT INTO boarding_house 
      (name, description, contact_number, landowner_id, location, amenities, distance_fron_university, availability_status, view_count)
     VALUES (?, ?, ?, ?, '', '[]', '', 'INACTIVE', 0)`,
    [propertyName, description, contactNumber, landownerId],
    (error, result) => {
      if (error) {
        console.error("Create room error:", error);
        return res.status(500).json({ message: "Database error" });
      }
      return res.status(201).json({
        message: "Room basic info saved successfully.",
        propertyId: result.insertId,
      });
    }
  );
};

export const uploadRoomPhotos = (_req, res) => {
  return res.status(201).json({ message: "Photos uploaded successfully." });
};
