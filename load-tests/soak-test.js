import http from 'k6/http';
import { check, sleep } from 'k6';

// Soak test - sustained load over time (find memory leaks, resource exhaustion)
export const options = {
  stages: [
    { duration: '2m', target: 50 },    // Ramp up
    { duration: '30m', target: 50 },   // Stay at 50 users for 30 minutes
    { duration: '1m', target: 0 },     // Cool down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2000'],
    'http_req_failed': ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Test homepage
  let res = http.get(`${BASE_URL}/`);
  check(res, {
    'homepage OK': (r) => r.status === 200,
  });
  
  sleep(2);
  
  // Test API
  const payload = JSON.stringify({ '0': { json: { page: 1, limit: 10 } } });
  res = http.get(
    `${BASE_URL}/api/trpc/thread.getAll?batch=1&input=${encodeURIComponent(payload)}`
  );
  
  check(res, {
    'API OK': (r) => r.status === 200,
  });
  
  sleep(3);
}



