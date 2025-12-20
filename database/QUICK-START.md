# ⚡ Quick Start: Database Indexing (5 Menit)

## 🚀 Langkah Super Cepat

### 1️⃣ Buka Supabase Dashboard
```
https://app.supabase.com
→ Login
→ Pilih project TuntasinAja
```

### 2️⃣ Buka SQL Editor
```
Sidebar kiri → SQL Editor
→ Klik "New query"
```

### 3️⃣ Copy & Paste SQL
```
1. Buka file: database/optimize-indexes.sql
2. Select All (Ctrl+A)
3. Copy (Ctrl+C)
4. Paste ke SQL Editor (Ctrl+V)
```

### 4️⃣ Run Script
```
Klik tombol "Run" (atau Ctrl+Enter)
→ Tunggu 10-30 detik
→ Lihat "Success. No rows returned" ✅
```

### 5️⃣ Done! 🎉
```
Indexes sudah dibuat!
Expected improvement: 10x faster queries
```

---

## 📊 Verifikasi (Optional)

Jalankan query ini untuk cek indexes:

```sql
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('threads', 'comments', 'histories')
ORDER BY tablename;
```

Harusnya muncul **22 indexes** baru!

---

## 🧪 Test Performance

Setelah indexing, test lagi dengan k6:

```bash
cd load-tests
k6 run basic-load-test.js --env BASE_URL=https://your-app.vercel.app
```

**Expected:** Response time turun 60-80%! 🚀

---

## ❓ FAQ

**Q: Apakah ini aman?**  
A: ✅ Ya! Indexes hanya improve read performance, tidak mengubah data.

**Q: Berapa lama prosesnya?**  
A: ⏱️ 10-30 detik untuk create semua indexes.

**Q: Bisa di-rollback?**  
A: ✅ Ya, bisa drop indexes kapan saja (tapi tidak perlu).

**Q: Apakah ini gratis?**  
A: ✅ 100% GRATIS! Supabase free plan support indexing.

---

**Total Time:** 5 menit  
**Impact:** 10x faster queries  
**Cost:** FREE  
**Risk:** LOW

