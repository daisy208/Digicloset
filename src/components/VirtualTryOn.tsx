import React, { useState } from "react";
import {
  Download,
  Share2,
  RotateCcw,
  Camera,
  Layers,
  Brain,
  Zap,
  Eye,
} from "lucide-react";
import { ClothingItem, LightingSettings } from "../types";
import { aiService } from "../services/aiService";
import BeforeAfter from "./BeforeAfter";
import toast from "react-hot-toast";

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
  onRemoveItem,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>("");
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const [fitAnalysis, setFitAnalysis] = useState<any>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);

  const getLightingStyle = () => {
    const { brightness, contrast, warmth, intensity } = lightingSettings;
    let filter = `brightness(${brightness}%) contrast(${contrast}%)`;
    if (warmth > 50) {
      filter += ` sepia(${(warmth - 50) * 0.4}%) saturate(${
        100 + (warmth - 50) * 0.8
      }%)`;
    } else {
      filter += ` hue-rotate(${(50 - warmth) * 2}deg)`;
    }
    filter += ` saturate(${intensity}%)`;
    return { filter };
  };

  const exportImage = async () => {
    if (!userPhoto || selectedItems.length === 0) {
      toast.error("Please upload a photo and select items first!");
      return;
    }

    setIsProcessing(true);
    setProcessingStage("Initializing AI processing...");

    try {
      setProcessingStage("Analyzing body pose...");
      await new Promise((r) => setTimeout(r, 1000));

      setProcessingStage("Applying virtual clothing...");
      await new Promise((r) => setTimeout(r, 1500));

      setProcessingStage("Optimizing lighting and shadows...");
      await new Promise((r) => setTimeout(r, 1000));

      setProcessingStage("Generating final image...");

      const result = await aiService.processVirtualTryOn(
        userPhoto,
        selectedItems,
        lightingSettings
      );

      setQualityScore(result.qualityScore || 85);
      setFitAnalysis(result.fitAnalysis);
      setResultImage(result.processedImageUrl);

      const link = document.createElement("a");
      link.href = result.processedImageUrl;
      link.download = `virtual-tryon-${Date.now()}.jpg`;
      link.click();

      setProcessingStage("Complete!");
      toast.success("Image exported successfully!");
    } catch (error) {
      console.error("Export failed:", error);
      setProcessingStage("Export failed");
      toast.error("Export failed. Please try again.");
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingStage("");
      }, 1000);
    }
  };

  const shareImage = () => {
    if (!userPhoto || selectedItems.length === 0) {
      toast.error("Upload a photo and select items before sharing!");
      return;
    }
    if (navigator.share) {
      navigator
        .share({
          title: "My Virtual Try-On",
          text: "Check out my virtual try-on!",
          url: window.location.href,
        })
        .then(() => toast.success("Shared successfully!"))
        .catch(() => toast.error("Share cancelled."));
    } else {
      toast("Sharing feature is not available on this device.");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Layers className="text-indigo-600" size={20} />
          <h3 className="text-lg font-semibold text-gray-800">Virtual Try-On</h3>
        </div>

        <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
          <button
            onClick={exportImage}
            disabled={isProcessing}
            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
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
            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Share2 size={16} />
            <span className="text-sm">Share</span>
          </button>
        </div>
      </div>

      {/* Main Preview Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
        {/* User Photo + Overlays */}
        <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden rounded-xl">
          {userPhoto ? (
            <>
              <img
                src={userPhoto}
                alt="User"
                className="w-full h-full object-cover"
                style={getLightingStyle()}
              />
              {selectedItems.map((item, index) => (
                <div
                  key={item.id}
                  className="absolute inset-0 pointer-events-none"
                  style={{ zIndex: 10 + index, ...getLightingStyle() }}
                >
                  <img
                    src={item.overlayImage}
                    alt={item.name}
                    className="w-full h-full object-cover mix-blend-multiply opacity-80"
                  />
                </div>
              ))}

              {isProcessing && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <Brain
                        className="animate-pulse text-indigo-600"
                        size={24}
                      />
                      <span className="text-gray-800 font-semibold">
                        AI Processing
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                        <span className="text-gray-600 text-sm">
                          {processingStage}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                          style={{
                            width: processingStage.includes("Initializing")
                              ? "20%"
                              : processingStage.includes("Analyzing")
                              ? "40%"
                              : processingStage.includes("Applying")
                              ? "60%"
                              : processingStage.includes("Optimizing")
                              ? "80%"
                              : processingStage.includes("Generating")
                              ? "95%"
                              : processingStage.includes("Complete")
                              ? "100%"
                              : "0%",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <Camera className="mx-auto text-gray-400 mb-3" size={48} />
                <p className="text-gray-600 font-medium">
                  Upload a photo to start
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  Your virtual try-on will appear here
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Before/After Slider */}
        {userPhoto && resultImage && (
          <div className="w-full flex flex-col items-center justify-center">
            <h4 className="font-medium mb-2">Before / After Comparison</h4>
            <BeforeAfter beforeUrl={userPhoto} afterUrl={resultImage} />
          </div>
        )}
      </div>

      {/* Selected Items List */}
      {selectedItems.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Selected Items ({selectedItems.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center bg-gray-50 rounded-lg p-3"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg"
                />
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-gray-600">
                    {item.brand} • ${item.price}
                  </p>
                </div>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="text-red-500 hover:text-red-700 text-xs sm:text-sm"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {qualityScore && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Image Quality</span>
                  <span
                    className={`text-xs font-medium ${
                      qualityScore >= 80
                        ? "text-emerald-600"
                        : qualityScore >= 60
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {Math.round(qualityScore)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div
                    className={`h-1 rounded-full ${
                      qualityScore >= 80
                        ? "bg-emerald-500"
                        : qualityScore >= 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
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
                  <span
                    className={`text-xs font-medium capitalize ${
                      fitAnalysis.overall_fit === "excellent"
                        ? "text-emerald-600"
                        : fitAnalysis.overall_fit === "good"
                        ? "text-blue-600"
                        : fitAnalysis.overall_fit === "fair"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
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
              <p className="text-xs font-medium text-blue-800 mb-1">
                AI Suggestions:
              </p>
              <ul className="text-xs text-blue-700 space-y-1">
                {fitAnalysis.adjustments_needed.map(
                  (adjustment: string, index: number) => (
                    <li key={index} className="flex items-start space-x-1">
                      <Zap size={10} className="mt-0.5 text-yellow-500" />
                      <span>{adjustment}</span>
                    </li>
                  )
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Lighting Info */}
      <div className="px-4 pb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-600">
            <span className="font-medium">Current Lighting:</span>{" "}
            {lightingSettings.scenario.charAt(0).toUpperCase() +
              lightingSettings.scenario.slice(1)}{" "}
            • Brightness: {lightingSettings.brightness}% • Warmth:{" "}
            {lightingSettings.warmth}%
            {qualityScore && (
              <span className="ml-2">
                • Quality: {Math.round(qualityScore)}%
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
import posthog from "posthog-js";

// When user exports image
posthog.capture("export_image", {
  itemsSelected: selectedItems.length,
  qualityScore,
});

// When user shares
posthog.capture("share_image", {
  itemsSelected: selectedItems.length,
});
