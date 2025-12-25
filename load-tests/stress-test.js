import http from 'k6/http';
import { check, sleep } from 'k6';

// Stress test - find the breaking point
export const options = {
  stages: [
    { duration: '1m', target: 50 },     // Normal
    { duration: '2m', target: 100 },    // Above normal
    { duration: '2m', target: 200 },    // Stress
    { duration: '2m', target: 300 },    // Heavy stress
    { duration: '2m', target: 400 },    // Breaking point?
    { duration: '3m', target: 500 },    // Beyond limits
    { duration: '1m', target: 0 },      // Recovery
  ],
  thresholds: {
    'http_req_duration': ['p(95)<3000', 'p(99)<8000'],
    'http_req_failed': ['rate<0.15'],   // Allow some failures during stress
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Realistic user flow
  const actions = [
    () => http.get(`${BASE_URL}/`),
    () => http.get(`${BASE_URL}/api/auth/session`),
    () => {
      const payload = JSON.stringify({ '0': { json: { page: 1, limit: 20 } } });
      return http.get(
        `${BASE_URL}/api/trpc/thread.getAll?batch=1&input=${encodeURIComponent(payload)}`
      );
    },
    () => http.get(`${BASE_URL}/api/app/version`),
  ];

  // Random action
  const action = actions[Math.floor(Math.random() * actions.length)];
  const res = action();
  
  check(res, {
    'responds': (r) => r.status < 500 || r.status === 503,
    'not too slow': (r) => r.timings.duration < 10000,
  });
  
  sleep(Math.random() * 3 + 1); // 1-4 seconds think time
}

export function handleSummary(data) {
  const metrics = data.metrics;
  const summary = {
    test_type: 'stress_test',
    duration: data.state?.testRunDurationMs,
    total_requests: metrics.http_reqs?.values?.count || 0,
    failed_requests: metrics.http_req_failed?.values?.fails || 0,
    error_rate: ((metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(2) + '%',
    avg_response_time: (metrics.http_req_duration?.values?.avg || 0).toFixed(2) + 'ms',
    p95_response_time: (metrics.http_req_duration?.values['p(95)'] || 0).toFixed(2) + 'ms',
    p99_response_time: (metrics.http_req_duration?.values['p(99)'] || 0).toFixed(2) + 'ms',
    max_vus: metrics.vus_max?.values?.max || 0,
  };
  
  return {
    'stress-test-results.json': JSON.stringify(summary, null, 2),
    'stdout': `
╔════════════════════════════════════════╗
║     STRESS TEST RESULTS               ║
╚════════════════════════════════════════╝

📊 Total Requests: ${summary.total_requests}
❌ Failed: ${summary.failed_requests} (${summary.error_rate})
👥 Max Users: ${summary.max_vus}

⏱️  Response Times:
   Average: ${summary.avg_response_time}
   p(95): ${summary.p95_response_time}
   p(99): ${summary.p99_response_time}

💡 Recommendation:
${getRecommendation(summary)}
    `,
  };
}

function getRecommendation(summary) {
  const errorRate = parseFloat(summary.error_rate);
  const p95 = parseFloat(summary.p95_response_time);
  
  if (errorRate > 15 || p95 > 3000) {
    return '🔴 Server struggled under stress! Consider upgrading plan.';
  } else if (errorRate > 5 || p95 > 1500) {
    return '🟡 Performance degraded at high load. Monitor closely.';
  } else {
    return '🟢 Server handled stress well! Within acceptable limits.';
  }
}



