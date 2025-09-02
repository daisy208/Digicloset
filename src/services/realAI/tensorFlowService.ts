import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import { ClothingItem } from '../../types';

export interface TensorFlowModels {
  bodySegmentation: tf.GraphModel | null;
  styleClassification: tf.LayersModel | null;
  colorAnalysis: tf.LayersModel | null;
  fitPrediction: tf.LayersModel | null;
}

export class TensorFlowService {
  private models: TensorFlowModels = {
    bodySegmentation: null,
    styleClassification: null,
    colorAnalysis: null,
    fitPrediction: null
  };
  private isInitialized = false;
  private modelUrls = {
    bodySegmentation: '/models/body-segmentation/model.json',
    styleClassification: '/models/style-classification/model.json',
    colorAnalysis: '/models/color-analysis/model.json',
    fitPrediction: '/models/fit-prediction/model.json'
  };

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🤖 Initializing TensorFlow.js models...');
      
      // Set backend to WebGL for better performance
      await tf.setBackend('webgl');
      await tf.ready();

      // Load models in parallel
      const modelPromises = [
        this.loadBodySegmentationModel(),
        this.loadStyleClassificationModel(),
        this.loadColorAnalysisModel(),
        this.loadFitPredictionModel()
      ];

      await Promise.allSettled(modelPromises);
      
