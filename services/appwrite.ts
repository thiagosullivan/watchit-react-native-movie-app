import { Client, Databases, ID, Query } from "react-native-appwrite";

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_TABLES_ID!;

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
      collectionId: COLLECTION_ID,
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
        collectionId: COLLECTION_ID,
        documentId: existingDocument.$id,
        data: {
          count: newCount,
        },
      });
      console.log(`Contagem atualizada para ${newCount}`);
    } else {
      await databases.createDocument({
        databaseId: DATABASE_ID,
        collectionId: COLLECTION_ID,
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
      collectionId: COLLECTION_ID,
      queries: [Query.limit(5), Query.orderDesc("count")],
    });

    return result.documents as unknown as TrendingMovie[];
  } catch (error) {
    console.error(error);
    return undefined;
  }
};
