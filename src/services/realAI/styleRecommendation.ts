import OpenAI from 'openai';
import { ClothingItem, StylePreferences } from '../../types';
import { AIAnalysisResult } from '../aiService';

export interface StyleRecommendationEngine {
  generateRecommendations(
    userAnalysis: AIAnalysisResult,
    preferences: StylePreferences,
    availableItems: ClothingItem[],
    occasion?: string
  ): Promise<any[]>;
}

export class OpenAIStyleRecommendation implements StyleRecommendationEngine {
  private openai: OpenAI;
  private model = 'gpt-4-turbo-preview';

  constructor() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    this.openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true // Note: In production, use a backend proxy
    });
  }

  async generateRecommendations(
    userAnalysis: AIAnalysisResult,
    preferences: StylePreferences,
    availableItems: ClothingItem[],
    occasion?: string
  ): Promise<any[]> {
    try {
      const prompt = this.buildStylePrompt(userAnalysis, preferences, availableItems, occasion);
      
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert fashion stylist and personal shopper with deep knowledge of body types, color theory, and style principles. Provide detailed, personalized fashion recommendations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const aiResponse = completion.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from AI service');
      }

      return this.parseAIRecommendations(aiResponse, availableItems);
    } catch (error) {
      console.error('OpenAI recommendation failed:', error);
      throw new Error('Failed to generate AI recommendations');
    }
  }

  private buildStylePrompt(
    userAnalysis: AIAnalysisResult,
    preferences: StylePreferences,
    availableItems: ClothingItem[],
    occasion?: string
  ): string {
    const itemsDescription = availableItems.map(item => 
      `ID: ${item.id}, Name: ${item.name}, Category: ${item.category}, Style: ${item.style}, Colors: ${item.colors.join(', ')}, Price: $${item.price}, Brand: ${item.brand}, Rating: ${item.rating}`
    ).join('\n');

    return `
Analyze this user's profile and recommend the best clothing items from the available catalog:

USER ANALYSIS:
- Body Shape: ${userAnalysis.bodyShape}
- Skin Tone: ${userAnalysis.skinTone}
- Body Measurements: Shoulders ${userAnalysis.bodyMeasurements.shoulders}cm, Chest ${userAnalysis.bodyMeasurements.chest}cm, Waist ${userAnalysis.bodyMeasurements.waist}cm, Hips ${userAnalysis.bodyMeasurements.hips}cm, Height ${userAnalysis.bodyMeasurements.height}cm

USER PREFERENCES:
- Preferred Styles: ${preferences.preferredStyles.join(', ')}
- Favorite Colors: ${preferences.favoriteColors.join(', ')}
- Body Type: ${preferences.bodyType}
- Occasions: ${preferences.occasions.join(', ')}
- Preferred Brands: ${preferences.brands.join(', ')}
- Price Range: $${preferences.priceRange[0]} - $${preferences.priceRange[1]}

${occasion ? `TARGET OCCASION: ${occasion}` : ''}

AVAILABLE ITEMS:
${itemsDescription}

Please provide recommendations in this exact JSON format:
{
  "recommendations": [
    {
      "itemId": "item_id_here",
      "score": 85,
      "reasons": ["reason 1", "reason 2", "reason 3"],
      "stylingTips": ["tip 1", "tip 2"],
      "occasionMatch": 90,
      "colorHarmony": 85,
      "fitPrediction": 88,
      "bodyShapeCompatibility": "excellent"
    }
  ]
}

Focus on:
1. Body shape compatibility and flattering silhouettes
2. Color harmony with skin tone
3. Style preference alignment
4. Occasion appropriateness
5. Price range fit
6. Practical styling advice

Provide 4-8 recommendations ranked by overall suitability.
    `;
  }

  private parseAIRecommendations(aiResponse: string, availableItems: ClothingItem[]): any[] {
    try {
      // Extract JSON from AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const recommendations = parsed.recommendations || [];

      // Map AI recommendations to actual items
      return recommendations
        .map((rec: any) => {
          const item = availableItems.find(item => item.id === rec.itemId);
          if (!item) return null;

          return {
            item,
            score: rec.score || 0,
            reasons: rec.reasons || [],
            styling_tips: rec.stylingTips || [],
            occasion_match: rec.occasionMatch || 0,
            color_harmony: rec.colorHarmony || 0,
            fit_prediction: rec.fitPrediction || 0,
            body_shape_compatibility: rec.bodyShapeCompatibility || 'good'
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Failed to parse AI recommendations:', error);
      // Fallback to rule-based recommendations
      return this.generateFallbackRecommendations(availableItems);
    }
  }

  private generateFallbackRecommendations(availableItems: ClothingItem[]): any[] {
    return availableItems
      .slice(0, 6)
      .map(item => ({
        item,
        score: Math.random() * 40 + 60, // 60-100 range
        reasons: ['Fallback recommendation'],
        styling_tips: ['Style as desired'],
        occasion_match: 70,
        color_harmony: 75,
        fit_prediction: 80,
        body_shape_compatibility: 'good'
      }));
  }
}

// Alternative recommendation engine using TensorFlow.js
export class TensorFlowStyleRecommendation implements StyleRecommendationEngine {
  private model: tf.LayersModel | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load pre-trained style recommendation model
      this.model = await tf.loadLayersModel('/models/style-recommendation-model.json');
      this.isInitialized = true;
      console.log('✅ TensorFlow style recommendation model loaded');
    } catch (error) {
      console.error('❌ Failed to load TensorFlow model:', error);
      throw new Error('Failed to initialize TensorFlow recommendation engine');
    }
  }

  async generateRecommendations(
    userAnalysis: AIAnalysisResult,
    preferences: StylePreferences,
    availableItems: ClothingItem[],
    occasion?: string
  ): Promise<any[]> {
    if (!this.isInitialized || !this.model) {
      await this.initialize();
    }

    try {
      const userFeatures = this.encodeUserFeatures(userAnalysis, preferences, occasion);
      const itemFeatures = availableItems.map(item => this.encodeItemFeatures(item));

      // Predict compatibility scores
      const scores = await this.predictCompatibility(userFeatures, itemFeatures);

      // Create recommendations with scores
      const recommendations = availableItems.map((item, index) => ({
        item,
        score: scores[index] * 100,
        reasons: this.generateReasons(item, userAnalysis, preferences),
        styling_tips: this.generateStylingTips(item, userAnalysis),
        occasion_match: this.calculateOccasionMatch(item, occasion),
        color_harmony: this.calculateColorHarmony(item, userAnalysis.skinTone),
        fit_prediction: this.predictFit(item, userAnalysis.bodyMeasurements)
      }));

      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);
    } catch (error) {
      console.error('TensorFlow recommendation failed:', error);
      throw new Error('Failed to generate ML recommendations');
    }
  }

  private encodeUserFeatures(
    analysis: AIAnalysisResult,
    preferences: StylePreferences,
    occasion?: string
  ): number[] {
    const features = [];

    // Body shape encoding (one-hot)
    const bodyShapes = ['pear', 'apple', 'hourglass', 'rectangle', 'inverted-triangle'];
    bodyShapes.forEach(shape => {
      features.push(analysis.bodyShape === shape ? 1 : 0);
    });

    // Skin tone encoding
    const skinTones = ['warm', 'cool', 'neutral'];
    skinTones.forEach(tone => {
      features.push(analysis.skinTone === tone ? 1 : 0);
    });

    // Body measurements (normalized)
    features.push(
      analysis.bodyMeasurements.height / 200,
      analysis.bodyMeasurements.shoulders / 50,
      analysis.bodyMeasurements.chest / 50,
      analysis.bodyMeasurements.waist / 50,
      analysis.bodyMeasurements.hips / 50
    );

    // Style preferences
    const allStyles = ['casual', 'formal', 'business', 'trendy', 'classic', 'bohemian', 'minimalist'];
    allStyles.forEach(style => {
      features.push(preferences.preferredStyles.includes(style as any) ? 1 : 0);
    });

    // Price range (normalized)
    features.push(
      preferences.priceRange[0] / 500,
      preferences.priceRange[1] / 500
    );

    // Occasion encoding
    const occasions = ['work', 'casual', 'party', 'date', 'vacation', 'formal-event'];
    occasions.forEach(occ => {
      features.push(occasion === occ ? 1 : 0);
    });

    return features;
  }

  private encodeItemFeatures(item: ClothingItem): number[] {
    const features = [];

    // Category encoding
    const categories = ['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories'];
    categories.forEach(cat => {
      features.push(item.category === cat ? 1 : 0);
    });

    // Style encoding
    const styles = ['casual', 'formal', 'business', 'trendy', 'classic', 'bohemian', 'minimalist'];
    styles.forEach(style => {
      features.push(item.style === style ? 1 : 0);
    });

    // Color encoding (simplified)
    const commonColors = ['black', 'white', 'blue', 'red', 'green', 'brown', 'gray', 'pink'];
    commonColors.forEach(color => {
      features.push(item.colors.some(c => c.toLowerCase().includes(color)) ? 1 : 0);
    });

    // Price (normalized)
    features.push(item.price / 500);

    // Rating
    features.push(item.rating / 5);

    return features;
  }

  private async predictCompatibility(userFeatures: number[], itemFeatures: number[][]): Promise<number[]> {
    if (!this.model) {
      throw new Error('Model not initialized');
    }

    // Create input tensor
    const userTensor = tf.tensor2d([userFeatures]);
    const itemTensors = itemFeatures.map(features => tf.tensor2d([features]));

    const scores = [];
    for (const itemTensor of itemTensors) {
      // Concatenate user and item features
      const combinedFeatures = tf.concat([userTensor, itemTensor], 1);
      
      // Predict compatibility
      const prediction = this.model.predict(combinedFeatures) as tf.Tensor;
      const score = await prediction.data();
      scores.push(score[0]);
      
      // Clean up tensors
      combinedFeatures.dispose();
      itemTensor.dispose();
      prediction.dispose();
    }

    userTensor.dispose();
    return scores;
  }

  private generateReasons(item: ClothingItem, analysis: AIAnalysisResult, preferences: StylePreferences): string[] {
    const reasons = [];

    if (preferences.preferredStyles.includes(item.style)) {
      reasons.push(`Matches your ${item.style} style preference`);
    }

    if (item.colors.some(color => preferences.favoriteColors.includes(color))) {
      reasons.push('Features your favorite colors');
    }

    // Body shape specific reasons
    const bodyShapeAdvice = this.getBodyShapeAdvice(analysis.bodyShape, item);
    if (bodyShapeAdvice) {
      reasons.push(bodyShapeAdvice);
    }

    if (item.rating >= 4.5) {
      reasons.push('Highly rated by other customers');
    }

    return reasons.slice(0, 3);
  }

  private getBodyShapeAdvice(bodyShape: string, item: ClothingItem): string | null {
    const advice: Record<string, Record<string, string>> = {
      'pear': {
        'tops': 'Draws attention to your upper body, balancing your silhouette',
        'outerwear': 'Creates structure in your shoulders and torso'
      },
      'apple': {
        'dresses': 'Empire waist style flatters your figure',
        'tops': 'Creates a defined waistline'
      },
      'hourglass': {
        'dresses': 'Accentuates your natural waist beautifully',
        'tops': 'Highlights your balanced proportions'
      },
      'rectangle': {
        'dresses': 'Creates curves and defines your waist',
        'tops': 'Adds visual interest to your silhouette'
      },
      'inverted-triangle': {
        'bottoms': 'Balances your broader shoulders',
        'dresses': 'Creates a harmonious silhouette'
      }
    };

    return advice[bodyShape]?.[item.category] || null;
  }

  private generateStylingTips(item: ClothingItem, analysis: AIAnalysisResult): string[] {
    const tips = [];

    // Category-specific tips
    if (item.category === 'tops') {
      if (analysis.bodyShape === 'pear') {
        tips.push('Tuck into high-waisted bottoms to elongate your torso');
      } else if (analysis.bodyShape === 'apple') {
        tips.push('Leave untucked for a flattering drape over your midsection');
      }
    }

    if (item.category === 'dresses') {
      if (analysis.bodyShape === 'hourglass') {
        tips.push('Add a belt to emphasize your natural waistline');
      } else if (analysis.bodyShape === 'rectangle') {
        tips.push('Create curves with strategic layering or accessories');
      }
    }

    // Color-specific tips
    if (analysis.skinTone === 'warm') {
      const hasWarmColors = item.colors.some(color => 
        ['red', 'orange', 'yellow', 'brown', 'gold'].some(warm => 
          color.toLowerCase().includes(warm)
        )
      );
      if (hasWarmColors) {
        tips.push('These warm tones will enhance your natural glow');
      }
    }

    return tips.slice(0, 2);
  }

  private calculateOccasionMatch(item: ClothingItem, occasion?: string): number {
    if (!occasion) return 70;

    const occasionMap: Record<string, Record<string, number>> = {
      'work': {
        'business': 95,
        'formal': 90,
        'classic': 85,
        'minimalist': 80,
        'casual': 40
      },
      'casual': {
        'casual': 95,
        'trendy': 85,
        'bohemian': 80,
        'classic': 70,
        'formal': 30
      },
      'party': {
        'formal': 95,
        'trendy': 90,
        'classic': 75,
        'business': 60,
        'casual': 40
      },
      'date': {
        'formal': 90,
        'trendy': 85,
        'classic': 80,
        'casual': 70,
        'bohemian': 75
      }
    };

    return occasionMap[occasion]?.[item.style] || 50;
  }

  private calculateColorHarmony(item: ClothingItem, skinTone: string): number {
    const warmColors = ['red', 'orange', 'yellow', 'brown', 'gold', 'coral', 'peach'];
    const coolColors = ['blue', 'green', 'purple', 'silver', 'gray', 'navy', 'teal'];
    const neutralColors = ['black', 'white', 'beige', 'cream', 'taupe'];

    let harmonyScore = 50; // Base score

    item.colors.forEach(color => {
      const colorLower = color.toLowerCase();
      
      if (neutralColors.some(neutral => colorLower.includes(neutral))) {
        harmonyScore += 15; // Neutral colors work with all skin tones
      } else if (skinTone === 'warm' && warmColors.some(warm => colorLower.includes(warm))) {
        harmonyScore += 25;
      } else if (skinTone === 'cool' && coolColors.some(cool => colorLower.includes(cool))) {
        harmonyScore += 25;
      } else if (skinTone === 'neutral') {
        harmonyScore += 20; // Neutral skin tone works with most colors
      }
    });

    return Math.min(harmonyScore, 100);
  }

  private predictFit(item: ClothingItem, measurements: any): number {
    // Simplified fit prediction based on category and measurements
    let fitScore = 75; // Base score

    if (item.category === 'tops') {
      // Check if chest measurement is within reasonable range for the item
      if (measurements.chest >= 32 && measurements.chest <= 42) {
        fitScore += 15;
      }
    }

    if (item.category === 'bottoms') {
      // Check waist and hip measurements
      if (measurements.waist >= 26 && measurements.waist <= 36) {
        fitScore += 10;
      }
      if (measurements.hips >= 34 && measurements.hips <= 44) {
        fitScore += 10;
      }
    }

    if (item.category === 'dresses') {
      // Overall body proportion check
      const waistToHipRatio = measurements.waist / measurements.hips;
      if (waistToHipRatio >= 0.7 && waistToHipRatio <= 0.8) {
        fitScore += 15;
      }
    }

    return Math.min(fitScore, 95);
  }
}

export const styleRecommendationEngine = new OpenAIStyleRecommendation();