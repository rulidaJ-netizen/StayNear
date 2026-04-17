import jwt from "jsonwebtoken";
import prisma from "../../shared/prismaClient.js";

const AUTH_INCLUDE = {
  student: true,
  landowner: true,
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

const serializeAuthUser = (account) => ({
  account_id: account.accountId ?? null,
  account_type: String(account.accountType ?? "").toLowerCase(),
  email: account.email ?? "",
  student_id: account.studentId ?? account.student?.studentId ?? null,
  landowner_id: account.landownerId ?? account.landowner?.landownerId ?? null,
});

const buildProfileData = ({
  firstName,
  middleName,
  lastName,
  email,
  address,
  gender,
  birthdate,
  mobileNo,
}) => ({
  firstName: String(firstName).trim(),
  middleName: hasValue(middleName) ? String(middleName).trim() : null,
  lastName: String(lastName).trim(),
  email,
  address: String(address).trim(),
  gender: String(gender).trim(),
  age: 0,
  mobileNo: String(mobileNo).trim(),
  birthdate,
});

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

    const missingFields = [
      "account_type",
      "firstName",
      "lastName",
      "email",
      "password",
      "address",
      "gender",
      "birthdate",
      "mobileNo",
    ].filter((field) => !hasValue(req.body[field]));

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const normalizedAccountType = normalizeAccountType(account_type);
    const normalizedEmail = normalizeEmail(email);
    const parsedBirthdate = new Date(birthdate);

    if (!["STUDENT", "LANDOWNER"].includes(normalizedAccountType)) {
      return res.status(400).json({ message: "Invalid account type" });
    }

    if (Number.isNaN(parsedBirthdate.getTime())) {
      return res.status(400).json({ message: "Invalid birthdate" });
    }

    const existingAccount = await prisma.account.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingAccount) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const profileData = buildProfileData({
      firstName,
      middleName,
      lastName,
      email: normalizedEmail,
      address,
      gender,
      birthdate: parsedBirthdate,
      mobileNo,
    });

    const account = await prisma.account.create({
      data: {
        accountType: normalizedAccountType,
        email: normalizedEmail,
        password,
        ...(normalizedAccountType === "STUDENT"
          ? {
              student: {
                create: profileData,
              },
            }
          : {
              landowner: {
                create: profileData,
              },
            }),
      },
      include: AUTH_INCLUDE,
    });

    return res.status(201).json({
      message: "Registration successful",
      user: serializeAuthUser(account),
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
      include: AUTH_INCLUDE,
    });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    if (account.password !== password) {
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
        student_id: account.student?.studentId,
        account_type: "student",
      };
    } else if (account.accountType === "LANDOWNER") {
      tokenPayload = {
        landowner_id: account.landowner?.landownerId,
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