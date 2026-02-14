// Movie genres available in the system
export const MOVIE_GENRES = [
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Family',
  'Fantasy',
  'Horror',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Thriller',
  'War',
  'Western'
] as const;

export type MovieGenre = typeof MOVIE_GENRES[number];

// User preference data structure
export interface UserGenrePreference {
  id?: number;
  genre: MovieGenre;
  preferenceScore: number; // 1-5 scale
  createdAt?: string;
  updatedAt?: string;
}

// For registration form
export interface GenrePreferenceSelection {
  genre: MovieGenre;
  selected: boolean;
  preferenceScore?: number;
}

// Genre display information
export const GENRE_DESCRIPTIONS: Record<MovieGenre, string> = {
  'Action': 'Fast-paced adventures with thrilling sequences',
  'Adventure': 'Exciting journeys and exploration stories',
  'Animation': 'Animated films for all ages',
  'Comedy': 'Funny and entertaining movies',
  'Crime': 'Stories about criminals and law enforcement',
  'Documentary': 'Real-life stories and educational content',
  'Drama': 'Emotional and character-driven narratives',
  'Family': 'Movies suitable for the whole family',
  'Fantasy': 'Magical worlds and supernatural stories',
  'Horror': 'Scary and suspenseful thrillers',
  'Mystery': 'Puzzling stories with hidden secrets',
  'Romance': 'Love stories and romantic comedies',
  'Sci-Fi': 'Science fiction and futuristic tales',
  'Thriller': 'Suspenseful and edge-of-your-seat stories',
  'War': 'Military conflicts and wartime stories',
  'Western': 'Stories set in the American Old West'
};

// Emoji icons for genres
export const GENRE_ICONS: Record<MovieGenre, string> = {
  'Action': '💥',
  'Adventure': '🗺️',
  'Animation': '🎨',
  'Comedy': '😂',
  'Crime': '🔫',
  'Documentary': '📚',
  'Drama': '🎭',
  'Family': '👨‍👩‍👧‍👦',
  'Fantasy': '🦄',
  'Horror': '👻',
  'Mystery': '🔍',
  'Romance': '💕',
  'Sci-Fi': '🚀',
  'Thriller': '😨',
  'War': '⚔️',
  'Western': '🤠'
};