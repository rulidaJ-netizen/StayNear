import {
  validateEmailField,
  validateFullNameField,
} from "../../../shared/utils/inputValidation";

export const validateProfileForm = (form) => {
  const errors = {};

  const fullNameError = validateFullNameField(form.full_name, {
    label: "Full name",
  });
  const emailError = validateEmailField(form.email);

  if (fullNameError) {
    errors.full_name = fullNameError;
  }

  if (emailError) {
    errors.email = emailError;
  }

  return errors;
};
