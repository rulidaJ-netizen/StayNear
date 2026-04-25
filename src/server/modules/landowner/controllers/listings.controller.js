import { db } from "../../../shared/db.js";
import {
  mapAvailabilityFields,
  normalizeAmenities,
  toClientAvailabilityStatus,
  toDbAvailabilityStatus,
  validatePricingAvailability,
} from "../../../shared/utils/listingUtils.js";
import { toUploadsUrl } from "../../../shared/config/runtimePaths.js";
import {
  hasValidationErrors,
  sendValidationError,
  validateAddressField,
  validateContactNumberField,
  validateDistanceFromUniversityField,
  validateLocationDetailsField,
  normalizeReferenceMapField,
  validateReferenceMapField,
} from "../../../shared/validation/inputValidation.js";
import {
  validateListingLocationPayload,
  validateRoomBasicsPayload,
} from "../../../shared/validation/listingValidation.js";

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const commitTransaction = (res, message) => {
  db.commit((commitError) => {
    if (commitError) {
      console.error("Commit error:", commitError);
      return db.rollback(() =>
        res.status(500).json({ message: "Commit failed" })
      );
    }

    return res.json({ message });
  });
};

export const getLandownerDashboard = (req, res) => {
  const { landownerId } = req.params;
  const statsSql = `
    SELECT
      COUNT(DISTINCT b.boardinghouse_id) AS totalListings,
      SUM(CASE WHEN b.availability_status = 'AVAILABLE' THEN 1 ELSE 0 END) AS activeListings,
      IFNULL(SUM(b.view_count), 0) AS totalViews,
      IFNULL(SUM(room_stats.availableRooms), 0) AS availableRooms
    FROM boarding_house b
    LEFT JOIN (
      SELECT
        boardinghouse_id,
        SUM(CASE WHEN availability_status = 'AVAILABLE' THEN 1 ELSE 0 END) AS availableRooms
      FROM rooms
      GROUP BY boardinghouse_id
    ) room_stats ON b.boardinghouse_id = room_stats.boardinghouse_id
    WHERE b.landowner_id = ?
  `;

  const listingsSql = `
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
    WHERE b.landowner_id = ?
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
    ORDER BY b.boardinghouse_id DESC
  `;

  db.query(statsSql, [landownerId], (statsError, statsData) => {
    if (statsError) {
      console.error("Fetch dashboard stats error:", statsError);
      return res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }

    db.query(listingsSql, [landownerId], (listingsError, listingsData) => {
      if (listingsError) {
        console.error("Fetch dashboard listings error:", listingsError);
        return res
          .status(500)
          .json({ message: "Failed to fetch dashboard listings" });
      }

      return res.json({
        stats: statsData[0] || {
          totalListings: 0,
          activeListings: 0,
          totalViews: 0,
          availableRooms: 0,
        },
        listings: listingsData.map(mapAvailabilityFields),
      });
    });
  });
};

