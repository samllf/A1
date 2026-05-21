import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

const logMetric = (metric: Metric) => {
  console.info('[web-vitals]', {
    name: metric.name,
    value: Math.round(metric.value * 100) / 100,
    rating: metric.rating
  });
};

export const reportWebVitals = () => {
  onCLS(logMetric);
  onFCP(logMetric);
  onINP(logMetric);
  onLCP(logMetric);
  onTTFB(logMetric);
};
