# 🚀 Load Testing dengan k6

Folder ini berisi berbagai script load testing untuk menguji batas maksimal server Vercel Anda.

## 📋 Prerequisites

- ✅ k6 sudah terinstall (`choco install k6`)
- ✅ Aplikasi sudah di-deploy ke Vercel
- ✅ Punya URL production Vercel

## 📁 Script yang Tersedia

### 1. `basic-load-test.js` - Load Test Dasar
**Tujuan:** Test normal dengan beban bertahap  
**Durasi:** ~5 menit  
**Max Users:** 200 concurrent users

```bash
# Local testing
k6 run basic-load-test.js

# Test production Vercel
k6 run basic-load-test.js --env BASE_URL=https://your-app.vercel.app
```

**Scenario:**
- 30s → 10 users (warm up)
- 1m → 50 users (normal load)
- 2m → 100 users (high load)
- 1m → 200 users (stress)
- 30s → 0 users (cool down)

---

### 2. `stress-test.js` - Stress Test
**Tujuan:** Cari breaking point server  
**Durasi:** ~13 menit  
**Max Users:** 500 concurrent users

```bash
k6 run stress-test.js --env BASE_URL=https://your-app.vercel.app
```

**Scenario:**
- Meningkat bertahap dari 50 → 500 users
- Menemukan titik di mana server mulai error/slow
- Memberikan rekomendasi otomatis

---

### 3. `spike-test.js` - Spike Test
**Tujuan:** Simulasi traffic surge tiba-tiba  
**Durasi:** ~2 menit  
**Max Users:** 500 users instantly

```bash
k6 run spike-test.js --env BASE_URL=https://your-app.vercel.app
```

**Scenario:**
- Traffic normal 10 users
- Tiba-tiba SPIKE ke 500 users
- Test apakah server bisa handle sudden traffic

---

### 4. `soak-test.js` - Soak Test
**Tujuan:** Test sustained load dalam waktu lama  
**Durasi:** ~33 menit  
**Max Users:** 50 users sustained

```bash
k6 run soak-test.js --env BASE_URL=https://your-app.vercel.app
```

**⚠️ WARNING:** Test ini lama! Pastikan Anda punya waktu.  
**Berguna untuk:** Menemukan memory leaks, resource exhaustion

---

## 🎯 Rekomendasi Penggunaan

### Untuk Pertama Kali (Mulai dari Sini!)
```bash
# 1. Test local dulu
k6 run basic-load-test.js

# 2. Test production dengan beban kecil
k6 run basic-load-test.js --env BASE_URL=https://your-app.vercel.app
```

### Untuk Mencari Batas Maksimal
```bash
# Gunakan stress test
k6 run stress-test.js --env BASE_URL=https://your-app.vercel.app
```

### Untuk Test Sudden Traffic Spike
```bash
# Gunakan spike test
k6 run spike-test.js --env BASE_URL=https://your-app.vercel.app
```

---

## 📊 Membaca Hasil Test

### Metrics Penting:

1. **http_req_duration** - Response time
   - `avg`: Average response time
   - `p(95)`: 95% request di bawah nilai ini
   - `p(99)`: 99% request di bawah nilai ini
   - ✅ Bagus: p(95) < 1000ms
   - ⚠️ Warning: p(95) 1000-2000ms
   - 🔴 Buruk: p(95) > 2000ms

2. **http_req_failed** - Error rate
   - ✅ Bagus: < 1%
   - ⚠️ Warning: 1-5%
   - 🔴 Buruk: > 5%

3. **http_reqs** - Request per second (RPS)
   - Menunjukkan throughput server Anda

4. **vus_max** - Maximum virtual users
   - Berapa banyak concurrent users

### Contoh Output:
```
✓ homepage status 200..................: 95.2%
✓ homepage response time < 2s..........: 98.1%
✗ threads API status 200...............: 89.5%

http_req_duration....: avg=456ms min=123ms max=8.9s p(95)=1.2s p(99)=3.5s
http_req_failed......: 4.8% (152 failed / 3168 total)
http_reqs............: 3168 (52.8/s)
vus_max..............: 200
```

**Interpretasi:**
- Homepage OK (95.2% success)
- Response time OK (98.1% < 2s)
- API mulai struggle (89.5% success, 10.5% error)
- p(95) = 1.2s → Masih acceptable
- Error rate 4.8% → Warning level
- **Kesimpulan:** Server mulai struggle di ~200 concurrent users

