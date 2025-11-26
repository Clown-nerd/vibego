import { Mood } from './types';

// High-quality Unsplash images representing the vibes
// These images are chosen for their high contrast and vibrant colors to match the app theme
export const MOOD_IMAGES: Record<string, string> = {
  [Mood.ENERGETIC]: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop', // Concert/Crowd
  [Mood.RELAXED]: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=1974&auto=format&fit=crop', // Coffee/Book/Cozy
  [Mood.SOCIAL]: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2070&auto=format&fit=crop', // Friends Dining
  [Mood.ROMANTIC]: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070&auto=format&fit=crop', // Cocktail/Date
  [Mood.ADVENTUROUS]: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?q=80&w=2073&auto=format&fit=crop', // Hiking/Nature
  'Default': 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop' // Party fallback
};

// Specific images for filters to override mood with more specific context
export const CATEGORY_IMAGES: Record<string, string> = {
  'Party': 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=1740&auto=format&fit=crop', // Nightlife/Club
  'Food': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1740&auto=format&fit=crop', // Restaurant/Gourmet
  'Live Music': 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1740&auto=format&fit=crop', // Concert
  'Art': 'https://images.unsplash.com/photo-1579783902614-a3fb39279c0f?q=80&w=1740&auto=format&fit=crop', // Museum/Art
  'Nature': 'https://images.unsplash.com/photo-1469474932222-de0d97449d84?q=80&w=1740&auto=format&fit=crop', // Outdoors
  'Fitness': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1740&auto=format&fit=crop', // Gym
};
