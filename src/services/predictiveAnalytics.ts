import { ClothingItem, StylePreferences } from '../types';

interface UserBehavior {
  userId: string;
  viewedItems: string[];
  triedOnItems: string[];
  purchasedItems: string[];
  sessionDuration: number;
  interactionCount: number;
  preferredCategories: string[];
  averagePrice: number;
  timeOfDay: string;
  deviceType: string;
}

interface PredictionResult {
  likelihood: number;
  confidence: number;
  factors: Array<{ factor: string; impact: number }>;
  recommendations: string[];
}

interface CustomerSegment {
  id: string;
  name: string;
  characteristics: string[];
  size: number;
  averageValue: number;
  conversionRate: number;
}

interface TrendPrediction {
  item: ClothingItem;
  predictedDemand: number;
  growthRate: number;
  seasonalFactor: number;
  confidenceLevel: number;
}

class PredictiveAnalyticsService {
  private userBehaviorHistory: Map<string, UserBehavior[]> = new Map();
  private itemInteractionMatrix: Map<string, Map<string, number>> = new Map();
  private globalTrends: Map<string, number> = new Map();

  recordUserBehavior(behavior: UserBehavior) {
    const history = this.userBehaviorHistory.get(behavior.userId) || [];
    history.push(behavior);
    this.userBehaviorHistory.set(behavior.userId, history);

    this.updateInteractionMatrix(behavior);
    this.updateGlobalTrends(behavior);
  }

  private updateInteractionMatrix(behavior: UserBehavior) {
    behavior.viewedItems.forEach(itemId => {
      if (!this.itemInteractionMatrix.has(itemId)) {
        this.itemInteractionMatrix.set(itemId, new Map());
      }
    });

    for (let i = 0; i < behavior.viewedItems.length - 1; i++) {
      const item1 = behavior.viewedItems[i];
      const item2 = behavior.viewedItems[i + 1];

      const interactions = this.itemInteractionMatrix.get(item1);
      if (interactions) {
        interactions.set(item2, (interactions.get(item2) || 0) + 1);
      }
    }
  }

  private updateGlobalTrends(behavior: UserBehavior) {
    behavior.preferredCategories.forEach(category => {
      this.globalTrends.set(category, (this.globalTrends.get(category) || 0) + 1);
    });
  }

  async predictPurchaseLikelihood(
    userId: string,
    item: ClothingItem,
    currentSession: Partial<UserBehavior>
  ): Promise<PredictionResult> {
    const userHistory = this.userBehaviorHistory.get(userId) || [];

    const factors = [
      this.calculateCategoryAffinity(userId, item.category),
      this.calculatePriceAffinity(userId, item.price),
      this.calculateStyleMatch(userId, item.style),
      this.calculateSessionEngagement(currentSession),
      this.calculateItemPopularity(item.id),
      this.calculateSeasonalRelevance(item)
    ];

    const likelihood = factors.reduce((sum, f) => sum + f.impact, 0) / factors.length;
    const confidence = this.calculateConfidence(userHistory.length, factors);

    const recommendations = this.generateRecommendations(factors, likelihood);

    return {
      likelihood: Math.max(0, Math.min(100, likelihood)),
      confidence: Math.max(0, Math.min(100, confidence)),
      factors: factors.sort((a, b) => b.impact - a.impact),
      recommendations
    };
  }

  private calculateCategoryAffinity(userId: string, category: string): { factor: string; impact: number } {
    const history = this.userBehaviorHistory.get(userId) || [];
    const categoryCount = history.reduce((count, behavior) => {
      return count + behavior.preferredCategories.filter(c => c === category).length;
    }, 0);

    const totalInteractions = history.reduce((sum, b) => sum + b.preferredCategories.length, 0);
    const affinity = totalInteractions > 0 ? (categoryCount / totalInteractions) * 100 : 50;

    return {
      factor: 'Category Affinity',
      impact: affinity
    };
  }

  private calculatePriceAffinity(userId: string, price: number): { factor: string; impact: number } {
    const history = this.userBehaviorHistory.get(userId) || [];

    if (history.length === 0) {
      return { factor: 'Price Affinity', impact: 50 };
    }

    const avgPrice = history.reduce((sum, b) => sum + b.averagePrice, 0) / history.length;
    const priceDiff = Math.abs(price - avgPrice) / avgPrice;
    const affinity = Math.max(0, 100 - (priceDiff * 100));

    return {
      factor: 'Price Affinity',
      impact: affinity
    };
  }

  private calculateStyleMatch(userId: string, style: string): { factor: string; impact: number } {
    const history = this.userBehaviorHistory.get(userId) || [];

    if (history.length === 0) {
      return { factor: 'Style Match', impact: 50 };
    }

    const stylePreferences = new Map<string, number>();
    history.forEach(behavior => {
      behavior.preferredCategories.forEach(cat => {
        stylePreferences.set(cat, (stylePreferences.get(cat) || 0) + 1);
      });
    });

    const totalStyles = Array.from(stylePreferences.values()).reduce((sum, count) => sum + count, 0);
    const styleScore = totalStyles > 0 ? ((stylePreferences.get(style) || 0) / totalStyles) * 100 : 50;

    return {
      factor: 'Style Match',
      impact: styleScore
    };
  }

