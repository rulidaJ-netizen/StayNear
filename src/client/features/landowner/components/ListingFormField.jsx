export default function ListingFormField({
  label,
  required = false,
  error = "",
  children,
}) {
  return (
    <div className="listing-form-field">
      <label className="listing-form-label">
        <span>{label}</span>
        {required && <span className="listing-required-mark">*</span>}
      </label>
      {children}
      {error ? <div className="listing-form-error">{error}</div> : null}
    </div>
  );
}
