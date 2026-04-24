import {
  validateAddressField,
  validateContactNumberField,
  validateDistanceFromUniversityField,
  validateLocationDetailsField,
} from "./inputValidation.js";

const normalizeString = (value) => String(value ?? "").trim();

export const validateRoomBasicsPayload = ({
  propertyName,
  description,
  contactNumber,
}) => {
  const errors = {};

  if (!normalizeString(propertyName)) {
    errors.property_name = "Property name is required.";
  }

  if (!normalizeString(description)) {
    errors.description = "Description is required.";
  }

  const contactNumberError = validateContactNumberField(
    contactNumber,
    "Contact number"
  );

  if (contactNumberError) {
    errors.contact_number = contactNumberError;
  }

  return errors;
};

export const validateListingLocationPayload = ({
  fullAddress,
  distanceFromUniversity,
  locationDetails,
  requireLocationDetails = false,
}) => {
  const errors = {};

  const addressError = validateAddressField(fullAddress, "Full address");
  const distanceError = validateDistanceFromUniversityField(
    distanceFromUniversity
  );
  const locationDetailsError = validateLocationDetailsField(
    locationDetails,
    "Location details",
    { required: requireLocationDetails }
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

  return errors;
};
