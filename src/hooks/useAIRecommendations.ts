import { useState, useEffect } from 'react';
import { ClothingItem, StylePreferences } from '../types';
import { mockClothingItems } from '../utils/mockData';

export const useAIRecommendations = (preferences: StylePreferences) => {
  const [recommendations, setRecommendations] = useState<ClothingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateRecommendations = () => {
    setIsLoading(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const scored = mockClothingItems.map(item => {
        let score = 0;
        
        // Style matching
        if (preferences.preferredStyles.includes(item.style)) score += 3;
        
        // Price range matching
        if (item.price >= preferences.priceRange[0] && item.price <= preferences.priceRange[1]) score += 2;
        
        // Brand preference
        if (preferences.brands.includes(item.brand)) score += 2;
        
        // Color preference (simplified)
        if (item.colors.some(color => preferences.favoriteColors.some(fav => 
          color.toLowerCase().includes(fav.toLowerCase()) || fav.toLowerCase().includes(color.toLowerCase())
        ))) score += 1;
        
        return { ...item, aiScore: score };
      });
      
      const sorted = scored.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
      setRecommendations(sorted.slice(0, 4));
      setIsLoading(false);
    }, 1000);
  };

  useEffect(() => {
    generateRecommendations();
  }, [preferences]);

  return { recommendations, isLoading, refreshRecommendations: generateRecommendations };
};