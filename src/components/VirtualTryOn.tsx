import React, { useState, useRef } from 'react';
import { Download, Share2, RotateCcw, Camera, Layers, Brain, Zap, Eye } from 'lucide-react';
import { ClothingItem, LightingSettings } from '../types';
import { aiService } from '../services/aiService';

interface VirtualTryOnProps {
  userPhoto: string;
  selectedItems: ClothingItem[];
  lightingSettings: LightingSettings;
  onRemoveItem: (itemId: string) => void;
}

export const VirtualTryOn: React.FC<VirtualTryOnProps> = ({
  userPhoto,
  selectedItems,
  lightingSettings,
  onRemoveItem
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const [fitAnalysis, setFitAnalysis] = useState<any>(null);
  const [warpedImage, setWarpedImage] = useState<string | null>(null);

  // Trigger IDM-VTON
  const handleTryOn = async () => {
    if (!userPhoto || selectedItems.length === 0) return;

    setIsProcessing(true);
    setProcessingStage("Generating Try-On with IDM-VTON...");

    try {
      const result = await aiService.processVirtualTryOn(
        userPhoto,
        selectedItems,
        lightingSettings
      );
      setWarpedImage(result.processedImageUrl);
      setFitAnalysis(result.fitAnalysis);
      setProcessingStage("Complete!");
    } catch (err) {
      console.error(err);
      setProcessingStage("Failed to generate");
    } finally {
      setTimeout(() => setIsProcessing(false), 1000);
    }
  };

  const shareImage = () => {
    if (navigator.share && warpedImage) {
      navigator.share({
        title: 'My Virtual Try-On',
        text: 'Check out my virtual try-on!',
        url: warpedImage
      });
    } else {
      alert('Sharing feature would be available here!');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="text-indigo-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-800">Virtual Try-On</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleTryOn}
              disabled={!userPhoto || selectedItems.length === 0 || isProcessing}
              className="flex items-center space-x-1 px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isProcessing ? (
                <RotateCcw size={16} className="animate-spin" />
              ) : (
                <Zap size={16} />
              )}
              <span className="text-sm">Apply Try-On</span>
            </button>

            <button
              onClick={shareImage}
              disabled={!warpedImage}
              className="flex items-center space-x-1 px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <Share2 size={16} />
              <span className="text-sm">Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Viewer */}
      <div className="relative">
        {userPhoto ? (
          <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden">
            {warpedImage ? (
              <img
                src={warpedImage}
                alt="Try-On Result"
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Camera className="mx-auto text-gray-400 mb-3" size={48} />
                <p className="text-gray-600 font-medium">Click "Apply Try-On" to generate</p>
              </div>
            )}

            {isProcessing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <Brain className="animate-pulse text-indigo-600" size={24} />
                    <span className="text-gray-800 font-semibold">AI Processing</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                      <span className="text-gray-600 text-sm">{processingStage}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <Camera className="mx-auto text-gray-400 mb-3" size={48} />
              <p className="text-gray-600 font-medium">Upload a photo to start</p>
              <p className="text-gray-500 text-sm mt-1">Your virtual try-on will appear here</p>
            </div>
          </div>
        )}
      </div>

      {/* Selected Items */}
      {selectedItems.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Selected Item
          </h4>
          <div className="space-y-2">
            {selectedItems.map(item => (
              <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                    <p className="text-gray-600 text-xs">{item.brand} • ${item.price}</p>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
