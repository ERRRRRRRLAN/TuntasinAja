-- Script untuk menambahkan kelas XI BC 1 dengan subscription 7 hari
-- Tanggal: 2025-01-XX (sesuaikan dengan tanggal saat ini)
-- Email domain: @tuntasinaja.com

-- 1. Insert or Update subscription untuk kelas XI BC 1 (durasi 7 hari)
-- Menggunakan ON CONFLICT untuk update jika sudah ada
INSERT INTO "class_subscriptions" (id, kelas, subscription_end_date, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'XI BC 1',
  NOW() + INTERVAL '7 days',
  NOW(),
  NOW()
)
ON CONFLICT (kelas) 
DO UPDATE SET 
  subscription_end_date = NOW() + INTERVAL '7 days',
  updated_at = NOW();

-- 2. Insert users untuk XI BC 1
-- Password format: 2 kata pertama + 4 angka random
-- Email format: 2 kata pertama (lowercase) + @tuntasinaja.com
-- PENTING: Password di-hash dengan bcrypt, jalankan TypeScript script untuk hash yang proper!
-- SQL script ini menggunakan simplified hash, GUNAKAN TypeScript script untuk production!

-- ABEL YOLANDA RAHMADANI (ketua)
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'abelyolanda@tuntasinaja.com',
  '$2a$10$' || encode(digest('AbelYolanda2847', 'sha256'), 'hex'),
  'Abel Yolanda Rahmadani',
  'XI BC 1',
  true,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- ALIFA JATIL IJAH
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'alifajatil@tuntasinaja.com',
  '$2a$10$' || encode(digest('AlifaJatil9315', 'sha256'), 'hex'),
  'Alifa Jatil Ijah',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- AMANDA PUTRI ALFIANI
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'amandaputri@tuntasinaja.com',
  '$2a$10$' || encode(digest('AmandaPutri4521', 'sha256'), 'hex'),
  'Amanda Putri Alfiani',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- AREL GAMAULANA
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'arelgamaulana@tuntasinaja.com',
  '$2a$10$' || encode(digest('ArelGamaulana7638', 'sha256'), 'hex'),
  'Arel Gamaulana',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- SARUNI KAMILA UTAMI
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'sarunikamila@tuntasinaja.com',
  '$2a$10$' || encode(digest('SaruniKamila1923', 'sha256'), 'hex'),
  'Saruni Kamila Utami',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- SAURA SAKILLA RUDINI
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'saurasakilla@tuntasinaja.com',
  '$2a$10$' || encode(digest('SauraSakilla5749', 'sha256'), 'hex'),
  'Saura Sakilla Rudini',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- AUREL DANU PRATAMA
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'aureldanu@tuntasinaja.com',
  '$2a$10$' || encode(digest('AurelDanu3856', 'sha256'), 'hex'),
  'Aurel Danu Pratama',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- BANYU PANGESTU
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'banyupangestu@tuntasinaja.com',
  '$2a$10$' || encode(digest('BanyuPangestu2194', 'sha256'), 'hex'),
  'Banyu Pangestu',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- BELLA AMANDA
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'bellaamanda@tuntasinaja.com',
  '$2a$10$' || encode(digest('BellaAmanda6472', 'sha256'), 'hex'),
  'Bella Amanda',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- BIANCA DESFA AYUNDARI
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'biancadesfa@tuntasinaja.com',
  '$2a$10$' || encode(digest('BiancaDesfa8315', 'sha256'), 'hex'),
  'Bianca Desfa Ayundari',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- CAHAYA AULIA
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'cahayaaulia@tuntasinaja.com',
  '$2a$10$' || encode(digest('CahayaAulia9527', 'sha256'), 'hex'),
  'Cahaya Aulia',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- CRISTHOPER GORA PARHA
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'cristhopergora@tuntasinaja.com',
  '$2a$10$' || encode(digest('CristhoperGora4168', 'sha256'), 'hex'),
  'Cristhoper Gora Parha',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- ERDI SAPUTRA
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'erdisaputra@tuntasinaja.com',
  '$2a$10$' || encode(digest('ErdiSaputra7391', 'sha256'), 'hex'),
  'Erdi Saputra',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- FABIAN MUHAMMAD CHEYNET
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'fabianmuhammad@tuntasinaja.com',
  '$2a$10$' || encode(digest('FabianMuhammad5824', 'sha256'), 'hex'),
  'Fabian Muhammad Cheynet',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- FATHIR AHMAD SHAREZAD
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'fathirahmad@tuntasinaja.com',
  '$2a$10$' || encode(digest('FathirAhmad3679', 'sha256'), 'hex'),
  'Fathir Ahmad Sharezad',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- HELWA NIDA LUTHFIAH
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'helwanida@tuntasinaja.com',
  '$2a$10$' || encode(digest('HelwaNida1245', 'sha256'), 'hex'),
  'Helwa Nida Luthfiah',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- ISTIQOMAH
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'istiqomah@tuntasinaja.com',
  '$2a$10$' || encode(digest('Istiqomah8932', 'sha256'), 'hex'),
  'Istiqomah',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- KESYA SAFIRA
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'kesyasafira@tuntasinaja.com',
  '$2a$10$' || encode(digest('KesyaSafira4576', 'sha256'), 'hex'),
  'Kesya Safira',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- KHANSA SYAFIQAH AURELLIA
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'khansasyafiqah@tuntasinaja.com',
  '$2a$10$' || encode(digest('KhansaSyafiqah9213', 'sha256'), 'hex'),
  'Khansa Syafiqah Aurellia',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- KHOLISHAH RIZKI KAMILATUNNISA
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'kholishahrizki@tuntasinaja.com',
  '$2a$10$' || encode(digest('KholishahRizki6847', 'sha256'), 'hex'),
  'Kholishah Rizki Kamilatunnisa',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- MAESYA SAFINATUNAZZA GHIFFARI
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'maesyasafinatunazza@tuntasinaja.com',
  '$2a$10$' || encode(digest('MaesyaSafinatunazza3158', 'sha256'), 'hex'),
  'Maesya Safinatunazza Ghiffari',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- MAMARA AZKA MUHANA SAKTI
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'mamaraazka@tuntasinaja.com',
  '$2a$10$' || encode(digest('MamaraAzka7429', 'sha256'), 'hex'),
  'Mamara Azka Muhana Sakti',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- MISCHA RACHMADIANTY
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'mischarachmadianty@tuntasinaja.com',
  '$2a$10$' || encode(digest('MischaRachmadianty5681', 'sha256'), 'hex'),
  'Mischa Rachmadianty',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- MUHAMAD AJRIL ILHAM
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'muhamadajril@tuntasinaja.com',
  '$2a$10$' || encode(digest('MuhamadAjril2937', 'sha256'), 'hex'),
  'Muhamad Ajril Ilham',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- MUHAMAD FAIRUL AZKA
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'muhamadfairul@tuntasinaja.com',
  '$2a$10$' || encode(digest('MuhamadFairul8164', 'sha256'), 'hex'),
  'Muhamad Fairul Azka',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- MUHAMMAD ARIA PAKULA
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'muhammadaria@tuntasinaja.com',
  '$2a$10$' || encode(digest('MuhammadAria4752', 'sha256'), 'hex'),
  'Muhammad Aria Pakula',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- MUTHI NAURA SABITHA
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'muthinaura@tuntasinaja.com',
  '$2a$10$' || encode(digest('MuthiNaura9385', 'sha256'), 'hex'),
  'Muthi Naura Sabitha',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- NAYLA OKTAFIA
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'naylaoktafia@tuntasinaja.com',
  '$2a$10$' || encode(digest('NaylaOktafia6219', 'sha256'), 'hex'),
  'Nayla Oktafia',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- NAYRA KANISYA PUTRI
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'nayrakanisya@tuntasinaja.com',
  '$2a$10$' || encode(digest('NayraKanisya3847', 'sha256'), 'hex'),
  'Nayra Kanisya Putri',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- NONI JULEHA
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'nonijuleha@tuntasinaja.com',
  '$2a$10$' || encode(digest('NoniJuleha5926', 'sha256'), 'hex'),
  'Noni Juleha',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- NOVIANA NILA SUKMA
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'noviananila@tuntasinaja.com',
  '$2a$10$' || encode(digest('NovianaNila1473', 'sha256'), 'hex'),
  'Noviana Nila Sukma',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- OCTAVIA SAFITRI
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'octaviasafitri@tuntasinaja.com',
  '$2a$10$' || encode(digest('OctaviaSafitri8542', 'sha256'), 'hex'),
  'Octavia Safitri',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- PAHROJI HIDAYATULOH
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'pahrojihidayatuloh@tuntasinaja.com',
  '$2a$10$' || encode(digest('PahrojiHidayatuloh2698', 'sha256'), 'hex'),
  'Pahroji Hidayatuloh',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- RIZKY FADILA RAMADHON
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'rizkyfadila@tuntasinaja.com',
  '$2a$10$' || encode(digest('RizkyFadila7351', 'sha256'), 'hex'),
  'Rizky Fadila Ramadhon',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- SHIFA FAUZIAH
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'shifafauziah@tuntasinaja.com',
  '$2a$10$' || encode(digest('ShifaFauziah4829', 'sha256'), 'hex'),
  'Shifa Fauziah',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- SISKA WULANDARI
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'siskawulandari@tuntasinaja.com',
  '$2a$10$' || encode(digest('SiskaWulandari9176', 'sha256'), 'hex'),
  'Siska Wulandari',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- SYIFA KEISA AUDIA
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'syifakeisa@tuntasinaja.com',
  '$2a$10$' || encode(digest('SyifaKeisa6384', 'sha256'), 'hex'),
  'Syifa Keisa Audia',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- TIARA SALSABILA
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'tiarasalsabila@tuntasinaja.com',
  '$2a$10$' || encode(digest('TiaraSalsabila5217', 'sha256'), 'hex'),
  'Tiara Salsabila',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- VERLITA AZZAHRA
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'verlitaazzahra@tuntasinaja.com',
  '$2a$10$' || encode(digest('VerlitaAzzahra8935', 'sha256'), 'hex'),
  'Verlita Azzahra',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- ZULFA RAIHANA PUTRI
INSERT INTO "users" (id, email, password_hash, name, kelas, is_ketua, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'zulfaraihana@tuntasinaja.com',
  '$2a$10$' || encode(digest('ZulfaRaihana4761', 'sha256'), 'hex'),
  'Zulfa Raihana Putri',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Script selesai
-- Total: 40 siswa + 1 subscription untuk kelas XI BC 1
-- Email domain: @tuntasinaja.com
