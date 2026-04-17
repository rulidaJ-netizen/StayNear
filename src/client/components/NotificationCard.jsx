import { useEffect } from "react";
import "./NotificationCard.css";

export const NotificationCard = ({ message, type = "error", onClose, duration = 5000 }) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className={`notification-card ${type}`}>
      <span className="message">{message}</span>
      <button className="close-btn" onClick={onClose}>×</button>
    </div>
  );
};