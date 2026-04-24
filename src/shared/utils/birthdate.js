export const MIN_ALLOWED_AGE = 15;
export const MAX_ALLOWED_AGE = 70;

const DATE_ONLY_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

const padDatePart = (value) => String(value).padStart(2, "0");

const toUtcDate = (year, month, day) =>
  new Date(Date.UTC(year, month - 1, day));

const toDateOnlyString = (year, month, day) =>
  `${String(year)}-${padDatePart(month)}-${padDatePart(day)}`;

const isValidDateParts = (year, month, day) => {
  const date = toUtcDate(year, month, day);

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const getUtcToday = (today = new Date()) =>
  new Date(
    Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate()
    )
  );

export const formatBirthdateForInput = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    const parsedValue = parseBirthdateInput(value);
    return parsedValue?.iso ?? "";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return toDateOnlyString(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate()
  );
};

export const parseBirthdateInput = (value) => {
  const normalizedValue = String(value ?? "").trim();
  const match = DATE_ONLY_REGEX.exec(normalizedValue);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!isValidDateParts(year, month, day)) {
    return null;
  }

  return {
    year,
    month,
    day,
    iso: toDateOnlyString(year, month, day),
    date: toUtcDate(year, month, day),
  };
};

export const calculateAgeFromBirthdate = (value, today = new Date()) => {
  const normalizedValue =
    value instanceof Date ? formatBirthdateForInput(value) : value;
  const parsedBirthdate = parseBirthdateInput(normalizedValue);

  if (!parsedBirthdate) {
    return null;
  }

  const utcToday = getUtcToday(today);
  let age = utcToday.getUTCFullYear() - parsedBirthdate.year;

  if (
    utcToday.getUTCMonth() + 1 < parsedBirthdate.month ||
    (utcToday.getUTCMonth() + 1 === parsedBirthdate.month &&
      utcToday.getUTCDate() < parsedBirthdate.day)
  ) {
    age -= 1;
  }

  return age;
};

export const validateBirthdateRange = (
  value,
  { minAge = MIN_ALLOWED_AGE, maxAge = MAX_ALLOWED_AGE } = {}
) => {
  const parsedBirthdate = parseBirthdateInput(value);

  if (!parsedBirthdate) {
    return {
      isValid: false,
      age: null,
      error: "Birthdate must be a valid date.",
    };
  }

  const age = calculateAgeFromBirthdate(parsedBirthdate.iso);

  if (age === null || age < minAge || age > maxAge) {
    return {
      isValid: false,
      age,
      error: `Age must be between ${minAge} and ${maxAge} years old.`,
    };
  }

  return {
    isValid: true,
    age,
    date: parsedBirthdate.date,
    iso: parsedBirthdate.iso,
    error: "",
  };
};

export const getBirthdateInputBounds = (
  today = new Date(),
  { minAge = MIN_ALLOWED_AGE, maxAge = MAX_ALLOWED_AGE } = {}
) => {
  const utcToday = getUtcToday(today);
  const latestBirthdate = new Date(utcToday);
  const earliestBirthdate = new Date(utcToday);

  latestBirthdate.setUTCFullYear(latestBirthdate.getUTCFullYear() - minAge);
  earliestBirthdate.setUTCFullYear(
    earliestBirthdate.getUTCFullYear() - maxAge
  );

  return {
    min: formatBirthdateForInput(earliestBirthdate),
    max: formatBirthdateForInput(latestBirthdate),
  };
};
