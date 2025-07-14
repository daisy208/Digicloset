import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { analytics } from '../services/analyticsService';

interface Experiment {
  id: string;
  name: string;
  variants: ExperimentVariant[];
  status: 'draft' | 'running' | 'completed';
  trafficAllocation: number;
  startDate: Date;
  endDate?: Date;
}

interface ExperimentVariant {
  id: string;
  name: string;
  weight: number;
  config: Record<string, any>;
}

interface ABTestContextType {
  getVariant: (experimentName: string) => string | null;
  trackConversion: (experimentName: string, conversionType?: string) => void;
  isExperimentActive: (experimentName: string) => boolean;
}

const ABTestContext = createContext<ABTestContextType | undefined>(undefined);

interface ABTestingProviderProps {
  children: ReactNode;
}

export const ABTestingProvider: React.FC<ABTestingProviderProps> = ({ children }) => {
  const [experiments, setExperiments] = useState<Record<string, Experiment>>({});
  const [userVariants, setUserVariants] = useState<Record<string, string>>({});

  useEffect(() => {
    loadExperiments();
  }, []);

  const loadExperiments = async () => {
    try {
      const response = await fetch('/api/experiments/active');
      const data = await response.json();
      
      const experimentsMap: Record<string, Experiment> = {};
      data.experiments.forEach((exp: Experiment) => {
        experimentsMap[exp.name] = exp;
      });
      
      setExperiments(experimentsMap);
      
      // Assign variants for active experiments
      const variants: Record<string, string> = {};
      Object.keys(experimentsMap).forEach(expName => {
        if (experimentsMap[expName].status === 'running') {
          variants[expName] = assignVariant(experimentsMap[expName]);
        }
      });
      
      setUserVariants(variants);
    } catch (error) {
      console.error('Failed to load experiments:', error);
    }
  };

  const assignVariant = (experiment: Experiment): string => {
    // Check if user already has a variant assigned (stored in localStorage)
    const storageKey = `experiment_${experiment.name}`;
    const existingVariant = localStorage.getItem(storageKey);
    
    if (existingVariant && experiment.variants.some(v => v.id === existingVariant)) {
      return existingVariant;
    }

    // Assign new variant based on weights
    const random = Math.random() * 100;
    let cumulativeWeight = 0;
    
    for (const variant of experiment.variants) {
      cumulativeWeight += variant.weight;
      if (random <= cumulativeWeight) {
        localStorage.setItem(storageKey, variant.id);
        
        // Track experiment exposure
        analytics.trackExperiment(experiment.name, variant.id, {
          experiment_id: experiment.id,
          variant_name: variant.name
        });
        
        return variant.id;
      }
    }
    
    // Fallback to first variant
    const fallbackVariant = experiment.variants[0].id;
    localStorage.setItem(storageKey, fallbackVariant);
    return fallbackVariant;
  };

  const getVariant = (experimentName: string): string | null => {
    return userVariants[experimentName] || null;
  };

  const trackConversion = (experimentName: string, conversionType: string = 'primary') => {
    const variant = userVariants[experimentName];
    if (variant) {
      analytics.track('experiment_conversion', {
        experiment_name: experimentName,
        variant,
        conversion_type: conversionType
      });
    }
  };

  const isExperimentActive = (experimentName: string): boolean => {
    const experiment = experiments[experimentName];
    return experiment?.status === 'running' || false;
  };

  const value: ABTestContextType = {
    getVariant,
    trackConversion,
    isExperimentActive
  };

  return (
    <ABTestContext.Provider value={value}>
      {children}
    </ABTestContext.Provider>
  );
};

export const useABTest = () => {
  const context = useContext(ABTestContext);
  if (context === undefined) {
    throw new Error('useABTest must be used within an ABTestingProvider');
  }
  return context;
};

// Hook for specific experiments
export const useExperiment = (experimentName: string) => {
  const { getVariant, trackConversion, isExperimentActive } = useABTest();
  
  const variant = getVariant(experimentName);
  const isActive = isExperimentActive(experimentName);
  
  return {
    variant,
    isActive,
    trackConversion: (conversionType?: string) => trackConversion(experimentName, conversionType)
  };
};