---

## 🎛️ Kustomisasi Test

### Mengubah Target Users
Edit file test, bagian `options.stages`:

```javascript
export const options = {
  stages: [
    { duration: '1m', target: 20 },   // Ubah angka ini
    { duration: '2m', target: 100 },  // Ubah angka ini
  ],
};
```

### Mengubah Thresholds
```javascript
thresholds: {
  'http_req_duration': ['p(95)<1000'],  // Ubah dari 2000 ke 1000
  'http_req_failed': ['rate<0.05'],     // Ubah dari 0.1 ke 0.05
},
```

### Menambah Endpoint Test
Di function `default()`, tambahkan:

```javascript
// Test endpoint baru
res = http.get(`${BASE_URL}/api/your-endpoint`);
check(res, {
  'your endpoint OK': (r) => r.status === 200,
});
```

---

## 🔍 Tips Monitoring

### 1. Monitor Vercel Dashboard
Saat running load test, buka:
- https://vercel.com/dashboard
- Pilih project Anda
- Lihat tab **Analytics**
- Monitor **Function Invocations** & **Errors**

### 2. Check Logs
```bash
vercel logs your-app --follow
```

### 3. Performance Insights
Tab **Speed Insights** di Vercel dashboard

---

## ⚠️ Important Notes

### Vercel Hobby Plan Limits:
- **Function Duration:** Max 10 detik
- **Function Memory:** Max 1024 MB
- **Bandwidth:** 100 GB/bulan
- **Serverless Execution:** 100 GB-hours/bulan

### Estimasi Kapasitas:
Berdasarkan pengalaman:
- ✅ **50-100 users:** Seharusnya lancar
- ⚠️ **100-200 users:** Mulai terasa slow
- 🔴 **200+ users:** Bisa error/timeout

**TAPI** ini tergantung:
- Kompleksitas query database
- Size response
- API endpoint yang di-hit
- Cold starts

### Jangan Over-Test!
- Jangan run test terlalu sering
- Vercel bisa anggap sebagai abuse
- Bisa kena rate limit atau ban sementara
- Test dengan bijak!

---

## 📝 Best Practices

1. **Mulai Kecil:** Start dengan 10-50 users dulu
2. **Monitor:** Pantau Vercel dashboard selama test
3. **Incremental:** Tingkatkan beban secara bertahap
4. **Off-Peak:** Test saat traffic sepi (malam/dini hari)
5. **Save Results:** Simpan hasil test untuk perbandingan
6. **Be Responsible:** Jangan over-test atau abuse

---

## 🆘 Troubleshooting

### Error: "dial: i/o timeout"
→ Server overwhelmed, terlalu banyak request  
→ Kurangi target users atau tingkatkan `sleep()`

### Error: "429 Too Many Requests"
→ Hit rate limit Vercel  
→ Tunggu beberapa menit, lalu test lagi  
→ Atau kurangi request rate

### Error: "context deadline exceeded"
→ Request timeout > 10 detik (Vercel limit)  
→ Optimize API/database query

### High Error Rate (>10%)
→ Server tidak kuat dengan beban tersebut  
→ Ini adalah batas maksimal Anda!

---

## 📈 Interpreting Results untuk Vercel Hobby Plan

### Scenario 1: All Green ✅
```
Error rate: <1%
p(95): <500ms
```
→ Server masih kuat, bisa tambah beban

### Scenario 2: Warning ⚠️
```
Error rate: 1-5%
p(95): 500-1500ms
```
→ Mendekati batas, ini mungkin max capacity Anda

### Scenario 3: Critical 🔴
```
Error rate: >5%
p(95): >2000ms
```
→ Server overwhelmed! Ini di atas batas maksimal

---

## 🎓 Next Steps

Setelah tau batas maksimal:

1. **Optimize Code:**
   - Cache responses
   - Optimize database queries
   - Use Edge functions jika bisa

2. **Consider Upgrade:**
   - Vercel Pro: $20/bulan
   - Lebih banyak resources & longer function duration

3. **Use CDN:**
   - Cache static assets
   - Reduce server load

4. **Database Optimization:**
   - Add indexes
   - Optimize queries
   - Use connection pooling

---

## 📞 Support

Kalau ada pertanyaan atau butuh bantuan interpretasi hasil:
1. Save output test Anda
2. Screenshot hasil
3. Tanyakan untuk analisis lebih lanjut

Happy Load Testing! 🚀



