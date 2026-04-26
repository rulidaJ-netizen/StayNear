import axios from "axios";
import api from "../../../shared/api/client";

const trimTrailingSlashes = (value) => String(value ?? "").replace(/\/+$/, "");

const resolveDirectPhotoUploadUrl = (boardingHouseId) => {
  const configuredApiUrl = String(import.meta.env.VITE_API_URL || "").trim();

  if (!configuredApiUrl) {
    return "";
  }

  try {
    const url = new URL(configuredApiUrl);
    const apiPath =
      url.pathname && url.pathname !== "/"
        ? trimTrailingSlashes(url.pathname)
        : "/api";

    url.pathname = `${apiPath}/landowner/boarding-houses/${boardingHouseId}/photos`;
    url.search = "";
    url.hash = "";

    return url.toString();
  } catch {
    return "";
  }
};

export const getLandownerDashboard = async (landownerId) => {
  const res = await api.get(
    `/landowner/boarding-houses/dashboard/${landownerId}`
  );
  return res.data;
};

export const getLandownerProfile = async (landownerId) => {
  const res = await api.get("/landowner/profile", {
    params: { landowner_id: landownerId },
  });
  return res.data;
};

export const updateLandownerProfile = async (landownerIdOrPayload, payload) => {
  const body =
    typeof landownerIdOrPayload === "object"
      ? landownerIdOrPayload
      : {
          landowner_id: landownerIdOrPayload,
          ...(payload || {}),
        };

  const res = await api.put("/landowner/profile/update", body);
  return res.data;
};

export const uploadLandownerAvatar = async (landownerId, file) => {
  const formData = new FormData();
  formData.append("landowner_id", landownerId);
  formData.append("avatar", file);

  const res = await api.post(
    "/landowner/profile/upload-avatar",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  return res.data;
};

export const getLandownerFavoritesOverview = async (landownerId) => {
  const res = await api.get("/landowner/profile/favorites", {
    params: { landowner_id: landownerId },
  });
  return res.data;
};

export const createBoardingHouseDraft = async (payload) => {
  const res = await api.post(
    "/landowner/boarding-houses/draft",
    payload
  );
  return res.data;
};

export const getLandownerListing = async (boardingHouseId) => {
  const res = await api.get(
    `/landowner/boarding-houses/${boardingHouseId}`
  );
  return res.data;
};

export const createLandownerListing = async (formData) => {
  const res = await api.post(
    "/landowner/boarding-houses",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return res.data;
};

export const updateLandownerListing = async (boardingHouseId, payload) => {
  const isFormData = payload instanceof FormData;

  const res = await api.put(
    `/landowner/boarding-houses/${boardingHouseId}`,
    payload,
    isFormData
      ? { headers: { "Content-Type": "multipart/form-data" } }
      : undefined
  );

  return res.data;
};

export const uploadBoardingHousePhotos = async (
  boardingHouseId,
  formData,
  options = {}
) => {
  const directUploadUrl = resolveDirectPhotoUploadUrl(boardingHouseId);
  const token = localStorage.getItem("token");
  const config = {
    onUploadProgress: options.onUploadProgress,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  };
  const request = directUploadUrl
    ? axios.post(directUploadUrl, formData, config)
    : api.post(`/landowner/boarding-houses/${boardingHouseId}/photos`, formData, config);
  const res = await request;

  return res.data;
};

export const savePricingAvailabilityDraft = async (
  boardingHouseId,
  payload
) => updateLandownerListing(boardingHouseId, payload);

export const saveLocationDetailsDraft = async (
  boardingHouseId,
  payload
) => updateLandownerListing(boardingHouseId, payload);

export const toggleLandownerListingAvailability = async (
  boardingHouseId,
  availabilityStatus
) => {
  const res = await api.patch(
    `/landowner/boarding-houses/${boardingHouseId}/availability`,
    { availability_status: availabilityStatus }
  );

  return res.data;
};

export const deleteLandownerListing = async (boardingHouseId) => {
  const res = await api.delete(
    `/landowner/boarding-houses/${boardingHouseId}`
  );

  return res.data;
};

export const createRoomBasicInfo = async (payload) => {
  const res = await api.post("/landowner/rooms", payload);
  return res.data;
};

export const getRoomBasicInfoById = async (propertyId) => {
  if (!propertyId) {
    throw new Error("propertyId is required");
  }

  const res = await api.get(`/landowner/boarding-houses/${propertyId}`);
  return res.data;
};

export const updateRoomBasicInfo = async (propertyId, data) => {
  if (!propertyId) {
    throw new Error("propertyId is required");
  }

  const payload = {
    property_name: String(
      data?.property_name ?? data?.propertyName ?? ""
    ).trim(),
    description: String(data?.description ?? "").trim(),
    contact_number: String(
      data?.contact_number ?? data?.contactNumber ?? ""
    ).trim(),
  };

  const res = await api.put(
    `/landowner/boarding-houses/${propertyId}`,
    payload
  );
  return res.data;
};
