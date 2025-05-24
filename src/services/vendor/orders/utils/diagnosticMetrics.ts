
/**
 * Simple metrics utility for diagnostics
 */
export const createDiagnosticMetrics = () => {
  const metrics: Record<string, number> = {};
  
  return {
    add: (name: string, value: number) => {
      metrics[name] = value;
    },
    get: () => metrics
  };
};

/**
 * Measure execution time of an async function
 */
export const measureExecutionTime = async <T>(
  name: string, 
  fn: () => Promise<T>, 
  metrics: ReturnType<typeof createDiagnosticMetrics>
): Promise<T> => {
  const startTime = performance.now();
  const result = await fn();
  metrics.add(name, performance.now() - startTime);
  return result;
};
