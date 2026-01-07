import http from 'k6/http';
import { check, sleep } from 'k6';

// Spike test - simulate sudden traffic surge
export const options = {
  stages: [
    { duration: '10s', target: 10 },    // Normal traffic
    { duration: '30s', target: 500 },   // SPIKE! 500 users instantly
    { duration: '1m', target: 500 },    // Stay at spike
    { duration: '10s', target: 10 },    // Back to normal
    { duration: '10s', target: 0 },     // Cool down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<5000'],  // More lenient during spike
    'http_req_failed': ['rate<0.2'],      // Allow 20% error during spike
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Test homepage under spike
  const res = http.get(`${BASE_URL}/`);
  
  check(res, {
    'status 200 or 503 (overloaded)': (r) => r.status === 200 || r.status === 503,
    'responds within 5s': (r) => r.timings.duration < 5000,
  });
  
  sleep(1);
}



