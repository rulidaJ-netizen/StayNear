import { validateBirthdateRange } from "../../../shared/utils/birthdate.js";
import {
  normalizeReferenceMapUrl,
  validateReferenceMapUrl,
} from "../../../shared/utils/referenceMap.js";

const LETTERS_ONLY_REGEX = /^\p{L}+$/u;
const LETTERS_AND_SPACES_REGEX = /^\p{L}+(?:\s+\p{L}+)*$/u;
const EMAIL_REGEX =
  /^(?!.*\s)(?!.*\.\.)([A-Za-z0-9#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9#$%&'*+/=?^_`{|}~-]+)*)@([A-Za-z0-9-]+\.)+[A-Za-z]{2,}$/;
const CONTACT_NUMBER_REGEX = /^\d{11}$/;
const ADDRESS_REGEX = /^[A-Za-z0-9, ]+$/;
const LOCATION_DETAILS_REGEX = /^[A-Za-z0-9, -]+$/;
const DISTANCE_FROM_UNIVERSITY_REGEX = /^\d+(,\d+)*$/;

const normalizeString = (value) => String(value ?? "").trim();

export const splitFullName = (value) =>
  normalizeString(value)
    .split(/\s+/)
    .filter(Boolean);

export const hasValidationErrors = (errors) =>
  Object.values(errors).some((value) => Boolean(value));

export const validateNameField = (value, label, { required = true } = {}) => {
  const normalizedValue = normalizeString(value);

  if (!normalizedValue) {
    return required ? `${label} is required.` : "";
  }

  if (!LETTERS_AND_SPACES_REGEX.test(normalizedValue)) {
    return `${label} must contain letters and spaces only. No digits or special characters allowed.`;
  }

  return "";
};

export const validateFullNameField = (
  value,
  { label = "Full name", requireLastName = true } = {}
) => {
  const parts = splitFullName(value);

  if (parts.length === 0) {
    return `${label} is required.`;
  }

  if (requireLastName && parts.length < 2) {
    return "Please enter at least a first name and last name.";
  }

  const invalidPart = parts.find((part) => !LETTERS_ONLY_REGEX.test(part));

  if (invalidPart) {
    return `${label} must use letters and spaces only for each name part.`;
  }

  return "";
};

export const validateEmailField = (value, label = "Email address") => {
  const normalizedValue = normalizeString(value).toLowerCase();

  if (!normalizedValue) {
    return `${label} is required.`;
  }

  if (!EMAIL_REGEX.test(normalizedValue)) {
    return `${label} must be a valid email address with no spaces.`;
  }

  return "";
};

export const validateContactNumberField = (
  value,
  label = "Contact number"
) => {
  const normalizedValue = normalizeString(value);

  if (!normalizedValue) {
    return `${label} is required.`;
  }

  if (!CONTACT_NUMBER_REGEX.test(normalizedValue)) {
    return `${label} must be exactly 11 digits. No special characters allowed`;
  }

  return "";
};

export const validateAddressField = (value, label = "Address") => {
  const normalizedValue = normalizeString(value);

  if (!normalizedValue) {
    return `${label} is required.`;
  }

  if (!ADDRESS_REGEX.test(normalizedValue)) {
    return `${label} may contain letters, numbers, spaces, and commas only.`;
  }

  return "";
};

export const validateLocationDetailsField = (
  value,
  label = "Location details",
  { required = true } = {}
) => {
  const normalizedValue = normalizeString(value);

  if (!normalizedValue) {
    return required ? `${label} is required.` : "";
  }

  if (!LOCATION_DETAILS_REGEX.test(normalizedValue)) {
    return `${label} may contain letters, numbers, spaces, commas, and hyphens only.`;
  }

  return "";
};

export const validateDistanceFromUniversityField = (
  value,
  label = "Distance from university",
  { required = true } = {}
) => {
  const normalizedValue = normalizeString(value);

  if (!normalizedValue) {
    return required ? `${label} is required.` : "";
  }

  if (!DISTANCE_FROM_UNIVERSITY_REGEX.test(normalizedValue)) {
    return `${label} may contain numbers and commas only.`;
  }

  return "";
};

export const validateBirthdateField = (
  value,
  label = "Birthdate",
  options
) => {
  const normalizedValue = normalizeString(value);

  if (!normalizedValue) {
    return `${label} is required.`;
  }

  const birthdateValidation = validateBirthdateRange(normalizedValue, options);

  if (!birthdateValidation.isValid) {
    return birthdateValidation.error;
  }

  return "";
};

export const validateReferenceMapField = (
  value,
  label = "Reference Map",
  options
) => validateReferenceMapUrl(value, { label, ...(options || {}) });

export const normalizeReferenceMapField = (value) =>
  normalizeReferenceMapUrl(value);

export const validationPatterns = {
  lettersOnly: LETTERS_ONLY_REGEX,
  lettersAndSpaces: LETTERS_AND_SPACES_REGEX,
  email: EMAIL_REGEX,
  contactNumber: CONTACT_NUMBER_REGEX,
  address: ADDRESS_REGEX,
  locationDetails: LOCATION_DETAILS_REGEX,
  distanceFromUniversity: DISTANCE_FROM_UNIVERSITY_REGEX,
};
