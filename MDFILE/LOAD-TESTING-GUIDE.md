# 🚀 Panduan Load Testing untuk TuntasinAja

## 📌 Ringkasan

Anda sekarang memiliki tools lengkap untuk menguji batas maksimal server Vercel Anda tanpa perlu banyak device!

## ✅ Yang Sudah Disiapkan

- ✅ k6 sudah terinstall (v1.4.2)
- ✅ 5 Script load test siap pakai
- ✅ PowerShell helper script untuk kemudahan
- ✅ Dokumentasi lengkap

## 📁 Struktur Folder `load-tests/`

```
load-tests/
├── demo-test.js              ← MULAI DARI SINI! (10 users, 40 detik)
├── basic-load-test.js        ← Test normal (200 users, 5 menit)
├── stress-test.js            ← Cari breaking point (500 users, 13 menit)
├── spike-test.js             ← Sudden traffic surge (500 users instant)
├── soak-test.js              ← Sustained load (50 users, 33 menit)
├── run-test.ps1              ← Helper script Windows
├── README.md                 ← Dokumentasi lengkap
├── quick-start.md            ← Quick start guide
└── .gitignore                ← Ignore hasil test
```

## 🎯 Cara Menggunakan (3 Langkah)

### Step 1: Persiapan URL

Anda perlu URL production Vercel Anda. Cek di:
- https://vercel.com/dashboard
- Pilih project "TuntasinAja"
- Copy URL production (contoh: `https://tuntasinaja.vercel.app`)

### Step 2: Run Demo Test (REKOMENDASI PERTAMA)

**Cara 1: Menggunakan PowerShell Helper (PALING MUDAH)**
```powershell
cd load-tests
.\run-test.ps1 -TestType basic -Url https://tuntasinaja.vercel.app
```

**Cara 2: Langsung dengan k6**
```bash
cd load-tests

# Demo test ringan (MULAI DARI SINI!)
k6 run demo-test.js --env BASE_URL=https://tuntasinaja.vercel.app

# Atau test basic
k6 run basic-load-test.js --env BASE_URL=https://tuntasinaja.vercel.app
```

### Step 3: Baca & Interpretasi Hasil

Output akan menampilkan metrics seperti ini:

```
✓ ✅ Homepage loaded.................: 98.5%
✓ ⚡ Response < 2s...................: 97.2%
✓ ✅ Session API responds............: 100%
✓ ✅ API responds....................: 95.3%

http_req_duration...: avg=456ms min=123ms max=2.1s p(95)=1.2s
http_req_failed.....: 1.8% (23 failed / 1280 total)
http_reqs...........: 1280 (32/s)
vus_max.............: 10
```

## 📊 Cara Membaca Hasil Test

### Metrics Penting:

#### 1. **Error Rate (`http_req_failed`)**
```
✅ BAGUS:    < 1%      Server stabil
⚠️ WARNING:  1-5%     Mulai ada masalah
🔴 BURUK:    > 5%     Server kewalahan
```

#### 2. **Response Time (`http_req_duration`)**
```
✅ BAGUS:    p(95) < 500ms     Sangat cepat
⚠️ OK:       p(95) < 1500ms    Masih acceptable
🔴 LAMBAT:   p(95) > 2000ms    Terlalu lambat
```

#### 3. **Throughput (`http_reqs`)**
```
Requests per second (RPS)
- Semakin tinggi = semakin bagus
- Menunjukkan kapasitas server Anda
```

#### 4. **Virtual Users (`vus_max`)**
```
Jumlah concurrent users saat test
- Ini yang Anda cari: berapa max users sebelum error/slow
```

## 🎓 Interpretasi Contoh

### Contoh 1: Server Kuat ✅
```
http_req_failed.....: 0.2%
http_req_duration...: avg=234ms p(95)=456ms
vus_max.............: 200
```
**Artinya:** Server masih sangat kuat dengan 200 users! Bisa test lebih tinggi.