export const getSingleListing = (req, res) => {
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
      console.error("Fetch listing error:", listingError);
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
          console.error("Fetch listing photos error:", photoError);
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

export const createListing = (req, res) => {
  const {
    landowner_id,
    property_name,
    name,
    description,
    contact_number,
    monthly_rent,
    total_rooms,
    available_rooms,
    amenities,
    location_city,
    full_address,
    location,
    distance_from_university,
    reference_map,
    room_type,
    capacity,
  } = req.body;

  const propertyName = String(property_name ?? name ?? "").trim();
  const fullAddress = String(full_address ?? location ?? "").trim();
  const legacyLocationDetails = String(location_city ?? "").trim();

  if (!landowner_id) {
    return res.status(400).json({ message: "landowner_id is required" });
  }

  const validationErrors = {
    ...validateRoomBasicsPayload({
      propertyName,
      description,
      contactNumber: contact_number,
    }),
    ...validateListingLocationPayload({
      fullAddress,
      distanceFromUniversity: distance_from_university,
      locationDetails: location_city,
      referenceMap: reference_map,
    }),
  };

  if (hasValidationErrors(validationErrors)) {
    return sendValidationError(
      res,
      validationErrors,
      "Please correct the invalid listing fields."
    );
  }

  const rawReferenceMap = String(reference_map ?? "").trim();
  const normalizedReferenceMap = rawReferenceMap
    ? normalizeReferenceMapField(rawReferenceMap)
    : "";

  const amenitiesText = normalizeAmenities(amenities);
  const availableRooms = Number(available_rooms || 0);
  const totalRooms = Number(total_rooms || 0);
  const availabilityStatus = availableRooms > 0 ? "AVAILABLE" : "INACTIVE";
  const pricingValidationError = validatePricingAvailability({
    monthly_rent,
    total_rooms,
    available_rooms,
  });

  if (pricingValidationError) {
    return res.status(400).json({
      message: pricingValidationError,
    });
  }

  db.beginTransaction((transactionError) => {
    if (transactionError) {
      console.error("Transaction start error:", transactionError);
      return res.status(500).json({ message: "Transaction failed to start" });
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
        propertyName,
        fullAddress,
        availabilityStatus,
        amenitiesText,
        landowner_id,
        description,
        contact_number,
        distance_from_university || "",
        normalizedReferenceMap || legacyLocationDetails,
        0,
      ],
      (boardingError, boardingResult) => {
        if (boardingError) {
          console.error("Create listing error:", boardingError);
          return db.rollback(() =>
            res.status(500).json({ message: "Failed to save boarding house" })
          );
        }

        const boardinghouseId = boardingResult.insertId;
        const files = req.files || [];

        const insertPhotos = (next) => {
          if (files.length === 0) {
            next();
            return;
          }

          const values = files.map((file) => [
            boardinghouseId,
            toUploadsUrl(file.filename),
          ]);

          db.query(
            "INSERT INTO boardinghouse_photos (boardinghouse_id, photo_url) VALUES ?",
            [values],
            (photoError) => {
              if (photoError) {
                console.error("Create listing photos error:", photoError);
                return db.rollback(() =>
                  res.status(500).json({ message: "Failed to save photos" })
                );
              }

              next();
            }
          );
        };

        insertPhotos(() => {
          const roomRows = [];

          for (let index = 0; index < totalRooms; index += 1) {
            roomRows.push([
              room_type || "Standard Room",
              description,
              Number(capacity || 1),
              Number(monthly_rent),
              index < availableRooms ? "AVAILABLE" : "INACTIVE",
              null,
              boardinghouseId,
            ]);
          }

          if (roomRows.length === 0) {
            return db.rollback(() =>
              res.status(400).json({ message: "At least one room is required" })
            );
          }

          db.query(
            `
              INSERT INTO rooms
                (room_type, description, capacity, price, availability_status, student_id, boardinghouse_id)
              VALUES ?
            `,
            [roomRows],
            (roomError) => {
              if (roomError) {
                console.error("Create listing rooms error:", roomError);
                return db.rollback(() =>
                  res.status(500).json({ message: "Failed to save rooms" })
                );
              }

              db.commit((commitError) => {
                if (commitError) {
                  console.error("Create listing commit error:", commitError);
                  return db.rollback(() =>
                    res.status(500).json({ message: "Commit failed" })
                  );
                }

                return res.status(201).json({
                  message: "Listing published successfully",
                });
              });
            }
          );
        });
      }
    );
  });
};

