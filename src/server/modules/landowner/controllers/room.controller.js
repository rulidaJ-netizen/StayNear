import { db } from "../../../shared/db.js";

export const createRoom = (req, res) => {
  const { propertyName, description, contactNumber } = req.body;

  if (!propertyName || !description || !contactNumber) {
    return res.status(400).json({
      message: "Property name, description, and contact number are required.",
    });
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