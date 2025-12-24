# 🔧 Fix Admin Password - Simple Solution

**Hash baru sudah di-generate!** Gunakan SQL script di bawah ini untuk update password admin.

## 🚀 Quick Fix - 3 Langkah

### Step 1: Buka Supabase SQL Editor
- Login ke https://supabase.com/dashboard
- Pilih project Anda
- Buka **SQL Editor**

### Step 2: Copy Script SQL
Buka file `scripts/fix-admin-password-final.sql` dan copy seluruh isinya.

### Step 3: Run Script
- Paste script ke SQL Editor
- Klik **Run** atau tekan `Ctrl+Enter`

## ✅ Selesai!

Script akan:
- ✅ Update password hash dengan hash baru yang valid
- ✅ Ensure isAdmin = true
- ✅ Normalize email ke lowercase
- ✅ Tampilkan hasil verifikasi

## 🔐 Login Credentials

Setelah script dijalankan, login dengan:
- **Email:** `admin@tuntasinaja.com`
- **Password:** `210609190210`

---

## 📋 File Script

Script lengkap ada di: **`scripts/fix-admin-password-final.sql`**

---

**Catatan:** Hash bcrypt menggunakan random salt, jadi hash ini mungkin berbeda dengan hash sebelumnya, tapi tetap valid untuk password yang sama.

