import React, { useState, useEffect } from 'react';
import { Palette, Sparkles, Eye } from 'lucide-react';
import { aiService, AIAnalysisResult } from '../services/aiService';
import { ClothingItem } from '../types';

interface ColorHarmonyToolProps {
  userAnalysis: AIAnalysisResult | null;
  selectedItem: ClothingItem | null;
}

export const ColorHarmonyTool: React.FC<ColorHarmonyToolProps> = ({
  userAnalysis,
  selectedItem
}) => {
  const [colorSuggestions, setColorSuggestions] = useState<{
    color: string;
    harmony: string;
    confidence: number;
  }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateColorSuggestions = async () => {
    if (!selectedItem || !userAnalysis) return;

    setIsLoading(true);
    try {
      const suggestions = await aiService.suggestColorCombinations(selectedItem, userAnalysis);
      setColorSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to generate color suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedItem && userAnalysis) {
      generateColorSuggestions();
    }
  }, [selectedItem, userAnalysis]);

  const getColorStyle = (colorName: string) => {
    const colorMap: Record<string, string> = {
      'red': '#EF4444',
      'blue': '#3B82F6',
      'green': '#10B981',
      'yellow': '#F59E0B',
      'purple': '#8B5CF6',
      'pink': '#EC4899',
      'orange': '#F97316',
      'brown': '#92400E',
      'gray': '#6B7280',
      'black': '#1F2937',
      'white': '#F9FAFB',
      'navy': '#1E3A8A',
      'beige': '#F5F5DC',
      'cream': '#FFFDD0',
      'gold': '#D4AF37',
      'silver': '#C0C0C0'
    };

    return { backgroundColor: colorMap[colorName.toLowerCase()] || '#6B7280' };
  };

  const getHarmonyIcon = (harmony: string) => {
    switch (harmony) {
      case 'complementary':
        return '🎨';
      case 'analogous':
        return '🌈';
      case 'skin-tone-match':
        return '✨';
      default:
        return '🎯';
    }
  };

  const getHarmonyDescription = (harmony: string) => {
    switch (harmony) {
      case 'complementary':
        return 'Opposite colors that create vibrant contrast';
      case 'analogous':
        return 'Adjacent colors that blend harmoniously';
      case 'skin-tone-match':
        return 'Perfect match for your skin tone';
      default:
        return 'Great color combination';
    }
  };

  if (!selectedItem) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center">
          <Palette className="mx-auto text-gray-400 mb-3" size={48} />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Color Harmony</h3>
          <p className="text-gray-600">Select an item to see AI-powered color suggestions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Palette className="text-indigo-600" size={24} />
          <h3 className="text-lg font-semibold text-gray-800">Color Harmony</h3>
        </div>
        
        <button
          onClick={generateColorSuggestions}
          disabled={isLoading}
          className="flex items-center space-x-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition-colors disabled:opacity-50"
        >
          <Sparkles size={16} className={isLoading ? 'animate-spin' : ''} />
          <span className="text-sm">Refresh</span>
        </button>
      </div>

      {/* Selected Item */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <img
            src={selectedItem.image}
            alt={selectedItem.name}
            className="w-16 h-16 object-cover rounded-lg"
          />
          <div>
            <h4 className="font-medium text-gray-800">{selectedItem.name}</h4>
            <p className="text-sm text-gray-600">{selectedItem.brand}</p>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-gray-500">Colors:</span>
              <div className="flex space-x-1">
                {selectedItem.colors.map((color, index) => (
                  <div
                    key={index}
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={getColorStyle(color)}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            <span className="text-gray-600">Analyzing color harmony...</span>
          </div>
        </div>
      )}

      {/* Color Suggestions */}
      {!isLoading && colorSuggestions.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">Recommended Color Combinations</h4>
          
          <div className="space-y-3">
            {colorSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                    style={getColorStyle(suggestion.color)}
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-800 capitalize">
                        {suggestion.color}
                      </span>
                      <span className="text-lg">{getHarmonyIcon(suggestion.harmony)}</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {getHarmonyDescription(suggestion.harmony)}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-1 text-sm">
                    <Eye size={14} className="text-gray-400" />
                    <span className="text-gray-600">
                      {Math.round(suggestion.confidence * 100)}%
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 capitalize">
                    {suggestion.harmony.replace('-', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skin Tone Guidance */}
      {userAnalysis && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-2">
            Perfect for Your {userAnalysis.skinTone} Skin Tone
          </h4>
          <p className="text-sm text-gray-600">
            {userAnalysis.skinTone === 'warm' && 
              'Warm colors like reds, oranges, and yellows will enhance your natural glow.'}
            {userAnalysis.skinTone === 'cool' && 
              'Cool colors like blues, greens, and purples will complement your undertones beautifully.'}
            {userAnalysis.skinTone === 'neutral' && 
              'You\'re lucky! Most colors will work well with your balanced undertones.'}
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && colorSuggestions.length === 0 && (
        <div className="text-center py-8">
          <Palette className="mx-auto text-gray-400 mb-3" size={32} />
          <p className="text-gray-600">No color suggestions available.</p>
          <button
            onClick={generateColorSuggestions}
            className="mt-2 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
          >
            Generate Suggestions
          </button>
        </div>
      )}
    </div>
  );
};