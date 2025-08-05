import React, { useState, useEffect } from 'react';
import { Brain, Camera, Zap, Target, Palette, Ruler, Activity, AlertCircle } from 'lucide-react';
import { aiService, AIAnalysisResult } from '../services/aiService';
import { realAIService } from '../services/realAI';

interface AIAnalysisPanelProps {
  userPhoto: string;
  onAnalysisComplete: (analysis: AIAnalysisResult) => void;
}

export const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({ 
  userPhoto, 
  onAnalysisComplete 
}) => {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiServiceHealth, setAiServiceHealth] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [useRealAI, setUseRealAI] = useState(import.meta.env.VITE_USE_REAL_AI === 'true');

  useEffect(() => {
    checkAIServiceHealth();
  }, []);

  const checkAIServiceHealth = async () => {
    try {
      const health = await aiService.checkServiceHealth();
      setAiServiceHealth(health);
    } catch (error) {
      console.error('Failed to check AI service health:', error);
    }
  };

  const runAnalysis = async () => {
    if (!userPhoto) return;

    setIsAnalyzing(true);
    setError('');

    try {
      const result = await aiService.analyzeUserPhoto(userPhoto);
      setAnalysis(result);
      onAnalysisComplete(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (userPhoto && !analysis) {
      runAnalysis();
    }
  }, [userPhoto]);

  if (!userPhoto) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center">
          <Camera className="mx-auto text-gray-400 mb-3" size={48} />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">AI Analysis</h3>
          <p className="text-gray-600">Upload a photo to get AI-powered style insights</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Brain className="text-indigo-600" size={24} />
          <h3 className="text-lg font-semibold text-gray-800">AI Analysis</h3>
          {aiServiceHealth && (
            <div className="flex items-center space-x-1">
              <Activity 
                size={16} 
                className={aiServiceHealth.realAI ? 'text-emerald-500' : 'text-yellow-500'} 
              />
              <span className="text-xs text-gray-600">
                {aiServiceHealth.realAI ? 'Real AI' : 'Demo Mode'}
              </span>
            </div>
          )}
        </div>
        
        {analysis && (
          <div className="flex items-center space-x-1 text-sm text-emerald-600">
            <Zap size={16} />
            <span>{Math.round(analysis.confidence * 100)}% confident</span>
          </div>
        )}
      </div>

      {/* AI Service Status */}
      {aiServiceHealth && !aiServiceHealth.realAI && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="text-yellow-600" size={16} />
            <p className="text-yellow-800 text-sm">
              Running in demo mode. Configure real AI services for production-grade analysis.
            </p>
          </div>
        </div>
      )}

      {isAnalyzing && (
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="text-gray-600">Analyzing your photo with AI...</span>
          </div>
          <div className="mt-4 space-y-2 text-sm text-gray-500">
            <p>🔍 Detecting body measurements</p>
            <p>🎨 Analyzing skin tone</p>
            <p>📐 Identifying body shape</p>
            {useRealAI && (
              <>
                <p>🤖 Running computer vision models</p>
                <p>🧠 Processing with neural networks</p>
              </>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={runAnalysis}
            className="mt-2 text-red-700 hover:text-red-800 text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {analysis && (
        <div className="space-y-4">
          {/* Body Shape */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="text-purple-600" size={16} />
              <span className="font-medium text-gray-800">Body Shape</span>
            </div>
            <p className="text-lg font-semibold text-purple-700 capitalize">
              {analysis.bodyShape.replace('-', ' ')}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {getBodyShapeDescription(analysis.bodyShape)}
            </p>
          </div>

          {/* Skin Tone */}
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Palette className="text-orange-600" size={16} />
              <span className="font-medium text-gray-800">Skin Tone</span>
            </div>
            <p className="text-lg font-semibold text-orange-700 capitalize">
              {analysis.skinTone}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {getSkinToneDescription(analysis.skinTone)}
            </p>
          </div>

          {/* Body Measurements */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Ruler className="text-blue-600" size={16} />
              <span className="font-medium text-gray-800">Measurements</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Height:</span>
                <span className="ml-2 font-medium">{analysis.bodyMeasurements.height}cm</span>
              </div>
              <div>
                <span className="text-gray-600">Chest:</span>
                <span className="ml-2 font-medium">{analysis.bodyMeasurements.chest}"</span>
              </div>
              <div>
                <span className="text-gray-600">Waist:</span>
                <span className="ml-2 font-medium">{analysis.bodyMeasurements.waist}"</span>
              </div>
              <div>
                <span className="text-gray-600">Hips:</span>
                <span className="ml-2 font-medium">{analysis.bodyMeasurements.hips}"</span>
              </div>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Analyzing with AI...</span>
              </>
            ) : (
              <>
                <Brain size={16} />
                <span>Run AI Analysis</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

function getBodyShapeDescription(bodyShape: string): string {
  const descriptions = {
    'pear': 'Hips wider than shoulders - emphasize your upper body',
    'apple': 'Fuller midsection - create vertical lines and define waist',
    'hourglass': 'Balanced proportions - highlight your natural waistline',
    'rectangle': 'Straight silhouette - create curves and define waist',
    'inverted-triangle': 'Shoulders wider than hips - balance with fuller bottoms'
  };
  
  return descriptions[bodyShape as keyof typeof descriptions] || 'Unique proportions';
}

function getSkinToneDescription(skinTone: string): string {
  const descriptions = {
    'warm': 'Golden, yellow, or peachy undertones - try warm colors',
    'cool': 'Pink, red, or blue undertones - try cool colors',
    'neutral': 'Balanced undertones - most colors will work well'
  };
  
  return descriptions[skinTone as keyof typeof descriptions] || 'Beautiful skin tone';
}