# 🚀 Quick Start Guide - Load Testing

## Langkah Super Cepat (5 Menit)

### 1️⃣ Persiapan
Pastikan Anda punya URL production Vercel. Contoh:
```
https://tuntasinaja.vercel.app
```

### 2️⃣ Run Test Pertama (REKOMENDASI)

#### Windows PowerShell (Paling Mudah):
```powershell
# Test production Vercel Anda
cd load-tests
.\run-test.ps1 -TestType basic -Url https://your-app.vercel.app
```

#### Atau Langsung dengan k6:
```bash
cd load-tests
k6 run basic-load-test.js --env BASE_URL=https://your-app.vercel.app
```

### 3️⃣ Tunggu ~5 Menit
Test akan berjalan otomatis dengan skenario:
- 10 users → 50 users → 100 users → 200 users

### 4️⃣ Baca Hasil
Lihat output di terminal:

```
✓ homepage status 200............: 95.2%   ← Berapa % yang berhasil
✓ threads API status 200.........: 89.5%   ← API response rate

http_req_duration...: avg=456ms p(95)=1.2s   ← Response time
http_req_failed.....: 4.8%                    ← Error rate (target < 5%)
http_reqs...........: 3168 (52.8/s)           ← Request per second
vus_max.............: 200                     ← Max concurrent users
```

## 📊 Interpretasi Cepat

### ✅ Server Kuat (BAGUS)
```
- Error rate: < 1%
- p(95): < 500ms
- Semua checks passing
```
→ **Server masih kuat, bisa handle lebih banyak**

### ⚠️ Server Mulai Struggle (WARNING)
```
- Error rate: 1-5%
- p(95): 500-1500ms
- Beberapa checks failed
```
→ **Ini mendekati batas maksimal Anda**

### 🔴 Server Overloaded (LIMIT REACHED)
```
- Error rate: > 5%
- p(95): > 2000ms
- Banyak checks failed
```
→ **Ini di atas batas! Server tidak kuat**

## 🎯 Cari Batas Maksimal

Kalau basic test lancar, coba stress test:

```powershell
.\run-test.ps1 -TestType stress -Url https://your-app.vercel.app
```

Test ini akan meningkat sampai 500 users dan memberikan rekomendasi otomatis!

## 🔥 Test Scenarios

### Test Homepage Doang (Paling Ringan)
Edit `basic-load-test.js`, comment yang lain:
```javascript
export default function () {
  const res = http.get(`${BASE_URL}/`);
  check(res, {
    'status 200': (r) => r.status === 200,
  });
  sleep(1);
}
```

### Test API Berat
Edit untuk fokus ke API yang paling berat:
```javascript
export default function () {
  const payload = JSON.stringify({ 
    '0': { json: { page: 1, limit: 50 } } 
  });
  
  const res = http.get(
    `${BASE_URL}/api/trpc/thread.getAll?batch=1&input=${encodeURIComponent(payload)}`
  );
  
  check(res, {
    'API responds': (r) => r.status === 200,
    'Fast response': (r) => r.timings.duration < 1000,
  });
  
  sleep(2);
}
```

## 💡 Tips Penting

1. **Mulai dari Local:**
   ```bash
   # Test local dulu
   npm run dev
   # Terminal lain:
   k6 run basic-load-test.js
   ```

2. **Monitor Vercel:**
   - Buka https://vercel.com/dashboard
   - Pilih project Anda
   - Tab Analytics → lihat grafik real-time

3. **Jangan Over-Test:**
   - Max 3-5 test per hari
   - Vercel bisa anggap abuse kalau terlalu sering

4. **Peak Hours:**
   - Test saat traffic sepi (malam/dini hari)
   - Hindari test saat banyak user real

## ❓ FAQ

**Q: Berapa batas normal untuk Hobby Plan?**  
A: Biasanya 50-150 concurrent users, tergantung kompleksitas app

**Q: Apa yang harus saya lakukan kalau error rate tinggi?**  
A: Itu artinya Anda sudah menemukan batas maksimal! Pertimbangkan:
   - Optimize code (caching, database queries)
   - Upgrade ke Vercel Pro
   - Use CDN untuk static assets

**Q: Test saya timeout terus?**  
A: Vercel Hobby Plan max 10 detik per request. Kalau timeout:
   - Optimize API queries
   - Kurangi response size
   - Consider pagination

**Q: Apakah ini aman untuk production?**  
A: Ya, tapi:
   - Jangan over-test
   - Test saat traffic sepi
   - Monitor Vercel dashboard
   - Siap matikan kalau ada masalah (Ctrl+C)

## 🆘 Masalah & Solusi

### "Connection refused"
→ Server mati atau URL salah, cek URL Anda

### "429 Too Many Requests"
→ Hit rate limit, tunggu 5-10 menit

### "context deadline exceeded"
→ Request > 10 detik, optimize API Anda

### Error rate >50%
→ Server completely overwhelmed, kurangi target users

## 📞 Butuh Bantuan?

Kalau bingung interpretasi hasil:
1. Screenshot output test
2. Paste hasil metrics
3. Tanya untuk analisis lebih detail

Selamat testing! 🎉



