import {
  validateBirthdateField,
  validateContactNumberField,
  validateEmailField,
  validateNameField,
} from "../../../shared/utils/inputValidation";

const normalizeString = (value) => String(value ?? "").trim();

export const validateRegisterForm = (form) => {
  const errors = {};

  const firstNameError = validateNameField(form.firstName, "First name");
  const lastNameError = validateNameField(form.lastName, "Last name");
  const middleNameError = validateNameField(form.middleName, "Middle name", {
    required: false,
  });
  const emailError = validateEmailField(form.email);
  const contactNumberError = validateContactNumberField(form.mobile_no);

  if (firstNameError) {
    errors.firstName = firstNameError;
  }

  if (lastNameError) {
    errors.lastName = lastNameError;
  }

  if (middleNameError) {
    errors.middleName = middleNameError;
  }

  if (emailError) {
    errors.email = emailError;
  }

  if (contactNumberError) {
    errors.mobile_no = contactNumberError;
  }

  if (!normalizeString(form.password)) {
    errors.password = "Password is required.";
  } else if (String(form.password).length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  if (!normalizeString(form.confirmPassword)) {
    errors.confirmPassword = "Confirm password is required.";
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (!normalizeString(form.gender)) {
    errors.gender = "Gender is required.";
  }

  const birthdateError = validateBirthdateField(form.birthdate, "Birthday");

  if (birthdateError) {
    errors.birthdate = birthdateError;
  }

  return errors;
};
