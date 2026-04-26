import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../shared/prismaClient.js";
import { db } from "../../shared/db.js";
import {
  hasValidationErrors,
  sendValidationError,
  validateBirthdateField,
  validateContactNumberField,
  validateEmailField,
  validateNameField,
} from "../../shared/validation/inputValidation.js";
import { parseBirthdateInput } from "../../../shared/utils/birthdate.js";

const AUTH_LOGIN_SELECT = {
  accountId: true,
  accountType: true,
  email: true,
  password: true,
  studentId: true,
  landownerId: true,
};

const hasValue = (value) => {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  return value !== null && value !== undefined;
};

const normalizeAccountType = (value) =>
  String(value ?? "").trim().toUpperCase();

const normalizeEmail = (value) => String(value ?? "").trim().toLowerCase();
const HASH_ROUNDS = 12;
const dbPromise = db.promise();

const serializeAuthUser = (account) => ({
  account_id: account.accountId ?? null,
  account_type: String(account.accountType ?? "").toLowerCase(),
  email: account.email ?? "",
  student_id: account.studentId ?? account.student?.studentId ?? null,
  landowner_id: account.landownerId ?? account.landowner?.landownerId ?? null,
});

const isBcryptHash = (value) =>
  /^\$2[aby]\$\d{2}\$/.test(String(value ?? "").trim());

const verifyPassword = async (password, storedPassword) => {
  const normalizedStoredPassword = String(storedPassword ?? "");

  if (!normalizedStoredPassword) {
    return false;
  }

  if (isBcryptHash(normalizedStoredPassword)) {
    return bcrypt.compare(password, normalizedStoredPassword);
  }

  // Backward compatibility for existing plain-text rows.
  return password === normalizedStoredPassword;
};

const queryAsync = async (sql, params = []) => {
  const [rows] = await dbPromise.query(sql, params);
  return rows;
};

const beginTransactionAsync = () => dbPromise.beginTransaction();

const commitAsync = () => dbPromise.commit();

const rollbackAsync = () => dbPromise.rollback();

export const register = async (req, res) => {
  try {
    const {
      account_type,
      firstName,
      lastName,
      middleName,
      email,
      password,
      address,
      gender,
      birthdate,
      mobileNo,
    } = req.body;

    const normalizedAccountType = normalizeAccountType(account_type);
    const normalizedEmail = normalizeEmail(email);
    const validationErrors = {
      account_type: hasValue(account_type) ? "" : "Account type is required.",
      firstName: validateNameField(firstName, "First name"),
      lastName: validateNameField(lastName, "Last name"),
      middleName: validateNameField(middleName, "Middle name", {
        required: false,
      }),
      email: validateEmailField(normalizedEmail),
      mobile_no: validateContactNumberField(mobileNo, "Contact number"),
      password: hasValue(password) ? "" : "Password is required.",
      gender: hasValue(gender) ? "" : "Gender is required.",
      birthdate: validateBirthdateField(birthdate),
    };

    if (hasValue(password) && String(password).length < 6) {
      validationErrors.password = "Password must be at least 6 characters.";
    }

    if (
      hasValue(account_type) &&
      !["STUDENT", "LANDOWNER"].includes(normalizedAccountType)
    ) {
      validationErrors.account_type = "Invalid account type.";
    }

    if (hasValidationErrors(validationErrors)) {
      return sendValidationError(
        res,
        validationErrors,
        "Please correct the invalid registration fields."
      );
    }

    const parsedBirthdate = parseBirthdateInput(birthdate);
    const normalizedAddress = hasValue(address) ? String(address).trim() : "";
    const existingAccountRows = await queryAsync(
      "SELECT account_id FROM account WHERE email = ? LIMIT 1",
      [normalizedEmail]
    );

    if (existingAccountRows.length > 0) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, HASH_ROUNDS);
    const profileTable =
      normalizedAccountType === "STUDENT" ? "student" : "landowner";
    const profileIdColumn =
      normalizedAccountType === "STUDENT" ? "student_id" : "landowner_id";

    await beginTransactionAsync();

    try {
      const profileResult = await queryAsync(
        `
          INSERT INTO ${profileTable}
            (firstName, middleName, lastName, email, address, gender, mobile_no, birthdate)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          String(firstName).trim(),
          hasValue(middleName) ? String(middleName).trim() : null,
          String(lastName).trim(),
          normalizedEmail,
          normalizedAddress,
          String(gender).trim(),
          String(mobileNo).trim(),
          parsedBirthdate?.iso,
        ]
      );

      await queryAsync(
        `
          INSERT INTO account (account_type, email, password, ${profileIdColumn})
          VALUES (?, ?, ?, ?)
        `,
        [
          normalizedAccountType,
          normalizedEmail,
          hashedPassword,
          profileResult.insertId,
        ]
      );

      await commitAsync();
    } catch (transactionError) {
      await rollbackAsync();
      console.error("Auth register transaction error:", transactionError);
      return res.status(500).json({ message: "Registration failed" });
    }

    return res.status(201).json({
      message: "Registration successful. Please log in with your new account.",
    });
  } catch (error) {
    console.error("Auth register error:", error);
    return res.status(500).json({ message: "Registration failed" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!hasValue(email) || !hasValue(password)) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const normalizedEmail = normalizeEmail(email);
    const requestedRole = normalizeAccountType(role);

    const account = await prisma.account.findUnique({
      where: { email: normalizedEmail },
      select: AUTH_LOGIN_SELECT,
    });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    const passwordMatches = await verifyPassword(password, account.password);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Incorrect Password." });
    }

    if (
      requestedRole &&
      ["STUDENT", "LANDOWNER"].includes(requestedRole) &&
      account.accountType !== requestedRole
    ) {
      return res.status(403).json({ message: "Role mismatch" });
    }

    // Generate JWT token
    let tokenPayload = {};
    if (account.accountType === "STUDENT") {
      tokenPayload = {
        student_id: account.studentId,
        account_type: "student",
      };
    } else if (account.accountType === "LANDOWNER") {
      tokenPayload = {
        landowner_id: account.landownerId,
        account_type: "landowner",
      };
    }

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({
      message: "Login successful",
      token,
      user: serializeAuthUser(account),
    });
  } catch (error) {
    console.error("Auth login error:", error);
    return res.status(500).json({ message: "Login failed" });
  }
};
