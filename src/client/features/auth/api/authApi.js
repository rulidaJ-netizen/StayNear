import api from "../../../shared/api/client";

const USER_STORAGE_KEY = "user";
const TOKEN_STORAGE_KEY = "token";

export const normalizeAuthUser = (user) => {
  if (!user || typeof user !== "object") {
    return null;
  }

  const accountType = String(user.account_type ?? user.accountType ?? "")
    .trim()
    .toLowerCase();

  return {
    ...user,
    account_id: user.account_id ?? user.accountId ?? null,
    account_type: accountType,
    full_name: user.full_name ?? user.fullName ?? "",
    avatar_url: user.avatar_url ?? user.avatarUrl ?? "",
    favorites_count:
      user.favorites_count ?? user.favoritesCount ?? user.favorites?.length ?? 0,
    student_id:
      user.student_id ?? user.studentId ?? user.student?.studentId ?? null,
    landowner_id:
      user.landowner_id ??
      user.landownerId ??
      user.landowner?.landownerId ??
      null,
  };
};

export const storeUser = (user) => {
  const normalizedUser = normalizeAuthUser(user);

  if (normalizedUser) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalizedUser));
  }

  return normalizedUser;
};

export const registerUser = async (userData) => {
  const response = await api.post("/auth/register", userData);
  return response.data;
};

export const loginUser = async (userData) => {
  const response = await api.post("/auth/login", userData);
  return response.data;
};

export const getStoredUser = () => {
  const storedUser = localStorage.getItem(USER_STORAGE_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return normalizeAuthUser(JSON.parse(storedUser));
  } catch (error) {
    console.error("Invalid user data in localStorage:", error);
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
};

export const logoutUser = () => {
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

export const updateStoredUser = (patch) => {
  const currentUser = getStoredUser();

  if (!currentUser) {
    return null;
  }

  const nextUser =
    typeof patch === "function" ? patch(currentUser) : { ...currentUser, ...patch };

  return storeUser(nextUser);
};
