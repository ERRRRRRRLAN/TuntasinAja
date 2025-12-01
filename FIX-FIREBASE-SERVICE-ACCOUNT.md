# 🔧 Fix FIREBASE_SERVICE_ACCOUNT Error

## ❌ Error yang Terjadi

```
Failed to parse FIREBASE_SERVICE_ACCOUNT: SyntaxError: Unexpected token ''', "'{
  "type"... is not valid JSON
```

## 🔍 Penyebab

Environment variable `FIREBASE_SERVICE_ACCOUNT` di Vercel tidak valid JSON. Kemungkinan:
1. Ada single quotes (`'`) atau double quotes (`"`) di awal/akhir value
2. Format JSON tidak benar
3. Ada escape character yang salah

## ✅ Solusi

### Step 1: Download Service Account JSON dari Firebase

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Pilih project **TuntasinAja**
3. Buka **Project Settings** (ikon gear di kiri atas)
4. Buka tab **Service Accounts**
5. Klik **Generate new private key**
6. Klik **Generate key**
7. File JSON akan terdownload (misal: `tuntasinaja-xxxxx-firebase-adminsdk-xxxxx-xxxxx.json`)

### Step 2: Buka File JSON

Buka file JSON yang terdownload dengan text editor (Notepad, VS Code, dll).

**Format yang benar:**
```json
{
  "type": "service_account",
  "project_id": "tuntasinaja-xxxxx",
  "private_key_id": "xxxxx",
  "private_key": "-----BEGIN PRIVATE KEY-----\nXXXXX\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@tuntasinaja-xxxxx.iam.gserviceaccount.com",
  "client_id": "xxxxx",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40tuntasinaja-xxxxx.iam.gserviceaccount.com"
}
```

### Step 3: Copy Isi JSON

**PENTING:** Copy seluruh isi JSON file, termasuk:
- `{` di awal
- `}` di akhir
- Semua field di dalamnya

**JANGAN:**
- ❌ Tambahkan quotes di awal/akhir
- ❌ Tambahkan single quotes
- ❌ Escape quotes manual
- ❌ Hapus `\n` di private_key

### Step 4: Set di Vercel

1. Buka [Vercel Dashboard](https://vercel.com/dashboard)
2. Pilih project **TuntasinAja**
3. Buka **Settings** → **Environment Variables**
4. Cari variable `FIREBASE_SERVICE_ACCOUNT`
5. Klik **Edit** atau **Add** (jika belum ada)

**Value yang benar:**
- Paste seluruh isi JSON file (tanpa quotes tambahan)
- Harus dimulai dengan `{` dan diakhiri dengan `}`
- Tidak ada quotes di awal/akhir

**Contoh value yang BENAR:**
```
{
  "type": "service_account",
  "project_id": "tuntasinaja-xxxxx",
  ...
}
```

**Contoh value yang SALAH:**
```
'{
  "type": "service_account",
  ...
}'
```

```
"{
  \"type\": \"service_account\",
  ...
}"
```

### Step 5: Save dan Redeploy

1. Klik **Save**
2. Buka tab **Deployments**
3. Klik **...** pada deployment terbaru
4. Pilih **Redeploy**
5. Atau buat deployment baru dengan trigger manual

### Step 6: Verifikasi

Setelah redeploy, test lagi dengan membuat thread baru. Cek Vercel Logs:

**Harus muncul:**
```
[FirebaseAdmin] ✅ Firebase initialized successfully
[FirebaseAdmin] Sending push notification: {...}
[FirebaseAdmin] ✅ Push notification sent: { successCount: 1, ... }
```

**Tidak boleh muncul:**
```
[FirebaseAdmin] ❌ Failed to parse FIREBASE_SERVICE_ACCOUNT
```

## 🔍 Cara Cek Format JSON Valid

### Online Validator
1. Buka [jsonlint.com](https://jsonlint.com/)
2. Paste isi JSON file
3. Klik **Validate JSON**
4. Harus muncul "Valid JSON"

### Manual Check
Pastikan:
- ✅ Dimulai dengan `{`
- ✅ Diakhiri dengan `}`
- ✅ Semua string values dalam double quotes `"`
- ✅ Tidak ada trailing comma
- ✅ `private_key` memiliki `\n` untuk newlines

## 📝 Template Value untuk Vercel

Copy template ini dan isi dengan data dari Firebase:

```json
{
  "type": "service_account",
  "project_id": "YOUR_PROJECT_ID",
  "private_key_id": "YOUR_PRIVATE_KEY_ID",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n",
  "client_email": "YOUR_CLIENT_EMAIL",
  "client_id": "YOUR_CLIENT_ID",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "YOUR_CLIENT_X509_CERT_URL"
}
```

**PENTING:** Ganti semua `YOUR_*` dengan nilai yang benar dari file JSON Firebase.

## ⚠️ Common Mistakes

### ❌ Mistake 1: Menambahkan Quotes
```
'{"type": "service_account", ...}'
```
**Salah!** Jangan tambahkan quotes di awal/akhir.

### ❌ Mistake 2: Escape Quotes Manual
```
"{\"type\": \"service_account\", ...}"
```
**Salah!** Vercel akan handle escape otomatis.

### ❌ Mistake 3: Hapus \n di private_key
```
"private_key": "-----BEGIN PRIVATE KEY-----YOUR_KEY-----END PRIVATE KEY-----"
```
**Salah!** Harus ada `\n` untuk newlines.

### ✅ Correct Format
```
{
  "type": "service_account",
  "project_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  ...
}
```
**Benar!** Langsung paste JSON tanpa modifikasi.

## 🎯 Quick Fix Checklist

- [ ] Download Service Account JSON dari Firebase
- [ ] Buka file JSON dengan text editor
- [ ] Copy seluruh isi JSON (dari `{` sampai `}`)
- [ ] Buka Vercel → Settings → Environment Variables
- [ ] Edit `FIREBASE_SERVICE_ACCOUNT`
- [ ] Paste JSON (tanpa quotes tambahan)
- [ ] Save
- [ ] Redeploy aplikasi
- [ ] Test dengan membuat thread baru
- [ ] Cek Vercel Logs untuk konfirmasi success

## 🔄 Setelah Fix

Setelah fix, kode akan:
1. Auto-clean quotes jika ada
2. Validate required fields
3. Log success message dengan project ID
4. Send notification dengan benar

---

**Status:** Setelah fix ini, notifikasi akan berfungsi dengan benar! ✅

