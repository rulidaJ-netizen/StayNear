import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./StudentDashboard.css";
import StudentNavbar from "../components/StudentNavbar";
import PropertyCard from "../components/PropertyCard";
import { imageBaseUrl } from "../../../shared/api/client";
import { parseAmenities } from "../../../shared/utils/amenities";
import {
  getStudentListings,
  recordStudentRoomView,
} from "../api/studentApi";
import { useStudentFavorites } from "../context/useStudentFavorites";

const PLACEHOLDER_IMAGE =
  "https://via.placeholder.com/700x420?text=StayNear+Property";

const AMENITY_FILTERS = [
  "wifi",
  "air conditioning",
  "study desk",
  "shared kitchen",
  "private room",
  "cctv",
  "laundry area",
  "parking",
  "balcony",
];

const normalizeProperty = (property) => {
  const amenitiesRaw = parseAmenities(property.amenities_list ?? property.amenities);
  const amenitiesLower = amenitiesRaw.map(a => a.toLowerCase().trim());

  return {
    id: property.boardinghouse_id,
    boardinghouse_id: property.boardinghouse_id,
    title: property.name,
    location: property.location,
    price: Number(property.min_price || 0),
    available: Number(property.available_rooms || 0),
    amenities: amenitiesLower,
    image: property.photo_url
      ? `${imageBaseUrl}${property.photo_url}`
      : PLACEHOLDER_IMAGE,
  };
};

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const {
    favoritesCount,
    isFavorite,
    isPending,
    toggleFavorite,
  } = useStudentFavorites();

  useEffect(() => {
    const loadStudentDashboard = async () => {
      try {
        setLoading(true);
        const listingsData = await getStudentListings();
        const listings = Array.isArray(listingsData)
          ? listingsData
          : listingsData?.listings || [];
        setProperties(listings.map(normalizeProperty));
      } catch (error) {
        console.error("Student dashboard load error:", error);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };
    loadStudentDashboard();
  }, []);

  const toggleFilter = (filter) => {
    setSelectedFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const filteredProperties = useMemo(() => {
    return properties.filter((item) => {
      const keyword = search.toLowerCase();
      const matchesSearch =
        item.title.toLowerCase().includes(keyword) ||
        item.location.toLowerCase().includes(keyword);

      let matchesAmenities = true;
      if (selectedFilters.length > 0) {
        matchesAmenities = selectedFilters.every(filter =>
          item.amenities.includes(filter)
        );
      }

      return matchesSearch && matchesAmenities;
    });
  }, [properties, search, selectedFilters]);

  const handleFavoriteToggle = async (property) => {
    const result = await toggleFavorite(property);
    if (!result.ok && result.message) {
      alert(result.message);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedFilters([]);
  };

  const handleViewRoom = (id) => {
    recordStudentRoomView(id).catch((error) => {
      console.error("Failed to record room view:", error);
    });
    navigate(`/room/${id}`);
  };

  return (
    <div className="student-page">
      <StudentNavbar favoritesCount={favoritesCount} />

      <section className="student-hero compact">
        <h1>Find Your Perfect Boarding House</h1>
        <p>Search from hundreds of verified properties near your university</p>

        <div className="search-row compact">
          <div className="search-box compact">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by location or property name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="amenities-filter-section compact">
        <div className="filter-header">
          <SlidersHorizontal size={16} />
          <span>Filter by Amenities</span>
        </div>
        <div className="amenities-grid">
          {AMENITY_FILTERS.map(amenity => (
            <button
              key={amenity}
              className={`amenity-filter-btn ${selectedFilters.includes(amenity) ? "active" : ""}`}
              onClick={() => toggleFilter(amenity)}
            >
              {amenity}
            </button>
          ))}
        </div>
      </div>

      <section className="student-content compact">
        <div className="results-row compact">
          <div className="results-count">
            {loading
              ? "Loading listings..."
              : `${filteredProperties.length} properties found`}
          </div>

          <button type="button" className="clear-btn" onClick={clearFilters}>
            Clear all filters
          </button>
        </div>

        <div className="property-grid compact">
          {filteredProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              isFavorite={isFavorite(property.boardinghouse_id)}
              onFavoriteToggle={handleFavoriteToggle}
              onView={handleViewRoom}
              disabled={isPending(property.boardinghouse_id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