export const updateListing = (req, res) => {
  const { id } = req.params;
  const {
    property_name,
    name,
    description,
    contact_number,
    monthly_rent,
    total_rooms,
    available_rooms,
    amenities,
    location_city,
    full_address,
    location,
    distance_from_university,
    reference_map,
    room_type,
    capacity,
    availability_status,
  } = req.body;

  const shouldUpdateName = hasOwn(req.body, "property_name") || hasOwn(req.body, "name");
  const shouldUpdateLocation =
    hasOwn(req.body, "full_address") || hasOwn(req.body, "location");
  const shouldUpdateAmenities = hasOwn(req.body, "amenities");
  const shouldUpdateAvailability =
    hasOwn(req.body, "availability_status") || hasOwn(req.body, "available_rooms");
  const shouldUpdateReferenceMap =
    hasOwn(req.body, "reference_map") || hasOwn(req.body, "location_city");

  const normalizedAvailabilityStatus = shouldUpdateAvailability
    ? toDbAvailabilityStatus(availability_status) ||
      (Number(available_rooms || 0) > 0 ? "AVAILABLE" : "INACTIVE")
    : null;

  const hasRoomConfiguration =
    hasOwn(req.body, "monthly_rent") ||
    hasOwn(req.body, "total_rooms") ||
    hasOwn(req.body, "available_rooms") ||
    hasOwn(req.body, "room_type") ||
    hasOwn(req.body, "capacity");

  const pricingValidationError = hasRoomConfiguration
    ? validatePricingAvailability({
        monthly_rent,
        total_rooms,
        available_rooms,
      })
    : null;

  const validationErrors = {};

  if (shouldUpdateName && !String(property_name ?? name ?? "").trim()) {
    validationErrors.property_name = "Property name is required.";
  }

  if (hasOwn(req.body, "description") && !String(description ?? "").trim()) {
    validationErrors.description = "Description is required.";
  }

  if (hasOwn(req.body, "contact_number")) {
    validationErrors.contact_number = validateContactNumberField(
      contact_number,
      "Contact number"
    );
  }

  if (shouldUpdateLocation) {
    validationErrors.full_address = validateAddressField(
      full_address ?? location,
      "Full address"
    );
  }

  if (hasOwn(req.body, "distance_from_university")) {
    validationErrors.distance_from_university =
      validateDistanceFromUniversityField(
        distance_from_university,
        "Distance from university",
        { required: false }
      );
  }

  if (hasOwn(req.body, "location_city")) {
    validationErrors.location_city = validateLocationDetailsField(
      location_city,
      "Location details",
      { required: false }
    );
  }

  if (hasOwn(req.body, "reference_map")) {
    validationErrors.reference_map = validateReferenceMapField(
      reference_map,
      "Reference Map",
      { required: false }
    );
  }

  if (hasValidationErrors(validationErrors)) {
    return sendValidationError(
      res,
      validationErrors,
      "Please correct the invalid listing fields."
    );
  }

  if (pricingValidationError) {
    return res.status(400).json({
      message: pricingValidationError,
    });
  }

  const normalizedReferenceMap = hasOwn(req.body, "reference_map")
    ? String(reference_map ?? "").trim()
      ? normalizeReferenceMapField(reference_map)
      : ""
    : null;
  const normalizedLegacyLocationDetails = hasOwn(req.body, "location_city")
    ? String(location_city ?? "").trim()
    : null;

  db.beginTransaction((transactionError) => {
    if (transactionError) {
      console.error("Update transaction start error:", transactionError);
      return res.status(500).json({ message: "Transaction failed" });
    }

    db.query(
      `
        UPDATE boarding_house
        SET
          name = COALESCE(?, name),
          location = COALESCE(?, location),
          availability_status = COALESCE(?, availability_status),
          amenities = COALESCE(?, amenities),
          description = COALESCE(?, description),
          contact_number = COALESCE(?, contact_number),
          distance_fron_university = COALESCE(?, distance_fron_university),
          reference_map = COALESCE(?, reference_map)
        WHERE boardinghouse_id = ?
      `,
      [
        shouldUpdateName ? String(property_name ?? name ?? "").trim() : null,
        shouldUpdateLocation ? String(full_address ?? location ?? "").trim() : null,
        normalizedAvailabilityStatus,
        shouldUpdateAmenities ? normalizeAmenities(amenities) : null,
        hasOwn(req.body, "description") ? description : null,
        hasOwn(req.body, "contact_number") ? contact_number : null,
        hasOwn(req.body, "distance_from_university")
          ? distance_from_university
          : null,
        shouldUpdateReferenceMap
          ? normalizedReferenceMap ?? normalizedLegacyLocationDetails ?? ""
          : null,
        id,
      ],
      (updateError) => {
        if (updateError) {
          console.error("Update listing error:", updateError);
          return db.rollback(() =>
            res.status(500).json({ message: "Failed to update boarding house" })
          );
        }

        const continueUpdateRooms = () => {
          if (!hasRoomConfiguration) {
            return commitTransaction(res, "Listing updated successfully");
          }

          const totalRooms = Number(total_rooms || 0);
          const availableRooms = Number(available_rooms || 0);
          const monthlyRent = Number(monthly_rent || 0);

          db.query(
            "DELETE FROM rooms WHERE boardinghouse_id = ?",
            [id],
            (deleteRoomsError) => {
              if (deleteRoomsError) {
                console.error("Delete listing rooms error:", deleteRoomsError);
                return db.rollback(() =>
                  res.status(500).json({ message: "Failed to refresh rooms" })
                );
              }

              const roomRows = [];

              for (let index = 0; index < totalRooms; index += 1) {
                roomRows.push([
                  room_type || "Standard Room",
                  description || "",
                  Number(capacity || 1),
                  monthlyRent,
                  index < availableRooms ? "AVAILABLE" : "INACTIVE",
                  null,
                  Number(id),
                ]);
              }

              db.query(
                `
                  INSERT INTO rooms
                    (room_type, description, capacity, price, availability_status, student_id, boardinghouse_id)
                  VALUES ?
                `,
                [roomRows],
                (insertRoomsError) => {
                  if (insertRoomsError) {
                    console.error("Insert updated rooms error:", insertRoomsError);
                    return db.rollback(() =>
                      res.status(500).json({ message: "Failed to update rooms" })
                    );
                  }

                  return commitTransaction(res, "Listing updated successfully");
                }
              );
            }
          );
        };

        if (req.files && req.files.length > 0) {
          db.query(
            "DELETE FROM boardinghouse_photos WHERE boardinghouse_id = ?",
            [id],
            (deletePhotosError) => {
              if (deletePhotosError) {
                console.error("Delete listing photos error:", deletePhotosError);
                return db.rollback(() =>
                  res.status(500).json({ message: "Failed to replace photos" })
                );
              }

              const values = req.files.map((file) => [
                Number(id),
                toUploadsUrl(file.filename),
              ]);

              db.query(
                "INSERT INTO boardinghouse_photos (boardinghouse_id, photo_url) VALUES ?",
                [values],
                (insertPhotosError) => {
                  if (insertPhotosError) {
                    console.error("Insert updated photos error:", insertPhotosError);
                    return db.rollback(() =>
                      res.status(500).json({
                        message: "Failed to save new photos",
                      })
                    );
                  }

                  continueUpdateRooms();
                }
              );
            }
          );
        } else {
          continueUpdateRooms();
        }
      }
    );
  });
};

