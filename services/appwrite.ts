import { Client, Databases, ID, Query } from "react-native-appwrite";

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_TABLES_ID!;

const client = new Client()
  .setEndpoint("https://nyc.cloud.appwrite.io/v1")
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!);

const databases = new Databases(client);

// Assumindo que 'Movie' é um tipo/interface definida em outro lugar
export const updateSearchCount = async (
  query: string,
  movie?: Movie | null
) => {
  if (!query || query.trim() === "") {
    console.log("Query de busca vazia, pulando atualização.");
    return;
  }

  try {
    // 1. Listar documentos (rows) existentes usando listDocuments (NOVA SINTAXE)
    const result = await databases.listDocuments({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID,
      queries: [Query.equal("searchTerm", query)],
      // total: false // Você pode adicionar isso se não precisar do total de documentos para otimização
    });

    console.log(
      "Resultado da busca no Appwrite (documents):",
      result.documents
    );

    if (result.documents.length > 0) {
      // 2. Se o documento existir, incremente o contador e atualize (NOVA SINTAXE PARA updateDocument TAMBÉM)
      const existingDocument = result.documents[0]; // Correção: pegamos o primeiro item do array 'documents'
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
      // 3. Se não existir, crie um novo documento (NOVA SINTAXE PARA createDocument TAMBÉM)
      await databases.createDocument({
        databaseId: DATABASE_ID,
        collectionId: COLLECTION_ID,
        documentId: ID.unique(), // Gera um ID único automaticamente
        data: {
          searchTerm: query,
          count: 1,
        },
      });
      console.log(`Novo registro criado para o termo: ${query}`);
    }
  } catch (error) {
    console.error("Erro no updateSearchCount:", error);
  }
};
