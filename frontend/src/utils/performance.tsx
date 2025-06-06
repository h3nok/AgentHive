import React from 'react';

// Performance monitoring and optimization utilities

interface PerformanceMetrics {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface VitalMetrics {
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
}

interface MemoryInfo {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
}

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private vitals: VitalMetrics = {};
  private observers: PerformanceObserver[] = [];
  private isEnabled: boolean;

  constructor(enableInProduction = false) {
    this.isEnabled = process.env.NODE_ENV === 'development' || enableInProduction;
    if (this.isEnabled) {
      this.initializeObservers();
      this.trackVitals();
    }
  }

  // Start timing a performance metric
  startTiming(name: string, metadata?: Record<string, any>): string {
    if (!this.isEnabled) return '';

    const id = `${name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const metric: PerformanceMetrics = {
      id,
      name,
      startTime: performance.now(),
      metadata,
    };

    this.metrics.set(id, metric);
    
    // Also use Performance API mark
    if (performance.mark) {
      performance.mark(`${name}-start`);
    }

    return id;
  }

  // End timing a performance metric
  endTiming(id: string): PerformanceMetrics | null {
    if (!this.isEnabled || !id) return null;

    const metric = this.metrics.get(id);
    if (!metric) return null;

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    // Use Performance API measure
    if (performance.measure && performance.mark) {
      try {
        performance.mark(`${metric.name}-end`);
        performance.measure(metric.name, `${metric.name}-start`, `${metric.name}-end`);
      } catch (e) {
        console.warn('Performance measure failed:', e);
      }
    }

    this.logMetric(metric);
    return metric;
  }

  // Measure a function execution time
  measureFunction<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    if (!this.isEnabled) return fn();

    const id = this.startTiming(name, metadata);
    try {
      const result = fn();
      this.endTiming(id);
      return result;
    } catch (error) {
      this.endTiming(id);
      throw error;
    }
  }

  // Measure async function execution time
  async measureAsync<T>(
    name: string, 
    fn: () => Promise<T>, 
    metadata?: Record<string, any>
  ): Promise<T> {
    if (!this.isEnabled) return fn();

    const id = this.startTiming(name, metadata);
    try {
      const result = await fn();
      this.endTiming(id);
      return result;
    } catch (error) {
      this.endTiming(id);
      throw error;
    }
  }

  // Get current memory usage
  getMemoryInfo(): MemoryInfo {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };
    }
    return {};
  }

  // Get all metrics
  getAllMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values()).filter(m => m.duration !== undefined);
  }

  // Get metrics by name
  getMetricsByName(name: string): PerformanceMetrics[] {
    return this.getAllMetrics().filter(m => m.name === name);
  }

  // Get performance summary
  getSummary(): {
    totalMetrics: number;
    averageRenderTime: number;
    memoryInfo: MemoryInfo;
    vitals: VitalMetrics;
    slowestOperations: PerformanceMetrics[];
  } {
    const allMetrics = this.getAllMetrics();
    const renderMetrics = allMetrics.filter(m => m.name.includes('render') || m.name.includes('component'));
    
    const averageRenderTime = renderMetrics.length > 0
      ? renderMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / renderMetrics.length
      : 0;

    const slowestOperations = allMetrics
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 10);

    return {
      totalMetrics: allMetrics.length,
      averageRenderTime,
      memoryInfo: this.getMemoryInfo(),
      vitals: this.vitals,
      slowestOperations,
    };
  }

  // Initialize performance observers
  private initializeObservers(): void {
    if (!('PerformanceObserver' in window)) return;

    // Observe navigation timing
    try {
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            this.trackNavigationTiming(entry as PerformanceNavigationTiming);
          }
        });
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);
    } catch (e) {
      console.warn('Navigation observer not supported:', e);
    }

    // Observe resource timing
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'resource') {
            this.trackResourceTiming(entry as PerformanceResourceTiming);
          }
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch (e) {
      console.warn('Resource observer not supported:', e);
    }

    // Observe long tasks
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.duration > 50) { // Tasks longer than 50ms
            console.warn('Long task detected:', {
              name: entry.name,
              duration: entry.duration,
              startTime: entry.startTime,
            });
          }
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    } catch (e) {
      console.warn('Long task observer not supported:', e);
    }
  }

  // Track Core Web Vitals
  private trackVitals(): void {
    // Track LCP (Largest Contentful Paint)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.vitals.LCP = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch (e) {
      console.warn('LCP observer not supported:', e);
    }

    // Track FID (First Input Delay)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.vitals.FID = (entry as any).processingStart - entry.startTime;
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch (e) {
      console.warn('FID observer not supported:', e);
    }

    // Track CLS (Cumulative Layout Shift)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
            this.vitals.CLS = clsValue;
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (e) {
      console.warn('CLS observer not supported:', e);
    }

    // Track FCP (First Contentful Paint)
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.vitals.FCP = entry.startTime;
          }
        });
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(fcpObserver);
    } catch (e) {
      console.warn('FCP observer not supported:', e);
    }
  }

  private trackNavigationTiming(entry: PerformanceNavigationTiming): void {
    this.vitals.TTFB = entry.responseStart - entry.requestStart;
    
    this.logMetric({
      id: 'navigation-timing',
      name: 'Navigation',
      startTime: entry.startTime,
      endTime: entry.loadEventEnd,
      duration: entry.loadEventEnd - entry.startTime,
      metadata: {
        domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
        domComplete: entry.domComplete - entry.navigationStart,
        loadComplete: entry.loadEventEnd - entry.loadEventStart,
        ttfb: entry.responseStart - entry.requestStart,
      }
    });
  }

  private trackResourceTiming(entry: PerformanceResourceTiming): void {
    const duration = entry.responseEnd - entry.startTime;
    
    // Log slow resources (> 1 second)
    if (duration > 1000) {
      console.warn('Slow resource detected:', {
        name: entry.name,
        duration,
        size: entry.transferSize,
        type: this.getResourceType(entry.name),
      });
    }
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
    if (url.includes('.woff') || url.includes('.ttf')) return 'font';
    return 'other';
  }

  private logMetric(metric: PerformanceMetrics): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance Metric:', {
        name: metric.name,
        duration: metric.duration?.toFixed(2) + 'ms',
        metadata: metric.metadata,
      });
    }

    // In production, send to analytics service
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(metric);
    }
  }

  private sendToAnalytics(metric: PerformanceMetrics): void {
    // Send to your analytics service (e.g., Google Analytics, DataDog, etc.)
    try {
      // Example: Send to API endpoint
      // fetch('/api/analytics/performance', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(metric),
      // });
    } catch (e) {
      console.error('Failed to send performance metric:', e);
    }
  }

  // Cleanup
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

// React Hook for performance monitoring
export const usePerformanceMonitor = () => {
  const monitor = React.useMemo(() => new PerformanceMonitor(), []);

  React.useEffect(() => {
    return () => monitor.destroy();
  }, [monitor]);

  return monitor;
};

// HOC for component performance monitoring
export const withPerformanceMonitoring = (
  WrappedComponent: React.ComponentType<any>,
  componentName?: string
) => {
  const ComponentWithPerformanceMonitoring = (props: any) => {
    const monitor = usePerformanceMonitor();
    const name = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component';

    React.useEffect(() => {
      const id = monitor.startTiming(`${name}-mount`);
      return () => monitor.endTiming(id);
    }, [monitor, name]);

    return React.createElement(WrappedComponent, props);
  };

  ComponentWithPerformanceMonitoring.displayName = `withPerformanceMonitoring(${componentName || WrappedComponent.displayName || WrappedComponent.name})`;
  return ComponentWithPerformanceMonitoring;
};

// Debounce utility for performance optimization
export const debounce = (
  func: (...args: any[]) => any,
  wait: number,
  immediate = false
) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: any[]) => {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(null, args);
    };

    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func.apply(null, args);
  };
};

// Throttle utility for performance optimization
export const throttle = (
  func: (...args: any[]) => any,
  limit: number
) => {
  let inThrottle: boolean;
  
  return (...args: any[]) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Lazy loading utility
export const createLazyComponent = (
  importFunc: () => Promise<{ default: React.ComponentType<any> }>,
  fallback?: React.ComponentType
) => {
  const LazyComponent = React.lazy(importFunc);
  
  return (props: any) => (
    <React.Suspense fallback={fallback ? React.createElement(fallback) : <div>Loading...</div>}>
      <LazyComponent {...props} />
    </React.Suspense>
  );
};

// Global performance monitor instance
export const globalPerformanceMonitor = new PerformanceMonitor(true);

// Initialize global monitoring
if (typeof window !== 'undefined') {
  // Track page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      globalPerformanceMonitor.startTiming('page-visible');
    } else {
      globalPerformanceMonitor.endTiming('page-visible');
    }
  });

  // Track window beforeunload
  window.addEventListener('beforeunload', () => {
    const summary = globalPerformanceMonitor.getSummary();
    console.log('Final Performance Summary:', summary);
  });
}

export default PerformanceMonitor; 