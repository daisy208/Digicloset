import React, { useState, useRef, useEffect } from 'react';
import { Download, Share2, RotateCcw, Camera, Layers } from 'lucide-react';
import { ClothingItem, LightingSettings } from '../types';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Apply lighting effects based on settings
  const getLightingStyle = () => {
    const { brightness, contrast, warmth, intensity } = lightingSettings;
    
    let filter = `brightness(${brightness}%) contrast(${contrast}%)`;
    
    // Add warmth effect
    if (warmth > 50) {
      filter += ` sepia(${(warmth - 50) * 0.4}%) saturate(${100 + (warmth - 50) * 0.8}%)`;
    } else {
      filter += ` hue-rotate(${(50 - warmth) * 2}deg)`;
    }
    
    // Add intensity effect
    filter += ` saturate(${intensity}%)`;
    
    return { filter };
  };

  const exportImage = async () => {
    setIsProcessing(true);
    // Simulate processing time
    setTimeout(() => {
      setIsProcessing(false);
      // In a real app, this would generate and download the composed image
      alert('Image exported! (Demo mode)');
    }, 2000);
  };

  const shareImage = () => {
    // In a real app, this would share the composed image
    if (navigator.share) {
      navigator.share({
        title: 'My Virtual Try-On',
        text: 'Check out my virtual try-on!',
        url: window.location.href
      });
    } else {
      alert('Sharing feature would be available here!');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="text-indigo-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-800">Virtual Try-On</h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={exportImage}
              disabled={isProcessing || !userPhoto || selectedItems.length === 0}
              className="flex items-center space-x-1 px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <RotateCcw size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              <span className="text-sm">Export</span>
            </button>
            
            <button
              onClick={shareImage}
              disabled={!userPhoto || selectedItems.length === 0}
              className="flex items-center space-x-1 px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Share2 size={16} />
              <span className="text-sm">Share</span>
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        {userPhoto ? (
          <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden">
            {/* User Photo with Lighting Effects */}
            <img
              src={userPhoto}
              alt="User"
              className="w-full h-full object-cover"
              style={getLightingStyle()}
            />
            
            {/* Clothing Overlays */}
            {selectedItems.map((item, index) => (
              <div
                key={item.id}
                className="absolute inset-0 pointer-events-none"
                style={{
                  zIndex: 10 + index,
                  ...getLightingStyle()
                }}
              >
                <img
                  src={item.overlayImage}
                  alt={item.name}
                  className="w-full h-full object-cover mix-blend-multiply opacity-80"
                />
              </div>
            ))}
            
            {/* Loading Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
                  <RotateCcw className="animate-spin text-indigo-600" size={20} />
                  <span className="text-gray-800 font-medium">Processing...</span>
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

      {/* Selected Items List */}
      {selectedItems.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Selected Items ({selectedItems.length})</h4>
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

      {/* Lighting Info */}
      <div className="px-4 pb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-600">
            <span className="font-medium">Current Lighting:</span> {lightingSettings.scenario.charAt(0).toUpperCase() + lightingSettings.scenario.slice(1)} 
            • Brightness: {lightingSettings.brightness}% 
            • Warmth: {lightingSettings.warmth}%
          </p>
        </div>
      </div>
    </div>
  );
};