  private calculateSessionEngagement(session: Partial<UserBehavior>): { factor: string; impact: number } {
    const viewedCount = session.viewedItems?.length || 0;
    const triedOnCount = session.triedOnItems?.length || 0;
    const sessionTime = session.sessionDuration || 0;

    const engagementScore = Math.min(100, (viewedCount * 5) + (triedOnCount * 15) + (sessionTime / 60));

    return {
      factor: 'Session Engagement',
      impact: engagementScore
    };
  }

  private calculateItemPopularity(itemId: string): { factor: string; impact: number } {
    const interactions = this.itemInteractionMatrix.get(itemId);
    const totalInteractions = interactions
      ? Array.from(interactions.values()).reduce((sum, count) => sum + count, 0)
      : 0;

    const popularityScore = Math.min(100, totalInteractions * 2);

    return {
      factor: 'Item Popularity',
      impact: popularityScore
    };
  }

  private calculateSeasonalRelevance(item: ClothingItem): { factor: string; impact: number } {
    const month = new Date().getMonth();
    const season = Math.floor(month / 3);

    const seasonalRelevance: Record<string, number[]> = {
      'outerwear': [100, 70, 30, 70],
      'dresses': [50, 80, 100, 60],
      'tops': [70, 90, 90, 70],
      'bottoms': [80, 80, 80, 80]
    };

    const relevance = seasonalRelevance[item.category]?.[season] || 70;

    return {
      factor: 'Seasonal Relevance',
      impact: relevance
    };
  }

  private calculateConfidence(historyLength: number, factors: any[]): number {
    const dataQuality = Math.min(100, historyLength * 5);
    const factorConsistency = this.calculateFactorConsistency(factors);

    return (dataQuality * 0.6) + (factorConsistency * 0.4);
  }

  private calculateFactorConsistency(factors: any[]): number {
    const impacts = factors.map(f => f.impact);
    const avg = impacts.reduce((sum, i) => sum + i, 0) / impacts.length;
    const variance = impacts.reduce((sum, i) => sum + Math.pow(i - avg, 2), 0) / impacts.length;
    const stdDev = Math.sqrt(variance);

    return Math.max(0, 100 - stdDev);
  }

  private generateRecommendations(factors: any[], likelihood: number): string[] {
    const recommendations: string[] = [];

    if (likelihood < 40) {
      recommendations.push('Consider offering a discount to increase conversion');
      recommendations.push('Show social proof and customer reviews');
      recommendations.push('Highlight free returns and easy exchanges');
    } else if (likelihood < 70) {
      recommendations.push('User shows moderate interest, consider upselling');
      recommendations.push('Show similar items to increase engagement');
    } else {
      recommendations.push('High purchase intent detected');
      recommendations.push('Consider offering expedited shipping');
      recommendations.push('Suggest complementary items');
    }

    const weakestFactor = factors.sort((a, b) => a.impact - b.impact)[0];
    if (weakestFactor && weakestFactor.impact < 50) {
      recommendations.push(`Focus on improving ${weakestFactor.factor}`);
    }

    return recommendations;
  }

  async predictNextPurchase(userId: string, items: ClothingItem[]): Promise<ClothingItem[]> {
    const userHistory = this.userBehaviorHistory.get(userId) || [];

    if (userHistory.length === 0) {
      return items.slice(0, 5);
    }

    const scoredItems = await Promise.all(
      items.map(async item => {
        const prediction = await this.predictPurchaseLikelihood(userId, item, {});
        return { item, score: prediction.likelihood };
      })
    );

    return scoredItems
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(scored => scored.item);
  }