      this.isInitialized = true;
      console.log('✅ TensorFlow.js service initialized');
      console.log('📊 Memory usage:', tf.memory());
    } catch (error) {
      console.error('❌ Failed to initialize TensorFlow.js service:', error);
      throw new Error('Failed to initialize TensorFlow.js service');
    }
  }

  private async loadBodySegmentationModel(): Promise<void> {
    try {
      this.models.bodySegmentation = await tf.loadGraphModel(this.modelUrls.bodySegmentation);
      console.log('✅ Body segmentation model loaded');
    } catch (error) {
      console.warn('⚠️ Body segmentation model not available:', error);
    }
  }

  private async loadStyleClassificationModel(): Promise<void> {
    try {
      this.models.styleClassification = await tf.loadLayersModel(this.modelUrls.styleClassification);
      console.log('✅ Style classification model loaded');
    } catch (error) {
      console.warn('⚠️ Style classification model not available:', error);
    }
  }

  private async loadColorAnalysisModel(): Promise<void> {
    try {
      this.models.colorAnalysis = await tf.loadLayersModel(this.modelUrls.colorAnalysis);
      console.log('✅ Color analysis model loaded');
    } catch (error) {
      console.warn('⚠️ Color analysis model not available:', error);
    }
  }

  private async loadFitPredictionModel(): Promise<void> {
    try {
      this.models.fitPrediction = await tf.loadLayersModel(this.modelUrls.fitPrediction);
      console.log('✅ Fit prediction model loaded');
    } catch (error) {
      console.warn('⚠️ Fit prediction model not available:', error);
    }
  }

  // Segment person from background using TensorFlow.js
  async segmentPerson(imageElement: HTMLImageElement): Promise<{
    maskTensor: tf.Tensor;
    maskImageUrl: string;
    confidence: number;
  }> {
    if (!this.isInitialized) await this.initialize();

    try {
      if (!this.models.bodySegmentation) {
        throw new Error('Body segmentation model not available');
      }

      // Preprocess image
      const inputTensor = tf.browser.fromPixels(imageElement)
        .resizeNearestNeighbor([513, 513])
        .expandDims(0)
        .div(255.0);

      // Run segmentation
      const prediction = this.models.bodySegmentation.predict(inputTensor) as tf.Tensor;
      
      // Post-process to get binary mask
      const maskTensor = tf.argMax(prediction, -1).squeeze();
      
      // Convert to image URL
      const maskCanvas = document.createElement('canvas');
      await tf.browser.toPixels(maskTensor as tf.Tensor2D, maskCanvas);
      const maskImageUrl = maskCanvas.toDataURL();

      // Calculate confidence
      const confidence = await this.calculateSegmentationConfidence(prediction);

      // Cleanup
      inputTensor.dispose();
      prediction.dispose();

      return {
        maskTensor,
        maskImageUrl,
        confidence
      };
    } catch (error) {
      console.error('Person segmentation failed:', error);
      throw new Error('Failed to segment person from image');
    }
  }

  // Classify clothing style using custom trained model
  async classifyStyle(imageElement: HTMLImageElement): Promise<{
    style: string;
    confidence: number;
    probabilities: Record<string, number>;
  }> {
    if (!this.isInitialized) await this.initialize();

    try {
      if (!this.models.styleClassification) {
        throw new Error('Style classification model not available');
      }

      // Preprocess image
      const inputTensor = tf.browser.fromPixels(imageElement)
        .resizeNearestNeighbor([224, 224])
        .expandDims(0)
        .div(255.0);

      // Run classification
      const prediction = this.models.styleClassification.predict(inputTensor) as tf.Tensor;
      const probabilities = await prediction.data();

      // Map to style labels
      const styleLabels = ['casual', 'formal', 'business', 'trendy', 'classic', 'bohemian', 'minimalist'];
      const maxIndex = probabilities.indexOf(Math.max(...Array.from(probabilities)));
      
      const probabilityMap = styleLabels.reduce((acc, label, index) => {
        acc[label] = probabilities[index];
        return acc;
      }, {} as Record<string, number>);

      // Cleanup
      inputTensor.dispose();
      prediction.dispose();

      return {
        style: styleLabels[maxIndex],
        confidence: probabilities[maxIndex],
        probabilities: probabilityMap
      };
    } catch (error) {
      console.error('Style classification failed:', error);
      throw new Error('Failed to classify clothing style');
    }
  }

  // Analyze color palette using TensorFlow.js
  async analyzeColors(imageElement: HTMLImageElement): Promise<{
    dominantColors: Array<{ color: string; percentage: number; rgb: [number, number, number] }>;
    colorHarmony: number;
    temperature: 'warm' | 'cool' | 'neutral';
  }> {
    if (!this.isInitialized) await this.initialize();

    try {
      // Extract color information using TensorFlow.js
      const imageTensor = tf.browser.fromPixels(imageElement);
      
      // Resize for faster processing
      const resized = tf.image.resizeBilinear(imageTensor, [64, 64]);
      
      // Get pixel data
      const pixelData = await resized.data();
      
      // Analyze colors
      const colorClusters = this.performKMeansClustering(pixelData, 5);
      const dominantColors = this.convertClustersToColors(colorClusters);
      const temperature = this.analyzeColorTemperature(dominantColors);
      const harmony = this.calculateColorHarmony(dominantColors);

      // Cleanup
      imageTensor.dispose();
      resized.dispose();

      return {
        dominantColors,
        colorHarmony: harmony,
        temperature
      };
    } catch (error) {
      console.error('Color analysis failed:', error);
      throw new Error('Failed to analyze colors');
    }
  }

  // Predict clothing fit using ML
  async predictFit(
    bodyMeasurements: any,
    clothingItem: ClothingItem
  ): Promise<{
    fitScore: number;
    sizeRecommendation: string;
    adjustments: string[];
    confidence: number;
  }> {
    if (!this.isInitialized) await this.initialize();

    try {
      if (!this.models.fitPrediction) {
        // Use rule-based fallback
        return this.ruleBased FitPrediction(bodyMeasurements, clothingItem);
      }

      // Prepare input features
      const features = this.prepareFitFeatures(bodyMeasurements, clothingItem);
      const inputTensor = tf.tensor2d([features]);

      // Run prediction
      const prediction = this.models.fitPrediction.predict(inputTensor) as tf.Tensor;
      const results = await prediction.data();

      // Interpret results
      const fitScore = results[0] * 100;
      const sizeRecommendation = this.interpretSizeRecommendation(results[1]);
      const adjustments = this.generateFitAdjustments(results.slice(2), clothingItem);

      // Cleanup
      inputTensor.dispose();
      prediction.dispose();

      return {
        fitScore,
        sizeRecommendation,
        adjustments,
        confidence: Math.min(fitScore / 100, 0.95)
      };
    } catch (error) {
      console.error('Fit prediction failed:', error);
      throw new Error('Failed to predict clothing fit');
    }
  }

  // Performance monitoring
  getPerformanceMetrics(): {
    memoryUsage: any;
    modelSizes: Record<string, number>;
    inferenceTime: Record<string, number>;
  } {
    const memory = tf.memory();
    const modelSizes = {};
    const inferenceTime = {}; // Would track actual inference times

    Object.entries(this.models).forEach(([name, model]) => {
      if (model) {
        modelSizes[name] = this.estimateModelSize(model);
      }
    });

    return {
      memoryUsage: memory,
      modelSizes,
      inferenceTime
    };
  }

  // Helper methods
  private async calculateSegmentationConfidence(prediction: tf.Tensor): Promise<number> {
    const maxValues = tf.max(prediction, -1);
    const meanConfidence = tf.mean(maxValues);
    const confidence = await meanConfidence.data();
    
    maxValues.dispose();
    meanConfidence.dispose();
    
    return confidence[0];
  }

  private performKMeansClustering(pixelData: Float32Array, k: number): Array<{
    centroid: [number, number, number];
    size: number;
  }> {
    // Simplified K-means clustering for color extraction
    const pixels = [];
    for (let i = 0; i < pixelData.length; i += 3) {
      pixels.push([pixelData[i], pixelData[i + 1], pixelData[i + 2]]);
    }

    // Initialize centroids randomly
    const centroids = [];
    for (let i = 0; i < k; i++) {
      const randomPixel = pixels[Math.floor(Math.random() * pixels.length)];
      centroids.push([...randomPixel]);
    }

    // Run K-means iterations
    for (let iter = 0; iter < 10; iter++) {
      const clusters = Array(k).fill(null).map(() => []);
      
      // Assign pixels to nearest centroid
      pixels.forEach(pixel => {
        let minDistance = Infinity;
        let closestCentroid = 0;
        
        centroids.forEach((centroid, index) => {
          const distance = Math.sqrt(
            Math.pow(pixel[0] - centroid[0], 2) +
            Math.pow(pixel[1] - centroid[1], 2) +
            Math.pow(pixel[2] - centroid[2], 2)
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            closestCentroid = index;
          }
        });
        
        clusters[closestCentroid].push(pixel);
      });

      // Update centroids
      clusters.forEach((cluster, index) => {
        if (cluster.length > 0) {
          centroids[index] = [
            cluster.reduce((sum, pixel) => sum + pixel[0], 0) / cluster.length,
            cluster.reduce((sum, pixel) => sum + pixel[1], 0) / cluster.length,
            cluster.reduce((sum, pixel) => sum + pixel[2], 0) / cluster.length
          ];
        }
      });
    }

    return centroids.map((centroid, index) => ({
      centroid: centroid as [number, number, number],
      size: clusters[index]?.length || 0
    }));
  }

  private convertClustersToColors(clusters: Array<{ centroid: [number, number, number]; size: number }>): Array<{
    color: string;
    percentage: number;
    rgb: [number, number, number];
  }> {
    const totalPixels = clusters.reduce((sum, cluster) => sum + cluster.size, 0);
    
    return clusters
      .sort((a, b) => b.size - a.size)
      .map(cluster => {
        const [r, g, b] = cluster.centroid.map(v => Math.round(v));
        const color = this.rgbToColorName(r, g, b);
        const percentage = (cluster.size / totalPixels) * 100;
        
        return {
          color,
          percentage,
          rgb: [r, g, b] as [number, number, number]
        };
      });
  }

  private rgbToColorName(r: number, g: number, b: number): string {
    // Simplified color name mapping
    const colorMap = [
      { name: 'black', rgb: [0, 0, 0] },
      { name: 'white', rgb: [255, 255, 255] },
      { name: 'red', rgb: [255, 0, 0] },
      { name: 'green', rgb: [0, 255, 0] },
      { name: 'blue', rgb: [0, 0, 255] },
      { name: 'yellow', rgb: [255, 255, 0] },
      { name: 'purple', rgb: [128, 0, 128] },
      { name: 'orange', rgb: [255, 165, 0] },
      { name: 'pink', rgb: [255, 192, 203] },
      { name: 'brown', rgb: [165, 42, 42] },
      { name: 'gray', rgb: [128, 128, 128] }
    ];

    let minDistance = Infinity;
    let closestColor = 'unknown';

    colorMap.forEach(({ name, rgb: [cr, cg, cb] }) => {
      const distance = Math.sqrt(
        Math.pow(r - cr, 2) + Math.pow(g - cg, 2) + Math.pow(b - cb, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestColor = name;
      }
    });

    return closestColor;
  }

  private analyzeColorTemperature(colors: Array<{ rgb: [number, number, number] }>): 'warm' | 'cool' | 'neutral' {
    let warmScore = 0;
    let coolScore = 0;

    colors.forEach(({ rgb: [r, g, b] }) => {
      // Warm colors have more red/yellow
      if (r > g && r > b) warmScore += 1;
      if (g > b && (r + g) > b * 1.5) warmScore += 0.5;
      
      // Cool colors have more blue/green
      if (b > r && b > g) coolScore += 1;
      if (g > r && b > r) coolScore += 0.5;
    });

    if (warmScore > coolScore * 1.2) return 'warm';
    if (coolScore > warmScore * 1.2) return 'cool';
    return 'neutral';
  }

  private calculateColorHarmony(colors: Array<{ rgb: [number, number, number] }>): number {
    if (colors.length < 2) return 100;

    let harmonyScore = 0;
    const numPairs = colors.length * (colors.length - 1) / 2;

    for (let i = 0; i < colors.length; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        const [r1, g1, b1] = colors[i].rgb;
        const [r2, g2, b2] = colors[j].rgb;
        
        // Calculate color distance
        const distance = Math.sqrt(
          Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
        );
        
        // Normalize distance (0-441 max for RGB)
        const normalizedDistance = distance / 441;
        
        // Good harmony is either very similar (< 0.2) or complementary (> 0.7)
        if (normalizedDistance < 0.2 || normalizedDistance > 0.7) {
          harmonyScore += 1;
        } else if (normalizedDistance > 0.4 && normalizedDistance < 0.6) {
          harmonyScore += 0.5; // Moderate harmony
        }
      }
    }

    return (harmonyScore / numPairs) * 100;
  }

  private prepareFitFeatures(bodyMeasurements: any, clothingItem: ClothingItem): number[] {
    const features = [];

    // Body measurements (normalized)
    features.push(
      bodyMeasurements.height / 200,
      bodyMeasurements.shoulders / 50,
      bodyMeasurements.chest / 50,
      bodyMeasurements.waist / 50,
      bodyMeasurements.hips / 50
    );

    // Clothing category encoding
    const categories = ['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories'];
    categories.forEach(cat => {
      features.push(clothingItem.category === cat ? 1 : 0);
    });

    // Style encoding
    const styles = ['casual', 'formal', 'business', 'trendy', 'classic', 'bohemian', 'minimalist'];
    styles.forEach(style => {
      features.push(clothingItem.style === style ? 1 : 0);
    });

    // Price (normalized)
    features.push(clothingItem.price / 500);

    // Rating
    features.push(clothingItem.rating / 5);

    return features;
  }

  private ruleBased FitPrediction(bodyMeasurements: any, clothingItem: ClothingItem): {
    fitScore: number;
    sizeRecommendation: string;
    adjustments: string[];
    confidence: number;
  } {
    let fitScore = 70;
    const adjustments = [];

    // Category-specific fit analysis
    switch (clothingItem.category) {
      case 'tops':
        if (bodyMeasurements.chest >= 32 && bodyMeasurements.chest <= 42) fitScore += 20;
        if (bodyMeasurements.shoulders >= 38 && bodyMeasurements.shoulders <= 46) fitScore += 10;
        break;

      case 'bottoms':
        if (bodyMeasurements.waist >= 26 && bodyMeasurements.waist <= 36) fitScore += 15;
        if (bodyMeasurements.hips >= 34 && bodyMeasurements.hips <= 44) fitScore += 15;
        break;

      case 'dresses':
        const waistToHipRatio = bodyMeasurements.waist / bodyMeasurements.hips;
        if (waistToHipRatio >= 0.65 && waistToHipRatio <= 0.85) fitScore += 20;
        break;
    }

    // Generate size recommendation
    const sizeRecommendation = this.recommendSize(bodyMeasurements);

    // Generate adjustments
    if (fitScore < 80) {
      adjustments.push('Consider sizing up for better comfort');
    }

    return {
      fitScore: Math.min(fitScore, 100),
      sizeRecommendation,
      adjustments,
      confidence: 0.75
    };
  }

  private recommendSize(measurements: any): string {
    if (measurements.chest <= 32) return 'XS';
    if (measurements.chest <= 34) return 'S';
    if (measurements.chest <= 38) return 'M';
    if (measurements.chest <= 42) return 'L';
    return 'XL';
  }

  private interpretSizeRecommendation(value: number): string {
    const sizes = ['XS', 'S', 'M', 'L', 'XL'];
    const index = Math.round(value * (sizes.length - 1));
    return sizes[Math.max(0, Math.min(index, sizes.length - 1))];
  }

  private generateFitAdjustments(values: ArrayLike<number>, item: ClothingItem): string[] {
    const adjustments = [];
    
    if (values[0] > 0.7) adjustments.push('Consider sizing up');
    if (values[1] > 0.7) adjustments.push('May need tailoring');
    if (values[2] > 0.7) adjustments.push('Check length measurements');

    return adjustments.slice(0, 2);
  }

  private estimateModelSize(model: tf.LayersModel | tf.GraphModel): number {
    // Estimate model size in MB
    if ('getWeights' in model) {
      const weights = model.getWeights();
      let totalParams = 0;
      weights.forEach(weight => {
        totalParams += weight.size;
      });
      return (totalParams * 4) / (1024 * 1024); // 4 bytes per float32
    }
    return 0;
  }

  // Cleanup resources
  dispose(): void {
    Object.values(this.models).forEach(model => {
      if (model) {
        model.dispose();
      }
    });
    
    // Clean up TensorFlow.js memory
    tf.disposeVariables();
    console.log('🧹 TensorFlow.js resources cleaned up');
  }
}

export const tensorFlowService = new TensorFlowService();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    tensorFlowService.dispose();
  });
}