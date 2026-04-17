import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { deleteLandownerListing } from "../api/landownerApi";

export default function DeleteRoom() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      await deleteLandownerListing(id);
      navigate("/landowner/dashboard");
    } catch (error) {
      console.error("Delete failed:", error);
      alert(error.response?.data?.message || "Failed to delete listing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      <h1>Delete Listing</h1>
      <p>Are you sure you want to delete this listing?</p>

      <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
        <button onClick={() => navigate(-1)}>Cancel</button>
        <button onClick={handleDelete} disabled={loading}>
          {loading ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );
}
