import fs from "fs";
import { db } from "../../../shared/db.js";
import {
  buildFullName,
  splitFullName,
} from "../../../shared/utils/profileUtils.js";
import { toClientAvailabilityStatus } from "../../../shared/utils/listingUtils.js";
import {
  ensureDirectory,
  resolveStoragePath,
  resolveUploadUrlPath,
  resolveUploadsPath,
  toUploadsUrl,
} from "../../../shared/config/runtimePaths.js";

const FULL_NAME_REGEX = /^[\p{L}][\p{L}\s.'-]*$/u;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const storageDir = resolveStoragePath();
const avatarsDir = resolveUploadsPath("avatars", "landowners");
const metadataFilePath = resolveStoragePath("landowner-profile-meta.json");

const ensureStoragePaths = () => {
  ensureDirectory(storageDir);
  ensureDirectory(avatarsDir);
};

const readProfileMetadata = () => {
  ensureStoragePaths();

  if (!fs.existsSync(metadataFilePath)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(metadataFilePath, "utf-8"));
  } catch (error) {
    console.error("Read landowner profile metadata error:", error);
    return {};
  }
};

const writeProfileMetadata = (metadata) => {
  ensureStoragePaths();
  fs.writeFileSync(metadataFilePath, JSON.stringify(metadata, null, 2), "utf-8");
};

const getLandownerId = (req) =>
  Number(
    req.params.id ??
      req.query.landowner_id ??
      req.body.landowner_id ??
      req.headers["x-landowner-id"]
  );

const serializeProfile = (record, favoritesCount, avatarUrl) => ({
  landowner_id: record.landowner_id,
  full_name: buildFullName(record.firstName, record.middleName, record.lastName),
  email: record.email ?? "",
  role: "Landowner",
  avatar_url: avatarUrl || "",
  favorites_count: Number(favoritesCount || 0),
  address: record.address ?? "",
  gender: record.gender ?? "",
  age: record.age ?? "",
  mobile_no: record.mobile_no ?? "",
});

const fetchLandownerProfile = (landownerId, callback) => {
  db.query(
    `
      SELECT
        landowner_id,
        firstName,
        middleName,
        lastName,
        email,
        address,
        gender,
        age,
        mobile_no
      FROM landowner
      WHERE landowner_id = ?
    `,
    [landownerId],
    (landownerError, landownerRows) => {
      if (landownerError) {
        callback(landownerError);
        return;
      }

      if (landownerRows.length === 0) {
        callback(null, null);
        return;
      }

      db.query(
        `
          SELECT COUNT(f.favorite_id) AS favorites_count
          FROM boarding_house b
          LEFT JOIN favorites f ON f.boardinghouse_id = b.boardinghouse_id
          WHERE b.landowner_id = ?
        `,
        [landownerId],
        (favoritesError, favoritesRows) => {
          if (favoritesError) {
            callback(favoritesError);
            return;
          }

          const metadata = readProfileMetadata();
          const avatarUrl = metadata[String(landownerId)]?.avatar_url || "";

          callback(
            null,
            serializeProfile(
              landownerRows[0],
              favoritesRows[0]?.favorites_count || 0,
              avatarUrl
            )
          );
        }
      );
    }
  );
};

export const getLandownerProfile = (req, res) => {
  const landownerId = getLandownerId(req);

  if (!Number.isInteger(landownerId) || landownerId <= 0) {
    return res.status(400).json({ message: "landowner_id is required" });
  }

  return fetchLandownerProfile(landownerId, (error, profile) => {
    if (error) {
      console.error("Fetch landowner profile error:", error);
      return res
        .status(500)
        .json({ message: "Failed to fetch landowner profile" });
    }

    if (!profile) {
      return res.status(404).json({ message: "Landowner not found" });
    }

    return res.json(profile);
  });
};

