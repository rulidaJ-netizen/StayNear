export const parseAmenities = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  if (!value) {
    return [];
  }

  const normalizedValue = String(value).trim();

  if (!normalizedValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(normalizedValue);

    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => String(item || "").trim())
        .filter(Boolean);
    }
  } catch (error) {
    void error;
  }

  return normalizedValue
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

export const formatAmenities = (value) => parseAmenities(value).join(", ");
