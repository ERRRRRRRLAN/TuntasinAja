# Setup XI BC 1 - Script Documentation

## 📋 Overview
Script untuk menambahkan 40 siswa kelas XI BC 1 dengan subscription 7 hari.

### Data Pelanggan:
- **Kelas:** XI BC 1
- **Durasi:** 7 Hari
- **Total Siswa:** 40 orang
- **Danton:** Abel Yolanda Rahmadani

## 🚀 Cara Menjalankan Script

### Opsi 1: Menggunakan TypeScript Script (RECOMMENDED)

Script ini akan:
- ✅ Hash password dengan bcrypt yang proper
- ✅ Check duplicate user
- ✅ Create subscription otomatis
- ✅ Error handling yang baik

```bash
# 1. Install dependencies (jika belum)
npm install

# 2. Jalankan script
npx ts-node scripts/add-xi-bc-1-users.ts

# Atau dengan tsx
npx tsx scripts/add-xi-bc-1-users.ts
```

### Opsi 2: Menggunakan SQL Script (Manual)

**⚠️ PERHATIAN:** SQL script menggunakan hash yang simplified, sebaiknya gunakan TypeScript script!

```bash
# Jalankan SQL script
psql -U postgres -d tuntasinaja -f scripts/add-xi-bc-1-users.sql
```

## 📝 Kredensial Lengkap

Lihat file `XI-BC-1-CREDENTIALS.txt` untuk daftar lengkap email dan password semua siswa.

### Contoh Kredensial:

**DANTON:**
- Nama: Abel Yolanda Rahmadani
- Email: abelyolanda@gmail.com
- Password: AbelYolanda2847
- Role: isDanton = true

**SISWA (contoh):**
- Nama: Alifa Jatil Ijah
- Email: alifajatil@gmail.com
- Password: AlifaJatil9315

## 📋 Format Data

### Email Format:
- 2 kata pertama dari nama (lowercase)
- Contoh: "Abel Yolanda Rahmadani" → `abelyolanda@gmail.com`
- Jika 1 kata: "Istiqomah" → `istiqomah@gmail.com`

### Password Format:
- 2 kata pertama dari nama (PascalCase) + 4 angka random
- Contoh: "Abel Yolanda Rahmadani" → `AbelYolanda2847`
- Jika 1 kata: "Istiqomah" → `Istiqomah8932`

### Nama Format:
- Proper case (huruf kapital di awal kata)
- Contoh: "ABEL YOLANDA RAHMADANI" → "Abel Yolanda Rahmadani"

## 🔍 Verifikasi Setelah Import

### 1. Cek Subscription
```sql
SELECT * FROM "class_subscriptions" 
WHERE kelas = 'XI BC 1';
```

### 2. Cek Users
```sql
SELECT id, name, email, kelas, is_danton 
FROM "users" 
WHERE kelas = 'XI BC 1'
ORDER BY is_danton DESC, name ASC;
```

### 3. Count Users
```sql
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_danton = true) as danton_count
FROM "users" 
WHERE kelas = 'XI BC 1';
```

Expected Result:
- Total: 40
- Danton: 1

## 🎯 Checklist

- [ ] Database sudah running
- [ ] Prisma sudah generate (`npx prisma generate`)
- [ ] Environment variables sudah set
- [ ] Script berhasil dijalankan
- [ ] Verifikasi jumlah user (40 siswa)
- [ ] Verifikasi danton (Abel)
- [ ] Verifikasi subscription (7 hari)
- [ ] Test login dengan salah satu kredensial
- [ ] File XI-BC-1-CREDENTIALS.txt sudah dibagikan ke admin/danton

## ⚙️ Troubleshooting

### Error: "User already exists"
- Cek database apakah user dengan email tersebut sudah ada
- Script akan skip user yang sudah ada

### Error: "Cannot connect to database"
- Pastikan DATABASE_URL sudah set di .env
- Pastikan database sudah running

### Error: "Prisma Client not generated"
```bash
npx prisma generate
```

## 📊 Output Example

```
🚀 Starting to add XI BC 1 students...

📝 Creating subscription for XI BC 1 (7 days)...
✅ Subscription created: abc123...

👥 Creating users...

✅ Created: Abel Yolanda Rahmadani (DANTON)
✅ Created: Alifa Jatil Ijah
✅ Created: Amanda Putri Alfiani
...
✅ Created: Zulfa Raihana Putri

==================================================
📊 SUMMARY
==================================================
✅ Successfully created: 40 users
❌ Errors: 0
📦 Total students: 40
📅 Subscription: 7 days
🎓 Class: XI BC 1
==================================================
```

## 🔐 Security Notes

1. ✅ Password sudah di-hash dengan bcrypt (rounds: 10)
2. ✅ Email unique constraint
3. ✅ Subscription dengan durasi 7 hari
4. ⚠️ Simpan file XI-BC-1-CREDENTIALS.txt dengan aman
5. ⚠️ Bagikan kredensial hanya ke danton/admin yang berwenang

## 📞 Support

Jika ada masalah, hubungi admin atau check:
- Database logs
- Prisma Studio: `npx prisma studio`
- Application logs

