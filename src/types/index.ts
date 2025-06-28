export interface User {
  id: string;
  name: string;
  photo?: string;
  preferences: StylePreferences;
}

export interface StylePreferences {
  favoriteColors: string[];
  preferredStyles: ClothingStyle[];
  bodyType: BodyType;
  occasions: Occasion[];
  brands: string[];
  priceRange: [number, number];
}

export interface ClothingItem {
  id: string;
  name: string;
  category: ClothingCategory;
  style: ClothingStyle;
  colors: string[];
  brand: string;
  price: number;
  image: string;
  overlayImage: string; // For virtual try-on
  tags: string[];
  rating: number;
  sizes: Size[];
}

export interface LightingSettings {
  brightness: number;
  contrast: number;
  warmth: number;
  scenario: LightingScenario;
  intensity: number;
}

export type ClothingCategory = 'tops' | 'bottoms' | 'dresses' | 'outerwear' | 'shoes' | 'accessories';
export type ClothingStyle = 'casual' | 'formal' | 'business' | 'trendy' | 'classic' | 'bohemian' | 'minimalist';
export type BodyType = 'petite' | 'tall' | 'curvy' | 'athletic' | 'plus-size';
export type Occasion = 'work' | 'casual' | 'party' | 'date' | 'vacation' | 'formal-event';
export type Size = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
export type LightingScenario = 'natural' | 'indoor' | 'evening' | 'bright' | 'warm' | 'cool';

export interface TryOnSession {
  userPhoto: string;
  selectedItems: ClothingItem[];
  lightingSettings: LightingSettings;
  timestamp: Date;
}