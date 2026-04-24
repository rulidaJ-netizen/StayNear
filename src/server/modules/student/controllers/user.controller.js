import fs from "fs";
import { db } from "../../../shared/db.js";
import { buildFullName, splitFullName } from "../../../shared/utils/profileUtils.js";
import {
  hasValidationErrors,
  sendValidationError,
  validateBirthdateField,
  validateEmailField,
  validateFullNameField,
} from "../../../shared/validation/inputValidation.js";
import {
  ensureDirectory,
  resolveStoragePath,
  resolveUploadUrlPath,
  resolveUploadsPath,
  toUploadsUrl,
} from "../../../shared/config/runtimePaths.js";
import {
  formatBirthdateForInput,
  validateBirthdateRange,
} from "../../../../shared/utils/birthdate.js";

const storageDir = resolveStoragePath();
const avatarsDir = resolveUploadsPath("avatars");
const metadataFilePath = resolveStoragePath("student-profile-meta.json");

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
    console.error("Read student profile metadata error:", error);
    return {};
  }
};

const writeProfileMetadata = (metadata) => {
  ensureStoragePaths();
  fs.writeFileSync(metadataFilePath, JSON.stringify(metadata, null, 2), "utf-8");
};

const getStudentId = (req) =>
  Number(req.query.student_id ?? req.body.student_id ?? req.headers["x-student-id"]);

const serializeUserProfile = (studentRecord, favoritesCount, avatarUrl) => ({
  student_id: studentRecord.student_id,
  full_name: buildFullName(
    studentRecord.firstName,
    studentRecord.middleName,
    studentRecord.lastName
  ),
  email: studentRecord.email ?? "",
  role: "Student",
  avatar_url: avatarUrl || "",
  favorites_count: Number(favoritesCount || 0),
  birthdate: formatBirthdateForInput(studentRecord.birthdate),
  age: Number(studentRecord.age || 0),
});

const fetchUserProfile = (studentId, callback) => {
  db.query(
    `
      SELECT
        student_id,
        firstName,
        middleName,
        lastName,
        email,
        birthdate,
        age
      FROM student
      WHERE student_id = ?
    `,
    [studentId],
    (studentError, studentRows) => {
      if (studentError) {
        callback(studentError);
        return;
      }

      if (studentRows.length === 0) {
        callback(null, null);
        return;
      }

      db.query(
        "SELECT COUNT(*) AS favorites_count FROM favorites WHERE student_id = ?",
        [studentId],
        (favoritesError, favoritesRows) => {
          if (favoritesError) {
            callback(favoritesError);
            return;
          }

          const metadata = readProfileMetadata();
          const avatarUrl = metadata[String(studentId)]?.avatar_url || "";

          callback(
            null,
            serializeUserProfile(
              studentRows[0],
              favoritesRows[0]?.favorites_count || 0,
              avatarUrl
            )
          );
        }
      );
    }
  );
};

export const getUserProfile = (req, res) => {
  const studentId = getStudentId(req);

  if (!Number.isInteger(studentId) || studentId <= 0) {
    return res.status(400).json({ message: "student_id is required" });
  }

  return fetchUserProfile(studentId, (error, profile) => {
    if (error) {
      console.error("Fetch user profile error:", error);
      return res.status(500).json({ message: "Failed to fetch user profile" });
    }

    if (!profile) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.json(profile);
  });
};

