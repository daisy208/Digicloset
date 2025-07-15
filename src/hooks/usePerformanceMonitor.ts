import { useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  componentName: string;
  timestamp: number;
}

interface PerformanceStats {
  averageRenderTime: number;
  slowRenders: number;
  totalRenders: number;
  memoryUsage?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private observers: PerformanceObserver[] = [];
  private slowRenderThreshold = 16; // 16ms for 60fps

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    // Observe long tasks
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              console.warn('Long task detected:', {
                duration: entry.duration,
                startTime: entry.startTime,
                name: entry.name
              });
            }
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (error) {
        console.warn('Long task observer not supported');
      }

      // Observe layout shifts
      try {
        const layoutShiftObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if ((entry as any).value > 0.1) {
              console.warn('Layout shift detected:', {
                value: (entry as any).value,
                sources: (entry as any).sources
              });
            }
          }
        });
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(layoutShiftObserver);
      } catch (error) {
        console.warn('Layout shift observer not supported');
      }
    }
  }

  recordRender(componentName: string, renderTime: number) {
    const metric: PerformanceMetrics = {
      componentName,
      renderTime,
      timestamp: Date.now()
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }

    // Log slow renders
    if (renderTime > this.slowRenderThreshold) {
      console.warn(`Slow render detected: ${componentName} took ${renderTime}ms`);
    }
  }

  getStats(componentName?: string): PerformanceStats {
    const relevantMetrics = componentName 
      ? this.metrics.filter(m => m.componentName === componentName)
      : this.metrics;

    if (relevantMetrics.length === 0) {
      return {
        averageRenderTime: 0,
        slowRenders: 0,
        totalRenders: 0
      };
    }

    const totalRenderTime = relevantMetrics.reduce((sum, m) => sum + m.renderTime, 0);
    const slowRenders = relevantMetrics.filter(m => m.renderTime > this.slowRenderThreshold).length;

    return {
      averageRenderTime: totalRenderTime / relevantMetrics.length,
      slowRenders,
      totalRenders: relevantMetrics.length,
      memoryUsage: this.getMemoryUsage()
    };
  }

  private getMemoryUsage(): number | undefined {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return undefined;
  }

  getTopSlowComponents(limit = 10) {
    const componentStats = new Map<string, { total: number; count: number; max: number }>();

    for (const metric of this.metrics) {
      const existing = componentStats.get(metric.componentName) || { total: 0, count: 0, max: 0 };
      existing.total += metric.renderTime;
      existing.count += 1;
      existing.max = Math.max(existing.max, metric.renderTime);
      componentStats.set(metric.componentName, existing);
    }

    return Array.from(componentStats.entries())
      .map(([name, stats]) => ({
        componentName: name,
        averageRenderTime: stats.total / stats.count,
        maxRenderTime: stats.max,
        renderCount: stats.count
      }))
      .sort((a, b) => b.averageRenderTime - a.averageRenderTime)
      .slice(0, limit);
  }

  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics = [];
  }
}

const performanceMonitor = new PerformanceMonitor();

// Hook for monitoring component render performance
export function usePerformanceMonitor(componentName: string) {
  const renderStartTime = useRef<number>(0);
  const [stats, setStats] = useState<PerformanceStats>({
    averageRenderTime: 0,
    slowRenders: 0,
    totalRenders: 0
  });

  useEffect(() => {
    renderStartTime.current = performance.now();
  });

  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    performanceMonitor.recordRender(componentName, renderTime);
    
    // Update stats
    setStats(performanceMonitor.getStats(componentName));
  });

  return {
    stats,
    globalStats: performanceMonitor.getStats(),
    topSlowComponents: performanceMonitor.getTopSlowComponents()
  };
}

// HOC for automatic performance monitoring
export function withPerformanceMonitor<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  return React.forwardRef<any, P>((props, ref) => {
    const name = componentName || Component.displayName || Component.name || 'Unknown';
    const { stats } = usePerformanceMonitor(name);

    // Show performance warning in development
    useEffect(() => {
      if (process.env.NODE_ENV === 'development' && stats.averageRenderTime > 16) {
        console.warn(`Performance warning: ${name} average render time is ${stats.averageRenderTime.toFixed(2)}ms`);
      }
    }, [stats.averageRenderTime, name]);

    return <Component {...props} ref={ref} />;
  });
}

// Hook for measuring custom operations
export function useOperationTimer() {
  const timers = useRef<Map<string, number>>(new Map());

  const startTimer = (operationName: string) => {
    timers.current.set(operationName, performance.now());
  };

  const endTimer = (operationName: string): number => {
    const startTime = timers.current.get(operationName);
    if (!startTime) {
      console.warn(`Timer for operation "${operationName}" was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    timers.current.delete(operationName);

    // Log slow operations
    if (duration > 100) {
      console.warn(`Slow operation detected: ${operationName} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  };

  const measureAsync = async <T>(operationName: string, operation: () => Promise<T>): Promise<T> => {
    startTimer(operationName);
    try {
      const result = await operation();
      endTimer(operationName);
      return result;
    } catch (error) {
      endTimer(operationName);
      throw error;
    }
  };

  return { startTimer, endTimer, measureAsync };
}

// Hook for monitoring memory usage
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<{
    used: number;
    total: number;
    limit: number;
  } | null>(null);

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMemoryInfo({
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit
        });
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
}

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    performanceMonitor.cleanup();
  });
}

export default performanceMonitor;