export const updateLandownerProfile = (req, res) => {
  const landownerId = getLandownerId(req);
  const fullName = String(req.body.full_name || "").trim();
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();

  if (!Number.isInteger(landownerId) || landownerId <= 0) {
    return res.status(400).json({ message: "landowner_id is required" });
  }

  if (!fullName) {
    return res.status(400).json({ message: "Full name is required" });
  }

  if (!FULL_NAME_REGEX.test(fullName)) {
    return res.status(400).json({ message: "Full name must contain letters only" });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ message: "A valid email address is required" });
  }

  const { firstName, middleName, lastName } = splitFullName(fullName);

  if (!firstName || !lastName) {
    return res.status(400).json({
      message: "Please provide your first and last name",
    });
  }

  db.query(
    "SELECT account_id FROM account WHERE email = ? AND (landowner_id IS NULL OR landowner_id <> ?)",
    [email, landownerId],
    (emailError, emailRows) => {
      if (emailError) {
        console.error("Check landowner email availability error:", emailError);
        return res.status(500).json({ message: "Failed to validate email" });
      }

      if (emailRows.length > 0) {
        return res.status(409).json({ message: "Email already exists" });
      }

      db.beginTransaction((transactionError) => {
        if (transactionError) {
          console.error(
            "Start landowner update transaction error:",
            transactionError
          );
          return res
            .status(500)
            .json({ message: "Failed to update landowner profile" });
        }

        db.query(
          `
            UPDATE landowner
            SET firstName = ?, middleName = ?, lastName = ?, email = ?
            WHERE landowner_id = ?
          `,
          [firstName, middleName, lastName, email, landownerId],
          (landownerError) => {
            if (landownerError) {
              console.error("Update landowner profile error:", landownerError);
              return db.rollback(() =>
                res
                  .status(500)
                  .json({ message: "Failed to update landowner profile" })
              );
            }

            db.query(
              "UPDATE account SET email = ? WHERE landowner_id = ?",
              [email, landownerId],
              (accountError) => {
                if (accountError) {
                  console.error("Update landowner account error:", accountError);
                  return db.rollback(() =>
                    res.status(500).json({ message: "Failed to update account" })
                  );
                }

                db.commit((commitError) => {
                  if (commitError) {
                    console.error("Commit landowner profile update error:", commitError);
                    return db.rollback(() =>
                      res
                        .status(500)
                        .json({ message: "Failed to update landowner profile" })
                    );
                  }

                  return fetchLandownerProfile(
                    landownerId,
                    (profileError, profile) => {
                      if (profileError) {
                        console.error(
                          "Fetch updated landowner profile error:",
                          profileError
                        );
                        return res.status(500).json({
                          message: "Profile updated, but reload failed",
                        });
                      }

                      return res.json({
                        message: "Landowner profile updated",
                        profile,
                      });
                    }
                  );
                });
              }
            );
          }
        );
      });
    }
  );
};

export const uploadLandownerAvatar = (req, res) => {
  const landownerId = getLandownerId(req);

  if (!Number.isInteger(landownerId) || landownerId <= 0) {
    return res.status(400).json({ message: "landowner_id is required" });
  }

  if (!req.file) {
    return res.status(400).json({ message: "Avatar image is required" });
  }

  db.query(
    "SELECT landowner_id FROM landowner WHERE landowner_id = ?",
    [landownerId],
    (landownerError, landownerRows) => {
      if (landownerError) {
        console.error("Validate landowner for avatar upload error:", landownerError);
        return res.status(500).json({ message: "Failed to upload avatar" });
      }

      if (landownerRows.length === 0) {
        return res.status(404).json({ message: "Landowner not found" });
      }

      const metadata = readProfileMetadata();
      const existingAvatarUrl = metadata[String(landownerId)]?.avatar_url;

      if (existingAvatarUrl) {
        const existingAvatarPath = resolveUploadUrlPath(existingAvatarUrl);

        if (
          existingAvatarPath !== req.file.path &&
          fs.existsSync(existingAvatarPath)
        ) {
          try {
            fs.unlinkSync(existingAvatarPath);
          } catch (error) {
            console.error("Delete old landowner avatar error:", error);
          }
        }
      }

      const avatarUrl = toUploadsUrl(
        "avatars",
        "landowners",
        req.file.filename
      );

      metadata[String(landownerId)] = {
        ...(metadata[String(landownerId)] || {}),
        avatar_url: avatarUrl,
      };

      writeProfileMetadata(metadata);

      return res.status(201).json({
        message: "Avatar uploaded successfully",
        avatar_url: avatarUrl,
      });
    }
  );
};

export const getLandownerFavorites = (req, res) => {
  const landownerId = getLandownerId(req);

  if (!Number.isInteger(landownerId) || landownerId <= 0) {
    return res.status(400).json({ message: "landowner_id is required" });
  }

  db.query(
    `
      SELECT
        b.boardinghouse_id,
        b.name,
        b.location,
        b.availability_status,
        (
          SELECT photo_url
          FROM boardinghouse_photos p
          WHERE p.boardinghouse_id = b.boardinghouse_id
          ORDER BY p.photo_id ASC
          LIMIT 1
        ) AS photo_url,
        COUNT(f.favorite_id) AS favorite_count
      FROM boarding_house b
      LEFT JOIN favorites f ON f.boardinghouse_id = b.boardinghouse_id
      WHERE b.landowner_id = ?
      GROUP BY
        b.boardinghouse_id,
        b.name,
        b.location,
        b.availability_status
      ORDER BY favorite_count DESC, b.boardinghouse_id DESC
    `,
    [landownerId],
    (error, rows) => {
      if (error) {
        console.error("Fetch landowner favorites error:", error);
        return res
          .status(500)
          .json({ message: "Failed to fetch favorite activity" });
      }

      const listings = rows.map((row) => ({
        ...row,
        availability_status: toClientAvailabilityStatus(row.availability_status),
        favorite_count: Number(row.favorite_count || 0),
      }));

      const totalFavorites = listings.reduce(
        (sum, item) => sum + Number(item.favorite_count || 0),
        0
      );

      return res.json({
        total_favorites: totalFavorites,
        listings,
      });
    }
  );
};
