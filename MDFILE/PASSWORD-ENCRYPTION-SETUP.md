# Password Encryption Setup Guide

## ✅ Yang Sudah Diimplementasikan

1. **Password Encryption System** - Menggunakan AES-256-GCM (reversible encryption)
2. **Admin View Password** - Admin bisa melihat password asli yang sudah di-decrypt
3. **Auto-Encrypt** - Password baru otomatis ter-encrypt saat create/update user
4. **Migration Script** - Script untuk encrypt semua password yang ada

## 🔧 Setup Environment Variable

### Di Local Development (.env)

Pastikan file `.env` sudah memiliki:
```env
PASSWORD_ENCRYPTION_KEY="374bdc8e02fb065e0f4ad1a6b55f4e7de64b1f27144cc44c2235ac1e0f9bb245"
```

### Di Vercel Production

**PENTING:** Environment variable `PASSWORD_ENCRYPTION_KEY` HARUS di-set di Vercel!

**Cara Set:**
1. Buka Vercel Dashboard → Project Settings → Environment Variables
2. Tambahkan variable baru:
   - **Name:** `PASSWORD_ENCRYPTION_KEY`
   - **Value:** `374bdc8e02fb065e0f4ad1a6b55f4e7de64b1f27144cc44c2235ac1e0f9bb245`
   - **Environment:** Production, Preview, Development (semua)
3. Klik "Save"
4. **Redeploy** aplikasi agar environment variable ter-load

## 🧪 Testing

Untuk test apakah decrypt bekerja dengan benar:

```bash
node scripts/test-decrypt.js
```

Script ini akan:
- Test encrypt/decrypt dengan password known
- Test decrypt password dari database
- Menampilkan error jika ada masalah

## 🐛 Troubleshooting

### Password masih menampilkan "Password tidak tersedia"

**Kemungkinan penyebab:**
1. **Environment variable belum di-set di Vercel**
   - ✅ Pastikan `PASSWORD_ENCRYPTION_KEY` sudah di-set di Vercel
   - ✅ Redeploy aplikasi setelah set environment variable

2. **Password belum ter-encrypt**
   - ✅ Jalankan migration: `npm run migrate:password-encryption`
   - ✅ Atau edit password user di admin panel (akan auto-encrypt)

3. **Decrypt error**
   - ✅ Cek console log di server untuk melihat error detail
   - ✅ Pastikan encryption key sama antara encrypt dan decrypt
   - ✅ Pastikan format encrypted password valid (harus ada 4 bagian dipisah `:`)

### Error "Failed to decrypt password"

**Cek:**
1. Apakah `PASSWORD_ENCRYPTION_KEY` sama dengan yang digunakan saat encrypt?
2. Apakah format encrypted password valid? (harus: `salt:iv:tag:encrypted`)
3. Cek server logs untuk detail error

## 📝 Cara Kerja

1. **Saat Create/Update User:**
   - Password di-hash dengan bcrypt (untuk autentikasi)
   - Password di-encrypt dengan AES-256-GCM (untuk admin view)
   - Keduanya disimpan di database

2. **Saat Admin View Password:**
   - System mengambil `passwordEncrypted` dari database
   - Decrypt menggunakan `PASSWORD_ENCRYPTION_KEY`
   - Tampilkan password asli di admin panel

3. **Security:**
   - Password tetap di-hash dengan bcrypt untuk autentikasi (tidak berubah)
   - Encrypted password hanya untuk admin view
   - Hanya admin yang bisa melihat password asli

## ✅ Checklist

- [ ] `PASSWORD_ENCRYPTION_KEY` sudah di-set di `.env` (local)
- [ ] `PASSWORD_ENCRYPTION_KEY` sudah di-set di Vercel (production)
- [ ] Aplikasi sudah di-redeploy setelah set environment variable
- [ ] Migration sudah dijalankan: `npm run migrate:password-encryption`
- [ ] Test decrypt: `node scripts/test-decrypt.js` berhasil
- [ ] Admin panel bisa melihat password asli

## 🚨 PENTING

**JANGAN** commit file `.env` ke git! File ini sudah di-ignore.

**JANGAN** share `PASSWORD_ENCRYPTION_KEY` ke public! Key ini harus tetap secret.

