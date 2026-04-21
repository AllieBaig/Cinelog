export interface WatchEvent {
  id: string;
  date: string; // ISO string
  xpEarned: number;
}

export interface Movie {
  id: string;
  name: string;
  year: number;
  actors: string[];
  director: string;
  categories: string[];
  tags: string[];
  themes: string[];
  
  // Logs
  watches: WatchEvent[];
  watchedDates: string[];
  lastWatched?: string;
  firstWatched?: string;

  // Stats
  watchCount: number;
  rewatchCount: number;

  // System
  createdAt: number;
  updatedAt: number;

  // Additional Features
  endingStyle?: 'happy' | 'sad' | 'bittersweet';
  plotTwist?: boolean;
}

export interface WatchListItem {
  id: string;
  name: string;
  year: number;
  actors: string[];
  director: string;
  categories: string[];
  tags: string[];
  themes: string[];
  createdAt: number;
  updatedAt: number;
  endingStyle?: 'happy' | 'sad' | 'bittersweet';
  plotTwist?: boolean;
}

export type ThemeCategory = 'system' | 'os' | 'texture' | 'cartoon' | 'movie';

export type ThemeType = 
  | 'light' | 'dark' 
  | 'win98' | 'winxp' | 'redhat' | 'playstation' | 'xbox'
  | 'paper' | 'glass' | 'wood' | 'metal' | 'fabric'
  | 'scoobydoo' | 'jetsons' | 'ben10' | 'flintstones'
  | 'matrix' | 'amelie' | 'bladerunner' | 'budapest';

export type LayoutType = 
  | 'card' | 'table' | 'list' | 'compact'
  | 'grid' | 'carousel' | 'masonry' | 'board' | 'timeline' | 'gallery' | 'spotlight' | 'split' | 'hexagon';

export interface Settings {
  layout: LayoutType;
  defaultLayout: 'grid' | 'list';
  theme: ThemeType;
  themeCategory: ThemeCategory;
  followSystemTheme: boolean;
  darkModeStyle: 'purple' | 'blue';
  showWatchlist: boolean;
  totalXP: number;
  aiCuratorEnabled: boolean;
  themeSyncEnabled: boolean;
  customCategories: string[];
  sortEnabled: boolean;
  sortBy: 'day' | 'month' | 'title' | 'actor' | 'category' | 'year';
  groupEnabled: boolean;
  groupBy: 'day' | 'month' | 'title' | 'actor' | 'category' | 'year';
  visibleLayouts: LayoutType[];
  customFont: string | null;
  ambientMotion: boolean;
  performanceMode: boolean;
  focusMode: boolean;
  showBottomMenu: boolean;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  requirement: number; // Number of movies
}

export const BADGES: Badge[] = [
  { id: 'newbie', name: 'Newbie', icon: '🎬', description: 'Watched 1 movie', requirement: 1 },
  { id: 'buff', name: 'Movie Buff', icon: '🍿', description: 'Watched 10 movies', requirement: 10 },
  { id: 'critic', name: 'Cinephile', icon: '🎥', description: 'Watched 50 movies', requirement: 50 },
  { id: 'legend', name: 'Legend', icon: '🏆', description: 'Watched 100 movies', requirement: 100 },
];
