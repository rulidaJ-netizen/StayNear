import {
  hasValidationErrors,
  validateAddressField,
  validateContactNumberField,
  validateDistanceFromUniversityField,
  validateLocationDetailsField,
  validateReferenceMapField,
} from "../../../shared/utils/inputValidation";

const normalizeString = (value) => String(value ?? "").trim();

const validatePositiveNumberField = (value, label) => {
  const normalizedValue = normalizeString(value);

  if (!normalizedValue) {
    return `${label} is required.`;
  }

  if (!/^\d+(\.\d+)?$/.test(normalizedValue) || Number(normalizedValue) <= 0) {
    return `${label} must be a positive number.`;
  }

  return "";
};

const validateWholeNumberField = (value, label, { allowZero = false } = {}) => {
  const normalizedValue = normalizeString(value);

  if (!normalizedValue) {
    return `${label} is required.`;
  }

  if (!/^\d+$/.test(normalizedValue)) {
    return `${label} must be a whole number.`;
  }

  if (!allowZero && Number(normalizedValue) <= 0) {
    return `${label} must be greater than zero.`;
  }

  return "";
};

export const validateRoomBasicsForm = (form) => {
  const errors = {};
  const propertyName = normalizeString(form.property_name ?? form.name);
  const description = normalizeString(form.description);
  const contactNumber = form.contact_number ?? form.contactNumber;

  if (!propertyName) {
    errors.property_name = "Property name is required.";
  }

  if (!description) {
    errors.description = "Description is required.";
  }

  const contactNumberError = validateContactNumberField(contactNumber);
  if (contactNumberError) {
    errors.contact_number = contactNumberError;
  }

  return errors;
};

export const validatePricingAvailabilityForm = (form) => {
  const errors = {};
  const monthlyRentError = validatePositiveNumberField(
    form.monthly_rent,
    "Monthly rent"
  );
  const totalRoomsError = validateWholeNumberField(
    form.total_rooms,
    "Total rooms"
  );
  const availableRoomsError = validateWholeNumberField(
    form.available_rooms,
    "Available rooms",
    { allowZero: true }
  );

  if (monthlyRentError) {
    errors.monthly_rent = monthlyRentError;
  }

  if (totalRoomsError) {
    errors.total_rooms = totalRoomsError;
  }

  if (availableRoomsError) {
    errors.available_rooms = availableRoomsError;
  }

  if (
    !totalRoomsError &&
    !availableRoomsError &&
    Number(form.available_rooms) > Number(form.total_rooms)
  ) {
    errors.available_rooms = "Available rooms cannot exceed total rooms.";
  }

  return errors;
};

export const validateLocationDetailsForm = (form) => {
  const errors = {};
  const addressError = validateAddressField(form.full_address, "Full address");
  const distanceError = validateDistanceFromUniversityField(
    form.distance_from_university
  );
  const locationDetailsError = validateLocationDetailsField(
    form.location_city,
    "Location details",
    { required: false }
  );
  const referenceMapError = validateReferenceMapField(
    form.reference_map,
    "Reference Map",
    { required: false }
  );

  if (addressError) {
    errors.full_address = addressError;
  }

  if (distanceError) {
    errors.distance_from_university = distanceError;
  }

  if (locationDetailsError) {
    errors.location_city = locationDetailsError;
  }

  if (referenceMapError) {
    errors.reference_map = referenceMapError;
  }

  return errors;
};

export const validateListingWizardStep = (step, form) => {
  switch (step) {
    case 1:
      return validateRoomBasicsForm(form);
    case 3:
      return validatePricingAvailabilityForm(form);
    case 4:
      return validateLocationDetailsForm(form);
    default:
      return {};
  }
};

export { hasValidationErrors };
