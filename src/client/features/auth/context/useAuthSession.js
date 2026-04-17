import { createContext, useContext } from "react";

export const AuthContext = createContext(null);

export function useAuthSession() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthSession must be used within an AuthProvider");
  }

  return context;
}
