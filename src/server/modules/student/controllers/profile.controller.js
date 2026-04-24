import { db } from "../../../shared/db.js";
import {
  buildFullName,
  splitFullName,
} from "../../../shared/utils/profileUtils.js";
import {
  hasValidationErrors,
  sendValidationError,
  validateAddressField,
  validateContactNumberField,
  validateEmailField,
  validateFullNameField,
} from "../../../shared/validation/inputValidation.js";

const serializeProfile = (record, idField) => ({
  [idField]: record[idField],
  full_name: buildFullName(record.firstName, record.middleName, record.lastName),
  email: record.email ?? "",
  address: record.address ?? "",
  gender: record.gender ?? "",
  age: record.age ?? "",
  mobile_no: record.mobile_no ?? "",
});

export const getStudentProfile = (req, res) => {
  const { id } = req.params;

  db.query("SELECT * FROM student WHERE student_id = ?", [id], (error, data) => {
    if (error) {
      console.error("Fetch student profile error:", error);
      return res.status(500).json({ message: "Failed to fetch student profile" });
    }

    if (data.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.json(serializeProfile(data[0], "student_id"));
  });
};

export const updateStudentProfile = (req, res) => {
  const { id } = req.params;
  const { full_name, email, address, gender, age, mobile_no } = req.body;
  const { firstName, middleName, lastName } = splitFullName(full_name);

  const validationErrors = {
    full_name: validateFullNameField(full_name, { label: "Full name" }),
    email: validateEmailField(email),
    address: validateAddressField(address),
    mobile_no: validateContactNumberField(mobile_no, "Contact number"),
    gender: String(gender ?? "").trim() ? "" : "Gender is required.",
  };

  if (hasValidationErrors(validationErrors)) {
    return sendValidationError(
      res,
      validationErrors,
      "Please correct the invalid profile fields."
    );
  }

  db.query(
    `
      UPDATE student
      SET firstName = ?, middleName = ?, lastName = ?, email = ?, address = ?, gender = ?, age = ?, mobile_no = ?
      WHERE student_id = ?
    `,
    [firstName, middleName, lastName, email, address, gender, age || 0, mobile_no, id],
    (studentError) => {
      if (studentError) {
        console.error("Update student profile error:", studentError);
        return res.status(500).json({ message: "Failed to update student profile" });
      }

      db.query(
        "UPDATE account SET email = ? WHERE student_id = ?",
        [email, id],
        (accountError) => {
          if (accountError) {
            console.error("Update student account error:", accountError);
            return res.status(500).json({ message: "Failed to update account" });
          }

          return res.json({ message: "Student profile updated" });
        }
      );
    }
  );
};