  async segmentCustomers(allBehaviors: UserBehavior[]): Promise<CustomerSegment[]> {
    const segments: CustomerSegment[] = [];

    const highValueUsers = allBehaviors.filter(b => b.purchasedItems.length > 5 && b.averagePrice > 100);
    if (highValueUsers.length > 0) {
      segments.push({
        id: 'high-value',
        name: 'High Value Customers',
        characteristics: ['Frequent buyers', 'High average order value', 'Low price sensitivity'],
        size: highValueUsers.length,
        averageValue: highValueUsers.reduce((sum, u) => sum + u.averagePrice, 0) / highValueUsers.length,
        conversionRate: 0.85
      });
    }

    const browserUsers = allBehaviors.filter(b => b.viewedItems.length > 10 && b.purchasedItems.length === 0);
    if (browserUsers.length > 0) {
      segments.push({
        id: 'browsers',
        name: 'Window Shoppers',
        characteristics: ['High engagement', 'Low conversion', 'Research-oriented'],
        size: browserUsers.length,
        averageValue: 0,
        conversionRate: 0.05
      });
    }

    const tryOnUsers = allBehaviors.filter(b => b.triedOnItems.length > 3);
    if (tryOnUsers.length > 0) {
      segments.push({
        id: 'try-on-engaged',
        name: 'Virtual Try-On Enthusiasts',
        characteristics: ['Uses try-on feature frequently', 'High purchase intent', 'Tech-savvy'],
        size: tryOnUsers.length,
        averageValue: tryOnUsers.reduce((sum, u) => sum + u.averagePrice, 0) / tryOnUsers.length,
        conversionRate: 0.65
      });
    }

    const casualUsers = allBehaviors.filter(b =>
      b.viewedItems.length > 0 &&
      b.purchasedItems.length > 0 &&
      b.purchasedItems.length <= 2
    );
    if (casualUsers.length > 0) {
      segments.push({
        id: 'casual',
        name: 'Casual Shoppers',
        characteristics: ['Occasional buyers', 'Moderate engagement', 'Price conscious'],
        size: casualUsers.length,
        averageValue: casualUsers.reduce((sum, u) => sum + u.averagePrice, 0) / casualUsers.length,
        conversionRate: 0.35
      });
    }

    return segments;
  }

  async predictTrends(items: ClothingItem[], historicalData: any[]): Promise<TrendPrediction[]> {
    return items.map(item => {
      const categoryTrend = this.globalTrends.get(item.category) || 0;
      const totalTrends = Array.from(this.globalTrends.values()).reduce((sum, val) => sum + val, 0);
      const demandScore = totalTrends > 0 ? (categoryTrend / totalTrends) * 100 : 50;

      const growthRate = this.calculateGrowthRate(item.category, historicalData);
      const seasonalFactor = this.calculateSeasonalRelevance(item).impact / 100;

      return {
        item,
        predictedDemand: demandScore * seasonalFactor,
        growthRate,
        seasonalFactor,
        confidenceLevel: Math.min(95, categoryTrend * 2)
      };
    }).sort((a, b) => b.predictedDemand - a.predictedDemand);
  }

  private calculateGrowthRate(category: string, historicalData: any[]): number {
    if (historicalData.length < 2) {
      return 0;
    }

    const recentData = historicalData.slice(-6);
    let growthSum = 0;

    for (let i = 1; i < recentData.length; i++) {
      const prev = recentData[i - 1][category] || 0;
      const curr = recentData[i][category] || 0;
      if (prev > 0) {
        growthSum += ((curr - prev) / prev) * 100;
      }
    }

    return growthSum / (recentData.length - 1);
  }

  async generateChurnRiskScore(userId: string): Promise<{
    riskScore: number;
    factors: string[];
    retentionActions: string[];
  }> {
    const history = this.userBehaviorHistory.get(userId) || [];

    if (history.length === 0) {
      return {
        riskScore: 50,
        factors: ['No historical data available'],
        retentionActions: ['Encourage first interaction with welcome offer']
      };
    }

    const recentBehavior = history.slice(-5);
    const daysSinceLastVisit = this.calculateDaysSinceLastVisit(recentBehavior);
    const engagementTrend = this.calculateEngagementTrend(recentBehavior);
    const purchaseFrequency = this.calculatePurchaseFrequency(history);

    const riskScore = Math.min(100,
      (daysSinceLastVisit * 2) +
      ((100 - engagementTrend) * 0.5) +
      ((100 - purchaseFrequency) * 0.5)
    );

    const factors: string[] = [];
    const retentionActions: string[] = [];

    if (daysSinceLastVisit > 30) {
      factors.push('Extended period of inactivity');
      retentionActions.push('Send re-engagement email with personalized offers');
    }

    if (engagementTrend < 40) {
      factors.push('Declining engagement trend');
      retentionActions.push('Highlight new arrivals matching their preferences');
    }

    if (purchaseFrequency < 30) {
      factors.push('Low purchase frequency');
      retentionActions.push('Offer loyalty rewards or exclusive discounts');
    }

    return { riskScore, factors, retentionActions };
  }

  private calculateDaysSinceLastVisit(recentBehavior: UserBehavior[]): number {
    if (recentBehavior.length === 0) return 90;
    return Math.min(90, 7);
  }

  private calculateEngagementTrend(recentBehavior: UserBehavior[]): number {
    if (recentBehavior.length === 0) return 0;

    const avgEngagement = recentBehavior.reduce((sum, b) =>
      sum + b.interactionCount, 0
    ) / recentBehavior.length;

    return Math.min(100, avgEngagement * 10);
  }

  private calculatePurchaseFrequency(history: UserBehavior[]): number {
    const totalPurchases = history.reduce((sum, b) => sum + b.purchasedItems.length, 0);
    const timeSpan = history.length || 1;

    return Math.min(100, (totalPurchases / timeSpan) * 50);
  }
}

export const predictiveAnalytics = new PredictiveAnalyticsService();
export default predictiveAnalytics;