### Contoh 2: Mendekati Limit ⚠️
```
http_req_failed.....: 3.5%
http_req_duration...: avg=876ms p(95)=1.8s
vus_max.............: 150
```
**Artinya:** Ini mungkin batas maksimal Anda. Server mulai struggle di ~150 users.

### Contoh 3: Overload 🔴
```
http_req_failed.....: 12.8%
http_req_duration...: avg=3.2s p(95)=8.5s
vus_max.............: 100
```
**Artinya:** Server tidak kuat! Batas maksimal di bawah 100 users. Perlu optimasi.

## 🔥 Skenario Testing yang Disarankan

### Untuk Pemula (Anda!)

```bash
# 1. MULAI DARI SINI - Test ringan 10 users
cd load-tests
k6 run demo-test.js --env BASE_URL=https://tuntasinaja.vercel.app

# 2. Kalau lancar, lanjut basic test 200 users
k6 run basic-load-test.js --env BASE_URL=https://tuntasinaja.vercel.app

# 3. Kalau masih lancar, cari breaking point
k6 run stress-test.js --env BASE_URL=https://tuntasinaja.vercel.app
```

### Hasil yang Diharapkan (Vercel Hobby Plan)

Berdasarkan pengalaman umum:

| Concurrent Users | Expected Result |
|-----------------|-----------------|
| 10-50 users     | ✅ Lancar, fast response |
| 50-100 users    | ✅ Masih OK, slight delay |
| 100-200 users   | ⚠️ Mulai slow, some errors |
| 200+ users      | 🔴 High error rate, timeouts |

**CATATAN:** Ini estimasi! Real capacity tergantung:
- Kompleksitas database query
- Size response data
- API endpoints yang di-hit
- Cold starts serverless functions

## 🎯 Menemukan Batas Maksimal Anda

Ikuti flow ini:

```
1. Demo Test (10 users)
   ↓ LANCAR?
   
2. Basic Test (200 users)
   ↓ LANCAR?
   
3. Stress Test (500 users)
   ↓ MELIHAT KAPAN MULAI ERROR
   
4. BATAS MAKSIMAL = User count saat error rate > 5%
```

### Contoh:
```
Demo (10):    Error 0.1%  ✅
Basic (200):  Error 4.2%  ⚠️
Stress (500): Error 15%   🔴

KESIMPULAN: Batas maksimal ~150-200 concurrent users
```

## 💡 Tips Penting

### 1. Monitor Vercel Dashboard Selama Test
```
1. Buka: https://vercel.com/dashboard
2. Pilih project TuntasinAja
3. Tab "Analytics" → lihat real-time graphs
4. Perhatikan:
   - Function invocations (naik drastis)
   - Error rate
   - Response time
```

### 2. Jangan Over-Test!
```
⚠️ WARNING:
- Max 3-5 test per hari
- Jangan test terlalu sering
- Vercel bisa block kalau dianggap abuse
- Test saat traffic sepi (malam/dini hari)
```

### 3. Check Vercel Logs
```bash
# Install Vercel CLI kalau belum
npm i -g vercel

# Login
vercel login

# Monitor logs selama test
vercel logs --follow
```

## 📈 Setelah Menemukan Batas Maksimal

### Jika Batas < 100 Users
**Solusi:**
1. 🔍 **Optimize Database:**
   - Add database indexes
   - Optimize slow queries
   - Use connection pooling

2. 🎯 **Cache Responses:**
   - Implement Redis/caching
   - Use SWR for client-side caching
   - Cache static data

3. 🚀 **Code Optimization:**
   - Lazy loading components
   - Reduce bundle size
   - Optimize images

### Jika Batas 100-200 Users
**Status:** ✅ BAGUS untuk Hobby Plan!

**Pilihan:**
1. Tetap di Hobby Plan (sudah cukup untuk small-medium app)
2. Implement caching untuk meningkatkan capacity
3. Consider upgrade ke Pro jika growth cepat

