import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getStoredUser } from "../../auth/api/authApi";
import { useAuthSession } from "../../auth/context/useAuthSession";
import { addFavorite, getFavorites, removeFavorite } from "../api/studentApi";
import { StudentFavoritesContext } from "./useStudentFavorites";

const extractBoardinghouseId = (item) =>
  Number(item?.boardinghouse_id ?? item?.id);

const dedupeFavorites = (items) => {
  const favoritesMap = new Map();

  items.forEach((item) => {
    const boardinghouseId = extractBoardinghouseId(item);

    if (!Number.isInteger(boardinghouseId) || boardinghouseId <= 0) {
      return;
    }

    favoritesMap.set(boardinghouseId, {
      ...favoritesMap.get(boardinghouseId),
      ...item,
      boardinghouse_id: boardinghouseId,
    });
  });

  return Array.from(favoritesMap.values());
};

const normalizeAvailability = (item) => {
  const explicitStatus = String(item?.availability_status || "")
    .trim()
    .toLowerCase();

  if (explicitStatus) {
    return explicitStatus;
  }

  return Number(item?.available_rooms ?? item?.available ?? 0) > 0
    ? "available"
    : "unavailable";
};

const normalizeAmenitiesList = (item) => {
  if (Array.isArray(item?.amenities_list)) {
    return item.amenities_list.filter(Boolean);
  }

  if (typeof item?.amenities === "string" && item.amenities.trim()) {
    return item.amenities
      .split(",")
      .map((amenity) => amenity.trim())
      .filter(Boolean);
  }

  const amenities = [];

  if (item?.wifi) {
    amenities.push("WiFi");
  }

  if (item?.kitchen) {
    amenities.push("Shared Kitchen");
  }

  return amenities;
};

const createOptimisticFavorite = (item) => {
  const boardinghouseId = extractBoardinghouseId(item);

  return {
    favorite_id: `optimistic-${boardinghouseId}`,
    boardinghouse_id: boardinghouseId,
    name: item?.name ?? item?.title ?? "Boarding House",
    location: item?.location ?? "",
    availability_status: normalizeAvailability(item),
    amenities_list: normalizeAmenitiesList(item),
    description: item?.description ?? "",
    contact_number: item?.contact_number ?? item?.contactNumber ?? "",
    distance_from_university:
      item?.distance_from_university ?? item?.distanceFromUniversity ?? "",
    reference_map: item?.reference_map ?? item?.referenceMap ?? "",
    min_price: Number(item?.min_price ?? item?.price ?? 0),
    available_rooms: Number(item?.available_rooms ?? item?.available ?? 0),
    photo_url: item?.photo_url ?? "",
    image_url: item?.image_url ?? item?.image ?? "",
  };
};

const buildErrorMessage = (error, fallbackMessage) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  fallbackMessage;

