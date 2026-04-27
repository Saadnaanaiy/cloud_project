// ============================================================
// K6 Load Test — Employee Platform Backend API
// ============================================================
// Install k6: https://k6.io/docs/get-started/installation/
// Run:  k6 run tests/load-test.js
// Or:   make load-test-local
// ============================================================
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ─── Custom Metrics ───────────────────────────────────────
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const healthDuration = new Trend('health_check_duration');

// ─── Test Configuration ──────────────────────────────────
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m',  target: 25 },   // Stay at 25 users
    { duration: '30s', target: 50 },   // Spike to 50 users
    { duration: '1m',  target: 50 },   // Hold at 50 users
    { duration: '30s', target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],   // 95% of requests under 500ms
    errors: ['rate<0.1'],               // Error rate below 10%
    health_check_duration: ['p(99)<200'], // Health checks under 200ms
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:30001';

// ─── Test Scenarios ──────────────────────────────────────
export default function () {
  // Health check endpoint
  group('Health Check', () => {
    const healthRes = http.get(`${BASE_URL}/health`);
    healthDuration.add(healthRes.timings.duration);
    check(healthRes, {
      'health status is 200': (r) => r.status === 200,
    }) || errorRate.add(1);
  });

  sleep(1);

  // Signup flow (simulated)
  group('Signup Flow', () => {
    const uniqueEmail = `loadtest_${Date.now()}_${Math.random().toString(36).slice(2)}@test.com`;
    const signupRes = http.post(
      `${BASE_URL}/auth/signup`,
      JSON.stringify({
        email: uniqueEmail,
        password: 'TestPassword123!',
        name: 'Load Test User',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    check(signupRes, {
      'signup status is 201 or 409': (r) => r.status === 201 || r.status === 409,
    }) || errorRate.add(1);
  });

  sleep(1);

  // Login flow
  group('Login Flow', () => {
    const loginRes = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    loginDuration.add(loginRes.timings.duration);
    check(loginRes, {
      'login status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    }) || errorRate.add(1);

    // If login succeeded, test authenticated endpoint
    if (loginRes.status === 200) {
      const body = JSON.parse(loginRes.body);
      const token = body.access_token || body.token;

      if (token) {
        const profileRes = http.get(`${BASE_URL}/employees`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        check(profileRes, {
          'employees status is 200': (r) => r.status === 200,
        }) || errorRate.add(1);
      }
    }
  });

  sleep(2);
}

// ─── Summary Report ──────────────────────────────────────
export function handleSummary(data) {
  const summary = {
    'Total Requests': data.metrics.http_reqs.values.count,
    'Avg Response Time': `${data.metrics.http_req_duration.values.avg.toFixed(2)}ms`,
    'P95 Response Time': `${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`,
    'Error Rate': `${(data.metrics.errors ? data.metrics.errors.values.rate * 100 : 0).toFixed(2)}%`,
  };

  console.log('\n════════════════════════════════════');
  console.log('  📊 Load Test Summary');
  console.log('════════════════════════════════════');
  Object.entries(summary).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  console.log('════════════════════════════════════\n');

  return {
    stdout: JSON.stringify(summary, null, 2),
  };
}