### Jika Batas > 200 Users
**Status:** 🎉 EXCELLENT!

**Next Steps:**
- Monitor production usage
- Prepare untuk upgrade saat user base grow
- Implement analytics untuk track real usage

## 🆘 Troubleshooting

### Problem: "Connection Refused"
**Solusi:**
- Cek URL Vercel Anda benar
- Pastikan app sudah di-deploy
- Test local dulu: `npm run dev`

### Problem: "429 Too Many Requests"
**Solusi:**
- Hit rate limit Vercel
- Tunggu 10-15 menit
- Kurangi request rate di script

### Problem: "Context Deadline Exceeded"
**Solusi:**
- Request timeout > 10 detik (Vercel limit)
- Optimize API/database query
- Reduce response size

### Problem: Error Rate Sangat Tinggi (>50%)
**Solusi:**
- Server completely overwhelmed
- Kurangi target users drastis
- Check logs untuk error spesifik

## 🔧 Kustomisasi Test

### Mengubah Jumlah Users

Edit file test, bagian `options.stages`:

```javascript
export const options = {
  stages: [
    { duration: '1m', target: 20 },   // Ubah dari 50 ke 20
    { duration: '2m', target: 100 },  // Ubah sesuai kebutuhan
  ],
};
```

### Test Endpoint Spesifik

Kalau mau test endpoint tertentu saja:

```javascript
export default function () {
  // Fokus test ke API berat Anda
  const payload = JSON.stringify({ 
    '0': { json: { page: 1, limit: 50 } } 
  });
  
  const res = http.get(
    `${BASE_URL}/api/trpc/thread.getAll?batch=1&input=${encodeURIComponent(payload)}`
  );
  
  check(res, {
    'API responds': (r) => r.status === 200,
    'Fast enough': (r) => r.timings.duration < 1000,
  });
  
  sleep(1);
}
```

## 📚 Resources

### Dokumentasi Lengkap
- `load-tests/README.md` - Dokumentasi detail semua script
- `load-tests/quick-start.md` - Quick start guide

### k6 Documentation
- Official: https://k6.io/docs/
- Examples: https://k6.io/docs/examples/

### Vercel Limits
- Hobby Plan: https://vercel.com/docs/concepts/limits/overview

## 🎯 Action Items untuk Anda

### Sekarang (Hari Ini):
- [ ] Run demo test
- [ ] Catat hasil (error rate, response time)
- [ ] Monitor Vercel dashboard

### Besok:
- [ ] Run basic test
- [ ] Analyze results
- [ ] Determine max capacity

### Minggu Ini:
- [ ] Run stress test (kalau perlu)
- [ ] Document findings
- [ ] Plan optimizations kalau diperlukan

## 🎓 Kesimpulan

**Yang Sudah Anda Punya:**
1. ✅ k6 terinstall dan siap digunakan
2. ✅ 5 jenis test siap pakai
3. ✅ Helper scripts dan dokumentasi
4. ✅ Panduan lengkap interpretasi hasil

**Yang Perlu Anda Lakukan:**
1. Copy URL production Vercel Anda
2. Run `demo-test.js` terlebih dahulu
3. Baca hasil dan lanjut ke test berikutnya
4. Temukan batas maksimal Anda!

**Expected Timeline:**
- Demo Test: 1 menit (40 detik test + setup)
- Basic Test: 7 menit (5 menit test + setup)
- Stress Test: 15 menit (13 menit test + setup)

**Total: ~25 menit untuk mengetahui batas maksimal server Anda!**

---

## 💬 Pertanyaan?

Kalau ada yang kurang jelas atau butuh bantuan interpretasi hasil:
1. Screenshot output test Anda
2. Paste metrics yang muncul
3. Tanya untuk analisis lebih detail

**Selamat Load Testing! 🚀**

---

*Dibuat: ${new Date().toLocaleDateString('id-ID')}*
*Tool: k6 v1.4.2*
*Target: Vercel Hobby Plan*

