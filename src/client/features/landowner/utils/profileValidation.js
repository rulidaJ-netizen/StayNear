const FULL_NAME_REGEX = /^[\p{L}][\p{L}\s.'-]*$/u;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateLandownerProfileForm = (form) => {
  const errors = {};
  const fullName = String(form.full_name || "").trim();
  const email = String(form.email || "").trim().toLowerCase();

  if (!fullName) {
    errors.full_name = "Full name is required.";
  } else if (!FULL_NAME_REGEX.test(fullName)) {
    errors.full_name = "Full name must contain letters only.";
  }

  if (!email) {
    errors.email = "Email address is required.";
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = "Please enter a valid email address.";
  }

  return errors;
};
