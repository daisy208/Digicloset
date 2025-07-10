import React, { useState } from 'react';
import { Shuffle, Sparkles, Heart, Share2 } from 'lucide-react';
import { aiService, AIAnalysisResult } from '../services/aiService';
import { ClothingItem, StylePreferences } from '../types';

interface OutfitGeneratorProps {
  userAnalysis: AIAnalysisResult | null;
  preferences: StylePreferences;
  availableItems: ClothingItem[];
  onOutfitSelect: (items: ClothingItem[]) => void;
}

export const OutfitGenerator: React.FC<OutfitGeneratorProps> = ({
  userAnalysis,
  preferences,
  availableItems,
  onOutfitSelect
}) => {
  const [outfits, setOutfits] = useState<ClothingItem[][]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedOccasion, setSelectedOccasion] = useState<string>('casual');

  const occasions = [
    { id: 'work', label: 'Work', emoji: '💼' },
    { id: 'casual', label: 'Casual', emoji: '👕' },
    { id: 'party', label: 'Party', emoji: '🎉' },
    { id: 'date', label: 'Date', emoji: '💕' }
  ];

  const generateOutfits = async () => {
    if (!userAnalysis) return;

    setIsGenerating(true);
    try {
      const generatedOutfits = await aiService.generateOutfitCombinations(
        availableItems,
        userAnalysis,
        preferences,
        selectedOccasion
      );
      setOutfits(generatedOutfits);
    } catch (error) {
      console.error('Failed to generate outfits:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const calculateOutfitPrice = (outfit: ClothingItem[]) => {
    return outfit.reduce((total, item) => total + item.price, 0);
  };

  if (!userAnalysis) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center">
          <Shuffle className="mx-auto text-gray-400 mb-3" size={48} />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">AI Outfit Generator</h3>
          <p className="text-gray-600">Complete AI analysis to generate complete outfits</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shuffle className="text-indigo-600" size={24} />
          <h3 className="text-lg font-semibold text-gray-800">AI Outfit Generator</h3>
        </div>
        
        <button
          onClick={generateOutfits}
          disabled={isGenerating}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <Sparkles size={16} className={isGenerating ? 'animate-spin' : ''} />
          <span>{isGenerating ? 'Generating...' : 'Generate Outfits'}</span>
        </button>
      </div>

      {/* Occasion Selector */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Occasion</h4>
        <div className="flex flex-wrap gap-2">
          {occasions.map(occasion => (
            <button
              key={occasion.id}
              onClick={() => setSelectedOccasion(occasion.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedOccasion === occasion.id
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>{occasion.emoji}</span>
              <span>{occasion.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isGenerating && (
        <div className="text-center py-12">
          <div className="inline-flex items-center space-x-3 mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="text-gray-600 font-medium">Creating perfect outfits...</span>
          </div>
          <div className="space-y-2 text-sm text-gray-500">
            <p>🎨 Analyzing color combinations</p>
            <p>👗 Matching styles and fits</p>
            <p>✨ Optimizing for your body shape</p>
          </div>
        </div>
      )}

      {/* Generated Outfits */}
      {!isGenerating && outfits.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">
            Generated Outfits for {selectedOccasion}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {outfits.map((outfit, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                onClick={() => onOutfitSelect(outfit)}
              >
                <div className="flex items-center justify-between mb-4">
                  <h5 className="font-semibold text-gray-800">Outfit {index + 1}</h5>
                  <div className="flex items-center space-x-2">
                    <button className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                      <Heart size={16} />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-blue-500 transition-colors">
                      <Share2 size={16} />
                    </button>
                  </div>
                </div>
                
                {/* Outfit Items */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {outfit.map((item, itemIndex) => (
                    <div key={item.id} className="relative">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-20 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all duration-200"></div>
                    </div>
                  ))}
                </div>
                
                {/* Outfit Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Price:</span>
                    <span className="font-semibold text-gray-800">
                      ${calculateOutfitPrice(outfit)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Items:</span>
                    <span className="text-gray-800">{outfit.length} pieces</span>
                  </div>
                  
                  {/* Style Tags */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Array.from(new Set(outfit.map(item => item.style))).map(style => (
                      <span
                        key={style}
                        className="px-2 py-1 bg-white text-gray-600 text-xs rounded-full"
                      >
                        {style}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Try On Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOutfitSelect(outfit);
                  }}
                  className="w-full mt-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  Try This Outfit
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isGenerating && outfits.length === 0 && (
        <div className="text-center py-12">
          <Shuffle className="mx-auto text-gray-400 mb-3" size={48} />
          <h4 className="text-lg font-semibold text-gray-800 mb-2">No Outfits Generated</h4>
          <p className="text-gray-600 mb-4">Click "Generate Outfits" to create AI-powered outfit combinations</p>
          <button
            onClick={generateOutfits}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Generate Outfits
          </button>
        </div>
      )}
    </div>
  );
};