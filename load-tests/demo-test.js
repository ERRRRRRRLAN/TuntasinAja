import http from 'k6/http';
import { check, sleep } from 'k6';

// Demo test - Very light load, safe for first try
export const options = {
  stages: [
    { duration: '10s', target: 5 },    // Ramp up to 5 users
    { duration: '20s', target: 10 },   // Stay at 10 users
    { duration: '10s', target: 0 },    // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<3000'],
    'http_req_failed': ['rate<0.1'],
  },
};

// GANTI URL INI atau gunakan: k6 run demo-test.js --env BASE_URL=https://your-app.vercel.app
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  console.log(`Testing: ${BASE_URL}`);
  
  // Test 1: Homepage
  const res1 = http.get(`${BASE_URL}/`);
  const check1 = check(res1, {
    '✅ Homepage loaded': (r) => r.status === 200,
    '⚡ Response < 2s': (r) => r.timings.duration < 2000,
  });
  
  if (!check1) {
    console.log(`❌ Homepage test failed: status=${res1.status}, duration=${res1.timings.duration}ms`);
  }
  
  sleep(1);
  
  // Test 2: Session API
  const res2 = http.get(`${BASE_URL}/api/auth/session`);
  check(res2, {
    '✅ Session API responds': (r) => r.status === 200 || r.status === 401,
  });
  
  sleep(1);
  
  // Test 3: Public tRPC endpoint
  const payload = JSON.stringify({ 
    '0': { json: { page: 1, limit: 5 } } 
  });
  
  const res3 = http.get(
    `${BASE_URL}/api/trpc/thread.getAll?batch=1&input=${encodeURIComponent(payload)}`,
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
  
  const check3 = check(res3, {
    '✅ API responds': (r) => r.status === 200,
    '⚡ API fast': (r) => r.timings.duration < 1500,
  });
  
  if (check3 && res3.status === 200) {
    try {
      const body = JSON.parse(res3.body);
      console.log(`📊 API returned data successfully`);
    } catch (e) {
      console.log(`⚠️  API response not JSON: ${res3.body.substring(0, 100)}`);
    }
  }
  
  sleep(2);
}

export function handleSummary(data) {
  const metrics = data.metrics;
  const passed = metrics.checks?.values?.passes || 0;
  const failed = metrics.checks?.values?.fails || 0;
  const total = passed + failed;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
  
  const summary = `
╔════════════════════════════════════════════════════╗
║           📊 DEMO TEST RESULTS                     ║
╚════════════════════════════════════════════════════╝

🎯 Test Summary:
   Total Checks: ${total}
   Passed: ${passed} (${passRate}%)
   Failed: ${failed}

📈 Performance:
   Total Requests: ${metrics.http_reqs?.values?.count || 0}
   Failed Requests: ${metrics.http_req_failed?.values?.fails || 0}
   Error Rate: ${((metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(2)}%
   
⏱️  Response Times:
   Average: ${(metrics.http_req_duration?.values?.avg || 0).toFixed(0)}ms
   Min: ${(metrics.http_req_duration?.values?.min || 0).toFixed(0)}ms
   Max: ${(metrics.http_req_duration?.values?.max || 0).toFixed(0)}ms
   p(95): ${(metrics.http_req_duration?.values['p(95)'] || 0).toFixed(0)}ms
   
👥 Virtual Users:
   Max Concurrent: ${metrics.vus_max?.values?.max || 0}
   
📊 Request Rate:
   ${(metrics.http_reqs?.values?.rate || 0).toFixed(1)} requests/second

${getRecommendation(metrics)}

════════════════════════════════════════════════════

💡 Next Steps:
   ${getNextSteps(metrics)}
`;

  return {
    'stdout': summary,
  };
}

function getRecommendation(metrics) {
  const errorRate = (metrics.http_req_failed?.values?.rate || 0) * 100;
  const p95 = metrics.http_req_duration?.values['p(95)'] || 0;
  const passRate = metrics.checks?.values?.rate || 0;
  
  if (errorRate > 5 || p95 > 2000 || passRate < 0.9) {
    return `🔴 Recommendation:
   Server struggled even with light load (max 10 users).
   Issues found:
   ${errorRate > 5 ? '   - High error rate (' + errorRate.toFixed(1) + '%)' : ''}
   ${p95 > 2000 ? '   - Slow response times (p95: ' + p95.toFixed(0) + 'ms)' : ''}
   ${passRate < 0.9 ? '   - Many checks failed' : ''}
   
   ⚠️  Consider optimizing before testing with higher load.`;
  } else if (errorRate > 1 || p95 > 1000) {
    return `🟡 Recommendation:
   Server handled light load but showed some issues.
   You can proceed to basic test, but monitor closely.`;
  } else {
    return `🟢 Recommendation:
   Server handled light load excellently!
   ✅ Ready for the next step: run basic-load-test.js
   ✅ Try: k6 run basic-load-test.js --env BASE_URL=your-url`;
  }
}

function getNextSteps(metrics) {
  const errorRate = (metrics.http_req_failed?.values?.rate || 0) * 100;
  
  if (errorRate < 1) {
    return `1. ✅ Great! Now try: k6 run basic-load-test.js
   2. Monitor Vercel dashboard during test
   3. Look for error patterns in logs`;
  } else {
    return `1. Check Vercel logs for errors
   2. Optimize slow endpoints
   3. Re-run demo test to verify improvements`;
  }
}


