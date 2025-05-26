import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  componentName: string;
  timestamp: number;
}

class PerformanceProfiler {
  private metrics: PerformanceMetrics[] = [];
  private isEnabled: boolean = __DEV__;

  startProfiling(componentName: string): () => void {
    if (!this.isEnabled) return () => {};

    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      this.metrics.push({
        renderTime,
        componentName,
        timestamp: Date.now(),
      });

      // Log slow renders (> 16ms for 60fps)
      if (renderTime > 16) {
        console.warn(`[Performance] Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }

      // Keep only last 100 metrics to prevent memory leaks
      if (this.metrics.length > 100) {
        this.metrics = this.metrics.slice(-100);
      }
    };
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getAverageRenderTime(componentName?: string): number {
    const filteredMetrics = componentName 
      ? this.metrics.filter(m => m.componentName === componentName)
      : this.metrics;

    if (filteredMetrics.length === 0) return 0;

    const total = filteredMetrics.reduce((sum, metric) => sum + metric.renderTime, 0);
    return total / filteredMetrics.length;
  }

  getSlowestComponents(limit: number = 5): Array<{ componentName: string; averageTime: number }> {
    const componentTimes = new Map<string, number[]>();

    this.metrics.forEach(metric => {
      if (!componentTimes.has(metric.componentName)) {
        componentTimes.set(metric.componentName, []);
      }
      componentTimes.get(metric.componentName)!.push(metric.renderTime);
    });

    const averages = Array.from(componentTimes.entries()).map(([componentName, times]) => ({
      componentName,
      averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
    }));

    return averages
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, limit);
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  logSummary(): void {
    if (!this.isEnabled || this.metrics.length === 0) return;

    console.group('[Performance Summary]');
    console.log(`Total renders tracked: ${this.metrics.length}`);
    console.log(`Average render time: ${this.getAverageRenderTime().toFixed(2)}ms`);
    console.log('Slowest components:');
    this.getSlowestComponents().forEach(({ componentName, averageTime }) => {
      console.log(`  ${componentName}: ${averageTime.toFixed(2)}ms`);
    });
    console.groupEnd();
  }
}

const profiler = new PerformanceProfiler();

export const usePerformanceProfiler = (componentName: string) => {
  const endProfilingRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Start profiling when component mounts or updates
    endProfilingRef.current = profiler.startProfiling(componentName);

    return () => {
      // End profiling when component unmounts or before next update
      if (endProfilingRef.current) {
        endProfilingRef.current();
        endProfilingRef.current = null;
      }
    };
  });

  const logMetrics = useCallback(() => {
    profiler.logSummary();
  }, []);

  const getComponentMetrics = useCallback(() => {
    return profiler.getMetrics().filter(m => m.componentName === componentName);
  }, [componentName]);

  const clearMetrics = useCallback(() => {
    profiler.clearMetrics();
  }, []);

  return {
    logMetrics,
    getComponentMetrics,
    clearMetrics,
    profiler,
  };
};

export default profiler; 