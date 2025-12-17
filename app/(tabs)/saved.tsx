import MovieCard from "@/components/MovieCard";
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { getFavoriteMovies } from "@/services/appwrite";
import useFetch from "@/services/useFetch";
import { useFocusEffect } from "expo-router";
import React, { useCallback } from "react";
import { FlatList, Image, ScrollView, Text, View } from "react-native";

const Saved = () => {
  const {
    data: favMovies,
    loading: favLoading,
    error: favError,
    refetch,
  } = useFetch(getFavoriteMovies);

  console.log(favMovies, "FILMES FAVORITOS");

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [])
  );

  return (
    <View className="bg-primary flex-1">
      <Image source={images.bg} className="absolute w-full z-0" />
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ minHeight: "100%", paddingBottom: 10 }}
      >
        <Image source={icons.logo} className="w-12 h-10 mt-20 mb-5 mx-auto" />
        <Text className="text-lg text-white font-bold mt-5 mb-3">
          Saved Movies
        </Text>

        {favMovies?.length > 0 ? (
          <FlatList
            data={favMovies}
            renderItem={({ item }) => (
              <MovieCard {...item} id={item.movie_id} />
            )}
            keyExtractor={(item) => item.movie_id}
            numColumns={3}
            columnWrapperStyle={{
              justifyContent: "flex-start",
              gap: 20,
              paddingRight: 5,
              marginBottom: 10,
            }}
            className="mt-2 pb-32"
            scrollEnabled={false}
          />
        ) : (
          <Text className="text-light-200 font-normal text-lg text-center mt-12">
            There&apos;s no movies added at your favorites
          </Text>
        )}
      </ScrollView>
    </View>
  );
};

export default Saved;
