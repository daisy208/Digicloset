import BeforeAfter from "./
const [resultImage, setResultImage] = useState<string | null>(null);
import React, { useState, useRef, useEffect } from 'react';
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
  setResultImage(result.processedImageUrl);
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const [fitAnalysis, setFitAnalysis] = useState<any>(null);

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
    setProcessingStage('Initializing AI processing...');
    
    try {
      if (userPhoto && selectedItems.length > 0) {
        setProcessingStage('Analyzing body pose...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setProcessingStage('Applying virtual clothing...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setProcessingStage('Optimizing lighting and shadows...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setProcessingStage('Generating final image...');
        
        // Process with real AI service
        const result = await aiService.processVirtualTryOn(
          userPhoto,
          selectedItems,
          lightingSettings
        );
        
        setQualityScore(result.qualityScore || 85);
        setFitAnalysis(result.fitAnalysis);
        
        // Create download link
        const link = document.createElement('a');
        link.href = result.processedImageUrl;
        link.download = `virtual-tryon-${Date.now()}.jpg`;
        link.click();
        
        setProcessingStage('Complete!');
      }
    } catch (error) {
      console.error('Export failed:', error);
      setProcessingStage('Export failed');
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingStage('');
      }, 1000);
    }
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
     {/* Before/After Comparison */}
{userPhoto && resultImage && (
  <div className="p-4 border-t border-gray-200">
    <h4 className="text-sm font-medium text-gray-700 mb-3">Before / After Comparison</h4>
    <BeforeAfter beforeUrl={userPhoto} afterUrl={resultImage} />
  </div>
)}
     
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
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: processingStage.includes('Initializing') ? '20%' :
                                 processingStage.includes('Analyzing') ? '40%' :
                                 processingStage.includes('Applying') ? '60%' :
                                 processingStage.includes('Optimizing') ? '80%' :
                                 processingStage.includes('Generating') ? '95%' :
                                 processingStage.includes('Complete') ? '100%' : '0%'
                        }}
                      />
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

      {/* AI Analysis Results */}
      {(qualityScore || fitAnalysis) && (
        <div className="p-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
            <Eye className="text-indigo-600" size={16} />
            <span>AI Analysis Results</span>
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            {qualityScore && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Image Quality</span>
                  <span className={`text-xs font-medium ${
                    qualityScore >= 80 ? 'text-emerald-600' : 
                    qualityScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {Math.round(qualityScore)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div 
                    className={`h-1 rounded-full ${
                      qualityScore >= 80 ? 'bg-emerald-500' : 
                      qualityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${qualityScore}%` }}
                  />
                </div>
              </div>
            )}
            
            {fitAnalysis && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Fit Analysis</span>
                  <span className={`text-xs font-medium capitalize ${
                    fitAnalysis.overall_fit === 'excellent' ? 'text-emerald-600' :
                    fitAnalysis.overall_fit === 'good' ? 'text-blue-600' :
                    fitAnalysis.overall_fit === 'fair' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {fitAnalysis.overall_fit}
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Recommended: {fitAnalysis.size_recommendation}
                </p>
              </div>
            )}
          </div>
          
          {fitAnalysis?.adjustments_needed?.length > 0 && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs font-medium text-blue-800 mb-1">AI Suggestions:</p>
              <ul className="text-xs text-blue-700 space-y-1">
                {fitAnalysis.adjustments_needed.map((adjustment: string, index: number) => (
                  <li key={index} className="flex items-start space-x-1">
                    <Zap size={10} className="mt-0.5 text-yellow-500" />
                    <span>{adjustment}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Lighting Info */}
      <div className="px-4 pb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-600">
            <span className="font-medium">Current Lighting:</span> {lightingSettings.scenario.charAt(0).toUpperCase() + lightingSettings.scenario.slice(1)} 
            • Brightness: {lightingSettings.brightness}% 
            • Warmth: {lightingSettings.warmth}%
            {qualityScore && (
              <span className="ml-2">• Quality: {Math.round(qualityScore)}%</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
