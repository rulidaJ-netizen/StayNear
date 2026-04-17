export default function ListingStepProgress({ activeStep = 1 }) {
  return (
    <div className="listing-step-progress" aria-label={`Step ${activeStep} of 4`}>
      {[1, 2, 3, 4].map((step) => (
        <span
          key={step}
          className={`listing-step-segment ${
            step <= activeStep ? "is-active" : ""
          }`}
        />
      ))}
    </div>
  );
}
