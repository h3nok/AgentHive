/**
 * Performance optimization configuration for enterprise-grade chat UI
 */

// React performance constants
export const PERFORMANCE_CONFIG = {
  // Virtual scrolling thresholds
  VIRTUAL_SCROLL_THRESHOLD: 100,
  
  // Debounce timings (ms)
  SEARCH_DEBOUNCE: 300,
  INPUT_DEBOUNCE: 150,
  RESIZE_DEBOUNCE: 250,
  
  // Animation durations (ms)
  QUICK_ANIMATION: 150,
  STANDARD_ANIMATION: 300,
  SLOW_ANIMATION: 500,
  
  // Memory management
  MAX_CACHED_MESSAGES: 1000,
  MAX_RECENT_QUERIES: 10,
  CLEANUP_INTERVAL: 300000, // 5 minutes
  
  // Intersection Observer options
  INTERSECTION_OPTIONS: {
    rootMargin: '50px',
    threshold: 0.1,
  },
  
  // Image lazy loading
  IMAGE_LAZY_LOADING_THRESHOLD: 200,
  
  // Component memoization keys
  MEMO_KEYS: {
    MESSAGE: ['id', 'text', 'isStreaming', 'timestamp'],
    AGENT: ['id', 'name', 'color'],
    SESSION: ['id', 'title', 'updatedAt'],
  },
} as const;

// Performance monitoring flags
export const PERFORMANCE_MONITORING = {
  ENABLE_RENDER_PROFILING: process.env.NODE_ENV === 'development',
  ENABLE_MEMORY_MONITORING: process.env.NODE_ENV === 'development',
  ENABLE_INTERACTION_TRACKING: true,
  LOG_SLOW_RENDERS: true,
  SLOW_RENDER_THRESHOLD: 16, // ms (60fps)
} as const;

// Accessibility performance settings
export const A11Y_PERFORMANCE = {
  ANNOUNCE_DEBOUNCE: 500,
  FOCUS_DEBOUNCE: 100,
  LIVE_REGION_UPDATE_LIMIT: 3, // per second
} as const;

// Theme performance optimizations
export const THEME_PERFORMANCE = {
  USE_CSS_VARIABLES: true,
  ENABLE_THEME_CACHING: true,
  PRECOMPUTE_COLORS: true,
} as const;
