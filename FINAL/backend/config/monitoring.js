import client from 'prom-client';

// Create a Registry to register the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
    app: 'ai-doc-assistant'
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Create custom metrics
export const httpRequestDurationMicroseconds = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

export const totalRequests = new client.Counter({
    name: 'total_requests',
    help: 'Total number of requests received',
    labelNames: ['method', 'route']
});

export const failedRequests = new client.Counter({
    name: 'failed_requests',
    help: 'Total number of failed requests',
    labelNames: ['method', 'route', 'error']
});

// Register custom metrics
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(totalRequests);
register.registerMetric(failedRequests);

export { register, client };
