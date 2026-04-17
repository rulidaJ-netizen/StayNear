const sanitizeAmenityList = (amenities) => {
  if (Array.isArray(amenities)) {
    return amenities
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  if (!amenities) {
    return [];
  }

  const value = String(amenities).trim();

  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => String(item || "").trim())
        .filter(Boolean);
    }
  } catch {}

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

export const parseAmenities = sanitizeAmenityList;

export const normalizeAmenities = (amenities) =>
  JSON.stringify(sanitizeAmenityList(amenities));

export const parseAmenityFilters = (amenity) => {
  if (Array.isArray(amenity)) {
    return amenity.flatMap((item) => parseAmenityFilters(item));
  }

  return sanitizeAmenityList(amenity);
};

export const validatePricingAvailability = ({
  monthly_rent,
  total_rooms,
  available_rooms,
}) => {
  if (monthly_rent === undefined || monthly_rent === null || monthly_rent === "") {
    return "Monthly rent is required";
  }

  const monthlyRent = Number(monthly_rent);

  if (!Number.isFinite(monthlyRent) || monthlyRent <= 0) {
    return "Monthly rent must be greater than 0";
  }

  if (total_rooms === undefined || total_rooms === null || total_rooms === "") {
    return "Total rooms is required";
  }

  const totalRooms = Number(total_rooms);

  if (!Number.isInteger(totalRooms) || totalRooms <= 0) {
    return "Total rooms must be a whole number greater than 0";
  }

  if (
    available_rooms === undefined ||
    available_rooms === null ||
    available_rooms === ""
  ) {
    return "Available rooms is required";
  }

  const availableRooms = Number(available_rooms);

  if (!Number.isInteger(availableRooms) || availableRooms < 0) {
    return "Available rooms must be a whole number";
  }

  if (availableRooms > totalRooms) {
    return "Available rooms cannot exceed total rooms";
  }

  return null;
};

export const toDbAvailabilityStatus = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (normalized === "available") {
    return "AVAILABLE";
  }

  if (normalized === "full") {
    return "FULL";
  }

  if (normalized === "inactive" || normalized === "unavailable") {
    return "INACTIVE";
  }

  return null;
};

export const toClientAvailabilityStatus = (value) =>
  value === "AVAILABLE" ? "available" : "unavailable";

export const mapAvailabilityFields = (row) => ({
  ...row,
  availability_status: toClientAvailabilityStatus(row.availability_status),
  amenities_list: sanitizeAmenityList(row.amenities),
});
