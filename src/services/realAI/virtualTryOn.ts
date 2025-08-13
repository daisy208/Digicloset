import * as fabric from 'fabric';
import { ClothingItem, LightingSettings } from '../../types';
import { BodyMeasurements, PoseKeypoints } from './bodyAnalysis';

export interface VirtualTryOnResult {
  processedImageUrl: string;
  fitAnalysis: {
    overall_fit: 'excellent' | 'good' | 'fair' | 'poor';
    size_recommendation: string;
    adjustments_needed: string[];
    confidence: number;
  };
  processingTime: number;
  qualityScore: number;
}

export class VirtualTryOnEngine {
  private canvas: fabric.Canvas | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create hidden canvas for processing
      const canvasElement = document.createElement('canvas');
      canvasElement.width = 512;
      canvasElement.height = 768;
      canvasElement.style.display = 'none';
      document.body.appendChild(canvasElement);

      this.canvas = new fabric.Canvas(canvasElement);
      this.isInitialized = true;
      console.log('✅ Virtual try-on engine initialized');
    } catch (error) {
      console.error('❌ Failed to initialize virtual try-on engine:', error);
      throw new Error('Failed to initialize virtual try-on engine');
    }
  }

  async processVirtualTryOn(
    userPhoto: string,
    clothingItems: ClothingItem[],
    bodyKeypoints: PoseKeypoints,
    bodyMeasurements: BodyMeasurements,
    lightingSettings: LightingSettings
  ): Promise<VirtualTryOnResult> {
    if (!this.isInitialized || !this.canvas) {
      await this.initialize();
    }

    const startTime = Date.now();

    try {
      // Clear canvas
      this.canvas!.clear();

      // Load and position user image
      const userImage = await this.loadImage(userPhoto);
      this.canvas!.setBackgroundImage(userImage, this.canvas!.renderAll.bind(this.canvas!));

      // Process each clothing item
      for (const item of clothingItems) {
        await this.overlayClothingItem(item, bodyKeypoints, bodyMeasurements);
      }

      // Apply lighting effects
      this.applyLightingEffects(lightingSettings);

      // Generate final image
      const processedImageUrl = this.canvas!.toDataURL('image/jpeg', 0.9);

      // Analyze fit quality
      const fitAnalysis = this.analyzeFit(clothingItems, bodyMeasurements);
      const qualityScore = this.assessImageQuality(processedImageUrl);

      return {
        processedImageUrl,
        fitAnalysis,
        processingTime: Date.now() - startTime,
        qualityScore
      };
    } catch (error) {
      console.error('Virtual try-on processing failed:', error);
      throw new Error('Failed to process virtual try-on');
    }
  }

  private async loadImage(src: string): Promise<fabric.Image> {
    return new Promise((resolve, reject) => {
      fabric.Image.fromURL(src, (img) => {
        if (img) {
          // Scale image to fit canvas
          const scale = Math.min(
            this.canvas!.width! / img.width!,
            this.canvas!.height! / img.height!
          );
          img.scale(scale);
          resolve(img);
        } else {
          reject(new Error('Failed to load image'));
        }
      });
    });
  }

  private async overlayClothingItem(
    item: ClothingItem,
    keypoints: PoseKeypoints,
    measurements: BodyMeasurements
  ): Promise<void> {
    try {
      const clothingImage = await this.loadImage(item.overlayImage);
      
      // Calculate positioning based on clothing category and body keypoints
      const position = this.calculateClothingPosition(item, keypoints, measurements);
      const scale = this.calculateClothingScale(item, measurements);
      
      // Apply transformations
      clothingImage.set({
        left: position.x,
        top: position.y,
        scaleX: scale.x,
        scaleY: scale.y,
        angle: position.rotation || 0
      });

      // Apply realistic draping and wrinkles
      this.applyClothPhysics(clothingImage, item, measurements);

      // Add to canvas
      this.canvas!.add(clothingImage);
    } catch (error) {
      console.error(`Failed to overlay ${item.name}:`, error);
    }
  }

  private calculateClothingPosition(
    item: ClothingItem,
    keypoints: PoseKeypoints,
    measurements: BodyMeasurements
  ): { x: number; y: number; rotation?: number } {
    const canvasWidth = this.canvas!.width!;
    const canvasHeight = this.canvas!.height!;

    switch (item.category) {
      case 'tops':
        return {
          x: (keypoints.leftShoulder.x + keypoints.rightShoulder.x) / 2 * canvasWidth,
          y: keypoints.leftShoulder.y * canvasHeight,
          rotation: this.calculateShoulderAngle(keypoints)
        };

      case 'bottoms':
        return {
          x: (keypoints.leftHip.x + keypoints.rightHip.x) / 2 * canvasWidth,
          y: keypoints.leftHip.y * canvasHeight
        };

      case 'dresses':
        return {
          x: (keypoints.leftShoulder.x + keypoints.rightShoulder.x) / 2 * canvasWidth,
          y: keypoints.leftShoulder.y * canvasHeight,
          rotation: this.calculateShoulderAngle(keypoints)
        };

      case 'outerwear':
        return {
          x: (keypoints.leftShoulder.x + keypoints.rightShoulder.x) / 2 * canvasWidth,
          y: (keypoints.leftShoulder.y - 0.05) * canvasHeight, // Slightly higher for jackets
          rotation: this.calculateShoulderAngle(keypoints)
        };

      default:
        return { x: canvasWidth / 2, y: canvasHeight / 2 };
    }
  }

  private calculateClothingScale(item: ClothingItem, measurements: BodyMeasurements): { x: number; y: number } {
    // Base scale factors for different clothing types
    const baseScales: Record<string, { x: number; y: number }> = {
      'tops': { x: 0.8, y: 0.6 },
      'bottoms': { x: 0.7, y: 0.8 },
      'dresses': { x: 0.8, y: 1.2 },
      'outerwear': { x: 0.9, y: 0.7 }
    };

    const baseScale = baseScales[item.category] || { x: 0.8, y: 0.8 };

    // Adjust scale based on body measurements
    const shoulderFactor = measurements.shoulders / 42; // Normalize to average
    const heightFactor = measurements.height / 170; // Normalize to average

    return {
      x: baseScale.x * shoulderFactor,
      y: baseScale.y * heightFactor
    };
  }

  private calculateShoulderAngle(keypoints: PoseKeypoints): number {
    const shoulderVector = {
      x: keypoints.rightShoulder.x - keypoints.leftShoulder.x,
      y: keypoints.rightShoulder.y - keypoints.leftShoulder.y
    };

    return Math.atan2(shoulderVector.y, shoulderVector.x) * (180 / Math.PI);
  }

  private applyClothPhysics(
    clothingImage: fabric.Image,
    item: ClothingItem,
    measurements: BodyMeasurements
  ): void {
    // Apply fabric-specific properties
    const fabricProperties = this.getFabricProperties(item);
    
    // Simulate draping based on fabric type
    if (fabricProperties.drape > 0.7) {
      // Flowy fabrics - add slight curve
      clothingImage.set({
        skewX: Math.random() * 2 - 1,
        skewY: Math.random() * 1
      });
    }

    // Add subtle wrinkles for realism
    this.addWrinkleEffect(clothingImage, fabricProperties);
  }

  private getFabricProperties(item: ClothingItem): {
    drape: number;
    stiffness: number;
    stretch: number;
  } {
    // Determine fabric properties from item tags or category
    const tags = item.tags.join(' ').toLowerCase();
    
    if (tags.includes('silk') || tags.includes('chiffon')) {
      return { drape: 0.9, stiffness: 0.2, stretch: 0.3 };
    } else if (tags.includes('denim') || tags.includes('structured')) {
      return { drape: 0.3, stiffness: 0.8, stretch: 0.2 };
    } else if (tags.includes('cotton') || tags.includes('jersey')) {
      return { drape: 0.6, stiffness: 0.4, stretch: 0.7 };
    } else {
      return { drape: 0.5, stiffness: 0.5, stretch: 0.5 };
    }
  }

  private addWrinkleEffect(image: fabric.Image, properties: any): void {
    // Add subtle shadow/highlight effects to simulate wrinkles
    const filter = new fabric.Image.filters.Brightness({
      brightness: (Math.random() - 0.5) * 0.1 * properties.drape
    });
    
    image.filters = [filter];
    image.applyFilters();
  }

  private applyLightingEffects(settings: LightingSettings): void {
    if (!this.canvas) return;

    // Create lighting overlay
    const overlay = new fabric.Rect({
      left: 0,
      top: 0,
      width: this.canvas.width,
      height: this.canvas.height,
      fill: this.getLightingColor(settings),
      opacity: this.getLightingOpacity(settings),
      selectable: false,
      evented: false
    });

    // Apply blend mode for realistic lighting
    overlay.set('globalCompositeOperation', this.getLightingBlendMode(settings));
    this.canvas.add(overlay);
  }

  private getLightingColor(settings: LightingSettings): string {
    const { warmth, scenario } = settings;
    
    switch (scenario) {
      case 'warm':
        return `hsl(30, 20%, ${50 + warmth / 2}%)`;
      case 'cool':
        return `hsl(210, 15%, ${50 + warmth / 2}%)`;
      case 'evening':
        return `hsl(45, 25%, ${30 + warmth / 3}%)`;
      case 'bright':
        return `hsl(60, 10%, ${70 + warmth / 4}%)`;
      default:
        return `hsl(0, 0%, ${50 + warmth / 2}%)`;
    }
  }

  private getLightingOpacity(settings: LightingSettings): number {
    return (settings.intensity / 100) * 0.3; // Max 30% opacity
  }

  private getLightingBlendMode(settings: LightingSettings): string {
    switch (settings.scenario) {
      case 'warm':
        return 'multiply';
      case 'cool':
        return 'screen';
      case 'bright':
        return 'overlay';
      default:
        return 'soft-light';
    }
  }

  private analyzeFit(items: ClothingItem[], measurements: BodyMeasurements): {
    overall_fit: 'excellent' | 'good' | 'fair' | 'poor';
    size_recommendation: string;
    adjustments_needed: string[];
    confidence: number;
  } {
    const fitScores = items.map(item => this.calculateItemFit(item, measurements));
    const avgFitScore = fitScores.reduce((sum, score) => sum + score, 0) / fitScores.length;

    let overall_fit: 'excellent' | 'good' | 'fair' | 'poor';
    if (avgFitScore >= 90) overall_fit = 'excellent';
    else if (avgFitScore >= 75) overall_fit = 'good';
    else if (avgFitScore >= 60) overall_fit = 'fair';
    else overall_fit = 'poor';

    const adjustments = this.generateFitAdjustments(items, measurements);
    const sizeRec = this.recommendSize(measurements);

    return {
      overall_fit,
      size_recommendation: sizeRec,
      adjustments_needed: adjustments,
      confidence: Math.min(avgFitScore / 100, 0.95)
    };
  }

  private calculateItemFit(item: ClothingItem, measurements: BodyMeasurements): number {
    let score = 70; // Base score

    // Category-specific fit analysis
    switch (item.category) {
      case 'tops':
        if (measurements.chest >= 32 && measurements.chest <= 42) score += 20;
        if (measurements.shoulders >= 38 && measurements.shoulders <= 46) score += 10;
        break;

      case 'bottoms':
        if (measurements.waist >= 26 && measurements.waist <= 36) score += 15;
        if (measurements.hips >= 34 && measurements.hips <= 44) score += 15;
        break;

      case 'dresses':
        const waistToHipRatio = measurements.waist / measurements.hips;
        if (waistToHipRatio >= 0.65 && waistToHipRatio <= 0.85) score += 20;
        break;
    }

    return Math.min(score, 100);
  }

  private generateFitAdjustments(items: ClothingItem[], measurements: BodyMeasurements): string[] {
    const adjustments = [];

    items.forEach(item => {
      switch (item.category) {
        case 'tops':
          if (measurements.chest > 40) {
            adjustments.push(`${item.name}: Consider sizing up for comfort`);
          } else if (measurements.chest < 34) {
            adjustments.push(`${item.name}: May need tailoring for better fit`);
          }
          break;

        case 'bottoms':
          if (measurements.waist > 34) {
            adjustments.push(`${item.name}: High-waisted style recommended`);
          }
          break;

        case 'dresses':
          if (measurements.height < 160) {
            adjustments.push(`${item.name}: May need hemming`);
          } else if (measurements.height > 175) {
            adjustments.push(`${item.name}: Check dress length`);
          }
          break;
      }
    });

    return adjustments.slice(0, 3);
  }

  private recommendSize(measurements: BodyMeasurements): string {
    // Size recommendation based on chest measurement (primary indicator)
    if (measurements.chest <= 32) return 'XS';
    if (measurements.chest <= 34) return 'S';
    if (measurements.chest <= 38) return 'M';
    if (measurements.chest <= 42) return 'L';
    return 'XL';
  }

  private assessImageQuality(imageUrl: string): number {
    // Simplified quality assessment
    // In production, this would analyze image sharpness, contrast, etc.
    return Math.random() * 20 + 80; // 80-100 range
  }

  // Advanced clothing positioning using machine learning
  async positionClothingWithML(
    item: ClothingItem,
    keypoints: PoseKeypoints,
    measurements: BodyMeasurements
  ): Promise<{ x: number; y: number; scale: number; rotation: number }> {
    try {
      // This would use a trained ML model for precise clothing positioning
      // For now, using rule-based positioning with ML-inspired calculations
      
      const position = this.calculateMLPosition(item, keypoints, measurements);
      return position;
    } catch (error) {
      console.error('ML positioning failed, using fallback:', error);
      return this.calculateFallbackPosition(item, keypoints);
    }
  }

  private calculateMLPosition(
    item: ClothingItem,
    keypoints: PoseKeypoints,
    measurements: BodyMeasurements
  ): { x: number; y: number; scale: number; rotation: number } {
    // Simulate ML-based positioning with more sophisticated calculations
    const shoulderCenter = {
      x: (keypoints.leftShoulder.x + keypoints.rightShoulder.x) / 2,
      y: (keypoints.leftShoulder.y + keypoints.rightShoulder.y) / 2
    };

    const hipCenter = {
      x: (keypoints.leftHip.x + keypoints.rightHip.x) / 2,
      y: (keypoints.leftHip.y + keypoints.rightHip.y) / 2
    };

    // Calculate body angle for proper clothing alignment
    const bodyAngle = Math.atan2(
      hipCenter.y - shoulderCenter.y,
      hipCenter.x - shoulderCenter.x
    ) * (180 / Math.PI);

    // Category-specific positioning with ML-inspired adjustments
    switch (item.category) {
      case 'tops':
        return {
          x: shoulderCenter.x * this.canvas!.width!,
          y: shoulderCenter.y * this.canvas!.height! - 20,
          scale: measurements.shoulders / 42,
          rotation: bodyAngle
        };

      case 'bottoms':
        return {
          x: hipCenter.x * this.canvas!.width!,
          y: hipCenter.y * this.canvas!.height!,
          scale: measurements.hips / 38,
          rotation: bodyAngle * 0.5
        };

      case 'dresses':
        return {
          x: shoulderCenter.x * this.canvas!.width!,
          y: shoulderCenter.y * this.canvas!.height! - 30,
          scale: (measurements.shoulders + measurements.hips) / 80,
          rotation: bodyAngle * 0.7
        };

      default:
        return {
          x: this.canvas!.width! / 2,
          y: this.canvas!.height! / 2,
          scale: 1,
          rotation: 0
        };
    }
  }

  private calculateFallbackPosition(
    item: ClothingItem,
    keypoints: PoseKeypoints
  ): { x: number; y: number; scale: number; rotation: number } {
    return {
      x: this.canvas!.width! / 2,
      y: this.canvas!.height! / 2,
      scale: 0.8,
      rotation: 0
    };
  }
}

export const virtualTryOnEngine = new VirtualTryOnEngine();