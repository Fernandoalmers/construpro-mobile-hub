
import React, { useState } from 'react';
import { toast } from "@/components/ui/sonner";
import { useFavoritesData, useRecentlyViewedData, useFrequentlyBoughtData } from '../../hooks/favorites';
import FavoritesHeader from './favorites/FavoritesHeader';
import FavoritesTabs from './favorites/FavoritesTabs';
import FavoritesContent from './favorites/FavoritesContent';

const FavoritesScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState("recent");
  
  // Fetch data using custom hooks
  const { 
    data: recentlyViewed = [], 
    isLoading: isLoadingRecent,
    error: recentError
  } = useRecentlyViewedData();
  
  const { 
    data: favorites = [], 
    isLoading: isLoadingFavorites,
    error: favoritesError
  } = useFavoritesData();

  const { 
    data: frequentlyBought = [], 
    isLoading: isLoadingFrequent,
    error: frequentError
  } = useFrequentlyBoughtData();

  const isLoading = 
    (activeTab === "recent" && isLoadingRecent) || 
    (activeTab === "favorites" && isLoadingFavorites) || 
    (activeTab === "frequent" && isLoadingFrequent);

  if (recentError || favoritesError || frequentError) {
    const error = recentError || favoritesError || frequentError;
    console.error('Query error:', error);
    toast.error(`Erro ao carregar dados: ${(error as Error).message}`);
  }

  console.log('Current favorites data:', favorites);
  console.log('Active tab:', activeTab);
  console.log('Is loading favorites:', isLoadingFavorites);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      <FavoritesHeader />
      <FavoritesTabs onValueChange={setActiveTab} />
      
      <div className="p-6">
        <FavoritesContent
          activeTab={activeTab}
          recentlyViewed={recentlyViewed}
          favorites={favorites}
          frequentlyBought={frequentlyBought}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default FavoritesScreen;
