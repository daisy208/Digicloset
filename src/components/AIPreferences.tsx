import React, { useState } from 'react';
import { Brain, Sparkles, RefreshCw, Heart } from 'lucide-react';
import { StylePreferences, ClothingStyle, BodyType, Occasion } from '../types';
import { useAIRecommendations } from '../hooks/useAIRecommendations';

interface AIPreferencesProps {
  preferences: StylePreferences;
  onPreferencesChange: (preferences: StylePreferences) => void;
}

export const AIPreferences: React.FC<AIPreferencesProps> = ({ 
  preferences, 
  onPreferencesChange 
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { recommendations, isLoading, refreshRecommendations } = useAIRecommendations(preferences);

  const styles: ClothingStyle[] = ['casual', 'formal', 'business', 'trendy', 'classic', 'bohemian', 'minimalist'];
  const bodyTypes: BodyType[] = ['petite', 'tall', 'curvy', 'athletic', 'plus-size'];
  const occasions: Occasion[] = ['work', 'casual', 'party', 'date', 'vacation', 'formal-event'];
  const colors = ['black', 'white', 'navy', 'gray', 'beige', 'brown', 'red', 'blue', 'green', 'pink', 'purple', 'yellow'];

  const updatePreferences = (updates: Partial<StylePreferences>) => {
    onPreferencesChange({ ...preferences, ...updates });
  };

  const toggleArrayItem = <T,>(array: T[], item: T): T[] => {
    return array.includes(item) 
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Brain className="text-indigo-600" size={24} />
          <h3 className="text-lg font-semibold text-gray-800">AI Style Preferences</h3>
        </div>
        <button
          onClick={refreshRecommendations}
          disabled={isLoading}
          className="flex items-center space-x-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          <span className="text-sm">Refresh</span>
        </button>
      </div>

      {/* Style Preferences */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Preferred Styles</h4>
        <div className="flex flex-wrap gap-2">
          {styles.map(style => (
            <button
              key={style}
              onClick={() => updatePreferences({ 
                preferredStyles: toggleArrayItem(preferences.preferredStyles, style) 
              })}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                preferences.preferredStyles.includes(style)
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {style.charAt(0).toUpperCase() + style.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Favorite Colors */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Favorite Colors</h4>
        <div className="grid grid-cols-6 gap-2">
          {colors.map(color => (
            <button
              key={color}
              onClick={() => updatePreferences({ 
                favoriteColors: toggleArrayItem(preferences.favoriteColors, color) 
              })}
              className={`aspect-square rounded-lg border-2 transition-all duration-200 ${
                preferences.favoriteColors.includes(color)
                  ? 'border-indigo-500 shadow-md scale-110'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              style={{ 
                backgroundColor: color === 'beige' ? '#F5F5DC' : color === 'earth-tones' ? '#8B4513' : color 
              }}
              title={color.charAt(0).toUpperCase() + color.slice(1)}
            >
              {preferences.favoriteColors.includes(color) && (
                <Heart size={12} className="text-white mx-auto" fill="currentColor" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Occasions */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Occasions</h4>
        <div className="flex flex-wrap gap-2">
          {occasions.map(occasion => (
            <button
              key={occasion}
              onClick={() => updatePreferences({ 
                occasions: toggleArrayItem(preferences.occasions, occasion) 
              })}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                preferences.occasions.includes(occasion)
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {occasion.replace('-', ' ').split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Settings Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 transition-colors"
      >
        <Sparkles size={16} />
        <span className="text-sm font-medium">
          {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
        </span>
      </button>

      {/* Advanced Settings */}
      {showAdvanced && (
        <div className="space-y-4 border-t pt-4">
          {/* Body Type */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Body Type</h4>
            <div className="flex flex-wrap gap-2">
              {bodyTypes.map(bodyType => (
                <button
                  key={bodyType}
                  onClick={() => updatePreferences({ bodyType })}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                    preferences.bodyType === bodyType
                      ? 'bg-purple-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {bodyType.charAt(0).toUpperCase() + bodyType.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Price Range: ${preferences.priceRange[0]} - ${preferences.priceRange[1]}
            </h4>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="500"
                value={preferences.priceRange[1]}
                onChange={(e) => updatePreferences({ 
                  priceRange: [preferences.priceRange[0], parseInt(e.target.value)] 
                })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* AI Recommendations Preview */}
      {recommendations.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
            <Sparkles size={16} className="text-yellow-500" />
            <span>AI Recommendations</span>
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {recommendations.slice(0, 4).map(item => (
              <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-full h-20 object-cover rounded mb-2"
                />
                <p className="text-xs font-medium text-gray-800 truncate">{item.name}</p>
                <p className="text-xs text-gray-600">${item.price}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};