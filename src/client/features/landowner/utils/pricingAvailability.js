import { parseAmenities } from "../../../shared/utils/amenities";

export const AMENITY_OPTIONS = [
  "WiFi",
  "Air Conditioning",
  "Study Desk",
  "Shared Kitchen",
  "Private Bathroom",
  "CCTV",
  "Laundry Area",
  "Parking",
  "Balcony",
];

export const createPricingAvailabilityForm = (listing = {}) => ({
  monthly_rent:
    listing.monthly_rent !== undefined && listing.monthly_rent !== null
      ? String(listing.monthly_rent)
      : "",
  total_rooms:
    listing.total_rooms !== undefined && listing.total_rooms !== null
      ? String(listing.total_rooms)
      : "",
  available_rooms:
    listing.available_rooms !== undefined && listing.available_rooms !== null
      ? String(listing.available_rooms)
      : "",
  amenities: parseAmenities(listing.amenities_list ?? listing.amenities),
});

export const getPricingAvailabilityStorageKey = (listingId) =>
  `staynear:pricing-availability:${listingId}`;

export const sanitizeDigitInput = (value) =>
  String(value ?? "").replace(/[^\d]/g, "");

export const validatePricingAvailabilityForm = (form) => {
  const errors = {};
  const monthlyRent = Number(form.monthly_rent);
  const totalRooms = Number(form.total_rooms);
  const availableRooms = Number(form.available_rooms);

  if (!form.monthly_rent) {
    errors.monthly_rent = "Monthly rent is required.";
  } else if (!Number.isFinite(monthlyRent) || monthlyRent <= 0) {
    errors.monthly_rent = "Monthly rent must be greater than 0.";
  }

  if (!form.total_rooms) {
    errors.total_rooms = "Total rooms is required.";
  } else if (!Number.isInteger(totalRooms) || totalRooms <= 0) {
    errors.total_rooms = "Total rooms must be a whole number greater than 0.";
  }

  if (form.available_rooms === "") {
    errors.available_rooms = "Available rooms is required.";
  } else if (!Number.isInteger(availableRooms) || availableRooms < 0) {
    errors.available_rooms =
      "Available rooms must be a whole number of rooms.";
  } else if (
    Number.isInteger(totalRooms) &&
    totalRooms > 0 &&
    availableRooms > totalRooms
  ) {
    errors.available_rooms =
      "Available rooms cannot be greater than total rooms.";
  }

  return errors;
};

export const toPricingAvailabilityPayload = (form, listing = {}) => ({
  monthly_rent: Number(form.monthly_rent),
  total_rooms: Number(form.total_rooms),
  available_rooms: Number(form.available_rooms),
  amenities: form.amenities,
  description: listing.description || "",
  room_type: listing.room_type || "Standard Room",
  capacity: Number(listing.capacity || 1),
});
