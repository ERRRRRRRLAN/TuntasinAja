-- ============================================
-- SCRIPT SQL: CREATE/UPDATE XI BC 1 USERS
-- Email dan password sudah dinormalisasi
-- Password sudah di-hash dengan bcrypt (rounds: 10)
-- ============================================

-- Hapus user XI BC 1 yang sudah ada (optional - uncomment jika perlu)
-- DELETE FROM users WHERE kelas = 'XI BC 1';

-- Buat/Update subscription untuk XI BC 1 (7 hari)
INSERT INTO class_subscriptions (kelas, subscription_end_date, created_at, updated_at)
VALUES ('XI BC 1', NOW() + INTERVAL '7 days', NOW(), NOW())
ON CONFLICT (kelas) DO UPDATE SET
  subscription_end_date = NOW() + INTERVAL '7 days',
  updated_at = NOW();

-- ============================================
-- INSERT USERS
-- ============================================

-- Abel Yolanda Rahmadani (DANTON)
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Abel Yolanda Rahmadani',
  'abelyolanda@tuntasinaja.com',
  '$2a$10$D6duu9uME9miWtob/lbGoe4qQqhBuRXqI.3UZsmsNVAwDgH6hKD5O',
  'XI BC 1',
  false,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Alifa Jatil Ijah 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Alifa Jatil Ijah',
  'alifajatil@tuntasinaja.com',
  '$2a$10$3fc7.lOUUcBYXVPQfhyBh.bxghHtoyd53nY921Iu9amos7KHuoJwi',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Amanda Putri Alfiani 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Amanda Putri Alfiani',
  'amandaputri@tuntasinaja.com',
  '$2a$10$jQK5BKBVUbkIardL8MJgaOz50Z8UzQpDfEAPV3NLue2CgViZmNIF2',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Arel Gamaulana 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Arel Gamaulana',
  'arelgamaulana@tuntasinaja.com',
  '$2a$10$kb04cRbdrOBp11athMht8OrNreDgLwr/2iCgV3mVV3WkyCtPIhRLq',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Saruni Kamila Utami 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Saruni Kamila Utami',
  'sarunikamila@tuntasinaja.com',
  '$2a$10$Qb2nHSgUTHRy33eRsXTip.1C0l5LMmjt64c5t798UjSYJT4sdjz3W',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Saura Sakilla Rudini 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Saura Sakilla Rudini',
  'saurasakilla@tuntasinaja.com',
  '$2a$10$HVqAnEvllOfgmBOa47EAy.aW0XlDzAoczPXoKzmFpI6QQfgMYPZXW',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Aurel Danu Pratama 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Aurel Danu Pratama',
  'aureldanu@tuntasinaja.com',
  '$2a$10$LK7.g9O6NifmO2JU2Gctqe986aWiCf7D5KVaFkIc9UKNfcccoKn6K',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Banyu Pangestu 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Banyu Pangestu',
  'banyupangestu@tuntasinaja.com',
  '$2a$10$AaS72kOlG/80mN1t6n9gg..rjIhJlWKhPR9a/Hg2qfv63BbgP.8D2',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Bella Amanda 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Bella Amanda',
  'bellaamanda@tuntasinaja.com',
  '$2a$10$n/9103tYRiX77iSvRc4q8ePQPSI12ZuMjnS6LhfV1ZUt3NU3z7S4m',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Bianca Desfa Ayundari 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Bianca Desfa Ayundari',
  'biancadesfa@tuntasinaja.com',
  '$2a$10$h4hNfOHwHGXzsP4cWrTlLOJkyVPwCLxD5xCkeQttEkMFlyocuOWDK',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Cahaya Aulia 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Cahaya Aulia',
  'cahayaaulia@tuntasinaja.com',
  '$2a$10$z3w64mX78sza0yLpcG1CAOwVsUaIYwSGgPplFrm7EqeWDw1.Ipy0O',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Cristhoper Gora Parha 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Cristhoper Gora Parha',
  'cristhopergora@tuntasinaja.com',
  '$2a$10$Hk38eevwgnm6P3QYB9mDBeIgoKPH6BQyrylBrRJlUR75FDuMvliQm',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Erdi Saputra 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Erdi Saputra',
  'erdisaputra@tuntasinaja.com',
  '$2a$10$Vv2/wKl3K6SvCfVVNBhpcOLUD/GVvPQT56Yc9iSErZ7LGN29TV2be',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Fabian Muhammad Cheynet 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Fabian Muhammad Cheynet',
  'fabianmuhammad@tuntasinaja.com',
  '$2a$10$F4PpSLovOEZ4V1U.bgib/e5R2t4tAAQHBHGpIjUDXJSFKk/flPgHy',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Fathir Ahmad Sharezad 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Fathir Ahmad Sharezad',
  'fathirahmad@tuntasinaja.com',
  '$2a$10$i6HeetRR.37Zp/uQmhkmYe46mKujy3lbRcr9ZES5U/KTPWO5fwxDG',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Helwa Nida Luthfiah 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Helwa Nida Luthfiah',
  'helwanida@tuntasinaja.com',
  '$2a$10$Vm6.UYVi98uNMHE4jsbrAeoDoOcSP1IHeRYnbPgGoJeEYtSzGv58u',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Istiqomah 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Istiqomah',
  'istiqomah@tuntasinaja.com',
  '$2a$10$rh83ZANv/oKnv/wX7fbd5OJI8aSuOdDnyBYSnuv0mJO91n.SqKgc6',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Kesya Safira 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Kesya Safira',
  'kesyasafira@tuntasinaja.com',
  '$2a$10$y36UnL4h0BKjWor1dVo0SupKcvK.bWRhQxnKE/OCFa9dJNd9ouUay',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Khansa Syafiqah Aurellia 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Khansa Syafiqah Aurellia',
  'khansasyafiqah@tuntasinaja.com',
  '$2a$10$pl9KNAdjh4V/.r/vuuisbO35ynSSOZ5J9xKxLDl8305GXsiJd777e',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Kholishah Rizki Kamilatunnisa 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Kholishah Rizki Kamilatunnisa',
  'kholishahrizki@tuntasinaja.com',
  '$2a$10$ORVsUTjQB1RuLN9kePJ9z./quFawvVQdVWRIguL5tsj9W0GLLnS5S',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Maesya Safinatunazza Ghiffari 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Maesya Safinatunazza Ghiffari',
  'maesyasafinatunazza@tuntasinaja.com',
  '$2a$10$PHyWhl9/D9mhKQl7XOtW3.fFWv85Cu6Ohs41fhLlVSIngB850b9k6',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Mamara Azka Muhana Sakti 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Mamara Azka Muhana Sakti',
  'mamaraazka@tuntasinaja.com',
  '$2a$10$GGJoZm8LycerRG0ElEppIOjUBsfoL0FNWz6szABNK.HaTeyrtTXU.',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Mischa Rachmadianty 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Mischa Rachmadianty',
  'mischarachmadianty@tuntasinaja.com',
  '$2a$10$akDstmQivxDTUKTWjNbjyeos8RhG0b5KGyMH/0sfjeRXcoj1VMseC',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Muhamad Ajril Ilham 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Muhamad Ajril Ilham',
  'muhamadajril@tuntasinaja.com',
  '$2a$10$7375d/4bF01R3Vxn5zjpyugWxln7VaAby2ZBf4mSZKH63FKjIuplK',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Muhamad Fairul Azka 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Muhamad Fairul Azka',
  'muhamadfairul@tuntasinaja.com',
  '$2a$10$r9k51evLRquFgmvle15Ro.Se7dbxlJseJj0Rce1npdJK81gsdeat2',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Muhammad Aria Pakula 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Muhammad Aria Pakula',
  'muhammadaria@tuntasinaja.com',
  '$2a$10$9yt45hXtFSIdz1RJ0peTteBo9SqK1T3xti9ZVyOPKI/KXFXgEKUTi',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Muthi Naura Sabitha 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Muthi Naura Sabitha',
  'muthinaura@tuntasinaja.com',
  '$2a$10$tbTH2WOxaH2OlOSdOMzTneHIEPP0EF6tPikVLrm40Tbt6r4.I9g4K',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Nayla Oktafia 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Nayla Oktafia',
  'naylaoktafia@tuntasinaja.com',
  '$2a$10$yfYrjDGjV6enbsbpKokhKuViJUI6Oo1uju8cVggfjiRyPdfvNBFcW',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Nayra Kanisya Putri 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Nayra Kanisya Putri',
  'nayrakanisya@tuntasinaja.com',
  '$2a$10$XzFhRF8mMSkkMUoseimqSe9pI97zeYAzasobI7EYtXXYVpkwfTPEq',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Noni Juleha 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Noni Juleha',
  'nonijuleha@tuntasinaja.com',
  '$2a$10$1tN7OYGx4SEZEHBst.Wx/O7mtsp9rl.ofDbiY.5EMhAYN2XQkxVgy',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Noviana Nila Sukma 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Noviana Nila Sukma',
  'noviananila@tuntasinaja.com',
  '$2a$10$XYXw8kSd.1IWzxg.tF..Oeo0S01Cg5hHBGrv2RDUzgxDJiVYm.anO',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Octavia Safitri 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Octavia Safitri',
  'octaviasafitri@tuntasinaja.com',
  '$2a$10$Gp5zktIEvlpS0bREeqNuJOlGej919hsn/7/qQxR9pi7qNFQhzfqaG',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Pahroji Hidayatuloh 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Pahroji Hidayatuloh',
  'pahrojihidayatuloh@tuntasinaja.com',
  '$2a$10$WfGAbLCniFhRC0XUqNpTR.Pc3vFolWxq1wneMOka7vNr/2ixIw80u',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Rizky Fadila Ramadhon 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Rizky Fadila Ramadhon',
  'rizkyfadila@tuntasinaja.com',
  '$2a$10$tNpDTHdjymrIKvYIsSscHO1LEpaNguutpvJ4u8qyVXIre0bhuyeg2',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Shifa Fauziah 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Shifa Fauziah',
  'shifafauziah@tuntasinaja.com',
  '$2a$10$dbWjq4tisleQtlOma77yD.AcRlNItB3hnwnt2kmL85Hglk3R3RuLO',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Siska Wulandari 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Siska Wulandari',
  'siskawulandari@tuntasinaja.com',
  '$2a$10$oyGASL.2LUH540mxAIYC7.Ti956nXabxf.y0SyAu.AzV1enCPxsG.',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Syifa Keisa Audia 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Syifa Keisa Audia',
  'syifakeisa@tuntasinaja.com',
  '$2a$10$h4IePoJ0rXYnT4g2SarQFuXj05SrgTJLfcHXVLdnHcfL6p8TBXzfG',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Tiara Salsabila 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Tiara Salsabila',
  'tiarasalsabila@tuntasinaja.com',
  '$2a$10$VrCpbGJLjnmXyc8TXseZ4uPHM7mOu3cQZvL2o/yeq8CtFXRtg8.ui',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Verlita Azzahra 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Verlita Azzahra',
  'verlitaazzahra@tuntasinaja.com',
  '$2a$10$S0SX/fPgWnceEgwNONlUbuUMxE1ttHnX9LZX4FyTfn7jIRmFdHlb.',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- Zulfa Raihana Putri 
INSERT INTO users (id, name, email, password_hash, kelas, is_admin, is_danton, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Zulfa Raihana Putri',
  'zulfaraihana@tuntasinaja.com',
  '$2a$10$nsTFnxizVI6Ylf7/HPsYDecyy74Q2CuSaFraEccbymLGeq4mjttLK',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  kelas = EXCLUDED.kelas,
  is_admin = EXCLUDED.is_admin,
  is_danton = EXCLUDED.is_danton,
  updated_at = NOW();

-- ============================================
-- TOTAL: 40 users (1 Danton + 39 Siswa)
-- KELAS: XI BC 1
-- SUBSCRIPTION: 7 Hari
-- ============================================