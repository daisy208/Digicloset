import React from 'react';
import { Sun, Moon, Lightbulb, Sunrise, Sunset, CloudSnow } from 'lucide-react';
import { LightingSettings, LightingScenario } from '../types';

interface LightAdjustmentProps {
  lightingSettings: LightingSettings;
  onLightingChange: (settings: LightingSettings) => void;
}

export const LightAdjustment: React.FC<LightAdjustmentProps> = ({ 
  lightingSettings, 
  onLightingChange 
}) => {
  const lightingScenarios: { 
    scenario: LightingScenario; 
    icon: React.ReactNode; 
    label: string; 
    description: string;
  }[] = [
    { scenario: 'natural', icon: <Sun size={20} />, label: 'Natural', description: 'Outdoor daylight' },
    { scenario: 'indoor', icon: <Lightbulb size={20} />, label: 'Indoor', description: 'Office/home lighting' },
    { scenario: 'evening', icon: <Moon size={20} />, label: 'Evening', description: 'Dim ambient light' },
    { scenario: 'bright', icon: <Sunrise size={20} />, label: 'Bright', description: 'High intensity light' },
    { scenario: 'warm', icon: <Sunset size={20} />, label: 'Warm', description: 'Golden hour lighting' },
    { scenario: 'cool', icon: <CloudSnow size={20} />, label: 'Cool', description: 'Cool fluorescent light' }
  ];

  const updateSettings = (updates: Partial<LightingSettings>) => {
    onLightingChange({ ...lightingSettings, ...updates });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <Sun className="text-yellow-500" size={24} />
        <h3 className="text-lg font-semibold text-gray-800">Lighting Adjustment</h3>
      </div>

      {/* Lighting Scenarios */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Lighting Scenarios</h4>
        <div className="grid grid-cols-2 gap-2">
          {lightingScenarios.map(({ scenario, icon, label, description }) => (
            <button
              key={scenario}
              onClick={() => updateSettings({ scenario })}
              className={`p-3 rounded-lg border transition-all duration-200 text-left ${
                lightingSettings.scenario === scenario
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1">
                {icon}
                <span className="font-medium text-sm">{label}</span>
              </div>
              <p className="text-xs text-gray-600">{description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Fine-tuning Controls */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700">Fine-tune Settings</h4>
        
        {/* Brightness */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm text-gray-600">Brightness</label>
            <span className="text-sm font-medium text-gray-800">{lightingSettings.brightness}%</span>
          </div>
          <input
            type="range"
            min="20"
            max="150"
            value={lightingSettings.brightness}
            onChange={(e) => updateSettings({ brightness: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Contrast */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm text-gray-600">Contrast</label>
            <span className="text-sm font-medium text-gray-800">{lightingSettings.contrast}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="150"
            value={lightingSettings.contrast}
            onChange={(e) => updateSettings({ contrast: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Warmth */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm text-gray-600">Warmth</label>
            <span className="text-sm font-medium text-gray-800">{lightingSettings.warmth}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={lightingSettings.warmth}
            onChange={(e) => updateSettings({ warmth: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Intensity */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm text-gray-600">Light Intensity</label>
            <span className="text-sm font-medium text-gray-800">{lightingSettings.intensity}%</span>
          </div>
          <input
            type="range"
            min="30"
            max="120"
            value={lightingSettings.intensity}
            onChange={(e) => updateSettings({ intensity: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={() => updateSettings({ 
          brightness: 100, 
          contrast: 100, 
          warmth: 50, 
          intensity: 80,
          scenario: 'natural'
        })}
        className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
      >
        Reset to Default
      </button>
    </div>
  );
};