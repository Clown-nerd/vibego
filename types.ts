import React from 'react';

// Define the custom element type
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'ion-icon': any;
    }
  }
}

// Augment the 'react' module as well to ensure the type is picked up by newer TS/React setups
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ion-icon': any;
    }
  }
}

export enum Mood {
  ENERGETIC = 'Energetic',
  RELAXED = 'Relaxed',
  SOCIAL = 'Social',
  ROMANTIC = 'Romantic',
  ADVENTUROUS = 'Adventurous'
}

export enum GroupType {
  SOLO = 'Solo',
  COUPLE = 'Couple',
  FRIENDS = 'Friends',
  FAMILY = 'Family'
}

export type DateRange = 'Today' | 'Tomorrow' | 'This Weekend' | 'Next Week';
export type CategoryFilter = 'All' | 'Party' | 'Food' | 'Live Music' | 'Art' | 'Nature' | 'Fitness';

export interface UserPreferences {
  mood: Mood;
  groupType: GroupType;
  budget: number; // in local currency (e.g., generic units)
  activities: string[];
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Venue {
  id: string;
  name: string;
  description: string;
  type: string;
  budgetLevel: string;
  rating?: string;
  address?: string;
  coordinates?: Coordinates; // Added for precise ride-hailing
  googleMapsUri?: string; // extracted from grounding
  time?: string; // Event time or opening hours
  ticketLink?: string; // URL to buy tickets
}

export interface AppState {
  hasOnboarded: boolean;
  location: Coordinates | null;
  preferences: UserPreferences;
  recommendations: Venue[];
  isGlobalLoading: boolean;
}