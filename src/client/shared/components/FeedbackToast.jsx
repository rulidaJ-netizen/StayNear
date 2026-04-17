export default function FeedbackToast({ type = "success", message = "" }) {
  if (!message) {
    return null;
  }

  return (
    <div className={`feedback-toast ${type}`}>
      <span>{message}</span>
    </div>
  );
}
