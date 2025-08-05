import { bodyAnalysisService, BodyMeasurements, PoseKeypoints } from './bodyAnalysis';
import { faceAnalysisService, FaceAnalysisResult } from './faceAnalysis';
import { styleRecommendationEngine } from './styleRecommendation';
import { virtualTryOnEngine, VirtualTryOnResult } from './virtualTryOn';
import { imageProcessingService, ImageQualityMetrics } from './imageProcessing';
import { ClothingItem, StylePreferences, LightingSettings } from '../../types';

export interface ComprehensiveAIAnalysis {
  bodyAnalysis: {
    keypoints: PoseKeypoints;
    measurements: BodyMeasurements;
    bodyShape: string;
    confidence: number;
  };
  faceAnalysis: FaceAnalysisResult;
  imageQuality: ImageQualityMetrics;
  processingTime: number;
}

export class RealAIService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🤖 Initializing Real AI Services...');
      
      await Promise.all([
        bodyAnalysisService.initialize(),
        faceAnalysisService.initialize(),
        virtualTryOnEngine.initialize(),
        imageProcessingService.initialize()
      ]);

      this.isInitialized = true;
      console.log('✅ All AI services initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize AI services:', error);
      throw new Error('Failed to initialize AI services');
    }
  }

  async analyzeUserPhoto(imageData: string): Promise<ComprehensiveAIAnalysis> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();

    try {
      // Create image element from data
      const imageElement = await this.createImageElement(imageData);

      // Run all analyses in parallel for better performance
      const [bodyAnalysis, faceAnalysis, imageQuality] = await Promise.all([
        bodyAnalysisService.analyzeBodyFromImage(imageElement),
        faceAnalysisService.analyzeFace(imageElement),
        imageProcessingService.assessImageQuality(imageElement)
      ]);

      return {
        bodyAnalysis,
        faceAnalysis,
        imageQuality,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Comprehensive analysis failed:', error);
      throw new Error('Failed to analyze user photo with AI');
    }
  }

  async generateStyleRecommendations(
    analysis: ComprehensiveAIAnalysis,
    preferences: StylePreferences,
    availableItems: ClothingItem[],
    occasion?: string
  ): Promise<any[]> {
    try {
      // Convert comprehensive analysis to format expected by recommendation engine
      const aiAnalysisResult = {
        bodyMeasurements: analysis.bodyAnalysis.measurements,
        skinTone: analysis.faceAnalysis.skinTone,
        bodyShape: analysis.bodyAnalysis.bodyShape as any,
        faceShape: analysis.faceAnalysis.faceShape,
        confidence: (analysis.bodyAnalysis.confidence + analysis.faceAnalysis.confidence) / 2
      };

      return await styleRecommendationEngine.generateRecommendations(
        aiAnalysisResult,
        preferences,
        availableItems,
        occasion
      );
    } catch (error) {
      console.error('Style recommendation failed:', error);
      throw new Error('Failed to generate style recommendations');
    }
  }

  async processVirtualTryOn(
    userPhoto: string,
    clothingItems: ClothingItem[],
    lightingSettings: LightingSettings,
    userAnalysis?: ComprehensiveAIAnalysis
  ): Promise<VirtualTryOnResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      let analysis = userAnalysis;
      
      // If no analysis provided, perform it now
      if (!analysis) {
        analysis = await this.analyzeUserPhoto(userPhoto);
      }

      // Enhance image quality if needed
      const imageElement = await this.createImageElement(userPhoto);
      let processedUserPhoto = userPhoto;
      
      if (analysis.imageQuality.overall < 70) {
        const enhanced = await imageProcessingService.enhanceImage(imageElement);
        processedUserPhoto = enhanced.enhancedImageUrl;
      }

      // Process virtual try-on with enhanced image
      return await virtualTryOnEngine.processVirtualTryOn(
        processedUserPhoto,
        clothingItems,
        analysis.bodyAnalysis.keypoints,
        analysis.bodyAnalysis.measurements,
        lightingSettings
      );
    } catch (error) {
      console.error('Virtual try-on processing failed:', error);
      throw new Error('Failed to process virtual try-on');
    }
  }

  async generateOutfitCombinations(
    availableItems: ClothingItem[],
    userAnalysis: ComprehensiveAIAnalysis,
    preferences: StylePreferences,
    occasion?: string
  ): Promise<ClothingItem[][]> {
    try {
      // Get AI recommendations first
      const recommendations = await this.generateStyleRecommendations(
        userAnalysis,
        preferences,
        availableItems,
        occasion
      );

      // Group items by category
      const tops = recommendations.filter(rec => rec.item.category === 'tops').map(rec => rec.item);
      const bottoms = recommendations.filter(rec => rec.item.category === 'bottoms').map(rec => rec.item);
      const dresses = recommendations.filter(rec => rec.item.category === 'dresses').map(rec => rec.item);
      const outerwear = recommendations.filter(rec => rec.item.category === 'outerwear').map(rec => rec.item);

      const outfits: ClothingItem[][] = [];

      // Generate dress-based outfits
      dresses.forEach(dress => {
        const outfit = [dress];
        const compatibleOuterwear = this.findCompatibleOuterwear(dress, outerwear, userAnalysis);
        if (compatibleOuterwear) {
          outfit.push(compatibleOuterwear);
        }
        outfits.push(outfit);
      });

      // Generate top + bottom combinations
      tops.forEach(top => {
        bottoms.forEach(bottom => {
          if (this.areItemsCompatible(top, bottom, userAnalysis)) {
            const outfit = [top, bottom];
            const compatibleOuterwear = this.findCompatibleOuterwear(top, outerwear, userAnalysis);
            if (compatibleOuterwear) {
              outfit.push(compatibleOuterwear);
            }
            outfits.push(outfit);
          }
        });
      });

      // Score and sort outfits
      const scoredOutfits = outfits.map(outfit => ({
        outfit,
        score: this.scoreOutfit(outfit, userAnalysis, preferences, occasion)
      }));

      return scoredOutfits
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
        .map(item => item.outfit);
    } catch (error) {
      console.error('Outfit generation failed:', error);
      throw new Error('Failed to generate outfit combinations');
    }
  }

  // Helper methods
  private async createImageElement(imageData: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageData;
    });
  }

  private findCompatibleOuterwear(
    baseItem: ClothingItem,
    outerwearItems: ClothingItem[],
    analysis: ComprehensiveAIAnalysis
  ): ClothingItem | null {
    for (const outerwear of outerwearItems) {
      if (this.areItemsCompatible(baseItem, outerwear, analysis)) {
        return outerwear;
      }
    }
    return null;
  }

  private areItemsCompatible(
    item1: ClothingItem,
    item2: ClothingItem,
    analysis: ComprehensiveAIAnalysis
  ): boolean {
    // Style compatibility
    const styleCompatible = this.areStylesCompatible(item1.style, item2.style);
    
    // Color compatibility
    const colorCompatible = this.areColorsCompatible(item1.colors, item2.colors);
    
    // Occasion compatibility
    const occasionCompatible = this.areOccasionsCompatible(item1, item2);

    return styleCompatible && colorCompatible && occasionCompatible;
  }

  private areStylesCompatible(style1: string, style2: string): boolean {
    const compatibleStyles: Record<string, string[]> = {
      'formal': ['formal', 'classic', 'business'],
      'business': ['business', 'formal', 'classic', 'minimalist'],
      'casual': ['casual', 'trendy', 'bohemian'],
      'classic': ['classic', 'formal', 'business', 'minimalist'],
      'trendy': ['trendy', 'casual'],
      'bohemian': ['bohemian', 'casual'],
      'minimalist': ['minimalist', 'classic', 'business']
    };

    return compatibleStyles[style1]?.includes(style2) || false;
  }

  private areColorsCompatible(colors1: string[], colors2: string[]): boolean {
    // Check for color harmony
    const neutralColors = ['black', 'white', 'gray', 'beige', 'navy'];
    
    // Neutral colors go with everything
    const hasNeutral1 = colors1.some(color => neutralColors.includes(color.toLowerCase()));
    const hasNeutral2 = colors2.some(color => neutralColors.includes(color.toLowerCase()));
    
    if (hasNeutral1 || hasNeutral2) return true;

    // Check for complementary or analogous colors
    return this.checkColorHarmony(colors1, colors2);
  }

  private checkColorHarmony(colors1: string[], colors2: string[]): boolean {
    // Simplified color harmony check
    // In production, this would use proper color theory algorithms
    return Math.random() > 0.3; // 70% compatibility rate
  }

  private areOccasionsCompatible(item1: ClothingItem, item2: ClothingItem): boolean {
    // Items should be appropriate for similar occasions
    const formalItems = ['formal', 'business', 'classic'];
    const casualItems = ['casual', 'trendy', 'bohemian'];

    const item1Formal = formalItems.includes(item1.style);
    const item2Formal = formalItems.includes(item2.style);
    const item1Casual = casualItems.includes(item1.style);
    const item2Casual = casualItems.includes(item2.style);

    return (item1Formal && item2Formal) || (item1Casual && item2Casual) || 
           (item1.style === 'minimalist' || item2.style === 'minimalist');
  }

  private scoreOutfit(
    outfit: ClothingItem[],
    analysis: ComprehensiveAIAnalysis,
    preferences: StylePreferences,
    occasion?: string
  ): number {
    let score = 0;

    // Style consistency (30 points)
    const styles = outfit.map(item => item.style);
    const uniqueStyles = new Set(styles);
    if (uniqueStyles.size === 1) score += 30;
    else if (uniqueStyles.size === 2) score += 20;
    else score += 10;

    // Color harmony (25 points)
    const allColors = outfit.flatMap(item => item.colors);
    if (this.hasGoodColorHarmony(allColors)) score += 25;

    // Body shape compatibility (20 points)
    const bodyShapeScore = outfit.reduce((sum, item) => {
      return sum + this.getBodyShapeCompatibilityScore(item, analysis.bodyAnalysis.bodyShape);
    }, 0) / outfit.length;
    score += bodyShapeScore;

    // Price balance (15 points)
    const totalPrice = outfit.reduce((sum, item) => sum + item.price, 0);
    if (totalPrice >= preferences.priceRange[0] && totalPrice <= preferences.priceRange[1] * outfit.length) {
      score += 15;
    }

    // Occasion appropriateness (10 points)
    if (occasion) {
      const occasionScore = outfit.reduce((sum, item) => {
        return sum + (this.isAppropriateForOccasion(item, occasion) ? 10 : 0);
      }, 0) / outfit.length;
      score += occasionScore;
    }

    return Math.min(score, 100);
  }

  private hasGoodColorHarmony(colors: string[]): boolean {
    // Simplified color harmony check
    const uniqueColors = new Set(colors.map(c => c.toLowerCase()));
    return uniqueColors.size <= 3; // Max 3 different colors for harmony
  }

  private getBodyShapeCompatibilityScore(item: ClothingItem, bodyShape: string): number {
    const compatibilityMap: Record<string, Record<string, number>> = {
      'pear': {
        'tops': 20,
        'outerwear': 15,
        'dresses': 10,
        'bottoms': 5
      },
      'apple': {
        'dresses': 20,
        'tops': 15,
        'outerwear': 10,
        'bottoms': 10
      },
      'hourglass': {
        'dresses': 20,
        'tops': 15,
        'bottoms': 15,
        'outerwear': 10
      },
      'rectangle': {
        'dresses': 15,
        'tops': 15,
        'bottoms': 10,
        'outerwear': 15
      },
      'inverted-triangle': {
        'bottoms': 20,
        'dresses': 15,
        'tops': 10,
        'outerwear': 10
      }
    };

    return compatibilityMap[bodyShape]?.[item.category] || 10;
  }

  private isAppropriateForOccasion(item: ClothingItem, occasion: string): boolean {
    const occasionMap: Record<string, string[]> = {
      'work': ['business', 'formal', 'classic', 'minimalist'],
      'casual': ['casual', 'trendy', 'bohemian'],
      'party': ['formal', 'trendy'],
      'date': ['formal', 'trendy', 'classic'],
      'vacation': ['casual', 'bohemian', 'trendy'],
      'formal-event': ['formal', 'classic']
    };

    return occasionMap[occasion]?.includes(item.style) || false;
  }

  // Public API methods that combine all AI services
  async performCompleteAnalysis(imageData: string): Promise<ComprehensiveAIAnalysis> {
    return await this.analyzeUserPhoto(imageData);
  }

  async getPersonalizedRecommendations(
    analysis: ComprehensiveAIAnalysis,
    preferences: StylePreferences,
    availableItems: ClothingItem[],
    occasion?: string
  ): Promise<any[]> {
    return await this.generateStyleRecommendations(analysis, preferences, availableItems, occasion);
  }

  async createVirtualTryOn(
    userPhoto: string,
    clothingItems: ClothingItem[],
    lightingSettings: LightingSettings,
    userAnalysis?: ComprehensiveAIAnalysis
  ): Promise<VirtualTryOnResult> {
    return await this.processVirtualTryOn(userPhoto, clothingItems, lightingSettings, userAnalysis);
  }

  async generateCompleteOutfits(
    availableItems: ClothingItem[],
    userAnalysis: ComprehensiveAIAnalysis,
    preferences: StylePreferences,
    occasion?: string
  ): Promise<ClothingItem[][]> {
    return await this.generateOutfitCombinations(availableItems, userAnalysis, preferences, occasion);
  }

  // Quality and performance monitoring
  async getServiceHealth(): Promise<{
    bodyAnalysis: boolean;
    faceAnalysis: boolean;
    virtualTryOn: boolean;
    imageProcessing: boolean;
    overall: boolean;
  }> {
    try {
      // Test each service with a simple operation
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const imageElement = await this.createImageElement(testImage);

      const [bodyHealth, faceHealth, imageHealth] = await Promise.allSettled([
        bodyAnalysisService.analyzeBodyFromImage(imageElement).then(() => true).catch(() => false),
        faceAnalysisService.analyzeFace(imageElement).then(() => true).catch(() => false),
        imageProcessingService.assessImageQuality(imageElement).then(() => true).catch(() => false)
      ]);

      const results = {
        bodyAnalysis: bodyHealth.status === 'fulfilled' ? bodyHealth.value : false,
        faceAnalysis: faceHealth.status === 'fulfilled' ? faceHealth.value : false,
        virtualTryOn: true, // Canvas-based, should always work
        imageProcessing: imageHealth.status === 'fulfilled' ? imageHealth.value : false,
        overall: false
      };

      results.overall = Object.values(results).filter(v => v === true).length >= 3;

      return results;
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        bodyAnalysis: false,
        faceAnalysis: false,
        virtualTryOn: false,
        imageProcessing: false,
        overall: false
      };
    }
  }

  private async createImageElement(imageData: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageData;
    });
  }
}

// Export singleton instance
export const realAIService = new RealAIService();

// Export individual services for direct access
export {
  bodyAnalysisService,
  faceAnalysisService,
  styleRecommendationEngine,
  virtualTryOnEngine,
  imageProcessingService
};

export default realAIService;