export function StudentFavoritesProvider({ children }) {
  const fallbackUser = getStoredUser();
  const { user, patchUser } = useAuthSession();
  const sessionUser = user || fallbackUser;
  const isStudentSession = sessionUser?.account_type === "student";
  const studentId = isStudentSession ? sessionUser?.student_id : null;

  const [favorites, setFavorites] = useState([]);
  const [pendingIds, setPendingIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const favoritesCountRef = useRef(Number(sessionUser?.favorites_count || 0));

  useEffect(() => {
    favoritesCountRef.current = Number(sessionUser?.favorites_count || 0);
  }, [sessionUser?.favorites_count]);

  const favoriteIds = useMemo(
    () =>
      favorites
        .map((item) => extractBoardinghouseId(item))
        .filter((value) => Number.isInteger(value) && value > 0),
    [favorites]
  );

  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const syncFavoritesCount = useCallback(
    (count) => {
      if (!isStudentSession) {
        return;
      }

      if (favoritesCountRef.current === count) {
        return;
      }

      patchUser({ favorites_count: count });
    },
    [isStudentSession, patchUser]
  );

  const applyFavorites = useCallback(
    (items) => {
      const nextFavorites = dedupeFavorites(items);
      setFavorites(nextFavorites);
      syncFavoritesCount(nextFavorites.length);
      return nextFavorites;
    },
    [syncFavoritesCount]
  );

  const refreshFavorites = useCallback(async () => {
    if (!studentId) {
      applyFavorites([]);
      setIsLoading(false);
      return [];
    }

    setIsLoading(true);

    try {
      const data = await getFavorites(studentId);
      return applyFavorites(data?.favorites || []);
    } catch (error) {
      console.error("Refresh favorites error:", error);
      applyFavorites([]);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [applyFavorites, studentId]);

  useEffect(() => {
    let isMounted = true;

    const loadFavorites = async () => {
      if (!studentId) {
        if (isMounted) {
          setPendingIds([]);
          setFavorites([]);
          setIsLoading(false);
        }
        return;
      }

      if (isMounted) {
        setIsLoading(true);
      }

      try {
        const data = await getFavorites(studentId);

        if (!isMounted) {
          return;
        }

        applyFavorites(data?.favorites || []);
      } catch (error) {
        console.error("Load favorites error:", error);

        if (isMounted) {
          applyFavorites([]);
        }
      } finally {
        if (isMounted) {
          setPendingIds([]);
          setIsLoading(false);
        }
      }
    };

    loadFavorites();

    return () => {
      isMounted = false;
    };
  }, [applyFavorites, studentId]);

  const isFavorite = useCallback(
    (boardinghouseId) => favoriteIdSet.has(Number(boardinghouseId)),
    [favoriteIdSet]
  );

  const isPending = useCallback(
    (boardinghouseId) => pendingIds.includes(Number(boardinghouseId)),
    [pendingIds]
  );

  const toggleFavorite = useCallback(
    async (item) => {
      if (!studentId) {
        return {
          ok: false,
          message: "Student account not found. Please log in again.",
        };
      }

      const boardinghouseId = extractBoardinghouseId(item);

      if (!Number.isInteger(boardinghouseId) || boardinghouseId <= 0) {
        return {
          ok: false,
          message: "Invalid room selected.",
        };
      }

      if (pendingIds.includes(boardinghouseId)) {
        return {
          ok: false,
          message: "",
        };
      }

      const currentlyFavorited = favoriteIdSet.has(boardinghouseId);
      const previousFavorites = favorites;

      setPendingIds((prev) =>
        prev.includes(boardinghouseId) ? prev : [...prev, boardinghouseId]
      );

      try {
        if (currentlyFavorited) {
          applyFavorites(
            previousFavorites.filter(
              (favorite) => extractBoardinghouseId(favorite) !== boardinghouseId
            )
          );

          try {
            await removeFavorite(studentId, boardinghouseId);
          } catch (error) {
            if (error?.response?.status !== 404) {
              throw error;
            }
          }

          return {
            ok: true,
            action: "removed",
          };
        }

        applyFavorites([...previousFavorites, createOptimisticFavorite(item)]);

        try {
          await addFavorite(studentId, boardinghouseId);
        } catch (error) {
          if (error?.response?.status !== 409) {
            throw error;
          }
        }

        await refreshFavorites();

        return {
          ok: true,
          action: "added",
        };
      } catch (error) {
        console.error("Toggle favorite error:", error);
        applyFavorites(previousFavorites);

        return {
          ok: false,
          message: buildErrorMessage(error, "Failed to update favorites"),
        };
      } finally {
        setPendingIds((prev) => prev.filter((id) => id !== boardinghouseId));
      }
    },
    [applyFavorites, favoriteIdSet, favorites, pendingIds, refreshFavorites, studentId]
  );

  const value = useMemo(
    () => ({
      favorites,
      favoriteIds,
      favoritesCount: favoriteIds.length,
      isFavorite,
      isLoading,
      isPending,
      refreshFavorites,
      toggleFavorite,
    }),
    [
      favoriteIds,
      favorites,
      isFavorite,
      isLoading,
      isPending,
      refreshFavorites,
      toggleFavorite,
    ]
  );

  return (
    <StudentFavoritesContext.Provider value={value}>
      {children}
    </StudentFavoritesContext.Provider>
  );
}
