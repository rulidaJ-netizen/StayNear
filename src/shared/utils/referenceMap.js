export const MAX_REFERENCE_MAP_URL_LENGTH = 2048;

const normalizeString = (value) => String(value ?? "").trim();

export const normalizeReferenceMapUrl = (value) => {
  const normalizedValue = normalizeString(value);

  if (!normalizedValue) {
    return "";
  }

  const encodedValue = encodeURI(normalizedValue);
  const parsedUrl = new URL(encodedValue);

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Reference Map must start with http:// or https://.");
  }

  return parsedUrl.toString();
};

export const validateReferenceMapUrl = (
  value,
  {
    label = "Reference Map",
    required = false,
    maxLength = MAX_REFERENCE_MAP_URL_LENGTH,
  } = {}
) => {
  const normalizedValue = normalizeString(value);

  if (!normalizedValue) {
    return required ? `${label} is required.` : "";
  }

  if (normalizedValue.length > maxLength) {
    return `${label} must be ${maxLength} characters or fewer.`;
  }

  try {
    normalizeReferenceMapUrl(normalizedValue);
  } catch (error) {
    return error.message || `${label} must be a valid URL.`;
  }

  return "";
};
