import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { getFavoriteMovies, toggleFavoriteMovie } from "./appwrite";

interface FavoriteMovie {
  movie_id: string;
  title: string;
}

interface FavoritesContextType {
  favorites: FavoriteMovie[];
  isLoading: boolean;
  toggleFavorite: (movieId: string | number) => Promise<void>;
  isMovieFavorited: (movieId: string | number) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState<FavoriteMovie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getFavoriteMovies();
      setFavorites(data as FavoriteMovie[]);
    } catch (error) {
      console.error("Failed to load favorites:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const toggleFavorite = async (movieId: string | number) => {
    await toggleFavoriteMovie(movieId);
    await loadFavorites();
  };

  const isMovieFavorited = (movieId: string | number) => {
    return favorites.some((fav) => fav.movie_id === String(movieId));
  };

  return (
    <FavoritesContext.Provider
      value={{ favorites, isLoading, toggleFavorite, isMovieFavorited }}
    >
      {/* {isLoading ? <View style={{flex: 1, justifyContent: 'center'}}><ActivityIndicator /></View> : children} */}
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
};
