import api from "../../../shared/api/client";

const ROOM_VIEW_DEBOUNCE_MS = 3000;
const ROOM_VIEW_STORAGE_PREFIX = "student-room-view";

const shouldSkipRoomView = (id) => {
  try {
    const storageKey = `${ROOM_VIEW_STORAGE_PREFIX}:${id}`;
    const now = Date.now();
    const lastTrackedAt = Number(sessionStorage.getItem(storageKey));

    if (Number.isFinite(lastTrackedAt) && now - lastTrackedAt < ROOM_VIEW_DEBOUNCE_MS) {
      return true;
    }

    sessionStorage.setItem(storageKey, String(now));
  } catch (error) {
    console.error("Room view cache error:", error);
  }

  return false;
};

export const getStudentListings = async (params = {}) => {
  const response = await api.get("/student/boarding-houses", { params });
  return response.data;
};

export const getStudentListingById = async (id) => {
  const response = await api.get(`/student/boarding-houses/${id}`);
  return response.data;
};

export const recordStudentRoomView = async (id) => {
  if (shouldSkipRoomView(id)) {
    return { skipped: true };
  }

  const response = await api.post(`/student/room/${id}/view`);
  return response.data;
};

export const getStudentProfile = async (studentId) => {
  const response = await api.get(`/student/profile/${studentId}`);
  return response.data;
};

export const getUserProfile = async (studentId) => {
  const response = await api.get("/user/profile", {
    params: { student_id: studentId },
  });
  return response.data;
};

export const updateUserProfile = async (payload) => {
  const response = await api.put("/user/update", payload);
  return response.data;
};

export const uploadUserAvatar = async (studentId, file) => {
  const formData = new FormData();
  formData.append("student_id", studentId);
  formData.append("avatar", file);

  const response = await api.post("/user/upload-avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const updateStudentProfile = async (studentId, payload) => {
  const response = await api.put(`/student/profile/${studentId}`, payload);
  return response.data;
};

export const getFavorites = async (studentId) => {
  const response = await api.get(`/student/favorites/${studentId}`);
  return response.data;
};

export const addFavorite = async (studentId, boardinghouseId) => {
  const response = await api.post("/student/favorites", {
    student_id: studentId,
    boardinghouse_id: boardinghouseId,
  });

  return response.data;
};

export const removeFavorite = async (studentId, boardinghouseId) => {
  const response = await api.delete(
    `/student/favorites/${studentId}/${boardinghouseId}`
  );

  return response.data;
};
