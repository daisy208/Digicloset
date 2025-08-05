import React, { useState, useEffect } from 'react';
import { Activity, AlertCircle, CheckCircle, Brain, Eye, Palette, Zap } from 'lucide-react';
import { aiService } from '../services/aiService';

export const AIServiceStatus: React.FC = () => {
  const [serviceHealth, setServiceHealth] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkServiceHealth();
    
    // Check health every 30 seconds
    const interval = setInterval(checkServiceHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkServiceHealth = async () => {
    try {
      const health = await aiService.checkServiceHealth();
      setServiceHealth(health);
    } catch (error) {
      console.error('Health check failed:', error);
      setServiceHealth({
        realAI: false,
        fallback: true,
        overall: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
          <span className="text-sm text-gray-600">Checking AI services...</span>
        </div>
      </div>
    );
  }

  const getStatusIcon = (isHealthy: boolean) => {
    return isHealthy ? (
      <CheckCircle className="text-emerald-500" size={16} />
    ) : (
      <AlertCircle className="text-red-500" size={16} />
    );
  };

  const getStatusColor = (isHealthy: boolean) => {
    return isHealthy ? 'text-emerald-600' : 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Brain className="text-indigo-600" size={20} />
          <h3 className="font-semibold text-gray-800">AI Service Status</h3>
        </div>
        <div className="flex items-center space-x-1">
          <Activity 
            size={16} 
            className={serviceHealth?.overall ? 'text-emerald-500' : 'text-red-500'} 
          />
          <span className={`text-xs font-medium ${getStatusColor(serviceHealth?.overall)}`}>
            {serviceHealth?.overall ? 'Operational' : 'Degraded'}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <Brain size={14} />
            <span className="text-gray-700">Real AI Services</span>
          </div>
          <div className="flex items-center space-x-1">
            {getStatusIcon(serviceHealth?.realAI)}
            <span className={getStatusColor(serviceHealth?.realAI)}>
              {serviceHealth?.realAI ? 'Active' : 'Unavailable'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <Zap size={14} />
            <span className="text-gray-700">Fallback System</span>
          </div>
          <div className="flex items-center space-x-1">
            {getStatusIcon(serviceHealth?.fallback)}
            <span className={getStatusColor(serviceHealth?.fallback)}>
              {serviceHealth?.fallback ? 'Ready' : 'Error'}
            </span>
          </div>
        </div>
      </div>

      {!serviceHealth?.realAI && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="text-yellow-600 mt-0.5" size={14} />
            <div>
              <p className="text-yellow-800 text-xs font-medium">Demo Mode Active</p>
              <p className="text-yellow-700 text-xs">
                Configure AI API keys for production-grade analysis
              </p>
            </div>
          </div>
        </div>
      )}

      {serviceHealth?.realAI && (
        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <CheckCircle className="text-emerald-600 mt-0.5" size={14} />
            <div>
              <p className="text-emerald-800 text-xs font-medium">Real AI Active</p>
              <p className="text-emerald-700 text-xs">
                Using production AI models for analysis
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};