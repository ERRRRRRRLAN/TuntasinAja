# 📝 Load Testing Commands Cheat Sheet

## 🚀 Quick Commands

### Demo Test (MULAI DARI SINI!)
```bash
cd load-tests
k6 run demo-test.js --env BASE_URL=https://your-app.vercel.app
```
**Duration:** 40 seconds | **Max Users:** 10

---

### Basic Load Test
```bash
k6 run basic-load-test.js --env BASE_URL=https://your-app.vercel.app
```
**Duration:** 5 minutes | **Max Users:** 200

---

### Stress Test (Cari Breaking Point)
```bash
k6 run stress-test.js --env BASE_URL=https://your-app.vercel.app
```
**Duration:** 13 minutes | **Max Users:** 500

---

### Spike Test (Sudden Traffic)
```bash
k6 run spike-test.js --env BASE_URL=https://your-app.vercel.app
```
**Duration:** 2 minutes | **Max Users:** 500 instantly

---

### Soak Test (Long Running)
```bash
k6 run soak-test.js --env BASE_URL=https://your-app.vercel.app
```
**Duration:** 33 minutes | **Max Users:** 50 sustained

---

## 🎨 Using PowerShell Helper

### Syntax
```powershell
.\run-test.ps1 -TestType [type] -Url [url]
```

### Examples
```powershell
# Demo test
.\run-test.ps1 -TestType basic -Url https://your-app.vercel.app

# Stress test
.\run-test.ps1 -TestType stress -Url https://your-app.vercel.app

# Spike test
.\run-test.ps1 -TestType spike -Url https://your-app.vercel.app

# Soak test (WARNING: 33 minutes!)
.\run-test.ps1 -TestType soak -Url https://your-app.vercel.app
```

---

## 🛠️ Advanced Options

### Custom Options
```bash
# Specify virtual users
k6 run --vus 50 --duration 30s demo-test.js --env BASE_URL=https://your-app.vercel.app

# Output to file
k6 run basic-load-test.js --env BASE_URL=https://your-app.vercel.app --out json=results.json

# Quiet mode (less output)
k6 run -q basic-load-test.js --env BASE_URL=https://your-app.vercel.app

# Show only summary
k6 run --quiet basic-load-test.js --env BASE_URL=https://your-app.vercel.app
```

### Environment Variables
```bash
# Multiple env vars
k6 run script.js --env BASE_URL=https://app.com --env API_KEY=xxx

# From file
k6 run script.js --env-file .env
```

---

## 📊 Monitoring Commands

### Monitor Vercel Logs
```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login
vercel login

# Watch logs in real-time
vercel logs --follow

# Logs for specific deployment
vercel logs [deployment-url] --follow
```

### Check Vercel Deployment
```bash
# List deployments
vercel ls

# Get deployment info
vercel inspect [deployment-url]
```

---

## 🔍 Results Analysis

### View Summary
```bash
# Results are automatically shown after test completes
# Look for these files:
- load-test-summary.json
- stress-test-results.json
```

### Parse JSON Results
```powershell
# View JSON results
Get-Content load-test-summary.json | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

---

## 🎯 Quick Decision Tree

```
START HERE:
│
├─ First time testing?
│  └─ Run: demo-test.js (10 users, 40s)
│
├─ Want to know max capacity?
│  └─ Run: stress-test.js (500 users, 13m)
│
├─ Testing sudden traffic spike?
│  └─ Run: spike-test.js (500 instant, 2m)
│
├─ Testing long-term stability?
│  └─ Run: soak-test.js (50 users, 33m)
│
└─ Regular load testing?
   └─ Run: basic-load-test.js (200 users, 5m)
```

---

## 💡 Pro Tips

### 1. Start Small
```bash
# Always start with demo
k6 run demo-test.js --env BASE_URL=https://your-app.vercel.app
```

### 2. Monitor Dashboard
Open Vercel dashboard BEFORE running test:
1. https://vercel.com/dashboard
2. Select your project
3. Open "Analytics" tab
4. Watch in real-time!

### 3. Test Local First
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run test
cd load-tests
k6 run demo-test.js
```

### 4. Save Results
```bash
# Run with output
k6 run basic-load-test.js --env BASE_URL=https://your-app.vercel.app > results.txt

# Or redirect to file
k6 run stress-test.js --env BASE_URL=https://your-app.vercel.app | Tee-Object -FilePath results.txt
```

---

## 🔥 One-Liner Commands

```bash
# Quick demo
cd load-tests && k6 run demo-test.js --env BASE_URL=https://your-app.vercel.app

# Quick basic test
cd load-tests && k6 run basic-load-test.js --env BASE_URL=https://your-app.vercel.app

# Quick stress test with output
cd load-tests && k6 run stress-test.js --env BASE_URL=https://your-app.vercel.app | Tee-Object -FilePath stress-results.txt

# Test all endpoints
cd load-tests && k6 run demo-test.js && k6 run basic-load-test.js && k6 run stress-test.js
```

---

## 📋 Checklist

Before running production test:

- [ ] Vercel URL is correct
- [ ] Dashboard open in browser
- [ ] Logs terminal ready (optional)
- [ ] Not peak hours
- [ ] Ready to monitor ~5-15 minutes
- [ ] Understand what you're testing

After test completes:

- [ ] Check error rate (target: <5%)
- [ ] Check p(95) response time (target: <2000ms)
- [ ] Check Vercel dashboard for issues
- [ ] Document max capacity found
- [ ] Plan next steps (optimize/upgrade)

---

## 🆘 Emergency Stop

If test causing issues:

```
Press: Ctrl + C

This will immediately stop k6 and all virtual users.
```

---

## 📞 Help

Need more details?
- Full docs: `load-tests/README.md`
- Quick start: `load-tests/quick-start.md`
- Main guide: `LOAD-TESTING-GUIDE.md`

---

**Last Updated:** ${new Date().toLocaleDateString('id-ID')}