export const updateUserProfile = (req, res) => {
  const studentId = Number(req.body.student_id);
  const fullName = String(req.body.full_name || "").trim();
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  const hasBirthdate = Object.prototype.hasOwnProperty.call(req.body, "birthdate");

  if (!Number.isInteger(studentId) || studentId <= 0) {
    return res.status(400).json({ message: "student_id is required" });
  }

  const baseValidationErrors = {
    full_name: validateFullNameField(fullName, { label: "Full name" }),
    email: validateEmailField(email),
  };

  db.query(
    "SELECT student_id, birthdate FROM student WHERE student_id = ?",
    [studentId],
    (studentLookupError, studentRows) => {
      if (studentLookupError) {
        console.error("Fetch current student profile error:", studentLookupError);
        return res.status(500).json({ message: "Failed to update user" });
      }

      if (studentRows.length === 0) {
        return res.status(404).json({ message: "Student not found" });
      }

      const nextBirthdate = hasBirthdate
        ? String(req.body.birthdate || "").trim()
        : formatBirthdateForInput(studentRows[0].birthdate);
      const validationErrors = {
        ...baseValidationErrors,
        birthdate: validateBirthdateField(nextBirthdate),
      };

      if (hasValidationErrors(validationErrors)) {
        return sendValidationError(
          res,
          validationErrors,
          "Please correct the invalid profile fields."
        );
      }

      const { firstName, middleName, lastName } = splitFullName(fullName);
      const birthdateValidation = validateBirthdateRange(nextBirthdate);

      db.query(
        "SELECT account_id FROM account WHERE email = ? AND (student_id IS NULL OR student_id <> ?)",
        [email, studentId],
        (emailError, emailRows) => {
          if (emailError) {
            console.error("Check email availability error:", emailError);
            return res.status(500).json({ message: "Failed to validate email" });
          }

          if (emailRows.length > 0) {
            return res.status(409).json({ message: "Email already exists" });
          }

          db.beginTransaction((transactionError) => {
            if (transactionError) {
              console.error("Start user update transaction error:", transactionError);
              return res.status(500).json({ message: "Failed to update user" });
            }

            db.query(
              `
                UPDATE student
                SET firstName = ?, middleName = ?, lastName = ?, email = ?, birthdate = ?, age = ?
                WHERE student_id = ?
              `,
              [
                firstName,
                middleName,
                lastName,
                email,
                birthdateValidation.date,
                birthdateValidation.age,
                studentId,
              ],
              (studentError) => {
                if (studentError) {
                  console.error("Update user student record error:", studentError);
                  return db.rollback(() =>
                    res.status(500).json({ message: "Failed to update user" })
                  );
                }

                db.query(
                  "UPDATE account SET email = ? WHERE student_id = ?",
                  [email, studentId],
                  (accountError) => {
                    if (accountError) {
                      console.error("Update user account record error:", accountError);
                      return db.rollback(() =>
                        res.status(500).json({ message: "Failed to update user" })
                      );
                    }

                    db.commit((commitError) => {
                      if (commitError) {
                        console.error("Commit user update error:", commitError);
                        return db.rollback(() =>
                          res.status(500).json({ message: "Failed to update user" })
                        );
                      }

                      return fetchUserProfile(studentId, (profileError, profile) => {
                        if (profileError) {
                          console.error("Fetch updated user profile error:", profileError);
                          return res
                            .status(500)
                            .json({ message: "Profile updated, but reload failed" });
                        }

                        return res.json({
                          message: "Profile updated successfully",
                          profile,
                        });
                      });
                    });
                  }
                );
              }
            );
          });
        }
      );
    }
  );
};

export const uploadUserAvatar = (req, res) => {
  const studentId = Number(req.body.student_id);

  if (!Number.isInteger(studentId) || studentId <= 0) {
    return res.status(400).json({ message: "student_id is required" });
  }

  if (!req.file) {
    return res.status(400).json({ message: "Avatar image is required" });
  }

  db.query(
    "SELECT student_id FROM student WHERE student_id = ?",
    [studentId],
    (studentError, studentRows) => {
      if (studentError) {
        console.error("Validate student for avatar upload error:", studentError);
        return res.status(500).json({ message: "Failed to upload avatar" });
      }

      if (studentRows.length === 0) {
        return res.status(404).json({ message: "Student not found" });
      }

      const metadata = readProfileMetadata();
      const existingAvatarUrl = metadata[String(studentId)]?.avatar_url;

      if (existingAvatarUrl) {
        const existingAvatarPath = resolveUploadUrlPath(existingAvatarUrl);

        if (
          existingAvatarPath !== req.file.path &&
          fs.existsSync(existingAvatarPath)
        ) {
          try {
            fs.unlinkSync(existingAvatarPath);
          } catch (error) {
            console.error("Delete old avatar error:", error);
          }
        }
      }

      const avatarUrl = toUploadsUrl("avatars", req.file.filename);

      metadata[String(studentId)] = {
        ...(metadata[String(studentId)] || {}),
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
