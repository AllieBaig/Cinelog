/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Settings as SettingsIcon, 
  List, 
  Calendar, 
  Trophy, 
  Trash2, 
  Download, 
  Upload, 
  Terminal,
  ShieldAlert,
  Slash,
  Cpu,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Star,
  Film,
  User,
  LayoutGrid,
  AlignLeft,
  Flame,
  Shuffle,
  Pencil,
  WifiOff,
  ArrowUpDown,
  Layers,
  Filter,
  Tag,
  Clock,
  TrendingUp,
  Sparkles,
  CheckCircle,
  Compass,
  Hourglass,
  Activity,
  PieChart,
  Repeat,
  Moon,
  Sun,
  Coffee,
  CalendarDays,
  RectangleHorizontal,
  Table as TableIcon,
  AlignJustify,
  MonitorPlay,
  GalleryHorizontal,
  ClipboardList,
  History,
  Image as ImageIcon,
  Zap,
  Columns,
  Hexagon as HexagonIcon,
  Library,
  Video,
  Smile
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react';
import { 
  format, 
  isToday, 
  isYesterday, 
  startOfDay, 
  subDays, 
  isSameDay, 
  parseISO,
  compareDesc,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isAfter,
  differenceInDays,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { cn } from './lib/utils';
import { Movie, Settings, Badge, BADGES, WatchEvent, WatchListItem, LayoutType } from './types';

// --- Constants ---
const LAYOUT_CONFIG: { id: LayoutType; name: string; summary: string; icon: any; type: 'text' | 'visual' }[] = [
  { id: 'card', name: 'Card', summary: 'Detailed view in clean text cards', icon: RectangleHorizontal, type: 'text' },
  { id: 'table', name: 'Table', summary: 'Structured columns for quick comparison', icon: TableIcon, type: 'text' },
  { id: 'list', name: 'List', summary: 'Simple vertical list with key details', icon: List, type: 'text' },
  { id: 'compact', name: 'Compact', summary: 'Dense single-line overview', icon: AlignJustify, type: 'text' },
  { id: 'grid', name: 'Grid', summary: 'Balanced visual grid', icon: LayoutGrid, type: 'visual' },
  { id: 'carousel', name: 'Carousel', summary: 'Swipe through one by one', icon: MonitorPlay, type: 'visual' },
  { id: 'masonry', name: 'Masonry', summary: 'Dynamic stacked layout with varied sizes', icon: GalleryHorizontal, type: 'visual' },
  { id: 'board', name: 'Board', summary: 'Grouped sections like a collection board', icon: ClipboardList, type: 'visual' },
  { id: 'timeline', name: 'Timeline', summary: 'Arranged by time and history', icon: History, type: 'visual' },
  { id: 'gallery', name: 'Gallery', summary: 'Visual showcase of images', icon: ImageIcon, type: 'visual' },
  { id: 'spotlight', name: 'Spotlight', summary: 'Focus on one at a time', icon: Zap, type: 'visual' },
  { id: 'split', name: 'Split', summary: 'Dual view for comparison and browsing', icon: Columns, type: 'visual' },
  { id: 'hexagon', name: 'Hexagon', summary: 'Unique geometric arrangement', icon: HexagonIcon, type: 'visual' }
];

// --- Storage Helpers ---
const STORAGE_KEYS = {
  MOVIES: 'cinelog_movies',
  SETTINGS: 'cinelog_settings',
  SHUFFLE_HISTORY: 'cinelog_shuffle_history',
  WATCHLIST: 'cinelog_watchlist',
};

const migrateMovie = (m: any): Movie => {
  const name = m.name || m.title || 'Unknown Movie';
  const year = m.year || m.releaseYear || 2024;
  const watches = m.watches || [];
  
  // Convert old 'date' to 'watches' if necessary
  if (m.date && watches.length === 0) {
    watches.push({ id: crypto.randomUUID(), date: m.date, xpEarned: 100 });
  }

  const watchedDates = watches.map((w: any) => w.date).sort((a: string, b: string) => b.localeCompare(a));
  
  return {
    ...m,
    id: m.id || crypto.randomUUID(),
    name,
    year: Number(year),
    actors: m.actors || (m.actor ? [m.actor] : []),
    director: m.director || '',
    categories: m.categories || (m.category ? [m.category] : []),
    tags: m.tags || [],
    themes: m.themes || [],
    watches,
    watchedDates,
    lastWatched: watchedDates[0] || undefined,
    firstWatched: watchedDates[watchedDates.length - 1] || undefined,
    watchCount: watches.length,
    rewatchCount: Math.max(0, watches.length - 1),
    createdAt: m.createdAt || Date.now(),
    updatedAt: m.updatedAt || m.createdAt || Date.now(),
  };
};

const getStoredMovies = (): Movie[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.MOVIES);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return parsed.map(migrateMovie);
  } catch (e) {
    console.error("Failed to parse movies", e);
    return [];
  }
};

const getStoredSettings = (): Settings => {
  const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  const defaultSettings: Settings = {
    layout: 'grid',
    defaultLayout: 'grid',
    theme: 'light',
    themeCategory: 'system',
    followSystemTheme: true,
    darkModeStyle: 'purple',
    showWatchlist: true,
    totalXP: 0,
    aiCuratorEnabled: false,
    themeSyncEnabled: false,
    customCategories: ['Comedy', 'Drama', 'Action', 'Thriller', 'Sci-Fi', 'Horror', 'Romance'],
    sortEnabled: true,
    sortBy: 'day',
    groupEnabled: false,
    groupBy: 'day',
    visibleLayouts: LAYOUT_CONFIG.map(l => l.id),
    customFont: null,
    ambientMotion: true,
    performanceMode: false,
    focusMode: false,
    showBottomMenu: true,
  };
  if (!stored) return defaultSettings;
  const parsed = JSON.parse(stored);
  
  // Migration for old layout settings
  if (parsed.textMode) parsed.layout = 'compact';
  else if (parsed.compactMode) parsed.layout = 'grid';

  const settings = { ...defaultSettings, ...parsed };
  
  // Apply default layout on every start as requested
  return { ...settings, layout: settings.defaultLayout || 'grid' };
};

// --- Components ---

const LayoutPicker = ({ 
  current, 
  onSelect, 
  theme, 
  visibleLayouts 
}: { 
  current: LayoutType; 
  onSelect: (l: LayoutType) => void; 
  theme: string;
  visibleLayouts: LayoutType[];
}) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const activeLayouts = LAYOUT_CONFIG.filter(l => visibleLayouts.includes(l.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Layout System</h3>
        <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">{activeLayouts.length} Available</span>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 no-scrollbar px-2 snap-x"
      >
        {activeLayouts.map((layout) => {
          const Icon = layout.icon;
          const isActive = current === layout.id;
          
          return (
            <motion.button
              key={layout.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(layout.id)}
              className={cn(
                "flex-shrink-0 w-40 snap-start text-left group",
                "focus:outline-none"
              )}
            >
              <div className={cn(
                "aspect-[4/3] rounded-3xl mb-3 flex items-center justify-center transition-all duration-300 relative overflow-hidden",
                isActive 
                  ? (theme === 'dark' ? "bg-white text-black" : "bg-black text-white") 
                  : (theme === 'dark' ? "bg-gray-800 text-gray-500 border-gray-700" : "bg-gray-50 text-gray-400 border-gray-100"),
                "border-2",
                isActive ? "border-transparent" : "border-transparent group-hover:border-gray-300/50"
              )}>
                {/* Preview Thumbnail Logic */}
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                   <Icon size={48} strokeWidth={1} />
                </div>
                
                {/* Layout Preview Elements */}
                <div className="relative z-10 flex flex-col items-center gap-1">
                   <Icon size={24} />
                   <div className="w-12 h-1 bg-current rounded-full opacity-20" />
                   <div className="w-8 h-1 bg-current rounded-full opacity-10" />
                </div>

                {isActive && (
                  <motion.div 
                    layoutId="active-nav"
                    className="absolute top-3 right-3"
                  >
                    <CheckCircle size={14} className="text-blue-500" />
                  </motion.div>
                )}
              </div>
              
              <div className="space-y-0.5 px-1">
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-xs font-black uppercase tracking-widest",
                    isActive ? "text-blue-500" : "text-gray-400"
                  )}>{layout.name}</span>
                  <span className={cn(
                    "text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter",
                    layout.type === 'text' ? "bg-gray-100 text-gray-400" : "bg-orange-50 text-orange-400"
                  )}>{layout.type}</span>
                </div>
                <p className="text-[10px] leading-tight text-gray-500 line-clamp-2">
                  {layout.summary}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
const CountUp = ({ value }: { value: number }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.5, ease: "easeOut" });
    return controls.stop;
  }, [value]);

  return <motion.span>{rounded}</motion.span>;
};

const ActivityRing = ({ size = 80, strokeWidth = 8, progress = 0, color = "#ff0000", label = "", icon: Icon }: { size?: number, strokeWidth?: number, progress: number, color: string, label: string, icon: any }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-gray-100 dark:text-gray-800"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon size={size * 0.25} style={{ color }} />
          <span className="text-[10px] font-black mt-0.5">{Math.round(progress)}%</span>
        </div>
      </div>
      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 text-center leading-tight">{label}</span>
    </div>
  );
};

const Heatmap = ({ data, theme, onDayClick }: { data: Record<string, number>, theme: string, onDayClick: (day: string) => void }) => {
  const today = new Date();
  const days = eachDayOfInterval({
    start: subDays(today, 83), // 12 weeks
    end: today
  });

  return (
    <div className="grid grid-cols-12 gap-1.5">
      {days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const count = data[dateStr] || 0;
        return (
          <motion.div
            key={dateStr}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.2, zIndex: 10 }}
            onClick={() => count > 0 && onDayClick(dateStr)}
            className={cn(
              "aspect-square rounded-[2px] transition-colors cursor-help",
              count === 0 
                ? (theme === 'dark' ? "bg-gray-800" : "bg-gray-100")
                : (count === 1 ? "bg-orange-200" : count === 2 ? "bg-orange-400" : "bg-orange-600")
            )}
          />
        );
      })}
    </div>
  );
};

const BadgeCard = ({ badge, earned, isDark, colors }: { badge: Badge; earned: boolean; isDark: boolean; colors: any; key?: any }) => (
  <motion.div 
    whileHover={{ y: -5, scale: 1.05 }}
    className={cn(
      "flex flex-col items-center p-4 rounded-[2rem] border transition-all duration-300 relative group overflow-hidden",
      earned 
        ? (isDark ? "bg-white border-white text-black" : "bg-black border-black text-white") 
        : "opacity-20 grayscale"
    )}
    style={{ 
      backgroundColor: !earned ? colors.card : undefined,
      borderColor: !earned ? colors.border : undefined
    }}
  >
    <span className="text-3xl mb-2">{badge.icon}</span>
    <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight opacity-80">{badge.name}</span>
    {earned && (
      <motion.div 
        initial={{ scale: 0 }} 
        animate={{ scale: 1 }} 
        className="absolute top-2 right-2 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center border-2 border-current"
      >
        <Check size={8} strokeWidth={4} />
      </motion.div>
    )}
  </motion.div>
);

const ExpandableStatGroup = ({ 
  title, 
  icon: Icon, 
  colorClass, 
  preview, 
  expanded, 
  onToggle, 
  children,
  colors 
}: { 
  title: string, 
  icon: any, 
  colorClass: string, 
  preview: string, 
  expanded: boolean, 
  onToggle: () => void, 
  children: React.ReactNode,
  colors: any
}) => {
  return (
    <div 
      className="p-6 rounded-[2.5rem] space-y-4 transition-all border shadow-sm"
      style={{ 
        backgroundColor: colors.card,
        borderColor: colors.border,
        color: colors.text
      }}
    >
      <div 
        className="flex items-center justify-between cursor-pointer group"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", colorClass)}>
            <Icon size={20} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-xs font-black uppercase tracking-widest line-height-none">{title}</h3>
            {!expanded && <p className="text-[10px] font-bold text-gray-400">{preview}</p>}
          </div>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 90 : 0 }}
          className="text-gray-300"
        >
          <ChevronRight size={20} />
        </motion.div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden pt-2"
          >
            <div className="grid grid-cols-2 gap-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatItem = ({ label, value, subValue, colors }: { label: string, value: string | number, subValue?: string, colors: any }) => (
  <div 
    className="p-4 rounded-2xl transition-all border"
    style={{ 
      backgroundColor: colors.bg,
      borderColor: colors.border
    }}
  >
    <div className="text-[8px] font-black uppercase tracking-widest text-gray-400">{label}</div>
    <div className="text-sm font-black tracking-tight leading-none truncate mt-0.5">{value}</div>
    {subValue && <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest truncate mt-1">{subValue}</div>}
  </div>
);

// --- Constants for Delight ---
const FUN_MESSAGES = [
  "Nice pick! 🍿",
  "Movie night done 🎬",
  "Great choice! 🌟",
  "Added to your legacy 🏆",
  "Cinephile status +1 🎥",
  "That's a wrap! 🎞️",
];

const FUN_FACTS = [
  "Did you know? The first movie ever made was only 2 seconds long.",
  "Tip: Try logging a re-watch to boost your XP!",
  "Fun fact: 'The Wizard of Oz' was one of the first major color films.",
  "Tip: You can export your data in settings for safekeeping.",
  "Badge alert: Reach 10 movies to unlock the 'Movie Buff' badge!",
];

const MOOD_EMOJIS = ["🎬", "🍿", "🎥", "🎞️", "🎭", "🌟", "🔥", "✨"];

const THEME_CATEGORIES = [
  { id: 'system', name: 'System' },
  { id: 'texture', name: 'Textures' },
  { id: 'os', name: 'OS Themes' },
  { id: 'cartoon', name: 'Fun & Cartoon' },
  { id: 'movie', name: 'Movie Palettes' },
] as const;

const THEMES_DATA = {
  system: [
    { id: 'light', name: 'Light', color: 'bg-white border-gray-200' },
    { id: 'dark', name: 'Dark', color: 'bg-gray-900 border-gray-800' },
  ],
  os: [
    { id: 'win98', name: 'Win 98', color: 'bg-[#008080]' },
    { id: 'winxp', name: 'Win XP', color: 'bg-[#245edb]' },
    { id: 'redhat', name: 'Red Hat', color: 'bg-[#cc0000]' },
    { id: 'playstation', name: 'PS', color: 'bg-[#003087]' },
    { id: 'xbox', name: 'Xbox', color: 'bg-[#107c10]' },
  ],
  texture: [
    { id: 'paper', name: 'Paper', color: 'bg-[#fcfaf2] border-[#e8e4d8]' },
    { id: 'glass', name: 'Glass', color: 'bg-blue-100/50' },
    { id: 'wood', name: 'Wood', color: 'bg-[#f3e5d8]' },
    { id: 'metal', name: 'Metal', color: 'bg-gray-400' },
    { id: 'fabric', name: 'Fabric', color: 'bg-blue-50' },
  ],
  cartoon: [
    { id: 'scoobydoo', name: 'Scooby', color: 'bg-[#6b4423]' },
    { id: 'jetsons', name: 'Jetsons', color: 'bg-[#00d2ff]' },
    { id: 'ben10', name: 'Ben 10', color: 'bg-black' },
    { id: 'flintstones', name: 'Flint', color: 'bg-[#ff9933]' },
  ],
  movie: [
    { id: 'matrix', name: 'Matrix', color: 'bg-black' },
    { id: 'amelie', name: 'Amélie', color: 'bg-[#8b0000]' },
    { id: 'bladerunner', name: 'Blade', color: 'bg-[#000b1e]' },
    { id: 'budapest', name: 'Budapest', color: 'bg-[#f8c8dc]' },
  ],
};

