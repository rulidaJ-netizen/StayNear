import { createContext, useContext } from "react";

export const StudentFavoritesContext = createContext(null);

export function useStudentFavorites() {
  const context = useContext(StudentFavoritesContext);

  if (!context) {
    throw new Error(
      "useStudentFavorites must be used within a StudentFavoritesProvider"
    );
  }

  return context;
}