export const deleteListing = (req, res) => {
  const { id } = req.params;

  db.beginTransaction((transactionError) => {
    if (transactionError) {
      console.error("Delete transaction start error:", transactionError);
      return res.status(500).json({ message: "Transaction failed" });
    }

    db.query(
      "DELETE FROM favorites WHERE boardinghouse_id = ?",
      [id],
      (favoritesError) => {
        if (favoritesError) {
          console.error("Delete listing favorites error:", favoritesError);
          return db.rollback(() =>
            res.status(500).json({ message: "Failed to delete favorites" })
          );
        }

        db.query(
          "DELETE FROM boardinghouse_photos WHERE boardinghouse_id = ?",
          [id],
          (photosError) => {
            if (photosError) {
              console.error("Delete listing photos error:", photosError);
              return db.rollback(() =>
                res.status(500).json({ message: "Failed to delete photos" })
              );
            }

            db.query(
              "DELETE FROM rooms WHERE boardinghouse_id = ?",
              [id],
              (roomsError) => {
                if (roomsError) {
                  console.error("Delete listing rooms error:", roomsError);
                  return db.rollback(() =>
                    res.status(500).json({ message: "Failed to delete rooms" })
                  );
                }

                db.query(
                  "DELETE FROM boarding_house WHERE boardinghouse_id = ?",
                  [id],
                  (listingError) => {
                    if (listingError) {
                      console.error("Delete listing error:", listingError);
                      return db.rollback(() =>
                        res.status(500).json({
                          message: "Failed to delete listing",
                        })
                      );
                    }

                    return commitTransaction(res, "Listing deleted successfully");
                  }
                );
              }
            );
          }
        );
      }
    );
  });
};

export const toggleAvailability = (req, res) => {
  const { id } = req.params;
  const normalizedAvailabilityStatus = toDbAvailabilityStatus(
    req.body.availability_status
  );

  if (!normalizedAvailabilityStatus) {
    return res.status(400).json({ message: "availability_status is required" });
  }

  db.query(
    "UPDATE boarding_house SET availability_status = ? WHERE boardinghouse_id = ?",
    [normalizedAvailabilityStatus, id],
    (listingError) => {
      if (listingError) {
        console.error("Toggle listing availability error:", listingError);
        return res
          .status(500)
          .json({ message: "Failed to update listing availability" });
      }

      const roomStatus =
        normalizedAvailabilityStatus === "AVAILABLE" ? "AVAILABLE" : "INACTIVE";

      db.query(
        "UPDATE rooms SET availability_status = ? WHERE boardinghouse_id = ?",
        [roomStatus, id],
        (roomError) => {
          if (roomError) {
            console.error("Toggle room availability error:", roomError);
            return res
              .status(500)
              .json({ message: "Failed to update room availability" });
          }

          return res.json({
            message: "Availability updated",
            availability_status: toClientAvailabilityStatus(
              normalizedAvailabilityStatus
            ),
          });
        }
      );
    }
  );
};
