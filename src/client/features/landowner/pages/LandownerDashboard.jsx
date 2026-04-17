import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LandownerNavbar from "../components/LandownerNavbar";
import LandownerListingCard from "../components/LandownerListingCard";
import { getStoredUser } from "../../auth/api/authApi";
import {
  deleteLandownerListing,
  getLandownerDashboard,
  toggleLandownerListingAvailability,
} from "../api/landownerApi";
import styles from "./LandownerDashboard.module.css";

const EMPTY_STATS = {
  totalListings: 0,
  activeListings: 0,
  totalViews: 0,
  availableRooms: 0,
};

const DASHBOARD_REFRESH_MS = 10000;

const getListingViewCount = (listing) =>
  Number(listing?.view_count ?? listing?.total_views ?? listing?.views ?? 0);

export default function LandownerDashboard() {
  const navigate = useNavigate();
  const storedUser = getStoredUser() || {};
  const landownerId = storedUser.landowner_id;

  const [boardingHouses, setBoardingHouses] = useState([]);
  const [apiStats, setApiStats] = useState(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchBoardingHouses = async ({ showLoading = false } = {}) => {
      try {
        if (showLoading && isMounted) {
          setLoading(true);
        }

        if (!landownerId) {
          if (!isMounted) {
            return;
          }

          setBoardingHouses([]);
          setApiStats(EMPTY_STATS);
          return;
        }

        const data = await getLandownerDashboard(landownerId);
        const items = Array.isArray(data) ? data : data?.listings || [];

        if (!isMounted) {
          return;
        }

        setBoardingHouses(items);
        setApiStats(data?.stats || EMPTY_STATS);
      } catch (error) {
        console.error("Failed to fetch boarding houses:", error);

        if (showLoading && isMounted) {
          setBoardingHouses([]);
          setApiStats(EMPTY_STATS);
        }
      } finally {
        if (showLoading && isMounted) {
          setLoading(false);
        }
      }
    };

    fetchBoardingHouses({ showLoading: true });

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchBoardingHouses();
      }
    }, DASHBOARD_REFRESH_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchBoardingHouses();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [landownerId]);

  const stats = useMemo(() => {
    if (apiStats.totalListings || apiStats.activeListings || apiStats.totalViews) {
      return apiStats;
    }

    const totalListings = boardingHouses.length;
    const availableRooms = boardingHouses.reduce(
      (sum, item) => sum + Number(item.available_rooms || 0),
      0
    );
    const activeListings = boardingHouses.filter(
      (item) => item.availability_status === "available"
    ).length;
    const totalViews = boardingHouses.reduce(
      (sum, item) => sum + getListingViewCount(item),
      0
    );

    return {
      totalListings,
      availableRooms,
      totalViews,
      activeListings,
    };
  }, [apiStats, boardingHouses]);

  const handleToggleAvailability = async (id, currentStatus) => {
    const newStatus =
      currentStatus === "available" ? "unavailable" : "available";

    try {
      await toggleLandownerListingAvailability(id, newStatus);

      setBoardingHouses((prev) =>
        prev.map((item) =>
          item.boardinghouse_id === id
            ? { ...item, availability_status: newStatus }
            : item
        )
      );
    } catch (error) {
      console.error("Failed to update availability:", error);
      alert("Failed to update availability.");
    }
  };

  const handleEdit = (id) => {
    navigate(`/landowner/edit-room/${id}`);
  };

  const handleViewRoom = (id) => {
    navigate(`/room/${id}`);
  };

  const handleDeleteRequest = (id) => {
    setPendingDeleteId(id);
  };

  const handleDelete = async () => {
    if (!pendingDeleteId) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteLandownerListing(pendingDeleteId);
      setBoardingHouses((prev) =>
        prev.filter((item) => item.boardinghouse_id !== pendingDeleteId)
      );
      setPendingDeleteId(null);
    } catch (error) {
      console.error("Delete listing error:", error);
      alert(error.response?.data?.message || "Failed to delete listing.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.page}>
      <LandownerNavbar />

      <main className={styles.main}>
        <section className={styles.hero}>
          <h1 className={styles.title}>Landowner Dashboard</h1>
          <p className={styles.subtitle}>
            Manage your property listings and track performance
          </p>
        </section>

        <section className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h2>{stats.totalListings}</h2>
            <p>Total Listings</p>
          </div>

          <div className={`${styles.statCard} ${styles.green}`}>
            <h2>{stats.availableRooms}</h2>
            <p>Available Rooms</p>
          </div>

          <div className={styles.statCard}>
            <h2>{stats.totalViews}</h2>
            <p>Total Views</p>
          </div>

          <div className={styles.statCard}>
            <h2>{stats.activeListings}</h2>
            <p>Active Listings</p>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Active Listings</h2>

            <button
              type="button"
              className={styles.addButton}
              onClick={() => navigate("/landowner/add-room")}
            >
              <Plus size={18} />
              <span>Add New Room</span>
            </button>
          </div>

          {loading ? (
            <p className={styles.stateText}>Loading boarding houses...</p>
          ) : boardingHouses.length === 0 ? (
            <p className={styles.stateText}>No boarding houses found.</p>
          ) : (
            <div className={styles.listGrid}>
              {boardingHouses.map((item) => (
                <LandownerListingCard
                  key={item.boardinghouse_id}
                  listing={item}
                  onToggleAvailability={handleToggleAvailability}
                  onView={handleViewRoom}
                  onEdit={handleEdit}
                  onDelete={handleDeleteRequest}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {pendingDeleteId ? (
        <div
          className={styles.modalOverlay}
          role="presentation"
          onClick={() => {
            if (!isDeleting) {
              setPendingDeleteId(null);
            }
          }}
        >
          <div
            className={styles.modalCard}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-listing-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="delete-listing-title" className={styles.modalTitle}>
              Delete Listing
            </h2>
            <p className={styles.modalText}>
              Are you sure you want to delete this listing? This action cannot
              be undone.
            </p>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCancelButton}
                onClick={() => setPendingDeleteId(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className={styles.modalDeleteButton}
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
