import React, { useState, useEffect } from 'react';
import { Sparkles, Star, TrendingUp, Heart, ShoppingBag, Brain, Zap } from 'lucide-react';
import { aiService, StyleRecommendation, AIAnalysisResult } from '../services/aiService';
import { ClothingItem, StylePreferences } from '../types';

interface SmartRecommendationsProps {
  userAnalysis: AIAnalysisResult | null;
  preferences: StylePreferences;
  availableItems: ClothingItem[];
  onItemSelect: (item: ClothingItem) => void;
  selectedItems: ClothingItem[];
}

export const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({
  userAnalysis,
  preferences,
  availableItems,
  onItemSelect,
  selectedItems
}) => {
  const [recommendations, setRecommendations] = useState<StyleRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOccasion, setSelectedOccasion] = useState<string>('casual');
  const [aiInsights, setAiInsights] = useState<string[]>([]);

  const occasions = [
    { id: 'work', label: 'Work', icon: '💼' },
    { id: 'casual', label: 'Casual', icon: '👕' },
    { id: 'party', label: 'Party', icon: '🎉' },
    { id: 'date', label: 'Date', icon: '💕' },
    { id: 'vacation', label: 'Vacation', icon: '🏖️' }
  ];

  const generateRecommendations = async () => {
    if (!userAnalysis) return;

    setIsLoading(true);
    setAiInsights([]);
    try {
      const recs = await aiService.generateRecommendations(
        userAnalysis,
        preferences,
        availableItems,
        selectedOccasion
      );
      setRecommendations(recs);
      
      // Generate AI insights about the recommendations
      const insights = this.generateAIInsights(recs, userAnalysis, preferences);
      setAiInsights(insights);
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIInsights = (
    recs: StyleRecommendation[],
    analysis: AIAnalysisResult,
    prefs: StylePreferences
  ): string[] => {
    const insights = [];

    if (recs.length > 0) {
      const avgScore = recs.reduce((sum, rec) => sum + rec.score, 0) / recs.length;
      insights.push(`AI found ${recs.length} items with ${Math.round(avgScore)}% compatibility`);
    }

    const bodyShapeItems = recs.filter(rec => 
      rec.reasons.some(reason => reason.toLowerCase().includes(analysis.bodyShape))
    );
    if (bodyShapeItems.length > 0) {
      insights.push(`${bodyShapeItems.length} items specifically chosen for your ${analysis.bodyShape} body shape`);
    }

    const colorMatches = recs.filter(rec => rec.color_harmony > 80);
    if (colorMatches.length > 0) {
      insights.push(`${colorMatches.length} items have excellent color harmony with your ${analysis.skinTone} skin tone`);
    }

    return insights;
  };

  useEffect(() => {
    if (userAnalysis && availableItems.length > 0) {
      generateRecommendations();
    }
  }, [userAnalysis, selectedOccasion, availableItems]);

  const isSelected = (item: ClothingItem) => 
    selectedItems.some(selected => selected.id === item.id);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  if (!userAnalysis) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center">
          <Sparkles className="mx-auto text-gray-400 mb-3" size={48} />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Smart Recommendations</h3>
          <p className="text-gray-600">Complete AI analysis to get personalized recommendations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="text-indigo-600" size={24} />
          <h3 className="text-lg font-semibold text-gray-800">AI Recommendations</h3>
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-2 py-1 rounded-full">
            <span className="text-xs font-medium text-purple-700">AI Powered</span>
          </div>
        </div>
        
        <button
          onClick={generateRecommendations}
          disabled={isLoading}
          className="flex items-center space-x-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition-colors disabled:opacity-50"
        >
          <TrendingUp size={16} className={isLoading ? 'animate-pulse' : ''} />
          <span className="text-sm">Refresh</span>
        </button>
      </div>

      {/* Occasion Selector */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Select Occasion</h4>
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
              <span>{occasion.icon}</span>
              <span>{occasion.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      {aiInsights.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Brain className="text-indigo-600" size={16} />
            <h4 className="font-medium text-indigo-800">AI Insights</h4>
          </div>
          <div className="space-y-2">
            {aiInsights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-2">
                <Zap className="text-yellow-500 mt-0.5" size={12} />
                <p className="text-sm text-indigo-700">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            <span className="text-gray-600">AI is analyzing your preferences...</span>
          </div>
          <div className="mt-4 space-y-1 text-xs text-gray-500">
            <p>🧠 Processing style preferences</p>
            <p>🎨 Analyzing color compatibility</p>
            <p>📏 Matching body measurements</p>
            <p>✨ Generating personalized suggestions</p>
          </div>
        </div>
      )}

      {/* Recommendations Grid */}
      {!isLoading && recommendations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">
              Recommended for {selectedOccasion}
            </h4>
            <span className="text-xs text-gray-500">
              {recommendations.length} items found
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recommendations.map((rec, index) => (
              <div
                key={rec.item.id}
                className={`group bg-gray-50 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                  isSelected(rec.item) ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''
                }`}
                onClick={() => onItemSelect(rec.item)}
              >
                <div className="flex space-x-3">
                  <img
                    src={rec.item.image}
                    alt={rec.item.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h5 className="font-medium text-gray-800 text-sm truncate">
                        {rec.item.name}
                      </h5>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(rec.score)}`}>
                        {Math.round(rec.score)}%
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-2">{rec.item.brand} • ${rec.item.price}</p>
                    
                    {/* AI Insights */}
                    <div className="space-y-1">
                      {rec.reasons.slice(0, 2).map((reason, idx) => (
                        <p key={idx} className="text-xs text-gray-600 flex items-center space-x-1">
                          <Star size={10} className="text-yellow-500" />
                          <span>{reason}</span>
                        </p>
                      ))}
                    </div>
                    
                    {/* Styling Tips */}
                    {rec.styling_tips.length > 0 && (
                      <div className="mt-2 p-2 bg-white rounded text-xs">
                        <p className="text-indigo-600 font-medium">💡 Styling Tip:</p>
                        <p className="text-gray-600">{rec.styling_tips[0]}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <span>Fit: {Math.round(rec.fit_prediction)}%</span>
                    <span>Color: {Math.round(rec.color_harmony)}%</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                      <Heart size={14} />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-indigo-600 transition-colors">
                      <ShoppingBag size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && recommendations.length === 0 && (
        <div className="text-center py-8">
          <Sparkles className="mx-auto text-gray-400 mb-3" size={32} />
          <p className="text-gray-600">No recommendations available for this occasion.</p>
          <button
            onClick={generateRecommendations}
            className="mt-2 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
          >
            Try different preferences
          </button>
        </div>
      )}
    </div>
  );
};