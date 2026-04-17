import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LandownerNavbar from "../components/LandownerNavbar";
import { imageBaseUrl } from "../../../shared/api/client";
import { parseAmenities } from "../../../shared/utils/amenities";
import { getStoredUser } from "../../auth/api/authApi";
import {
  createLandownerListing,
  getLandownerListing,
  updateLandownerListing,
} from "../api/landownerApi";

const amenityOptions = [
  "WiFi",
  "Air Conditioning",
  "Study Desk",
  "Shared Kitchen",
  "Private Bathroom",
  "CCTV",
  "Laundry Area",
  "Parking",
  "Balcony",
];

export default function ListingWizard({ mode = "create" }) {
  const user = getStoredUser();
  const navigate = useNavigate();
  const { id } = useParams();

  const [step, setStep] = useState(1);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [newPhotos, setNewPhotos] = useState([]);
  const [form, setForm] = useState({
    property_name: "",
    description: "",
    contact_number: "",
    monthly_rent: "",
    total_rooms: "",
    available_rooms: "",
    amenities: [],
    location_city: "",
    full_address: "",
    distance_from_university: "",
    reference_map: "",
    room_type: "Standard Room",
    capacity: 1,
  });

  useEffect(() => {
    if (mode !== "edit" || !id) {
      return;
    }

    const fetchListing = async () => {
      try {
        const data = await getLandownerListing(id);

        setForm({
          property_name: data.name || "",
          description: data.description || "",
          contact_number: data.contact_number || "",
          monthly_rent: data.monthly_rent || "",
          total_rooms: data.total_rooms || "",
          available_rooms: data.available_rooms || "",
          amenities: parseAmenities(data.amenities_list ?? data.amenities),
          location_city: data.reference_map || "",
          full_address: data.location || "",
          distance_from_university: data.distance_from_university || "",
          reference_map: data.reference_map || "",
          room_type: data.room_type || "Standard Room",
          capacity: data.capacity || 1,
        });
        setExistingPhotos(data.photos || []);
      } catch (error) {
        console.error("Fetch listing error:", error);
      }
    };

    fetchListing();
  }, [id, mode]);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const toggleAmenity = (amenity) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((item) => item !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handlePhotoChange = (e) => {
    setNewPhotos(Array.from(e.target.files || []));
  };

  const submit = async () => {
    const formData = new FormData();

    formData.append("landowner_id", user.landowner_id);
    formData.append("property_name", form.property_name);
    formData.append("description", form.description);
    formData.append("contact_number", form.contact_number);
    formData.append("monthly_rent", form.monthly_rent);
    formData.append("total_rooms", form.total_rooms);
    formData.append("available_rooms", form.available_rooms);
    formData.append("amenities", JSON.stringify(form.amenities));
    formData.append("location_city", form.location_city);
    formData.append("full_address", form.full_address);
    formData.append("distance_from_university", form.distance_from_university);
    formData.append("reference_map", form.reference_map);
    formData.append("room_type", form.room_type);
    formData.append("capacity", form.capacity);

    newPhotos.forEach((file) => {
      formData.append("photos", file);
    });

    try {
      if (mode === "create") {
        await createLandownerListing(formData);
        alert("Listing published successfully");
      } else {
        await updateLandownerListing(id, formData);
        alert("Listing updated successfully");
      }

      navigate("/landowner/dashboard");
    } catch (error) {
      console.error("Submit listing error:", error);
      alert(error.response?.data?.message || "Failed to save listing");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <LandownerNavbar />

      <div className="max-w-4xl mx-auto py-10 px-6">
        <button
          onClick={() => navigate("/landowner/dashboard")}
          className="text-gray-600 mb-6"
        >
          Back to dashboard
        </button>

        <h1 className="text-5xl font-bold">
          {mode === "create" ? "Add Room" : "Edit Listing"}
        </h1>
        <p className="text-gray-500 text-2xl mt-3">Step {step} of 4</p>

        <div className="grid grid-cols-4 gap-4 mt-6 mb-8">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className={`h-3 rounded-full ${
                item <= step ? "bg-blue-500" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        <div className="bg-white border rounded-3xl p-8 shadow-sm">
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-3xl font-bold">Basic Information</h2>

              <div>
                <label className="block mb-2 font-medium">Property Name *</label>
                <input
                  name="property_name"
                  value={form.property_name}
                  onChange={handleChange}
                  className="w-full border rounded-2xl p-4"
                  placeholder="e.g. Cozy Student Room near UP"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Description *</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="w-full border rounded-2xl p-4 min-h-40"
                  placeholder="Describe the room, facilities, and nearby amenities..."
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Contact Number *</label>
                <input
                  name="contact_number"
                  value={form.contact_number}
                  onChange={handleChange}
                  className="w-full border rounded-2xl p-4"
                  placeholder="+63 917 123 4567"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-3xl font-bold">Upload Photos</h2>
              <p className="text-gray-500">
                Add high-quality photos to attract more students
              </p>

              {existingPhotos.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {existingPhotos.map((photo) => (
                    <img
                      key={photo.photo_id}
                      src={`${imageBaseUrl}${photo.photo_url}`}
                      alt="Listing"
                      className="w-full h-44 object-cover rounded-2xl border"
                    />
                  ))}
                </div>
              )}

              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoChange}
                className="w-full border rounded-2xl p-4"
              />

              {newPhotos.length > 0 && (
                <div className="text-gray-600">
                  {newPhotos.length} photo(s) selected
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-3xl font-bold">Pricing & Availability</h2>
              <p className="text-gray-500">
                Set your rental price and room availability
              </p>

              <div>
                <label className="block mb-2 font-medium">Monthly Rent (PHP) *</label>
                <input
                  type="number"
                  name="monthly_rent"
                  value={form.monthly_rent}
                  onChange={handleChange}
                  className="w-full border rounded-2xl p-4"
                  placeholder="5000"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-medium">Total Rooms *</label>
                  <input
                    type="number"
                    name="total_rooms"
                    value={form.total_rooms}
                    onChange={handleChange}
                    className="w-full border rounded-2xl p-4"
                    placeholder="5"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium">Available Rooms *</label>
                  <input
                    type="number"
                    name="available_rooms"
                    value={form.available_rooms}
                    onChange={handleChange}
                    className="w-full border rounded-2xl p-4"
                    placeholder="2"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 font-medium">Amenities *</label>
                <div className="flex flex-wrap gap-3">
                  {amenityOptions.map((amenity) => (
                    <button
                      type="button"
                      key={amenity}
                      onClick={() => toggleAmenity(amenity)}
                      className={`px-4 py-2 rounded-full ${
                        form.amenities.includes(amenity)
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {amenity}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-3xl font-bold">Location Details</h2>
              <p className="text-gray-500">
                Help students find your property easily
              </p>

              <div>
                <label className="block mb-2 font-medium">Location / City *</label>
                <input
                  name="location_city"
                  value={form.location_city}
                  onChange={handleChange}
                  className="w-full border rounded-2xl p-4"
                  placeholder="e.g. Quezon City"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Full Address *</label>
                <input
                  name="full_address"
                  value={form.full_address}
                  onChange={handleChange}
                  className="w-full border rounded-2xl p-4"
                  placeholder="Barangay, Municipality, City, Country"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">
                  Distance from University *
                </label>
                <input
                  name="distance_from_university"
                  value={form.distance_from_university}
                  onChange={handleChange}
                  className="w-full border rounded-2xl p-4"
                  placeholder="e.g. 500m from UP Diliman"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Reference Map</label>
                <input
                  name="reference_map"
                  value={form.reference_map}
                  onChange={handleChange}
                  className="w-full border rounded-2xl p-4"
                  placeholder="Paste Google Maps link if available"
                />
              </div>
            </div>
          )}

          <div className="border-t mt-8 pt-6 flex gap-4">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 bg-gray-100 rounded-2xl py-4 text-xl"
              >
                Previous
              </button>
            )}

            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="flex-1 bg-blue-500 text-white rounded-2xl py-4 text-xl"
              >
                Next
              </button>
            ) : (
              <button
                onClick={submit}
                className="flex-1 bg-emerald-500 text-white rounded-2xl py-4 text-xl"
              >
                {mode === "create" ? "Publish Listing" : "Save Changes"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
