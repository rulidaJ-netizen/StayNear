import { Check } from "lucide-react";

export default function AmenityChip({
  label,
  selected = false,
  onToggle,
}) {
  return (
    <button
      type="button"
      className={`amenity-chip ${selected ? "is-selected" : ""}`}
      onClick={onToggle}
      aria-pressed={selected}
    >
      {selected ? <Check size={16} strokeWidth={2.8} /> : null}
      <span>{label}</span>
    </button>
  );
}
