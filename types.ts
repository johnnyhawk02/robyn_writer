
export interface TracingWord {
  id?: string;
  text: string;
  // category removed
  imageUrl?: string; // Base64 string for user uploads
  emoji?: string;    // Fallback for default words
}

export enum BrushColor {
  Red = '#EF4444',
  Blue = '#3B82F6',
  Green = '#22C55E',
  Yellow = '#EAB308',
  Purple = '#A855F7',
  Pink = '#EC4899',
  Black = '#1F2937',
}
