import { Mood, GroupType } from './types';

export const MOODS = [
  { value: Mood.ENERGETIC, icon: 'flash', label: 'Energetic' },
  { value: Mood.RELAXED, icon: 'cafe', label: 'Relaxed' },
  { value: Mood.SOCIAL, icon: 'people', label: 'Social' },
  { value: Mood.ROMANTIC, icon: 'heart', label: 'Romantic' },
  { value: Mood.ADVENTUROUS, icon: 'compass', label: 'Adventurous' },
];

export const GROUP_TYPES = [
  { value: GroupType.SOLO, label: 'Solo' },
  { value: GroupType.COUPLE, label: 'Couple' },
  { value: GroupType.FRIENDS, label: 'Friends' },
  { value: GroupType.FAMILY, label: 'Family' },
];

export const ACTIVITIES = [
  'Live Music', 'Food & Dining', 'Nightlife', 'Nature', 
  'Art & Culture', 'Outdoors', 'Shopping', 'Gaming & Sports'
];

export const PLACEHOLDER_COORDS = {
  latitude: 40.7128,
  longitude: -74.0060 // NYC default if geo fails
};