export default function App() {
  const [movies, setMovies] = useState<Movie[]>(getStoredMovies());
  const [watchlist, setWatchlist] = useState<WatchListItem[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.WATCHLIST);
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      return parsed.map((m: any) => ({
        ...m,
        id: m.id || crypto.randomUUID(),
        name: m.name || m.title || 'Unknown',
        year: Number(m.year || m.releaseYear || 2024),
        actors: m.actors || (m.actor ? [m.actor] : []),
        director: m.director || '',
        categories: m.categories || (m.category ? [m.category] : []),
        tags: m.tags || [],
        themes: m.themes || [],
        createdAt: m.createdAt || Date.now(),
        updatedAt: m.updatedAt || m.createdAt || Date.now(),
      }));
    } catch (e) {
      return [];
    }
  });
  const [settings, setSettings] = useState<Settings>(getStoredSettings());
  const [scrollPos, setScrollPos] = useState(0);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(
    typeof window !== 'undefined' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : 'light'
  );
  const [swStatus, setSwStatus] = useState<'Active' | 'Waiting' | 'Installing' | 'None'>('None');

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    
    const checkStatus = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        if (registrations.length === 0) {
          setSwStatus('None');
          return;
        }
        const reg = registrations[0];
        if (reg.installing) setSwStatus('Installing');
        else if (reg.waiting) setSwStatus('Waiting');
        else if (reg.active) setSwStatus('Active');
      } catch (err) {
        console.error("SW status check failed", err);
      }
    };

    checkStatus();
    
    navigator.serviceWorker.addEventListener('controllerchange', checkStatus);
    return () => navigator.serviceWorker.removeEventListener('controllerchange', checkStatus);
  }, []);
  const [activeTab, setActiveTab] = useState<'list' | 'stats' | 'settings'>('list');
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);
  const [listTab, setListTab] = useState<'watched' | 'watchlist'>('watched');
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [filter, setFilter] = useState<{ type: 'actor' | 'category' | 'month' | 'day', value: string } | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [editingWatchlistItem, setEditingWatchlistItem] = useState<WatchListItem | null>(null);
  const [editingWatch, setEditingWatch] = useState<{ movieId: string, watchId: string } | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    rings: true,
    timeline: false,
    heatmap: false,
    habits: false,
    rewatchInsights: false,
    actorInsights: false,
    categoryInsights: false,
    monthlyTrends: false,
    funPatterns: false,
    consistency: false,
    discovery: false,
    timePatterns: false,
    balance: false,
    badges: false,
    directorSpotlight: false,
    releaseEra: false,
    themeDeepDive: false,
    endingPreference: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  const [shuffledMovie, setShuffledMovie] = useState<Movie | null>(null);
  const [shuffleHistory, setShuffleHistory] = useState<string[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.SHUFFLE_HISTORY);
    return stored ? JSON.parse(stored) : [];
  });
  
  // Delight States
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastXpEarned, setLastXpEarned] = useState(0);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [successMessage, setSuccessMessage] = useState("");
  const [funFact, setFunFact] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [actors, setActors] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [actorInput, setActorInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [director, setDirector] = useState('');
  const [year, setYear] = useState('');
  const [endingStyle, setEndingStyle] = useState<'happy' | 'sad' | 'bittersweet' | ''>('');
  const [plotTwist, setPlotTwist] = useState(false);
  const [themes, setThemes] = useState<string[]>([]);
  const [themeInput, setThemeInput] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [showShuffleResult, setShowShuffleResult] = useState(false);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [showGroupOptions, setShowGroupOptions] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  // --- Smart Auto-Fill Logic (Offline) ---
  useEffect(() => {
    // Only auto-fill for new entries, not when editing (to preserve user intent)
    if (!name.trim() || editingMovie || editingWatchlistItem) return;

    const timer = setTimeout(() => {
      setIsAutoFilling(true);
      const lowerName = name.toLowerCase();
      
      // 1. Memory Check: Reuse data if we've seen this movie before
      const existingMatch = [...movies, ...watchlist].find(m => m.name.toLowerCase() === lowerName);
      if (existingMatch) {
        if (!director) setDirector(existingMatch.director || '');
        if (!year) setYear(existingMatch.year?.toString() || '');
        if (actors.length === 0) setActors(existingMatch.actors || []);
        if (categories.length === 0) setCategories(existingMatch.categories || []);
        if (themes.length === 0) setThemes(existingMatch.themes || []);
        if (tags.length === 0) setTags(existingMatch.tags || []);
        if (!endingStyle) setEndingStyle(existingMatch.endingStyle || '');
        if (!plotTwist) setPlotTwist(existingMatch.plotTwist || false);
        setTimeout(() => setIsAutoFilling(false), 800);
        return;
      }

      // 2. Year Detection (19XX or 20XX)
      const yearMatch = name.match(/\b(19|20)\d{2}\b/);
      if (yearMatch && !year) {
        setYear(yearMatch[0]);
      }

      // 3. Keyword-based Metadata
      const suggestedCats: string[] = [];
      const suggestedThemes: string[] = [];
      let suggestedEnding: typeof endingStyle = '';
      let suggestedTwist = false;
      let guessedYear = '';

      const techKeywords = /space|future|alien|planet|star|robot|scifi|tech|cyber|virtual|matrix/i;
      const emotionalKeywords = /love|wedding|heart|marry|date|romance|kiss|tear|feeling|sweet/i;
      const intenseKeywords = /war|battle|fight|gun|action|strike|kill|dead|blood|hunt|fear|soldier/i;
      const funnyKeywords = /comedy|joke|laugh|funny|parody|humor|silly/i;
      const darkKeywords = /horror|fear|spooky|nightmare|ghost|creature|monster|shadow/i;
      const smartKeywords = /detective|mystery|clue|thriller|riddle|secret|noir|crime|murder|killer/i;

      // Category detection
      if (emotionalKeywords.test(lowerName)) suggestedCats.push('Romance');
      if (intenseKeywords.test(lowerName)) suggestedCats.push('Action');
      if (techKeywords.test(lowerName)) suggestedCats.push('Sci-Fi');
      if (darkKeywords.test(lowerName)) suggestedCats.push('Horror');
      if (funnyKeywords.test(lowerName)) suggestedCats.push('Comedy');
      if (smartKeywords.test(lowerName)) suggestedCats.push('Thriller');

      // Theme detection
      if (/back|pay|kill|revenge|vengeance|hunt/i.test(lowerName)) suggestedThemes.push('Revenge');
      if (/money|bank|vault|job|heist|steal|gold/i.test(lowerName)) suggestedThemes.push('Heist');
      if (/alone|wild|island|lost|survival|stranded|desert/i.test(lowerName)) suggestedThemes.push('Survival');
      if (/love|heart|kiss|together|connection/i.test(lowerName)) suggestedThemes.push('Love');
      if (/marathon|race|run|time|clock/i.test(lowerName)) suggestedThemes.push('Marathon');
      if (/nature|forest|mountain|earth/i.test(lowerName)) suggestedThemes.push('Nature');

      // Ending style & Twist guesses
      if (/death|tragedy|gone|lost|failed|end|over/i.test(lowerName)) suggestedEnding = 'sad';
      if (/forever|happy|victory|win|saved|success/i.test(lowerName)) suggestedEnding = 'happy';
      if (/mystery|secret|reveal|hidden|twist|mask/i.test(lowerName)) suggestedTwist = true;

      // Heuristic for Era (Modern vs Classic)
      if (!year) {
        const classicHints = /\b(the |of |mr\.|mrs\.|sir |lady |man in |a woman|citizen |dr\.|captain )\b/i;
        const modernHints = /\b(20\d\d|ultra|digital|neon|hack|stream|play|vlog)\b/i;
        
        if (classicHints.test(lowerName)) guessedYear = '1970'; // Placeholder for "Classic" score
        else if (modernHints.test(lowerName)) guessedYear = '2020'; // Placeholder for "Modern" score
      }

      // Apply suggestions IF fields are empty
      if (categories.length === 0 && suggestedCats.length > 0) setCategories(suggestedCats.slice(0, 3));
      if (themes.length === 0 && suggestedThemes.length > 0) setThemes(suggestedThemes.slice(0, 3));
      if (!endingStyle && suggestedEnding) setEndingStyle(suggestedEnding);
      if (!plotTwist && suggestedTwist) setPlotTwist(true);
      if (!year && guessedYear) setYear(guessedYear);

      setTimeout(() => setIsAutoFilling(false), 800);
    }, 1200);

    return () => clearTimeout(timer);
  }, [name]);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        setScrollPos(scrollRef.current.scrollTop);
      }
    };
    const el = scrollRef.current;
    el?.addEventListener('scroll', handleScroll);
    return () => el?.removeEventListener('scroll', handleScroll);
  }, [activeTab]);

  // Persistence
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MOVIES, JSON.stringify(movies));
  }, [movies]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHUFFLE_HISTORY, JSON.stringify(shuffleHistory));
  }, [shuffleHistory]);

  // Selected Movie Data
  const selectedMovie = useMemo(() => 
    movies.find(m => m.id === selectedMovieId) || null
  , [movies, selectedMovieId]);

  // Gamification Logic
  useEffect(() => {
    if (!settings.showWatchlist && listTab === 'watchlist') {
      setListTab('watched');
    }
  }, [settings.showWatchlist, listTab]);

  const stats = useMemo(() => {
    const allWatches = movies.flatMap(m => m.watches.map(w => ({ ...w, movieName: m.name, actors: m.actors })));
    
    let streak = 0;
    const uniqueDays = Array.from(new Set(allWatches.map(w => format(parseISO(w.date), 'yyyy-MM-dd')))) as string[];
    uniqueDays.sort((a, b) => b.localeCompare(a));

    if (uniqueDays.length > 0) {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      
      let lastDay = uniqueDays[0];
      if (lastDay === todayStr || lastDay === yesterdayStr) {
        streak = 1;
        for (let i = 1; i < uniqueDays.length; i++) {
          const prev = parseISO(uniqueDays[i-1] as string);
          const curr = parseISO(uniqueDays[i] as string);
          if (isSameDay(curr, subDays(prev, 1))) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    // Monthly Stats
    const monthlyData: { [key: string]: { 
      count: number, 
      movies: { [title: string]: number }, 
      actors: { [name: string]: number },
      days: Set<string>
    } } = {};

    allWatches.forEach(w => {
      const monthKey = format(parseISO(w.date), 'yyyy-MM');
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { count: 0, movies: {}, actors: {}, days: new Set() };
      }
      monthlyData[monthKey].count++;
      monthlyData[monthKey].movies[w.movieTitle] = (monthlyData[monthKey].movies[w.movieTitle] || 0) + 1;
      if (w.actors && w.actors.length > 0) {
        w.actors.forEach(actorName => {
          monthlyData[monthKey].actors[actorName] = (monthlyData[monthKey].actors[actorName] || 0) + 1;
        });
      }
      monthlyData[monthKey].days.add(format(parseISO(w.date), 'yyyy-MM-dd'));
    });

    const sortedMonths = Object.keys(monthlyData).sort((a, b) => b.localeCompare(a));
    const currentMonthKey = format(new Date(), 'yyyy-MM');
    const lastMonthKey = format(subDays(startOfMonth(new Date()), 1), 'yyyy-MM');

    const monthlyStats = sortedMonths.map(month => {
      const data = monthlyData[month];
      const mostWatchedMovie = Object.entries(data.movies).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
      const mostWatchedActor = Object.entries(data.actors).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
      
      // Streak for month
      const monthDays = Array.from(data.days).sort((a, b) => b.localeCompare(a));
      let monthStreak = 0;
      if (monthDays.length > 0) {
        monthStreak = 1;
        for (let i = 1; i < monthDays.length; i++) {
          const prev = parseISO(monthDays[i-1]);
          const curr = parseISO(monthDays[i]);
          if (isSameDay(curr, subDays(prev, 1))) {
            monthStreak++;
          } else {
            break;
          }
        }
      }

      return {
        month,
        label: format(parseISO(`${month}-01`), 'MMMM yyyy'),
        count: data.count,
        mostWatchedMovie,
        mostWatchedActor,
        streak: monthStreak,
        isCurrent: month === currentMonthKey
      };
    });

    const totalWatches = allWatches.length;
    const reWatches = totalWatches - movies.length;

    const dailyWatches = allWatches.reduce((acc, w) => {
      const day = format(parseISO(w.date), 'yyyy-MM-dd');
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const reWatchList = movies
      .filter(m => m.watches.length > 1)
      .sort((a, b) => b.watches.length - a.watches.length);

    const topActors = Object.entries(
      allWatches.reduce((acc, w) => {
        if (w.actors) {
          w.actors.forEach(a => {
            acc[a] = (acc[a] || 0) + 1;
          });
        }
        return acc;
      }, {} as Record<string, number>)
    ).sort((a, b) => (b[1] as number) - (a[1] as number));

    const topCategories = Object.entries(
      movies.reduce((acc, m) => {
        if (m.categories) {
          m.categories.forEach(c => {
            acc[c] = (acc[c] || 0) + m.watches.length;
          });
        }
        return acc;
      }, {} as Record<string, number>)
    ).sort((a, b) => (b[1] as number) - (a[1] as number));

    // Detailed Insights Calculation
    const dayOfWeekCounts: Record<string, number> = {};
    const hourCounts: Record<string, number> = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
    const allIntervals: number[] = [];
    const rewatchIntervals: number[] = [];

    allWatches.forEach(w => {
      const date = parseISO(w.date);
      const dayName = format(date, 'EEEE');
      dayOfWeekCounts[dayName] = (dayOfWeekCounts[dayName] || 0) + 1;
      
      const hour = date.getHours();
      if (hour >= 5 && hour < 12) hourCounts.Morning++;
      else if (hour >= 12 && hour < 17) hourCounts.Afternoon++;
      else if (hour >= 17 && hour < 21) hourCounts.Evening++;
      else hourCounts.Night++;
    });

    movies.forEach(m => {
      if (m.watches.length > 1) {
        const sorted = [...m.watches].sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
        for (let i = 1; i < sorted.length; i++) {
          const gap = differenceInDays(parseISO(sorted[i].date), parseISO(sorted[i-1].date));
          rewatchIntervals.push(gap);
        }
      }
    });

    const uniqueDaysSorted = [...uniqueDays].sort((a, b) => (a as string).localeCompare(b as string)) as string[];
    for(let i=1; i < uniqueDaysSorted.length; i++) {
      allIntervals.push(differenceInDays(parseISO(uniqueDaysSorted[i]), parseISO(uniqueDaysSorted[i-1])));
    }

    const mostActiveDay = Object.entries(dayOfWeekCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const preferredTime = Object.entries(hourCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const bingeDay = Object.entries(dailyWatches).sort((a,b) => (b[1] as number) - (a[1] as number))[0];
    const longestGap = allIntervals.length > 0 ? Math.max(...allIntervals) : 0;
    const avgRewatchGap = rewatchIntervals.length > 0 ? Math.round(rewatchIntervals.reduce((a,b) => a+b, 0) / rewatchIntervals.length) : 0;
    const fastestRewatch = rewatchIntervals.length > 0 ? Math.min(...rewatchIntervals) : 0;

    const topRewatchActor = Object.entries(
      movies.filter(m => m.watches.length > 1).reduce((acc, m) => {
        m.actors?.forEach(a => acc[a] = (acc[a] || 0) + m.watches.length - 1);
        return acc;
      }, {} as Record<string, number>)
    ).sort((a,b) => (b[1] as number) - (a[1] as number))[0]?.[0] || 'None';

    const growth = monthlyStats.length >= 2 
      ? Math.round(((monthlyStats[0].count - monthlyStats[1].count) / (monthlyStats[1].count || 1)) * 100)
      : 0;

    const diversityScore = movies.reduce((acc, m) => {
      m.categories?.forEach(c => acc.add(c));
      return acc;
    }, new Set<string>()).size;

    // --- New advanced stats calculations ---
    const directorCounts: Record<string, number> = {};
    const decadeCounts: Record<string, number> = {};
    const endingCounts: Record<string, number> = { happy: 0, sad: 0, bittersweet: 0 };
    let plotTwistCount = 0;
    const themeCounts: Record<string, number> = {};
    let classicCount = 0;
    let modernCount = 0;

    movies.forEach(m => {
      if (m.director) directorCounts[m.director] = (directorCounts[m.director] || 0) + m.watches.length;
      if (m.year) {
        const decade = Math.floor(m.year / 10) * 10;
        decadeCounts[decade] = (decadeCounts[decade] || 0) + m.watches.length;
        if (m.year < 2000) classicCount += m.watches.length;
        else modernCount += m.watches.length;
      }
      if (m.endingStyle) endingCounts[m.endingStyle] += m.watches.length;
      if (m.plotTwist) plotTwistCount += m.watches.length;
      if (m.themes) {
        m.themes.forEach(t => themeCounts[t] = (themeCounts[t] || 0) + m.watches.length);
      }
    });

    const mostWatchedDirector = Object.entries(directorCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'Unknown';
    const mostWatchedDecade = Object.entries(decadeCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'Unknown';
    const uniqueDirectors = Object.keys(directorCounts).length;

    const totalEndings = endingCounts.happy + endingCounts.sad + endingCounts.bittersweet;
    const happyRatio = totalEndings > 0 ? Math.round((endingCounts.happy / totalEndings) * 100) : 0;

    return {
      total: totalWatches,
      unique: movies.length,
      reWatches,
      streak,
      monthlyStats,
      dailyWatches,
      reWatchList,
      topActors,
      topCategories,
      comparison: {
        current: monthlyData[currentMonthKey]?.count || 0,
        last: monthlyData[lastMonthKey]?.count || 0
      },
      badges: BADGES.filter(b => totalWatches >= b.requirement),
      // New Detailed Stats
      habits: {
        totalWatchDays: uniqueDays.length,
        mostActiveDay,
        preferredTime
      },
      rewatchInsights: {
        mostRewatchedMovie: reWatchList[0]?.name || 'None',
        totalRewatches: reWatches,
        avgGap: avgRewatchGap
      },
      actorInsights: {
        mostWatchedActor: topActors[0]?.[0] || 'None',
        uniqueActors: topActors.length,
        topRewatchActor
      },
      categoryInsights: {
        favoriteCategory: topCategories[0]?.[0] || 'None',
        leastWatchedCategory: topCategories[topCategories.length-1]?.[0] || 'None',
        diversityScore
      },
      monthlyTrends: {
        bestMonth: monthlyStats.sort((a,b) => b.count - a.count)[0]?.label || 'None',
        avgPerMonth: Math.round(totalWatches / (monthlyStats.length || 1)),
        growth
      },
      funPatterns: {
        longestGap,
        bingeDay: bingeDay?.[1] || 0,
        bingeDate: bingeDay?.[0] || 'N/A'
      },
      consistency: {
        score: Math.min(100, Math.round((uniqueDays.length / (allIntervals.length + 1 || 1)) * 100)),
        level: uniqueDays.length > 50 ? 'Binge Master' : (uniqueDays.length > 20 ? 'Regular' : 'Newcomer')
      },
      discovery: {
        percentNew: Math.round((movies.length / (totalWatches || 1)) * 100),
        explorerLevel: movies.length > 100 ? 'Epic Explorer' : (movies.length > 30 ? 'Voyager' : 'Tourist')
      },
      timePatterns: {
        avgGap: allIntervals.length > 0 ? Math.round(allIntervals.reduce((a,b) => a+b, 0) / allIntervals.length) : 0,
        fastestRewatch
      },
      balance: {
        topMood: movies[0]?.genre || 'Unknown',
        balanceScore: Math.round((diversityScore / (topCategories.length || 1)) * 100)
      },
      // Advanced Stat Groups
      directorSpotlight: {
        mostWatchedDirector,
        uniqueDirectors,
        varietyScore: totalWatches > 0 ? Math.round((uniqueDirectors / movies.length) * 100) : 0
      },
      releaseEra: {
        mostWatchedDecade: mostWatchedDecade !== 'Unknown' ? `${mostWatchedDecade}s` : 'Unknown',
        ratio: modernCount > 0 ? Math.round((classicCount / (classicCount + modernCount)) * 100) : (classicCount > 0 ? 100 : 0),
        eraPreferenceScore: Math.min(100, Math.round((Object.keys(decadeCounts).length / 10) * 100))
      },
      themeDeepDive: {
        customThemesCount: Object.keys(themeCounts).length,
        completionRate: Math.min(100, Math.round((Object.keys(themeCounts).length / 20) * 100)),
        themedMarathonDays: movies.filter(m => (m.themes?.length || 0) > 2).length
      },
      endingPreference: {
        happyRatio,
        plotTwistPercent: totalWatches > 0 ? Math.round((plotTwistCount / totalWatches) * 100) : 0,
        styleScore: Math.min(100, Math.round((totalEndings / (totalWatches || 1)) * 100))
      }
    };
  }, [movies]);

  // --- AI Curator & Theme Sync Logic ---
  
  const movieMoods = useMemo(() => {
    const allItems = [
      ...movies.map(m => ({ ...m, source: 'watched' as const })),
      ...watchlist.map(w => ({ ...w, source: 'watchlist' as const, watches: [] as WatchEvent[] }))
    ];
    
    return allItems.map(m => {
      const lowerName = m.name.toLowerCase();
      let mood: 'calm' | 'intense' | 'fun' = 'fun';
      let genre: 'drama' | 'thriller' | 'comedy' = 'comedy';
      
      if (lowerName.match(/dark|night|kill|dead|blood|hunt|fear|war|fight|alien|space|star/)) {
        mood = 'intense';
        genre = 'thriller';
      } else if (lowerName.match(/love|peace|calm|dream|life|heart|home|story|tale/)) {
        mood = 'calm';
        genre = 'drama';
      }
      
      return { ...m, mood, genre };
    });
  }, [movies, watchlist]);

  const aiSuggestions = useMemo(() => {
    if (!settings.aiCuratorEnabled || (movies.length === 0 && watchlist.length === 0)) return null;
    
    const hour = new Date().getHours();
    let targetMood: 'calm' | 'intense' | 'fun' = 'fun';
    let timeLabel = "Perfect for now";
    
    if (hour >= 5 && hour < 12) {
      targetMood = 'calm';
      timeLabel = "Morning Calm";
    } else if (hour >= 12 && hour < 18) {
      targetMood = 'fun';
      timeLabel = "Afternoon Fun";
    } else {
      targetMood = 'intense';
      timeLabel = "Evening Intensity";
    }
    
    // Prefer watchlist items for suggestions
    const watchlistCandidates = movieMoods.filter(m => m.source === 'watchlist' && m.mood === targetMood);
    const watchedCandidates = movieMoods.filter(m => m.source === 'watched' && m.mood === targetMood);
    
    let suggestion;
    if (watchlistCandidates.length > 0) {
      suggestion = watchlistCandidates[Math.floor(Math.random() * watchlistCandidates.length)];
    } else if (watchedCandidates.length > 0) {
      suggestion = watchedCandidates[Math.floor(Math.random() * watchedCandidates.length)];
    } else {
      suggestion = movieMoods[Math.floor(Math.random() * movieMoods.length)];
    }
      
    return { suggestion, timeLabel };
  }, [movieMoods, settings.aiCuratorEnabled]);

  const syncedTheme = useMemo(() => {
    if (settings.followSystemTheme) {
      return systemTheme;
    }
    return settings.theme;
  }, [systemTheme, settings.followSystemTheme, settings.theme]);

  const isDark = syncedTheme === 'dark';

  const themeColors = useMemo(() => {
    if (!isDark) {
      return {
        bg: '#f2f2f7', // iOS light gray
        card: '#ffffff',
        text: '#000000',
        border: '#e5e5ea',
        accent: settings.darkModeStyle === 'purple' ? '#8b5cf6' : '#3b82f6',
        secondary: '#8e8e93'
      };
    }

    // Soft Dark Styles
    if (settings.darkModeStyle === 'purple') {
      return {
        bg: '#1c1c1e',
        card: '#2c2c2e',
        text: '#ffffff',
        border: '#3a3a3c',
        accent: '#a78bfa',
        secondary: '#98989d'
      };
    } else {
      return {
        bg: '#0f172a', // Slate 900
        card: '#1e293b', // Slate 800
        text: '#f8fafc',
        border: '#334155',
        accent: '#60a5fa',
        secondary: '#94a3b8'
      };
    }
  }, [isDark, settings.darkModeStyle]);

  // Handle Custom Font
  useEffect(() => {
    const styleId = 'custom-font-style';
    let styleTag = document.getElementById(styleId);
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }

    if (settings.customFont) {
      styleTag.innerHTML = `
        @font-face {
          font-family: 'CustomFont';
          src: url('${settings.customFont}');
        }
        body, button, input, textarea {
          font-family: 'CustomFont', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
        }
      `;
    } else {
      styleTag.innerHTML = '';
    }
  }, [settings.customFont]);

  const actorSuggestions = useMemo(() => {
    const counts: { [key: string]: number } = {};
    [...movies, ...watchlist].forEach(m => {
      if (m.actors && m.actors.length > 0) {
        m.actors.forEach(a => {
          counts[a] = (counts[a] || 0) + 1;
        });
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);
  }, [movies, watchlist]);

  const filteredActors = useMemo(() => {
    if (!actorInput.trim()) return [];
    return actorSuggestions.filter(a => 
      a.toLowerCase().includes(actorInput.toLowerCase()) && 
      !actors.includes(a)
    ).slice(0, 5);
  }, [actorInput, actorSuggestions, actors]);

  const handleDrillDown = (type: 'actor' | 'category' | 'month' | 'day', value: string) => {
    setFilter({ type, value });
    setActiveTab('list');
    setSelectedMovieId(null);
  };

  const calculateXP = (movieName: string, date: Date) => {
    let xp = 100; // Base XP
    
    // Check for re-watch
    const existingMovie = movies.find(m => m.name.toLowerCase() === movieName.toLowerCase());
    if (existingMovie) {
      xp += 50; // Re-watch bonus
    }

    // Streak bonus ONLY for today
    if (isToday(date)) {
      const yesterdayStr = format(subDays(date, 1), 'yyyy-MM-dd');
      const hasYesterday = movies.some(m => m.watches.some(w => format(parseISO(w.date), 'yyyy-MM-dd') === yesterdayStr));
      if (hasYesterday) {
        xp += 50; // Consecutive day bonus
      }
    }

    return xp;
  };

  const triggerSuccess = (xp: number) => {
    setLastXpEarned(xp);
    setSuccessMessage(FUN_MESSAGES[Math.floor(Math.random() * FUN_MESSAGES.length)]);
    setFunFact(Math.random() > 0.7 ? FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)] : "");
    setShowSuccess(true);
    
    // Auto close after 2 seconds if it's a quick rewatch, 
    // but for the modal we let the user see it.
  };

  const finalizeMovieObject = (m: any): Movie => {
    const watches = [...(m.watches || [])].sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date)));
    const watchedDates = watches.map(w => w.date);
    return {
      ...m,
      name: m.name || 'Unknown',
      year: Number(m.year || 2024),
      actors: m.actors || [],
      director: m.director || '',
      categories: m.categories || [],
      tags: m.tags || [],
      themes: m.themes || [],
      watches,
      watchedDates,
      lastWatched: watchedDates[0] || undefined,
      firstWatched: watchedDates[watchedDates.length - 1] || undefined,
      watchCount: watches.length,
      rewatchCount: Math.max(0, watches.length - 1),
      updatedAt: Date.now(),
    };
  };

  const handleAddMovie = (onlySaveToList = false) => {
    if (!name.trim()) return;
    setError(null);

    // Validation for Year
    if (!year) {
      setError("Release year is required");
      return;
    }
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 1888 || yearNum > 2100) {
      setError("Enter a valid 4-digit year (1888-2100)");
      return;
    }

    if (editingWatch) {
      // Update existing watch date
      const updatedMovies = movies.map(m => {
        if (m.id === editingWatch.movieId) {
          const updatedWatches = m.watches.map(w => 
            w.id === editingWatch.watchId ? { ...w, date: selectedDate.toISOString() } : w
          );
          return finalizeMovieObject({ ...m, watches: updatedWatches });
        }
        return m;
      });
      setMovies(updatedMovies);
      resetForm();
      return;
    }

    if (editingMovie) {
      // Check if new name already exists in OTHER movies
      const isDuplicate = movies.some(m => m.id !== editingMovie.id && m.name.toLowerCase() === name.toLowerCase());
      if (isDuplicate) {
        setError("Movie already exists");
        return;
      }
      // Update movie metadata
      const updatedMovies = movies.map(m => 
        m.id === editingMovie.id ? finalizeMovieObject({ 
          ...m, name, actors, categories, tags,
          director: director || '',
          year: yearNum,
          endingStyle: (endingStyle as any) || undefined,
          plotTwist,
          themes
        }) : m
      );
      setMovies(updatedMovies);
      resetForm();
      return;
    }

    const existingMovieIndex = movies.findIndex(m => m.name.toLowerCase() === name.toLowerCase());
    
    if (!onlySaveToList) {
      // Check for duplicate on same day
      if (existingMovieIndex > -1) {
        const movie = movies[existingMovieIndex];
        const isDuplicate = movie.watches.some(w => isSameDay(parseISO(w.date), selectedDate));
        if (isDuplicate) {
          setError("Already logged today");
          return;
        }
      }

      const xp = calculateXP(name, selectedDate);
      const newWatch: WatchEvent = {
        id: crypto.randomUUID(),
        date: selectedDate.toISOString(),
        xpEarned: xp,
      };

      if (existingMovieIndex > -1) {
        const updatedMovies = movies.map((m, i) => {
          if (i === existingMovieIndex) {
            return finalizeMovieObject({
              ...m,
              watches: [newWatch, ...m.watches]
            });
          }
          return m;
        });
        setMovies(updatedMovies);
      } else {
        const newMovie = finalizeMovieObject({
          id: crypto.randomUUID(),
          name,
          actors,
          categories,
          tags,
          watches: [newWatch],
          createdAt: Date.now(),
          director: director || '',
          year: yearNum,
          endingStyle: (endingStyle as any) || undefined,
          plotTwist,
          themes
        });
        setMovies([newMovie, ...movies]);
      }

      setSettings(s => ({ ...s, totalXP: s.totalXP + xp }));
      triggerSuccess(xp);
    } else {
      // Just save to list if it doesn't exist
      if (existingMovieIndex === -1) {
        const newMovie = finalizeMovieObject({
          id: crypto.randomUUID(),
          name,
          actors,
          categories,
          tags,
          watches: [],
          createdAt: Date.now(),
          director: director || '',
          year: yearNum,
          endingStyle: (endingStyle as any) || undefined,
          plotTwist,
          themes
        });
        setMovies([newMovie, ...movies]);
        resetForm();
      } else {
        setError("Movie already in list");
      }
    }
  };

  const quickRewatch = (movie: Movie) => {
    const today = new Date();
    
    // Check for duplicate on same day
    const isDuplicate = movie.watches.some(w => isSameDay(parseISO(w.date), today));
    if (isDuplicate) {
      setSuccessMessage("Already logged today");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      return;
    }

    const xp = calculateXP(movie.name, today);
    const newWatch: WatchEvent = {
      id: crypto.randomUUID(),
      date: today.toISOString(),
      xpEarned: xp,
    };

    const updatedMovies = movies.map(m => 
      m.id === movie.id ? finalizeMovieObject({ ...m, watches: [...m.watches, newWatch] }) : m
    );
    setMovies(updatedMovies);
    setSettings(s => ({ ...s, totalXP: s.totalXP + xp }));
    triggerSuccess(xp);
    
    // Quick rewatch success disappears faster
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleAddToWatchlist = () => {
    if (!name.trim()) return;

    // Validation for Year
    if (!year) {
      setError("Release year is required");
      return;
    }
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 1888 || yearNum > 2100) {
      setError("Enter a valid 4-digit year (1888-2100)");
      return;
    }
    
    if (editingWatchlistItem) {
      const updated = watchlist.map(item => 
        item.id === editingWatchlistItem.id ? { 
          ...item, name, actors, categories, tags,
          director: director || '',
          year: yearNum,
          updatedAt: Date.now(),
          endingStyle: (endingStyle as any) || undefined,
          plotTwist,
          themes
        } : item
      );
      setWatchlist(updated);
      resetForm();
      return;
    }

    const isDuplicate = watchlist.some(m => m.name.toLowerCase() === name.toLowerCase());
    if (isDuplicate) {
      setError("Already in watchlist");
      return;
    }

    const newItem: WatchListItem = {
      id: crypto.randomUUID(),
      name,
      actors,
      categories,
      tags,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      director: director || '',
      year: yearNum,
      endingStyle: (endingStyle as any) || undefined,
      plotTwist,
      themes
    };
    setWatchlist([newItem, ...watchlist]);
    resetForm();
  };

  const removeFromWatchlist = (id: string) => {
    setWatchlist(watchlist.filter(item => item.id !== id));
  };

  const handleShuffle = () => {
    if (watchlist.length === 0) {
      setError("Watchlist is empty");
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Filter candidates: Not in shuffle history (last 3)
    let candidates = watchlist.filter(m => !shuffleHistory.slice(-3).includes(m.id));

    // Fallback if too many filters: just avoid last shuffled
    if (candidates.length === 0) {
      candidates = watchlist.filter(m => !shuffleHistory.slice(-1).includes(m.id));
    }

    // Final fallback: any movie from watchlist
    if (candidates.length === 0) {
      candidates = watchlist;
    }

    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    setShuffledMovie(picked as any);
    setShuffleHistory(prev => [...prev.slice(-10), picked.id]);
  };

  const resetForm = () => {
    setName('');
    setActors([]);
    setCategories([]);
    setTags([]);
    setTagInput('');
    setDirector('');
    setYear('');
    setEndingStyle('');
    setPlotTwist(false);
    setThemes([]);
    setThemeInput('');
    setActorInput('');
    setCategoryInput('');
    setSelectedDate(new Date());
    setIsAdding(false);
    setEditingMovie(null);
    setEditingWatchlistItem(null);
    setEditingWatch(null);
    setShowSuccess(false);
    setError(null);
  };

  const deleteMovie = (id: string) => {
    if (confirm('Delete this movie and all its logs?')) {
      setMovies(movies.filter(m => m.id !== id));
      setSelectedMovieId(null);
    }
  };

  const deleteWatch = (movieId: string, watchId: string) => {
    if (confirm('Delete this watch entry?')) {
      const updatedMovies = movies.map(m => {
        if (m.id === movieId) {
          const newWatches = m.watches.filter(w => w.id !== watchId);
          return { ...m, watches: newWatches };
        }
        return m;
      });
      setMovies(updatedMovies);
    }
  };

  const resetFont = () => {
    setSettings(s => ({ ...s, customFont: null }));
  };

  const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSettings(s => ({ ...s, customFont: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const refreshApp = () => {
    setMovies(getStoredMovies());
    const storedWatchlist = localStorage.getItem(STORAGE_KEYS.WATCHLIST);
    if (storedWatchlist) {
      try {
        const parsed = JSON.parse(storedWatchlist);
        setWatchlist(parsed.map(migrateMovie) as any);
      } catch (e) {
        console.error("Failed to refresh watchlist", e);
      }
    }
    setSettings(getStoredSettings());
    // Trigger a brief loading state if needed, but the user wants it clean.
    // Resetting states that might be stale
    setEditingMovie(null);
    setEditingWatchlistItem(null);
    setSelectedMovieId(null);
    setIsAdding(false);
  };

  const unregisterServiceWorker = async () => {
    if (!window.confirm('This will unregister all service workers. Continue?')) return;
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
      alert('Service Workers unregistered.');
      window.location.reload();
    }
  };

  const clearCacheStorage = async () => {
    if (!window.confirm('This will clear all cache storage. Continue?')) return;
    if ('caches' in window) {
      const keys = await caches.keys();
      for (const key of keys) {
        await caches.delete(key);
      }
      alert('Cache storage cleared.');
    }
  };

  const clearIndexedDBData = async () => {
    if (!window.confirm('This will attempt to clear IndexedDB databases. Note: This might not work in all browsers for all databases. Continue?')) return;
    if ('indexedDB' in window) {
      // @ts-ignore - databases() might not be in all TS types yet
      const dbs = await window.indexedDB.databases?.() || [];
      for (const dbInfo of dbs) {
        if (dbInfo.name) {
          window.indexedDB.deleteDatabase(dbInfo.name);
        }
      }
      alert('IndexedDB data clearing initiated.');
    } else {
      alert('IndexedDB not supported in this browser.');
    }
  };

  const fullAppReset = async () => {
    if (!window.confirm('CRITICAL: This will unregister SW, clear cache, and clear IndexedDB. Your local movie data in localStorage will be KEPT. Proceed with system reset?')) return;
    
    try {
      // 1. SW
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      
      // 2. Cache
      if ('caches' in window) {
        const keys = await caches.keys();
        for (const key of keys) {
          await caches.delete(key);
        }
      }
      
      // 3. IndexedDB
      if ('indexedDB' in window) {
        // @ts-ignore
        const dbs = await window.indexedDB.databases?.() || [];
        for (const dbInfo of dbs) {
          if (dbInfo.name) {
            window.indexedDB.deleteDatabase(dbInfo.name);
          }
        }
      }
      
      alert('System reset complete. Reloading app...');
      window.location.reload();
    } catch (err) {
      console.error("Full reset failed", err);
      alert('Reset partially failed. See console for details.');
    }
  };

  const exportData = () => {
    const data = JSON.stringify({ movies, watchlist, settings });
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `movies_backup_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.json`;
    a.click();
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.movies) setMovies(data.movies);
        if (data.watchlist) setWatchlist(data.watchlist);
        if (data.settings) setSettings(data.settings);
      } catch (err) {
        alert('Invalid backup file');
      }
    };
    reader.readAsText(file);
  };

  const clearCache = () => {
    if (confirm('Clear all data? This cannot be undone.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // --- Calendar Component ---
  const CalendarPicker = ({ value, onChange, onClose }: { value: Date, onChange: (d: Date) => void, onClose: () => void }) => {
    const [viewDate, setViewDate] = useState(value);
    const days = eachDayOfInterval({
      start: startOfMonth(viewDate),
      end: endOfMonth(viewDate)
    });
    const startDay = getDay(days[0]);
    const today = startOfDay(new Date());

    return (
      <div className={cn(
        "p-4 rounded-3xl shadow-xl border transition-colors duration-300",
        syncedTheme === 'dark' ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-100 text-black"
      )}>
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => setViewDate(subMonths(viewDate, 1))} 
            className={cn(
              "p-2 rounded-full transition-colors",
              syncedTheme === 'dark' ? "hover:bg-gray-700" : "hover:bg-gray-100"
            )}
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-bold">{format(viewDate, 'MMMM yyyy')}</span>
          <button 
            onClick={() => setViewDate(addMonths(viewDate, 1))} 
            disabled={isAfter(startOfMonth(addMonths(viewDate, 1)), today)}
            className={cn(
              "p-2 rounded-full transition-colors disabled:opacity-20",
              syncedTheme === 'dark' ? "hover:bg-gray-700" : "hover:bg-gray-100"
            )}
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
            <span key={d} className="text-[10px] font-bold text-gray-400">{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
          {days.map(day => {
            const isFuture = isAfter(startOfDay(day), today);
            const isSelected = isSameDay(day, value);
            return (
              <button
                key={day.toISOString()}
                disabled={isFuture}
                onClick={() => { onChange(day); onClose(); }}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-full text-xs transition-colors",
                  isSelected 
                    ? (syncedTheme === 'dark' ? "bg-blue-500 text-white font-bold" : "bg-black text-white font-bold") 
                    : (syncedTheme === 'dark' ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-700"),
                  isToday(day) && !isSelected && "text-blue-500 font-bold",
                  isFuture && "opacity-20 cursor-not-allowed"
                )}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const processedMovies = useMemo(() => {
    let list = listTab === 'watched' ? [...movies] : [...watchlist];

    // Filtering
    if (filter) {
      if (filter.type === 'actor') {
        list = list.filter(m => m.actors.includes(filter.value));
      } else if (filter.type === 'category') {
        list = list.filter(m => m.categories.includes(filter.value));
      } else if (filter.type === 'month') {
        list = list.filter(m => {
          if ('watches' in m) {
            return m.watches.some(w => format(parseISO(w.date), 'yyyy-MM') === filter.value);
          }
          return false;
        });
      } else if (filter.type === 'day') {
        list = list.filter(m => {
          if ('watches' in m) {
            return m.watches.some(w => format(parseISO(w.date), 'yyyy-MM-dd') === filter.value);
          }
          return false;
        });
      }
    }

    // Sorting
    if (settings.sortEnabled) {
      list.sort((a, b) => {
        switch (settings.sortBy) {
          case 'title':
            return a.name.localeCompare(b.name);
          case 'actor':
            return (a.actors[0] || '').localeCompare(b.actors[0] || '');
          case 'category':
            return (a.categories[0] || '').localeCompare(b.categories[0] || '');
          case 'year':
            return (b.year || 0) - (a.year || 0);
          case 'day':
          case 'month': {
            const dateA = 'watches' in a && a.watches[0] ? parseISO(a.watches[0].date).getTime() : a.createdAt;
            const dateB = 'watches' in b && b.watches[0] ? parseISO(b.watches[0].date).getTime() : b.createdAt;
            return dateB - dateA;
          }
          default:
            return 0;
        }
      });
    }

    // Grouping
    if (settings.groupEnabled) {
      const groups: { [key: string]: (Movie | WatchListItem)[] } = {};
      list.forEach(item => {
        let key = 'Other';
        switch (settings.groupBy) {
          case 'title':
            key = item.name[0].toUpperCase();
            break;
          case 'actor':
            key = item.actors && item.actors.length > 0 ? item.actors[0][0].toUpperCase() : 'Unknown';
            break;
          case 'category':
            key = item.categories && item.categories.length > 0 ? item.categories[0] : 'Uncategorized';
            break;
          case 'day': {
            const date = 'watches' in item && item.watches[0] ? parseISO(item.watches[0].date) : new Date(item.createdAt);
            key = format(date, 'yyyy-MM-dd');
            break;
          }
          case 'month': {
            const date = 'watches' in item && item.watches[0] ? parseISO(item.watches[0].date) : new Date(item.createdAt);
            key = format(date, 'MMMM yyyy');
            break;
          }
          case 'year': {
            key = item.year?.toString() || 'Unknown Year';
            break;
          }
        }
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      });
      return groups;
    }

    return { 'All': list };
  }, [movies, watchlist, listTab, settings.sortEnabled, settings.sortBy, settings.groupEnabled, settings.groupBy, filter]) as { [key: string]: (Movie | WatchListItem)[] };

  return (
    <div className={cn(
      "h-screen flex flex-col overflow-hidden text-black font-sans selection:bg-black selection:text-white transition-colors duration-500",
      `theme-${syncedTheme}`,
      syncedTheme === 'dark' && "dark text-white",
    )}
    style={{ 
      backgroundColor: themeColors.bg,
      color: themeColors.text
    }}>
      {/* Dynamic Texture Layer */}
      <div 
        className="texture-layer" 
        style={{ 
          transform: `translateY(${scrollPos * 0.05}px)`
        }} 
      />

      {/* Header */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-[100] px-6 py-4 pb-4 safe-top flex items-center justify-between border-b transition-all max-w-md mx-auto",
        syncedTheme === 'glass' ? "bg-white/20 backdrop-blur-xl border-white/20" : "backdrop-blur-md border-transparent",
      )}
      style={{ 
        backgroundColor: `${themeColors.bg}CC`, // Glass effect with background color
        borderColor: themeColors.border,
        color: themeColors.text
      }}>
        <div className="flex items-center gap-2">
          {selectedMovieId ? (
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => setSelectedMovieId(null)}
              className={cn(
                "p-2 rounded-full mr-1",
                syncedTheme === 'dark' ? "bg-gray-800" : "bg-gray-50"
              )}
            >
              <ChevronLeft size={20} />
            </motion.button>
          ) : (
            <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center">
              <Film size={18} className="text-white" />
            </div>
          )}
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tight leading-none">
              {selectedMovieId ? 'Movie Details' : 'CineLog'}
            </h1>
            {!selectedMovieId && (
              <motion.span 
                key={settings.totalXP}
                initial={{ scale: 1.2, color: "#9333ea" }}
                animate={{ scale: 1, color: "#9ca3af" }}
                className="text-[10px] font-bold uppercase tracking-widest"
              >
                {settings.totalXP} XP
              </motion.span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isOffline && (
            <div className="flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1 rounded-full border border-red-100">
              <WifiOff size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Offline</span>
            </div>
          )}
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-full border",
            syncedTheme === 'dark' ? "bg-orange-900/20 text-orange-400 border-orange-900/30" : "bg-orange-50 text-orange-600 border-orange-100"
          )}>
            <Flame size={14} fill="currentColor" />
            <span className="text-xs font-bold">{stats.streak}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main 
        ref={scrollRef}
        className="flex-1 overflow-y-auto pt-24 pb-40 px-6 max-w-md mx-auto w-full no-scrollbar relative z-10"
      >
        <AnimatePresence mode="wait">
          {selectedMovieId && selectedMovie ? (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {/* Movie Info */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tight leading-tight">
                      {selectedMovie.name}
                      {selectedMovie.year && (
                        <span className="ml-3 text-gray-400 font-medium text-xl">({selectedMovie.year})</span>
                      )}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {selectedMovie.actors && selectedMovie.actors.length > 0 ? selectedMovie.actors.map(a => (
                        <button
                          key={a}
                          onClick={() => {
                            setFilter({ type: 'actor', value: a });
                            setSelectedMovieId(null);
                          }}
                          className="flex items-center gap-1 text-gray-400 text-[10px] uppercase font-bold tracking-wider hover:text-orange-500 transition-colors"
                        >
                          <User size={10} />
                          <span>{a}</span>
                        </button>
                      )) : (
                        <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Unknown Actor</span>
                      )}
                      {selectedMovie.categories && selectedMovie.categories.length > 0 && selectedMovie.categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => {
                            setFilter({ type: 'category', value: cat });
                            setSelectedMovieId(null);
                          }}
                          className={cn(
                            "text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider transition-all",
                            syncedTheme === 'dark' ? "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white" : "bg-gray-100 text-gray-500 hover:bg-black hover:text-white"
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setEditingMovie(selectedMovie);
                      setName(selectedMovie.name);
                      setActors(selectedMovie.actors || []);
                      setCategories(selectedMovie.categories || []);
                      setTags(selectedMovie.tags || []);
                      setDirector(selectedMovie.director || '');
                      setYear(selectedMovie.year?.toString() || '');
                      setThemes(selectedMovie.themes || []);
                      setEndingStyle(selectedMovie.endingStyle || '');
                      setPlotTwist(selectedMovie.plotTwist || false);
                      setIsAdding(true);
                    }}
                    className={cn(
                      "p-3 rounded-2xl transition-colors border",
                      syncedTheme === 'dark' ? "bg-gray-800 text-gray-400 border-gray-700 hover:text-white" : "bg-gray-50 text-gray-400 border-transparent hover:text-black"
                    )}
                  >
                    <Plus size={20} className="rotate-45" />
                  </motion.button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className={cn(
                    "p-4 rounded-3xl space-y-1 border transition-all",
                    syncedTheme === 'glass' ? "glass-card" : (syncedTheme === 'dark' ? "bg-gray-800/50 border-gray-700 shadow-sm" : "bg-gray-50 border-transparent")
                  )}>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Watches</span>
                    <div className="text-2xl font-black">{selectedMovie.watches.length}</div>
                  </div>
                  <div className={cn(
                    "p-4 rounded-3xl space-y-1 border transition-all",
                    syncedTheme === 'glass' ? "glass-card" : (syncedTheme === 'dark' ? "bg-gray-800/50 border-gray-700 shadow-sm" : "bg-gray-50 border-transparent")
                  )}>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">XP Earned</span>
                    <div className={cn(
                      "text-2xl font-black",
                      syncedTheme === 'dark' ? "text-blue-400" : "text-purple-600"
                    )}>
                      {selectedMovie.watches.reduce((acc, w) => acc + w.xpEarned, 0)}
                    </div>
                  </div>
                </div>

                <div className={cn(
                  "p-5 rounded-3xl space-y-3 border transition-all",
                  syncedTheme === 'glass' ? "glass-card" : (syncedTheme === 'dark' ? "bg-gray-800/50 border-gray-700 shadow-sm" : "bg-gray-50 border-transparent")
                )}>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">First Watched</span>
                    <span className="text-xs font-bold">
                      {selectedMovie.watches.length > 0 
                        ? format(parseISO(selectedMovie.watches[selectedMovie.watches.length - 1].date), 'MMM d, yyyy')
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Watched</span>
                    <span className="text-xs font-bold">
                      {selectedMovie.watches.length > 0 
                        ? format(parseISO(selectedMovie.watches[0].date), 'MMM d, yyyy')
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setName(selectedMovie.name);
                    setActors(selectedMovie.actors || []);
                    setCategories(selectedMovie.categories || []);
                    setTags(selectedMovie.tags || []);
                    setDirector(selectedMovie.director || '');
                    setYear(selectedMovie.year?.toString() || '');
                    setThemes(selectedMovie.themes || []);
                    setEndingStyle(selectedMovie.endingStyle || '');
                    setPlotTwist(selectedMovie.plotTwist || false);
                    setIsAdding(true);
                  }}
                  className={cn(
                    "py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all border",
                    syncedTheme === 'dark' ? "bg-gray-800 text-white border-gray-700 hover:bg-gray-700" : "bg-black text-white border-black"
                  )}
                >
                  <Plus size={18} />
                  Log Watch
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => quickRewatch(selectedMovie)}
                  className="bg-orange-500 text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} />
                  Re-watch
                </motion.button>
              </div>

              {/* History */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Watch History</h3>
                <div className="space-y-2">
                  {selectedMovie.watches.map((watch) => (
                    <motion.div
                      key={watch.id}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "p-3 rounded-2xl flex items-center justify-between group border transition-all",
                        syncedTheme === 'glass' ? "glass-card" : (syncedTheme === 'dark' ? "bg-gray-800/40 border-gray-700 shadow-sm" : "bg-white border-gray-100")
                      )}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">{format(parseISO(watch.date), 'MMMM d, yyyy')}</span>
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-widest",
                          syncedTheme === 'dark' ? "text-blue-400" : "text-purple-600"
                        )}>+{watch.xpEarned} XP</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setEditingWatch({ movieId: selectedMovie.id, watchId: watch.id });
                            setSelectedDate(parseISO(watch.date));
                            setIsAdding(true);
                          }}
                          className="p-2 hover:bg-gray-50 rounded-full text-gray-400 hover:text-black"
                        >
                          <Plus size={14} className="rotate-45" />
                        </button>
                        <button 
                          onClick={() => deleteWatch(selectedMovie.id, watch.id)}
                          className="p-2 hover:bg-red-50 rounded-full text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="pt-8">
                <button 
                  onClick={() => deleteMovie(selectedMovie.id)}
                  className={cn(
                    "w-full py-4 text-red-500 text-sm font-bold border rounded-2xl transition-colors",
                    syncedTheme === 'dark' ? "border-red-900/30 hover:bg-red-900/20" : "border-red-100 hover:bg-red-50"
                  )}
                >
                  Delete Movie
                </button>
              </div>
            </motion.div>
          ) : activeTab === 'list' ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  <button 
                    onClick={() => setListTab('watched')}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                      listTab === 'watched' 
                        ? (syncedTheme === 'dark' ? "bg-gray-700 text-white shadow-sm" : "bg-white text-black shadow-sm") 
                        : "text-gray-400"
                    )}
                  >
                    Watched
                  </button>
                  {settings.showWatchlist && (
                    <button 
                      onClick={() => setListTab('watchlist')}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                        listTab === 'watchlist' 
                          ? (syncedTheme === 'dark' ? "bg-gray-700 text-white shadow-sm" : "bg-white text-black shadow-sm") 
                          : "text-gray-400"
                      )}
                    >
                      Watchlist
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleShuffle}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      syncedTheme === 'dark' ? "bg-gray-800 text-gray-400 hover:text-white" : "bg-gray-50 text-gray-400 hover:text-black"
                    )}
                    title="Shuffle Movie"
                  >
                    <Shuffle size={16} />
                  </button>
                  <button 
                    onClick={() => setShowLayoutPicker(!showLayoutPicker)}
                    className={cn(
                      "p-2 rounded-lg transition-colors flex items-center gap-2",
                      showLayoutPicker 
                        ? (syncedTheme === 'dark' ? "bg-white text-black" : "bg-black text-white") 
                        : (syncedTheme === 'dark' ? "bg-gray-800 text-gray-400 hover:text-white" : "bg-gray-50 text-gray-400 hover:text-black")
                    )}
                  >
                    <LayoutGrid size={16} />
                    {showLayoutPicker && <span className="text-[10px] font-black uppercase tracking-widest px-1">Layout</span>}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {showLayoutPicker && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-gray-50/50 dark:bg-gray-800/20 rounded-[2rem] p-4"
                  >
                    <LayoutPicker 
                      current={settings.layout} 
                      onSelect={(l) => setSettings(s => ({ ...s, layout: l }))}
                      theme={syncedTheme}
                      visibleLayouts={settings.visibleLayouts}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sort & Group Controls */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                <button
                  onClick={() => setSettings(s => ({ ...s, sortEnabled: !s.sortEnabled }))}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border whitespace-nowrap",
                    settings.sortEnabled 
                      ? (syncedTheme === 'dark' ? "bg-white text-black border-white" : "bg-black text-white border-black") 
                      : (syncedTheme === 'dark' ? "bg-gray-800 text-gray-400 border-gray-700" : "bg-white text-gray-400 border-gray-100")
                  )}
                >
                  <ArrowUpDown size={12} />
                  Sort {settings.sortEnabled ? 'On' : 'Off'}
                </button>

                {settings.sortEnabled && (
                  <div className={cn(
                    "flex items-center gap-1 rounded-full p-1 border",
                    syncedTheme === 'dark' ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-100"
                  )}>
                    {(['day', 'month', 'year', 'title', 'actor', 'category'] as const).map(option => (
                      <button
                        key={option}
                        onClick={() => setSettings(s => ({ ...s, sortBy: option }))}
                        className={cn(
                          "px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter transition-all",
                          settings.sortBy === option 
                            ? (syncedTheme === 'dark' ? "bg-white text-black shadow-sm" : "bg-white text-black shadow-sm") 
                            : "text-gray-400"
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                <div className="w-px h-4 bg-gray-100 mx-1 shrink-0" />

                <button
                  onClick={() => setSettings(s => ({ ...s, groupEnabled: !s.groupEnabled }))}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border whitespace-nowrap",
                    settings.groupEnabled 
                      ? (syncedTheme === 'dark' ? "bg-white text-black border-white" : "bg-black text-white border-black") 
                      : (syncedTheme === 'dark' ? "bg-gray-800 text-gray-400 border-gray-700" : "bg-white text-gray-400 border-gray-100")
                  )}
                >
                  <Layers size={12} />
                  Group {settings.groupEnabled ? 'On' : 'Off'}
                </button>

                {settings.groupEnabled && (
                  <div className={cn(
                    "flex items-center gap-1 rounded-full p-1 border",
                    syncedTheme === 'dark' ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-100"
                  )}>
                    {(['day', 'month', 'year', 'title', 'actor', 'category'] as const).map(option => (
                      <button
                        key={option}
                        onClick={() => setSettings(s => ({ ...s, groupBy: option }))}
                        className={cn(
                          "px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter transition-all",
                          settings.groupBy === option 
                            ? (syncedTheme === 'dark' ? "bg-white text-black shadow-sm" : "bg-white text-black shadow-sm") 
                            : "text-gray-400"
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {filter && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-2xl border",
                    syncedTheme === 'dark' ? "bg-orange-900/20 border-orange-900/30 text-orange-400" : "bg-orange-50 border-orange-100 text-orange-600"
                  )}
                >
                  <div className="flex items-center gap-2 flex-1">
                    {filter.type === 'actor' ? <User size={14} /> : <Tag size={14} />}
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Filtering {filter.type}: {filter.value}
                    </span>
                  </div>
                  <button 
                    onClick={() => setFilter(null)}
                    className="p-1 hover:bg-orange-500/10 rounded-full transition-colors"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              )}

              <AnimatePresence>
                {error && !isAdding && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-red-50 text-red-500 text-[10px] font-bold rounded-xl text-center uppercase tracking-widest"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* AI Curator Suggestion */}
              {settings.aiCuratorEnabled && aiSuggestions && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-5 rounded-[2rem] border transition-all",
                    syncedTheme === 'glass' ? "glass-card" : (syncedTheme === 'dark' ? "bg-gray-800 border-gray-700" : "bg-blue-50/30 border-blue-100")
                  )}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{aiSuggestions.timeLabel}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h3 className="text-lg font-black leading-tight">{aiSuggestions.suggestion.name}</h3>
                      <p className="text-xs text-gray-400">{aiSuggestions.suggestion.mood} • {aiSuggestions.suggestion.genre}</p>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        if (aiSuggestions.suggestion.source === 'watchlist') {
                          setName(aiSuggestions.suggestion.name);
                          setActors(aiSuggestions.suggestion.actors || []);
                          setYear(aiSuggestions.suggestion.year?.toString() || '');
                          setIsAdding(true);
                        } else {
                          setSelectedMovieId(aiSuggestions.suggestion.id);
                        }
                      }}
                      className={cn(
                        "p-3 rounded-2xl transition-all",
                        syncedTheme === 'dark' ? "bg-white text-black" : "bg-black text-white"
                      )}
                    >
                      <Film size={18} />
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Shuffle Result */}
              <AnimatePresence>
                {shuffledMovie && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className={cn(
                      "p-6 rounded-[2rem] border-2 border-dashed flex flex-col items-center text-center space-y-4 mb-4",
                      syncedTheme === 'dark' 
                        ? "border-orange-900/50 bg-orange-900/10" 
                        : "border-orange-200 bg-orange-50/30",
                      syncedTheme === 'glass' && "glass-card border-orange-300/50"
                    )}>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Shuffle Pick</span>
                        <h3 className="text-2xl font-black">{shuffledMovie.name}</h3>
                        <div className="flex flex-wrap justify-center gap-2">
                          {shuffledMovie.actors && shuffledMovie.actors.map(a => (
                            <span key={a} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{a}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 w-full">
                        <button 
                          onClick={() => {
                            setName(shuffledMovie.name);
                            setActors(shuffledMovie.actors || []);
                            setCategories(shuffledMovie.categories || []);
                            setTags(shuffledMovie.tags || []);
                            setYear(shuffledMovie.year?.toString() || '');
                            setIsAdding(true);
                            setShuffledMovie(null);
                          }}
                          className="flex-1 bg-orange-500 text-white py-3 rounded-xl text-xs font-bold shadow-md"
                        >
                          Watch Now
                        </button>
                        <button 
                          onClick={() => setShuffledMovie(null)}
                          className={cn(
                            "p-3 rounded-xl transition-colors",
                            syncedTheme === 'dark' ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-400"
                          )}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {listTab === 'watched' ? (
                movies.length === 0 ? (
                  <div className="py-20 flex flex-col items-center text-center space-y-4">
                    <div className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center",
                      syncedTheme === 'dark' ? "bg-gray-800" : "bg-gray-50"
                    )}>
                      <Film size={24} className="text-gray-300" />
                    </div>
                    <p className="text-gray-400 text-sm">No movies logged yet.<br/>Tap the plus to start.</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {Object.entries(processedMovies).map(([groupName, groupItems]) => (
                      <div key={groupName} className="space-y-4">
                        {settings.groupEnabled && (
                          <div className="flex items-center gap-3">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 whitespace-nowrap">
                              {groupName}
                            </h4>
                            <div className="h-px w-full bg-gray-50" />
                          </div>
                        )}
                        <div className={cn(
                          "grid gap-4",
                          settings.layout === 'grid' || settings.layout === 'compact' ? "grid-cols-2" : "grid-cols-1"
                        )}>
                          {groupItems.map((item) => {
                            const movie = item as Movie;
                            const lastWatch = movie.watches[0];
                            const watchCount = movie.watches.length;
                            const isMostWatched = watchCount > 0 && watchCount === Math.max(...movies.map(m => m.watches.length));
                            const isTextMode = ['table', 'list', 'compact'].includes(settings.layout);
                            
                            return (
                              <motion.div
                                layout
                                key={movie.id}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedMovieId(movie.id)}
                                className={cn(
                                  "group relative border rounded-[2rem] overflow-hidden transition-all hover:border-gray-200 cursor-pointer shadow-sm",
                                  syncedTheme === 'glass' ? "glass-card" : (syncedTheme === 'dark' ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"),
                                  isMostWatched && !isTextMode && (syncedTheme === 'dark' ? "border-orange-900/50 bg-orange-900/20" : "border-orange-200 bg-orange-50/30"),
                                  isTextMode ? "p-4 flex items-center justify-between" : "p-6",
                                  settings.layout === 'compact' && !isTextMode ? "p-4" : ""
                                )}
                              >
                                <div className={cn(
                                  isTextMode ? "flex items-center gap-3" : "space-y-2"
                                )}>
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                      <h3 className={cn(
                                        "font-bold leading-tight",
                                        settings.layout === 'compact' ? "text-sm" : "text-base"
                                      )}>
                                        {movie.name}
                                        {movie.year && (
                                          <span className="ml-2 text-gray-400 font-medium text-[10px]">({movie.year})</span>
                                        )}
                                      </h3>
                                      {isMostWatched && !isTextMode && (
                                        <span className="text-[8px] font-black bg-orange-500 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                          Top Pick
                                        </span>
                                      )}
                                      {watchCount > 1 && (
                                        <span className="text-[10px] font-black bg-black text-white px-1.5 py-0.5 rounded-md">
                                          x{watchCount}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                      {movie.actors && movie.actors.length > 0 && movie.actors.map(a => (
                                        <button
                                          key={a}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setFilter({ type: 'actor', value: a });
                                          }}
                                          className="flex items-center gap-1 text-gray-400 text-[10px] uppercase font-bold tracking-wider hover:text-orange-500 transition-colors"
                                        >
                                          <User size={10} />
                                          <span>{a}</span>
                                        </button>
                                      ))}
                                      {movie.categories && movie.categories.length > 0 && movie.categories.map(cat => (
                                        <button
                                          key={cat}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setFilter({ type: 'category', value: cat });
                                          }}
                                          className="text-[8px] font-black bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md uppercase tracking-wider hover:bg-black hover:text-white transition-all"
                                        >
                                          {cat}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  {!isTextMode && lastWatch && (
                                    <div className="flex items-center gap-2 pt-1">
                                      <span 
                                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                        style={{ 
                                          backgroundColor: themeColors.bg,
                                          color: themeColors.accent,
                                          border: `1px solid ${themeColors.border}`
                                        }}
                                      >
                                        Last: {format(parseISO(lastWatch.date), 'MMM d, yyyy')}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className={cn(
                                  "flex items-center gap-1",
                                  isTextMode ? "" : "absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                                )}>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingMovie(movie);
                                      setName(movie.name);
                                      setActors(movie.actors || []);
                                      setCategories(movie.categories || []);
                                      setDirector(movie.director || '');
                                      setYear(movie.year?.toString() || '');
                                      setEndingStyle(movie.endingStyle || '');
                                      setPlotTwist(movie.plotTwist || false);
                                      setThemes(movie.themes || []);
                                      setTags(movie.tags || []);
                                      setIsAdding(true);
                                    }}
                                    title="Edit Movie"
                                    className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-black"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      quickRewatch(movie);
                                    }}
                                    title="Quick Re-watch"
                                    className="p-2 hover:bg-orange-50 rounded-full text-gray-400 hover:text-orange-500"
                                  >
                                    <RefreshCw size={14} />
                                  </button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                watchlist.length === 0 ? (
                  <div className="py-20 flex flex-col items-center text-center space-y-4">
                    <div className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center",
                      syncedTheme === 'dark' ? "bg-gray-800" : "bg-gray-50"
                    )}>
                      <List size={24} className="text-gray-300" />
                    </div>
                    <p className="text-gray-400 text-sm">Add movies to watchlist</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {Object.entries(processedMovies).map(([groupName, groupItems]) => (
                      <div key={groupName} className="space-y-4">
                        {settings.groupEnabled && (
                          <div className="flex items-center gap-3">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 whitespace-nowrap">
                              {groupName}
                            </h4>
                            <div className="h-px w-full bg-gray-50" />
                          </div>
                        )}
                        <div className={cn(
                          "grid gap-4",
                          settings.layout === 'grid' || settings.layout === 'compact' ? "grid-cols-2" : "grid-cols-1"
                        )}>
                          {groupItems.map((item) => {
                            const isTextMode = ['table', 'list', 'compact'].includes(settings.layout);
                            return (
                              <motion.div
                                layout
                                key={item.id}
                                className={cn(
                                  "group relative border rounded-[2rem] transition-all hover:border-gray-200 cursor-pointer shadow-sm",
                                  syncedTheme === 'glass' ? "glass-card" : (syncedTheme === 'dark' ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"),
                                  isTextMode ? "p-4 flex items-center justify-between" : "p-6",
                                  settings.layout === 'compact' && !isTextMode ? "p-4" : ""
                                )}
                              >
                                <div className={cn(
                                  isTextMode ? "flex items-center gap-3" : "space-y-2"
                                )}>
                                  <div className="flex flex-col">
                                    <h3 className={cn(
                                      "font-bold leading-tight",
                                      settings.layout === 'compact' ? "text-sm" : "text-base"
                                    )}>{item.name}</h3>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                      {item.actors && item.actors.length > 0 && item.actors.map(a => (
                                        <button
                                          key={a}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setFilter({ type: 'actor', value: a });
                                          }}
                                          className="flex items-center gap-1 text-gray-400 text-[10px] uppercase font-bold tracking-wider hover:text-orange-500 transition-colors"
                                        >
                                          <User size={10} />
                                          <span>{a}</span>
                                        </button>
                                      ))}
                                      {item.categories && item.categories.length > 0 && item.categories.map(cat => (
                                        <button
                                          key={cat}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setFilter({ type: 'category', value: cat });
                                          }}
                                          className="text-[8px] font-black bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md uppercase tracking-wider hover:bg-black hover:text-white transition-all"
                                        >
                                          {cat}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                <div className={cn(
                                  "flex items-center gap-1",
                                  isTextMode ? "" : "absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity"
                                )}>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setName(item.name);
                                      setActors(item.actors || []);
                                      setCategories(item.categories || []);
                                      setDirector(item.director || '');
                                      setYear(item.year?.toString() || '');
                                      setEndingStyle(item.endingStyle || '');
                                      setPlotTwist(item.plotTwist || false);
                                      setThemes(item.themes || []);
                                      setTags(item.tags || []);
                                      setIsAdding(true);
                                    }}
                                    title="Mark as Watched"
                                    className="p-2 hover:bg-green-50 rounded-full text-gray-400 hover:text-green-500"
                                  >
                                    <Check size={14} />
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingWatchlistItem(item);
                                      setName(item.name);
                                      setActors(item.actors || []);
                                      setCategories(item.categories || []);
                                      setDirector(item.director || '');
                                      setYear(item.year?.toString() || '');
                                      setEndingStyle(item.endingStyle || '');
                                      setPlotTwist(item.plotTwist || false);
                                      setThemes(item.themes || []);
                                      setTags(item.tags || []);
                                      setIsAdding(true);
                                    }}
                                    title="Edit"
                                    className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-black"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeFromWatchlist(item.id);
                                    }}
                                    title="Remove"
                                    className="p-2 hover:bg-red-50 rounded-full text-gray-400 hover:text-red-500"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </motion.div>
          ) : activeTab === 'stats' ? (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8 pb-10"
            >
              {/* Hero Card */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                  "p-8 rounded-[3rem] relative overflow-hidden shadow-2xl",
                  syncedTheme === 'glass' ? "glass-card" : (syncedTheme === 'dark' ? "bg-white text-black" : "bg-black text-white")
                )}
              >
                <div className="relative z-10 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Total Watches</span>
                      <div className="text-6xl font-black tracking-tighter">
                        <CountUp value={stats.total} />
                      </div>
                    </div>
                    <Trophy size={32} className="opacity-20" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-8 pt-4 border-t border-current/10">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Total XP</span>
                      <div className="text-2xl font-black tracking-tight">
                        <CountUp value={settings.totalXP} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Current Streak</span>
                      <div className="text-2xl font-black tracking-tight flex items-center gap-2">
                        <CountUp value={stats.streak} />
                        <Flame size={20} className="text-orange-500" fill="currentColor" />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full -mr-16 -mt-16" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full -ml-16 -mb-16" />
              </motion.div>

              {/* Activity Rings */}
              <div className={cn(
                "p-8 rounded-[3rem] space-y-6",
                syncedTheme === 'glass' ? "glass-card" : (syncedTheme === 'dark' ? "bg-gray-800" : "bg-gray-50")
              )}>
                <div 
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => toggleSection('rings')}
                >
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Activity Rings</h3>
                  <ChevronRight size={16} className={cn("text-gray-400 transition-transform", expandedSections.rings && "rotate-90")} />
                </div>
                <AnimatePresence>
                  {expandedSections.rings && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex justify-around items-center pt-2">
                        <ActivityRing 
                          progress={Math.min(100, (stats.total / 100) * 100)} 
                          color="#ef4444" 
                          label="All Time" 
                          icon={Film}
                        />
                        <ActivityRing 
                          progress={Math.min(100, (stats.streak / 30) * 100)} 
                          color="#f97316" 
                          label="Streak" 
                          icon={Flame}
                        />
                        <ActivityRing 
                          progress={Math.min(100, (stats.comparison.current / 10) * 100)} 
                          color="#3b82f6" 
                          label="Monthly" 
                          icon={Calendar}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Monthly Timeline */}
              <div className="space-y-4">
                <div 
                  className="flex justify-between items-center px-4 cursor-pointer"
                  onClick={() => toggleSection('timeline')}
                >
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Monthly Timeline</h3>
                  <ChevronRight size={16} className={cn("text-gray-400 transition-transform", expandedSections.timeline && "rotate-90")} />
                </div>
                <AnimatePresence>
                  {expandedSections.timeline && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 pb-4">
                        {stats.monthlyStats.map((m, idx) => (
                          <motion.div
                            key={m.month}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            onClick={() => {
                              setFilter({ type: 'month', value: m.month });
                              setActiveTab('list');
                            }}
                            className={cn(
                              "min-w-[140px] p-6 rounded-[2.5rem] space-y-3 shrink-0 border transition-all cursor-pointer hover:scale-105 active:scale-95",
                              m.isCurrent 
                                ? (syncedTheme === 'dark' ? "bg-white text-black border-white" : "bg-black text-white border-black")
                                : (syncedTheme === 'dark' ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100")
                            )}
                          >
                            <div className="text-[10px] font-black uppercase tracking-widest opacity-60">{format(parseISO(`${m.month}-01`), 'MMM')}</div>
                            <div className="text-3xl font-black">{m.count}</div>
                            <div className="h-1.5 w-full bg-current/10 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, (m.count / 15) * 100)}%` }}
                                className="h-full bg-current"
                              />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Watch Heatmap */}
              <div className={cn(
                "p-8 rounded-[3rem] space-y-6",
                syncedTheme === 'glass' ? "glass-card" : (syncedTheme === 'dark' ? "bg-gray-800" : "bg-gray-50")
              )}>
                <div 
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => toggleSection('heatmap')}
                >
                  <div className="flex items-center gap-2">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Watch Heatmap</h3>
                    <span className="text-[10px] font-bold text-gray-400">Last 12 Weeks</span>
                  </div>
                  <ChevronRight size={16} className={cn("text-gray-400 transition-transform", expandedSections.heatmap && "rotate-90")} />
                </div>
                <AnimatePresence>
                  {expandedSections.heatmap && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <Heatmap 
                        data={stats.dailyWatches} 
                        theme={syncedTheme} 
                        onDayClick={(day) => {
                          setFilter({ type: 'day', value: day });
                          setActiveTab('list');
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 10 Detailed Grouped Stats */}
              <div className="space-y-4">
                <ExpandableStatGroup
                  title="Watching Habits"
                  icon={Clock}
                  colorClass="bg-blue-500/10 text-blue-500"
                  preview={`${stats.habits.totalWatchDays} Days Active`}
                  expanded={!!expandedSections.habits}
                  onToggle={() => toggleSection('habits')}
                  colors={themeColors}
                >
                  <StatItem label="Total Watch Days" value={stats.habits.totalWatchDays} colors={themeColors} />
                  <StatItem label="Most Active" value={stats.habits.mostActiveDay} colors={themeColors} />
                  <StatItem label="Peak Time" value={stats.habits.preferredTime} colors={themeColors} />
                  <StatItem label="Label" value={stats.habits.totalWatchDays > 30 ? 'Dedicated' : 'Occasional'} colors={themeColors} />
                </ExpandableStatGroup>

                <ExpandableStatGroup
                  title="Re-watch Insights"
                  icon={Repeat}
                  colorClass="bg-orange-500/10 text-orange-500"
                  preview={`${stats.rewatchInsights.totalRewatches} Re-watches`}
                  expanded={!!expandedSections.rewatchInsights}
                  onToggle={() => toggleSection('rewatchInsights')}
                  colors={themeColors}
                >
                  <StatItem label="Most Re-watched" value={stats.rewatchInsights.mostRewatchedMovie} colors={themeColors} />
                  <StatItem label="Total Re-watches" value={stats.rewatchInsights.totalRewatches} colors={themeColors} />
                  <StatItem label="Average Gap" value={`${stats.rewatchInsights.avgGap} Days`} colors={themeColors} />
                  <StatItem label="Label" value={stats.rewatchInsights.totalRewatches > 10 ? 'Loyalty King' : 'New Story Seeker'} colors={themeColors} />
                </ExpandableStatGroup>

                <ExpandableStatGroup
                  title="Actor Insights"
                  icon={User}
                  colorClass="bg-purple-500/10 text-purple-500"
                  preview={stats.actorInsights.mostWatchedActor}
                  expanded={!!expandedSections.actorInsights}
                  onToggle={() => toggleSection('actorInsights')}
                  colors={themeColors}
                >
                  <StatItem label="Most Watched" value={stats.actorInsights.mostWatchedActor} colors={themeColors} />
                  <StatItem label="Unique Actors" value={stats.actorInsights.uniqueActors} colors={themeColors} />
                  <StatItem label="Top Re-watch" value={stats.actorInsights.topRewatchActor} colors={themeColors} />
                  <StatItem label="Label" value={stats.actorInsights.uniqueActors > 50 ? 'Casting Director' : 'Fan'} colors={themeColors} />
                </ExpandableStatGroup>

                <ExpandableStatGroup
                  title="Category Insights"
                  icon={Tag}
                  colorClass="bg-green-500/10 text-green-500"
                  preview={stats.categoryInsights.favoriteCategory}
                  expanded={!!expandedSections.categoryInsights}
                  onToggle={() => toggleSection('categoryInsights')}
                  colors={themeColors}
                >
                  <StatItem label="Favorite" value={stats.categoryInsights.favoriteCategory} colors={themeColors} />
                  <StatItem label="Least Watched" value={stats.categoryInsights.leastWatchedCategory} colors={themeColors} />
                  <StatItem label="Diversity Score" value={stats.categoryInsights.diversityScore} colors={themeColors} />
                  <StatItem label="Label" value={stats.categoryInsights.diversityScore > 10 ? 'Genre Picker' : 'Specialist'} colors={themeColors} />
                </ExpandableStatGroup>

                <ExpandableStatGroup
                  title="Monthly Trends"
                  icon={TrendingUp}
                  colorClass="bg-pink-500/10 text-pink-500"
                  preview={`${stats.monthlyTrends.avgPerMonth} / Month`}
                  expanded={!!expandedSections.monthlyTrends}
                  onToggle={() => toggleSection('monthlyTrends')}
                  colors={themeColors}
                >
                  <StatItem label="Best Month" value={stats.monthlyTrends.bestMonth} colors={themeColors} />
                  <StatItem label="Monthly Avg" value={stats.monthlyTrends.avgPerMonth} colors={themeColors} />
                  <StatItem label="Growth" value={`${stats.monthlyTrends.growth}%`} colors={themeColors} />
                  <StatItem label="Trend" value={stats.monthlyTrends.growth > 0 ? 'Rising' : 'Cooling'} colors={themeColors} />
                </ExpandableStatGroup>

                <ExpandableStatGroup
                  title="Fun Patterns"
                  icon={Sparkles}
                  colorClass="bg-yellow-500/10 text-yellow-500"
                  preview={`Binge: ${stats.funPatterns.bingeDay} Movies`}
                  expanded={!!expandedSections.funPatterns}
                  onToggle={() => toggleSection('funPatterns')}
                  colors={themeColors}
                >
                  <StatItem label="Longest Gap" value={`${stats.funPatterns.longestGap} Days`} colors={themeColors} />
                  <StatItem label="Binge Date" value={stats.funPatterns.bingeDate} colors={themeColors} />
                  <StatItem label="Binge Record" value={`${stats.funPatterns.bingeDay} in a day`} colors={themeColors} />
                  <StatItem label="Label" value={stats.funPatterns.bingeDay >= 3 ? 'Binge Master' : 'Casual'} colors={themeColors} />
                </ExpandableStatGroup>

                <ExpandableStatGroup
                  title="Consistency Score"
                  icon={CheckCircle}
                  colorClass="bg-cyan-500/10 text-cyan-500"
                  preview={`${stats.consistency.score}% Consistency`}
                  expanded={!!expandedSections.consistency}
                  onToggle={() => toggleSection('consistency')}
                  colors={themeColors}
                >
                  <StatItem label="Consistency %" value={stats.consistency.score} colors={themeColors} />
                  <StatItem label="Level" value={stats.consistency.level} colors={themeColors} />
                  <StatItem label="Streak Ratio" value="Strong" colors={themeColors} />
                  <StatItem label="Label" value={stats.consistency.level} colors={themeColors} />
                </ExpandableStatGroup>

                <ExpandableStatGroup
                  title="Discovery Insights"
                  icon={Compass}
                  colorClass="bg-indigo-500/10 text-indigo-500"
                  preview={`${stats.discovery.percentNew}% New`}
                  expanded={!!expandedSections.discovery}
                  onToggle={() => toggleSection('discovery')}
                  colors={themeColors}
                >
                  <StatItem label="Explore Level" value={stats.discovery.explorerLevel} colors={themeColors} />
                  <StatItem label="Total Unique" value={stats.unique} colors={themeColors} />
                  <StatItem label="% New Content" value={`${stats.discovery.percentNew}%`} colors={themeColors} />
                  <StatItem label="Label" value={stats.discovery.explorerLevel} colors={themeColors} />
                </ExpandableStatGroup>

                <ExpandableStatGroup
                  title="Time Patterns"
                  icon={Hourglass}
                  colorClass="bg-emerald-500/10 text-emerald-500"
                  preview={`Gap: ${stats.timePatterns.avgGap} Days`}
                  expanded={!!expandedSections.timePatterns}
                  onToggle={() => toggleSection('timePatterns')}
                  colors={themeColors}
                >
                  <StatItem label="Avg Gap" value={`${stats.timePatterns.avgGap} Days`} colors={themeColors} />
                  <StatItem label="Fastest Re-watch" value={`${stats.timePatterns.fastestRewatch} Days`} colors={themeColors} />
                  <StatItem label="Active Period" value={stats.habits.preferredTime} colors={themeColors} />
                  <StatItem label="Label" value={stats.timePatterns.avgGap < 3 ? 'Frequent' : 'Selective'} colors={themeColors} />
                </ExpandableStatGroup>

                <ExpandableStatGroup
                  title="Mood & Balance"
                  icon={Activity}
                  colorClass="bg-[#8b5cf6]/10 text-[#8b5cf6]"
                  preview={`Balance: ${stats.balance.balanceScore}%`}
                  expanded={!!expandedSections.balance}
                  onToggle={() => toggleSection('balance')}
                  colors={themeColors}
                >
                  <StatItem label="Top Category" value={stats.categoryInsights.favoriteCategory} colors={themeColors} />
                  <StatItem label="Diversity Count" value={stats.categoryInsights.diversityScore} colors={themeColors} />
                  <StatItem label="Balance Score" value={`${stats.balance.balanceScore}%`} colors={themeColors} />
                  <StatItem label="Label" value={stats.balance.balanceScore > 70 ? 'Eclectic' : 'Focussed'} colors={themeColors} />
                </ExpandableStatGroup>

                <ExpandableStatGroup
                  title="Director Spotlight"
                  icon={Video}
                  colorClass="bg-orange-600/10 text-orange-600"
                  preview={stats.directorSpotlight.mostWatchedDirector}
                  expanded={!!expandedSections.directorSpotlight}
                  onToggle={() => toggleSection('directorSpotlight')}
                  colors={themeColors}
                >
                  <StatItem label="Most Watched" value={stats.directorSpotlight.mostWatchedDirector} colors={themeColors} />
                  <StatItem label="Unique Directors" value={stats.directorSpotlight.uniqueDirectors} colors={themeColors} />
                  <StatItem label="Variety Score" value={`${stats.directorSpotlight.varietyScore}%`} colors={themeColors} />
                  <StatItem label="Status" value={stats.directorSpotlight.uniqueDirectors > 20 ? 'Cinephile' : 'Explorer'} colors={themeColors} />
                </ExpandableStatGroup>

                <ExpandableStatGroup
                  title="Release Era Explorer"
                  icon={History}
                  colorClass="bg-red-500/10 text-red-500"
                  preview={stats.releaseEra.mostWatchedDecade}
                  expanded={!!expandedSections.releaseEra}
                  onToggle={() => toggleSection('releaseEra')}
                  colors={themeColors}
                >
                  <StatItem label="Favorite Decade" value={stats.releaseEra.mostWatchedDecade} colors={themeColors} />
                  <StatItem label="Classic Ratio" value={`${stats.releaseEra.ratio}%`} colors={themeColors} />
                  <StatItem label="Era Diversity" value={stats.releaseEra.eraPreferenceScore} colors={themeColors} />
                  <StatItem label="Preference" value={stats.releaseEra.ratio > 60 ? 'Retro Lover' : 'Modern Fan'} colors={themeColors} />
                </ExpandableStatGroup>

                <ExpandableStatGroup
                  title="Thematic Deep Dives"
                  icon={Layers}
                  colorClass="bg-blue-600/10 text-blue-600"
                  preview={`${stats.themeDeepDive.customThemesCount} Themes`}
                  expanded={!!expandedSections.themeDeepDive}
                  onToggle={() => toggleSection('themeDeepDive')}
                  colors={themeColors}
                >
                  <StatItem label="Custom Themes" value={stats.themeDeepDive.customThemesCount} colors={themeColors} />
                  <StatItem label="Completion %" value={`${stats.themeDeepDive.completionRate}%`} colors={themeColors} />
                  <StatItem label="Marathon Depth" value={stats.themeDeepDive.themedMarathonDays} colors={themeColors} />
                  <StatItem label="Focus" value={stats.themeDeepDive.completionRate > 50 ? 'Specialist' : 'Generalist'} colors={themeColors} />
                </ExpandableStatGroup>

                <ExpandableStatGroup
                  title="Ending Preferences"
                  icon={Smile}
                  colorClass="bg-green-600/10 text-green-600"
                  preview={`${stats.endingPreference.happyRatio}% Happy`}
                  expanded={!!expandedSections.endingPreference}
                  onToggle={() => toggleSection('endingPreference')}
                  colors={themeColors}
                >
                  <StatItem label="Happy Ratio" value={`${stats.endingPreference.happyRatio}%`} colors={themeColors} />
                  <StatItem label="Plot Twists" value={`${stats.endingPreference.plotTwistPercent}%`} colors={themeColors} />
                  <StatItem label="Ending Depth" value={stats.endingPreference.styleScore} colors={themeColors} />
                  <StatItem label="Preferred Mood" value={stats.endingPreference.happyRatio > 50 ? 'Optimist' : 'Realist'} colors={themeColors} />
                </ExpandableStatGroup>
              </div>

              {/* Badges Section */}
              <div className="space-y-4">
                <div 
                  className="flex justify-between items-center px-4 cursor-pointer"
                  onClick={() => toggleSection('badges')}
                >
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Badges</h3>
                  <ChevronRight size={16} className={cn("text-gray-400 transition-transform", expandedSections.badges && "rotate-90")} />
                </div>
                <AnimatePresence>
                  {expandedSections.badges && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-4 gap-3 px-1">
                        {BADGES.map((badge) => (
                          <BadgeCard 
                            key={badge.id}
                            badge={badge} 
                            earned={stats.total >= badge.requirement} 
                            isDark={isDark}
                            colors={themeColors}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8 pb-20"
            >
              {/* 1. Appearance Section */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-4 mb-2">Appearance</h3>
                <div className="rounded-3xl overflow-hidden border" style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }}>
                  <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: themeColors.border }}>
                    <div className="flex items-center gap-3">
                      <Moon size={18} style={{ color: themeColors.accent }} />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">Follow System</span>
                        <span className="text-[10px] text-gray-400">Sync with OS theme</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSettings(s => ({ ...s, followSystemTheme: !s.followSystemTheme }))}
                      className={cn(
                        "w-10 h-5 rounded-full transition-all relative",
                        settings.followSystemTheme ? "bg-blue-500" : "bg-gray-300"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                        settings.followSystemTheme ? "left-6" : "left-1"
                      )} />
                    </button>
                  </div>

                  {!settings.followSystemTheme && (
                    <div className="px-6 py-4 border-b" style={{ borderColor: themeColors.border }}>
                      <div className="flex bg-gray-100/50 p-1 rounded-xl mb-4" style={{ backgroundColor: isDark ? '#1c1c1e' : '#f2f2f7' }}>
                        {THEME_CATEGORIES.map(cat => (
                          <button
                            key={cat.id}
                            onClick={() => setSettings(s => ({ ...s, themeCategory: cat.id }))}
                            className={cn(
                              "flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                              settings.themeCategory === cat.id ? "bg-white shadow-sm text-black" : "text-gray-400"
                            )}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {THEMES_DATA[settings.themeCategory as keyof typeof THEMES_DATA].map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setSettings(s => ({ ...s, theme: t.id as any }))}
                            className={cn(
                              "flex flex-col items-center p-2 rounded-xl border relative transition-all",
                              settings.theme === t.id ? "ring-2 ring-blue-500 border-transparent" : "border-transparent"
                            )}
                          >
                            <div className={cn("w-6 h-6 rounded-full border border-black/5", t.color)} />
                            <span className="text-[8px] font-bold mt-1 uppercase tracking-tighter truncate w-full text-center">{t.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Sparkles size={18} style={{ color: '#a78bfa' }} />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">Dark Mode Style</span>
                        <span className="text-[10px] text-gray-400">Choose your dark tint</span>
                      </div>
                    </div>
                    <div className="flex bg-gray-100/50 p-1 rounded-xl" style={{ backgroundColor: isDark ? '#1c1c1e' : '#f2f2f7' }}>
                      {(['purple', 'blue'] as const).map(style => (
                        <button
                          key={style}
                          onClick={() => setSettings(s => ({ ...s, darkModeStyle: style }))}
                          className={cn(
                            "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                            settings.darkModeStyle === style ? "bg-white shadow-sm text-black" : "text-gray-400"
                          )}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Display Section */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-4 mb-2">Display</h3>
                <div className="rounded-3xl overflow-hidden border" style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }}>
                  <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: themeColors.border }}>
                    <div className="flex items-center gap-3">
                      <LayoutGrid size={18} style={{ color: '#f59e0b' }} />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">Default Layout</span>
                        <span className="text-[10px] text-gray-400">Apply Grid or List on start</span>
                      </div>
                    </div>
                    <div className="flex bg-gray-100/50 p-1 rounded-xl" style={{ backgroundColor: isDark ? '#1c1c1e' : '#f2f2f7' }}>
                      {(['grid', 'list'] as const).map(l => (
                        <button
                          key={l}
                          onClick={() => setSettings(s => ({ ...s, defaultLayout: l, layout: l }))}
                          className={cn(
                            "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                            settings.defaultLayout === l ? "bg-white shadow-sm text-black" : "text-gray-400"
                          )}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: themeColors.border }}>
                    <div className="flex items-center gap-3">
                      <Plus size={18} style={{ color: '#ec4899' }} />
                      <span className="text-sm font-semibold">Custom Font</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {settings.customFont && (
                        <button 
                          onClick={resetFont}
                          className="px-3 py-1 bg-red-500 text-white rounded-full text-[10px] uppercase font-bold"
                        >
                          Reset
                        </button>
                      )}
                      <label className="px-4 py-1.5 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-gray-800 transition-colors">
                        Upload
                        <input type="file" accept=".ttf,.otf,.woff,.woff2" onChange={handleFontUpload} className="hidden" />
                      </label>
                    </div>
                  </div>

                  <div className="px-6 py-4">
                    <LayoutPicker 
                      current={settings.layout} 
                      onSelect={(l) => setSettings(s => ({ ...s, layout: l }))}
                      theme={syncedTheme}
                      visibleLayouts={settings.visibleLayouts}
                    />
                  </div>
                </div>
              </div>

              {/* 3. Experience Section */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-4 mb-2">Experience</h3>
                <div className="rounded-3xl overflow-hidden border" style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }}>
                  <button 
                    onClick={() => setSettings(s => ({ ...s, ambientMotion: !s.ambientMotion }))}
                    className="w-full px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: themeColors.border }}
                  >
                    <div className="flex items-center gap-3">
                      <Activity size={18} className="text-green-500" />
                      <span className="text-sm font-semibold">Ambient Motion</span>
                    </div>
                    <div className={cn("w-10 h-5 rounded-full relative", settings.ambientMotion ? "bg-green-500" : "bg-gray-300")}>
                      <div className={cn("absolute top-1 w-3 h-3 rounded-full bg-white transition-all", settings.ambientMotion ? "left-6" : "left-1")} />
                    </div>
                  </button>

                  <button 
                    onClick={() => setSettings(s => ({ ...s, performanceMode: !s.performanceMode }))}
                    className="w-full px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: themeColors.border }}
                  >
                    <div className="flex items-center gap-3">
                      <Zap size={18} className="text-orange-500" />
                      <span className="text-sm font-semibold">Performance Mode</span>
                    </div>
                    <div className={cn("w-10 h-5 rounded-full relative", settings.performanceMode ? "bg-orange-500" : "bg-gray-300")}>
                      <div className={cn("absolute top-1 w-3 h-3 rounded-full bg-white transition-all", settings.performanceMode ? "left-6" : "left-1")} />
                    </div>
                  </button>

                  <button 
                    onClick={() => setSettings(s => ({ ...s, focusMode: !s.focusMode }))}
                    className="w-full px-6 py-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <MonitorPlay size={18} className="text-blue-500" />
                      <span className="text-sm font-semibold">Focus Mode</span>
                    </div>
                    <div className={cn("w-10 h-5 rounded-full relative", settings.focusMode ? "bg-blue-500" : "bg-gray-300")}>
                      <div className={cn("absolute top-1 w-3 h-3 rounded-full bg-white transition-all", settings.focusMode ? "left-6" : "left-1")} />
                    </div>
                  </button>
                </div>
              </div>

              {/* 4. Navigation Section */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-4 mb-2">Navigation</h3>
                <div className="rounded-3xl overflow-hidden border" style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }}>
                  <button 
                    onClick={() => setSettings(s => ({ ...s, showBottomMenu: !s.showBottomMenu }))}
                    className="w-full px-6 py-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <LayoutGrid size={18} className="text-indigo-500" />
                      <span className="text-sm font-semibold">Sticky Bottom Menu</span>
                    </div>
                    <div className={cn("w-10 h-5 rounded-full relative", settings.showBottomMenu ? "bg-indigo-500" : "bg-gray-300")}>
                      <div className={cn("absolute top-1 w-3 h-3 rounded-full bg-white transition-all", settings.showBottomMenu ? "left-6" : "left-1")} />
                    </div>
                  </button>
                </div>
              </div>

              {/* 5. Data & Support Section */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-4 mb-2">Data & System</h3>
                <div className="rounded-3xl overflow-hidden border" style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }}>
                  <button onClick={refreshApp} className="w-full px-6 py-4 flex items-center gap-3 border-b" style={{ borderColor: themeColors.border }}>
                    <RefreshCw size={18} className="text-gray-400" />
                    <span className="text-sm font-semibold">Refresh App State</span>
                  </button>
                  <button onClick={exportData} className="w-full px-6 py-4 flex items-center gap-3 border-b" style={{ borderColor: themeColors.border }}>
                    <Download size={18} className="text-gray-400" />
                    <span className="text-sm font-semibold">Backup All Data</span>
                  </button>
                  <label className="w-full px-6 py-4 flex items-center gap-3 border-b cursor-pointer" style={{ borderColor: themeColors.border }}>
                    <Upload size={18} className="text-gray-400" />
                    <span className="text-sm font-semibold">Restore from Backup</span>
                    <input type="file" accept=".json" onChange={importData} className="hidden" />
                  </label>
                  <button onClick={clearCache} className="w-full px-6 py-4 flex items-center gap-3 text-red-500">
                    <Trash2 size={18} />
                    <span className="text-sm font-semibold">Factory Reset (Wipe Everything)</span>
                  </button>
                </div>
              </div>

              {/* 6. Advanced Section */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-4 mb-2">Advanced</h3>
                <div className="rounded-3xl overflow-hidden border" style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }}>
                  <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: themeColors.border }}>
                    <div className="flex items-center gap-3">
                      <Cpu size={18} className="text-gray-400" />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">Service Worker Tools</span>
                        <span className="text-[10px] text-gray-400">Current Status: </span>
                      </div>
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                      swStatus === 'Active' ? "bg-green-500/10 text-green-500" :
                      swStatus === 'None' ? "bg-gray-500/10 text-gray-400" :
                      "bg-blue-500/10 text-blue-500"
                    )}>
                      {swStatus}
                    </span>
                  </div>

                  <button onClick={unregisterServiceWorker} className="w-full px-6 py-4 flex items-center gap-3 border-b text-left" style={{ borderColor: themeColors.border }}>
                    <Slash size={18} className="text-gray-400" />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">Unregister Service Workers</span>
                      <span className="text-[10px] text-gray-400">Fix PWA update issues</span>
                    </div>
                  </button>

                  <button onClick={clearCacheStorage} className="w-full px-6 py-4 flex items-center gap-3 border-b text-left" style={{ borderColor: themeColors.border }}>
                    <Trash2 size={18} className="text-gray-400" />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">Clear Cache Storage</span>
                      <span className="text-[10px] text-gray-400">Wipe stored assets and offline data</span>
                    </div>
                  </button>

                  <button onClick={clearIndexedDBData} className="w-full px-6 py-4 flex items-center gap-3 border-b text-left" style={{ borderColor: themeColors.border }}>
                    <Terminal size={18} className="text-gray-400" />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">Clear IndexedDB</span>
                      <span className="text-[10px] text-gray-400">Flush internal app databases</span>
                    </div>
                  </button>

                  <button onClick={() => window.location.reload()} className="w-full px-6 py-4 flex items-center gap-3 border-b text-left" style={{ borderColor: themeColors.border }}>
                    <RefreshCw size={18} className="text-gray-400" />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">Hard Reload App</span>
                      <span className="text-[10px] text-gray-400">Force browser to fetch fresh code</span>
                    </div>
                  </button>

                  <button onClick={fullAppReset} className="w-full px-6 py-4 flex items-center gap-3 text-red-500 text-left">
                    <ShieldAlert size={18} />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">Full System Reset</span>
                      <span className="text-[10px] text-red-400/80">Keep user data, wipe system state</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-4 text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">CineLog AI v2.0 • Purely Offline</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Add Movie Modal */}
      <AnimatePresence>
        {isAdding && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetForm}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[120]"
            />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={cn(
                  "fixed bottom-0 left-0 right-0 rounded-t-[3rem] z-[120] px-8 pt-10 pb-12 shadow-2xl max-w-md mx-auto overflow-hidden",
                  syncedTheme === 'glass' ? "glass-card" : ""
                )}
                style={{ 
                  backgroundColor: themeColors.card,
                  color: themeColors.text,
                  boxShadow: `0 -10px 40px ${isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)'}`
                }}
              >
              <AnimatePresence mode="wait">
                {!showSuccess ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex flex-col">
                        <h2 className="text-2xl font-black tracking-tight">{editingMovie ? 'Edit Movie' : 'New Entry'}</h2>
                        {isAutoFilling && (
                          <motion.span 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            className="text-[10px] font-black uppercase tracking-widest text-blue-500 flex items-center gap-1"
                          >
                            <Sparkles size={10} /> Smart Suggesting...
                          </motion.span>
                        )}
                      </div>
                      <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={resetForm} 
                        className={cn(
                          "p-2 rounded-full transition-colors",
                          syncedTheme === 'dark' ? "bg-gray-700 text-white" : "bg-gray-50 text-black"
                        )}
                      >
                        <X size={20} />
                      </motion.button>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto no-scrollbar space-y-6 pr-1 -mr-1">
                      {error && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "px-4 py-3 rounded-xl text-xs font-bold text-center",
                            syncedTheme === 'dark' ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-500"
                          )}
                        >
                          {error}
                        </motion.div>
                      )}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Movie Title</label>
                        <input
                          autoFocus
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Inception"
                          className={cn(
                            "w-full border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-black transition-all",
                            syncedTheme === 'dark' ? "bg-gray-700 text-white placeholder:text-gray-500" : "bg-gray-50 text-black"
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Director</label>
                          <input
                            type="text"
                            value={director}
                            onChange={(e) => setDirector(e.target.value)}
                            placeholder="Christopher Nolan"
                            className={cn(
                              "w-full border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-black transition-all",
                              syncedTheme === 'dark' ? "bg-gray-700 text-white placeholder:text-gray-500" : "bg-gray-50 text-black"
                            )}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Release Year</label>
                          <input
                            type="number"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            placeholder="2010"
                            className={cn(
                              "w-full border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-black transition-all",
                              syncedTheme === 'dark' ? "bg-gray-700 text-white placeholder:text-gray-500" : "bg-gray-50 text-black"
                            )}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 relative">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Actors</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {actors.map(a => (
                            <span key={a} className="bg-orange-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1">
                              {a}
                              <X size={10} className="cursor-pointer" onClick={() => setActors(actors.filter(x => x !== a))} />
                            </span>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={actorInput}
                          onChange={(e) => setActorInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ',') {
                              e.preventDefault();
                              const val = actorInput.trim().replace(/,$/, '');
                              if (val && !actors.includes(val)) {
                                setActors([...actors, val]);
                                setActorInput('');
                              }
                            }
                          }}
                          placeholder="Add actor (Enter or comma)"
                          className={cn(
                            "w-full border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-black transition-all",
                            syncedTheme === 'dark' ? "bg-gray-700 text-white placeholder:text-gray-500" : "bg-gray-50 text-black"
                          )}
                        />
                        <AnimatePresence>
                          {filteredActors.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className={cn(
                                "absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-xl z-[60] overflow-hidden border",
                                syncedTheme === 'dark' ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
                              )}
                            >
                              {filteredActors.map((suggestion) => (
                                <button
                                  key={suggestion}
                                  onClick={() => {
                                    if (!actors.includes(suggestion)) {
                                      setActors([...actors, suggestion]);
                                    }
                                    setActorInput('');
                                  }}
                                  className={cn(
                                    "w-full px-5 py-3 text-left text-sm font-medium transition-colors hover:bg-gray-50",
                                    syncedTheme === 'dark' ? "hover:bg-gray-700 text-white" : "hover:bg-gray-50 text-black"
                                  )}
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Ending & Style</label>
                        <div className="flex flex-col gap-3">
                          <div className={cn(
                            "flex p-1 rounded-2xl",
                            syncedTheme === 'dark' ? "bg-gray-700" : "bg-gray-100"
                          )}>
                            {(['happy', 'sad', 'bittersweet'] as const).map(style => (
                              <button
                                key={style}
                                onClick={() => setEndingStyle(style)}
                                className={cn(
                                  "flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all",
                                  endingStyle === style 
                                    ? (syncedTheme === 'dark' ? "bg-white text-black shadow-lg" : "bg-black text-white shadow-lg")
                                    : "text-gray-400"
                                )}
                              >
                                {style}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => setPlotTwist(!plotTwist)}
                            className={cn(
                              "flex items-center justify-between px-5 py-4 rounded-2xl transition-all",
                              plotTwist 
                                ? "bg-purple-500/10 text-purple-600 border border-purple-500/20" 
                                : (syncedTheme === 'dark' ? "bg-gray-700 text-gray-400" : "bg-gray-50 text-gray-400")
                            )}
                          >
                            <span className="text-xs font-bold uppercase tracking-widest">Plot Twist?</span>
                            <div className={cn(
                              "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                              plotTwist ? "border-purple-500 bg-purple-500 text-white" : "border-gray-300"
                            )}>
                              {plotTwist && <Check size={10} />}
                            </div>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Thematic Tags</label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {themes.map(t => (
                              <span key={t} className="bg-blue-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1">
                                {t}
                                <X size={10} className="cursor-pointer" onClick={() => setThemes(themes.filter(x => x !== t))} />
                              </span>
                            ))}
                          </div>
                          <input
                            type="text"
                            value={themeInput}
                            onChange={(e) => setThemeInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ',') {
                                e.preventDefault();
                                const val = themeInput.trim().replace(/,$/, '');
                                if (val && !themes.includes(val)) {
                                  setThemes([...themes, val]);
                                  setThemeInput('');
                                }
                              }
                            }}
                            placeholder="Add theme tag (e.g. Space, Nature)"
                            className={cn(
                              "w-full border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-black transition-all mb-4",
                              syncedTheme === 'dark' ? "bg-gray-700 text-white placeholder:text-gray-500" : "bg-gray-50 text-black"
                            )}
                          />

                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Tags (Generic)</label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {tags.map(t => (
                              <span key={t} className="bg-indigo-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1">
                                {t}
                                <X size={10} className="cursor-pointer" onClick={() => setTags(tags.filter(x => x !== t))} />
                              </span>
                            ))}
                          </div>
                          <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ',') {
                                e.preventDefault();
                                const val = tagInput.trim().replace(/,$/, '');
                                if (val && !tags.includes(val)) {
                                  setTags([...tags, val]);
                                  setTagInput('');
                                }
                              }
                            }}
                            placeholder="Add generic tag"
                            className={cn(
                              "w-full border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-black transition-all",
                              syncedTheme === 'dark' ? "bg-gray-700 text-white placeholder:text-gray-500" : "bg-gray-50 text-black"
                            )}
                          />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Categories</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {categories.map(cat => (
                            <span key={cat} className={cn(
                              "px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1",
                              syncedTheme === 'dark' ? "bg-gray-700 text-white" : "bg-black text-white"
                            )}>
                              {cat}
                              <X size={10} className="cursor-pointer" onClick={() => setCategories(categories.filter(x => x !== cat))} />
                            </span>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {settings.customCategories.filter(cat => !categories.includes(cat)).map(cat => (
                            <button
                              key={cat}
                              onClick={() => setCategories([...categories, cat])}
                              className={cn(
                                "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                                syncedTheme === 'dark' ? "bg-gray-700 text-gray-400 border-gray-600" : "bg-gray-50 text-gray-400 border-gray-100"
                              )}
                            >
                              {cat}
                            </button>
                          ))}
                          <button
                            onClick={() => {
                              const newCat = prompt("Enter new category:");
                              if (newCat && !settings.customCategories.includes(newCat)) {
                                setSettings(s => ({ ...s, customCategories: [...s.customCategories, newCat] }));
                                setCategories([...categories, newCat]);
                              }
                            }}
                            className={cn(
                              "px-4 py-2 rounded-xl text-xs font-bold transition-all border border-dashed",
                              syncedTheme === 'dark' ? "border-gray-600 text-gray-400" : "border-gray-200 text-gray-400"
                            )}
                          >
                            + New
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Watch Date</label>
                        <div className="relative">
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowCalendar(!showCalendar)}
                            className={cn(
                              "w-full border-none rounded-2xl px-5 py-4 text-sm font-medium flex items-center justify-between",
                              syncedTheme === 'dark' ? "bg-gray-700 text-white" : "bg-gray-50 text-black"
                            )}
                          >
                            <span>{format(selectedDate, 'MMMM d, yyyy')}</span>
                            <Calendar size={18} className="text-gray-400" />
                          </motion.button>
                          
                          <AnimatePresence>
                            {showCalendar && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="absolute bottom-full mb-4 left-0 right-0 z-50"
                              >
                                <CalendarPicker 
                                  value={selectedDate} 
                                  onChange={setSelectedDate} 
                                  onClose={() => setShowCalendar(false)} 
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            if (editingWatchlistItem) {
                              handleAddToWatchlist();
                            } else {
                              handleAddMovie(false);
                            }
                          }}
                          disabled={!name.trim()}
                          className={cn(
                            "py-4 rounded-2xl font-bold text-sm shadow-xl transition-all disabled:opacity-50 border",
                            syncedTheme === 'dark' ? "bg-white text-black border-white shadow-white/5" : "bg-black text-white border-black shadow-black/10"
                          )}
                        >
                          {editingMovie || editingWatchlistItem ? 'Save Changes' : 'Add to Log'}
                        </motion.button>
                        {!editingMovie && !editingWatch && !editingWatchlistItem && (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleAddToWatchlist}
                            disabled={!name.trim()}
                            className={cn(
                              "py-4 rounded-2xl font-bold text-sm transition-all disabled:opacity-50 border",
                              syncedTheme === 'dark' ? "bg-gray-800 text-white border-gray-700" : "bg-gray-100 text-black border-transparent"
                            )}
                          >
                            Add to Watchlist
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="flex flex-col items-center text-center py-6 space-y-6"
                  >
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 12 }}
                      className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center text-4xl"
                    >
                      {MOOD_EMOJIS[Math.floor(Math.random() * MOOD_EMOJIS.length)]}
                    </motion.div>
                    
                    <div className="space-y-2">
                      <h2 className="text-2xl font-black">{successMessage}</h2>
                      <div className="flex items-center justify-center gap-3">
                        <motion.span 
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          className={cn(
                            "font-bold text-sm",
                            syncedTheme === 'dark' ? "text-blue-400" : "text-purple-600"
                          )}
                        >
                          +{lastXpEarned} XP
                        </motion.span>
                        {stats.streak > 1 && (
                          <motion.span 
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-orange-600 font-bold text-sm flex items-center gap-1"
                          >
                            <Flame size={14} fill="currentColor" />
                            {stats.streak} day streak
                          </motion.span>
                        )}
                      </div>
                    </div>

                    {funFact && (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-gray-400 text-xs italic px-4"
                      >
                        {funFact}
                      </motion.p>
                    )}

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={resetForm}
                      className={cn(
                        "w-full rounded-2xl py-4 font-bold text-sm transition-all",
                        syncedTheme === 'dark' ? "bg-gray-800 text-white hover:bg-gray-700" : "bg-gray-100 text-black"
                      )}
                    >
                      Awesome
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Quick Rewatch Feedback Toast */}
      <AnimatePresence>
        {showSuccess && !isAdding && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-28 left-6 right-6 z-[110] pointer-events-none"
          >
            <div className="bg-black text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center justify-between max-w-md mx-auto">
              <div className="flex items-center gap-3">
                <div className="text-xl">🍿</div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold">{successMessage}</span>
                  <span className="text-[10px] opacity-60">+{lastXpEarned} XP earned</span>
                </div>
              </div>
              {stats.streak > 1 && (
                <div className="flex items-center gap-1 text-orange-400 font-bold text-xs">
                  <Flame size={14} fill="currentColor" />
                  {stats.streak}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <AnimatePresence>
        {settings.showBottomMenu && (
          <motion.nav 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 px-8 py-4 pb-8 safe-bottom z-[100] flex items-center justify-between max-w-md mx-auto border-t transition-all pointer-events-auto backdrop-blur-xl"
            style={{ 
              backgroundColor: `${themeColors.bg}CC`,
              borderColor: themeColors.border,
              color: themeColors.text
            }}
          >
            <motion.button 
              whileTap={{ scale: 0.8 }}
              onClick={() => setActiveTab('list')}
              className={cn(
                "p-2 transition-all", 
                activeTab === 'list' 
                  ? "scale-110" 
                  : "text-gray-400"
              )}
              style={{ color: activeTab === 'list' ? themeColors.accent : undefined }}
            >
              <List size={24} />
            </motion.button>
            
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsAdding(true)}
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all -mt-10 border-4",
                isDark ? "shadow-white/5" : "shadow-black/10"
              )}
              style={{ 
                backgroundColor: themeColors.text, 
                color: themeColors.bg,
                borderColor: themeColors.bg
              }}
            >
              <Plus size={28} />
            </motion.button>
    
            <div className="flex gap-8">
              <motion.button 
                whileTap={{ scale: 0.8 }}
                onClick={() => setActiveTab('stats')}
                className={cn(
                  "p-2 transition-all", 
                  activeTab === 'stats' 
                    ? "scale-110" 
                    : "text-gray-400"
                )}
                style={{ color: activeTab === 'stats' ? themeColors.accent : undefined }}
              >
                <Trophy size={24} />
              </motion.button>
              <motion.button 
                whileTap={{ scale: 0.8 }}
                onClick={() => setActiveTab('settings')}
                className={cn(
                  "p-2 transition-all", 
                  activeTab === 'settings' 
                    ? "scale-110" 
                    : "text-gray-400"
                )}
                style={{ color: activeTab === 'settings' ? themeColors.accent : undefined }}
              >
                <SettingsIcon size={24} />
              </motion.button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}
