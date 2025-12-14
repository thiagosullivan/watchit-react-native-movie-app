import { Client, Databases, ID, Query } from "react-native-appwrite";
import { TMDB_CONFIG } from "./api";

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const METRICS_ID = process.env.EXPO_PUBLIC_APPWRITE_METRICS_TABLES_ID!;
const FAVORITES_ID = process.env.EXPO_PUBLIC_APPWRITE_FAVORITES_TABLES_ID!;

const client = new Client()
  .setEndpoint("https://nyc.cloud.appwrite.io/v1")
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!);

const databases = new Databases(client);

export const updateSearchCount = async (
  query: string,
  movie?: Movie | null
) => {
  if (!query || query.trim() === "") {
    console.log("Query de busca vazia, pulando atualização.");
    return;
  }

  console.log(movie, "MOVIE INFOS");

  try {
    const result = await databases.listDocuments({
      databaseId: DATABASE_ID,
      collectionId: METRICS_ID,
      queries: [Query.equal("searchTerm", query)],
    });

    console.log(
      "Resultado da busca no Appwrite (documents):",
      result.documents
    );

    if (result.documents.length > 0) {
      const existingDocument = result.documents[0];
      const newCount = existingDocument.count + 1;

      await databases.updateDocument({
        databaseId: DATABASE_ID,
        collectionId: METRICS_ID,
        documentId: existingDocument.$id,
        data: {
          count: newCount,
        },
      });
      console.log(`Contagem atualizada para ${newCount}`);
    } else {
      await databases.createDocument({
        databaseId: DATABASE_ID,
        collectionId: METRICS_ID,
        documentId: ID.unique(),
        data: {
          searchTerm: query,
          count: 1,
          title: movie?.title,
          movie_id: movie?.id,
          poster_url: `https://image.tmdb.org/t/p/w500${movie?.poster_path}`,
        },
      });
      console.log(`New query created: ${query}`);
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

export const getTrendingMovies = async (): Promise<
  TrendingMovie[] | undefined
> => {
  try {
    const result = await databases.listDocuments({
      databaseId: DATABASE_ID,
      collectionId: METRICS_ID,
      queries: [Query.limit(5), Query.orderDesc("count")],
    });

    return result.documents as unknown as TrendingMovie[];
  } catch (error) {
    console.error(error);
    return undefined;
  }
};

export const toggleFavoriteMovie = async (movieId: string | number | null) => {
  if (!movieId) {
    console.error("Movie ID é nulo ou inválido.");
    return;
  }

  console.log(`Tentando alternar favorito para Movie ID: ${movieId}`);

  try {
    // 1. Fazer fetch dos detalhes do filme no TMDB
    const response = await fetch(
      `${TMDB_CONFIG.BASE_URL}/movie/${movieId}?api_key=${TMDB_CONFIG.API_KEY}`,
      {
        method: "GET",
        headers: TMDB_CONFIG.headers,
      }
    );

    if (!response.ok) {
      throw new Error("Falha ao buscar detalhes do filme no TMDB");
    }

    const movieData = await response.json();

    // Formatar os dados para o Appwrite
    const formattedMovieData = {
      movie_id: String(movieData.id), // Garantir que o ID é string para o Appwrite
      title: movieData.title,
      release_date: movieData.release_date,
      poster_url: `image.tmdb.org{movieData.poster_path}`,
    };

    // 2. Verificar se o filme já existe na coleção de favoritos do Appwrite
    const existingFavorites = await databases.listDocuments({
      databaseId: DATABASE_ID,
      collectionId: FAVORITES_ID,
      queries: [Query.equal("movie_id", formattedMovieData.movie_id)],
    });

    if (existingFavorites.documents.length > 0) {
      // O filme JÁ está na lista. Vamos removê-lo.
      const existingDocument = existingFavorites.documents[0];

      await databases.deleteDocument({
        databaseId: DATABASE_ID,
        collectionId: FAVORITES_ID,
        documentId: existingDocument.$id, // Usa o ID interno do documento Appwrite
      });

      console.log(`Filme removido dos favoritos: ${formattedMovieData.title}`);
      return {
        status: "removed",
        title: formattedMovieData.title,
        movieId: movieId,
      };
    } else {
      // O filme NÃO está na lista. Vamos adicioná-lo.
      await databases.createDocument({
        databaseId: DATABASE_ID,
        collectionId: FAVORITES_ID,
        documentId: ID.unique(), // Gera um novo ID único
        data: formattedMovieData,
      });

      console.log(
        `Filme adicionado aos favoritos: ${formattedMovieData.title}`
      );
      return {
        status: "added",
        title: formattedMovieData.title,
        movieId: movieId,
      };
    }
  } catch (error) {
    console.error("Erro ao alternar favorito:", error);
    throw error;
  }
};
