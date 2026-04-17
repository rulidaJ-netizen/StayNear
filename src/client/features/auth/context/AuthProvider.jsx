import { useCallback, useMemo, useState } from "react";
import {
  getStoredUser,
  logoutUser,
  storeUser,
  updateStoredUser,
} from "../api/authApi";
import { AuthContext } from "./useAuthSession";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());

  const saveSessionUser = useCallback((nextUser) => {
    const stored = storeUser(nextUser);
    setUser(stored);
    return stored;
  }, []);

  const patchSessionUser = useCallback((patch) => {
    const stored = updateStoredUser(patch);
    setUser(stored);
    return stored;
  }, []);

  const clearSessionUser = useCallback(() => {
    logoutUser();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser: saveSessionUser,
      patchUser: patchSessionUser,
      clearUser: clearSessionUser,
    }),
    [clearSessionUser, patchSessionUser, saveSessionUser, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
