-- Script untuk menambahkan kelas XI BC 1 dengan subscription 7 hari
-- Tanggal: 2025-01-XX (sesuaikan dengan tanggal saat ini)

-- 1. Insert subscription untuk kelas XI BC 1 (durasi 7 hari)
INSERT INTO "ClassSubscription" (id, "className", "startDate", "endDate", "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'XI BC 1',
  NOW(),
  NOW() + INTERVAL '7 days',
  true,
  NOW(),
  NOW()
);

-- 2. Insert users untuk XI BC 1
-- Password format: 2 kata pertama + 4 angka random
-- Email format: 2 kata pertama (lowercase)

-- ABEL YOLANDA RAHMADANI (Danton)
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'abelyolanda@gmail.com',
  '$2a$10$' || encode(digest('AbelYolanda2847', 'sha256'), 'hex'),
  'Abel Yolanda Rahmadani',
  'XI BC 1',
  true,
  false,
  NOW(),
  NOW()
);

-- ALIFA JATIL IJAH
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'alifajatil@gmail.com',
  '$2a$10$' || encode(digest('AlifaJatil9315', 'sha256'), 'hex'),
  'Alifa Jatil Ijah',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- AMANDA PUTRI ALFIANI
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'amandaputri@gmail.com',
  '$2a$10$' || encode(digest('AmandaPutri4521', 'sha256'), 'hex'),
  'Amanda Putri Alfiani',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- AREL GAMAULANA
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'arelgamaulana@gmail.com',
  '$2a$10$' || encode(digest('ArelGamaulana7638', 'sha256'), 'hex'),
  'Arel Gamaulana',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- SARUNI KAMILA UTAMI
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'sarunikamila@gmail.com',
  '$2a$10$' || encode(digest('SaruniKamila1923', 'sha256'), 'hex'),
  'Saruni Kamila Utami',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- SAURA SAKILLA RUDINI
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'saurasakilla@gmail.com',
  '$2a$10$' || encode(digest('SauraSakilla5749', 'sha256'), 'hex'),
  'Saura Sakilla Rudini',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- AUREL DANU PRATAMA
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'aureldanu@gmail.com',
  '$2a$10$' || encode(digest('AurelDanu3856', 'sha256'), 'hex'),
  'Aurel Danu Pratama',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- BANYU PANGESTU
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'banyupangestu@gmail.com',
  '$2a$10$' || encode(digest('BanyuPangestu2194', 'sha256'), 'hex'),
  'Banyu Pangestu',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- BELLA AMANDA
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'bellaamanda@gmail.com',
  '$2a$10$' || encode(digest('BellaAmanda6472', 'sha256'), 'hex'),
  'Bella Amanda',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- BIANCA DESFA AYUNDARI
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'biancadesfa@gmail.com',
  '$2a$10$' || encode(digest('BiancaDesfa8315', 'sha256'), 'hex'),
  'Bianca Desfa Ayundari',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- CAHAYA AULIA
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'cahayaaulia@gmail.com',
  '$2a$10$' || encode(digest('CahayaAulia9527', 'sha256'), 'hex'),
  'Cahaya Aulia',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- CRISTHOPER GORA PARHA
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'cristhopergora@gmail.com',
  '$2a$10$' || encode(digest('CristhoperGora4168', 'sha256'), 'hex'),
  'Cristhoper Gora Parha',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- ERDI SAPUTRA
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'erdisaputra@gmail.com',
  '$2a$10$' || encode(digest('ErdiSaputra7391', 'sha256'), 'hex'),
  'Erdi Saputra',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- FABIAN MUHAMMAD CHEYNET
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'fabianmuhammad@gmail.com',
  '$2a$10$' || encode(digest('FabianMuhammad5824', 'sha256'), 'hex'),
  'Fabian Muhammad Cheynet',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- FATHIR AHMAD SHAREZAD
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'fathirahmad@gmail.com',
  '$2a$10$' || encode(digest('FathirAhmad3679', 'sha256'), 'hex'),
  'Fathir Ahmad Sharezad',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- HELWA NIDA LUTHFIAH
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'helwanida@gmail.com',
  '$2a$10$' || encode(digest('HelwaNida1245', 'sha256'), 'hex'),
  'Helwa Nida Luthfiah',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- ISTIQOMAH
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'istiqomah@gmail.com',
  '$2a$10$' || encode(digest('Istiqomah8932', 'sha256'), 'hex'),
  'Istiqomah',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- KESYA SAFIRA
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'kesyasafira@gmail.com',
  '$2a$10$' || encode(digest('KesyaSafira4576', 'sha256'), 'hex'),
  'Kesya Safira',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- KHANSA SYAFIQAH AURELLIA
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'khansasyafiqah@gmail.com',
  '$2a$10$' || encode(digest('KhansaSyafiqah9213', 'sha256'), 'hex'),
  'Khansa Syafiqah Aurellia',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- KHOLISHAH RIZKI KAMILATUNNISA
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'kholishahrizki@gmail.com',
  '$2a$10$' || encode(digest('KholishahRizki6847', 'sha256'), 'hex'),
  'Kholishah Rizki Kamilatunnisa',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- MAESYA SAFINATUNAZZA GHIFFARI
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'maesyasafinatunazza@gmail.com',
  '$2a$10$' || encode(digest('MaesyaSafinatunazza3158', 'sha256'), 'hex'),
  'Maesya Safinatunazza Ghiffari',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- MAMARA AZKA MUHANA SAKTI
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'mamaraazka@gmail.com',
  '$2a$10$' || encode(digest('MamaraAzka7429', 'sha256'), 'hex'),
  'Mamara Azka Muhana Sakti',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- MISCHA RACHMADIANTY
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'mischarachmadianty@gmail.com',
  '$2a$10$' || encode(digest('MischaRachmadianty5681', 'sha256'), 'hex'),
  'Mischa Rachmadianty',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- MUHAMAD AJRIL ILHAM
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'muhamadajril@gmail.com',
  '$2a$10$' || encode(digest('MuhamadAjril2937', 'sha256'), 'hex'),
  'Muhamad Ajril Ilham',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- MUHAMAD FAIRUL AZKA
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'muhamadfairul@gmail.com',
  '$2a$10$' || encode(digest('MuhamadFairul8164', 'sha256'), 'hex'),
  'Muhamad Fairul Azka',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- MUHAMMAD ARIA PAKULA
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'muhammadaria@gmail.com',
  '$2a$10$' || encode(digest('MuhammadAria4752', 'sha256'), 'hex'),
  'Muhammad Aria Pakula',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- MUTHI NAURA SABITHA
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'muthinaura@gmail.com',
  '$2a$10$' || encode(digest('MuthiNaura9385', 'sha256'), 'hex'),
  'Muthi Naura Sabitha',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- NAYLA OKTAFIA
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'naylaoktafia@gmail.com',
  '$2a$10$' || encode(digest('NaylaOktafia6219', 'sha256'), 'hex'),
  'Nayla Oktafia',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- NAYRA KANISYA PUTRI
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'nayrakanisya@gmail.com',
  '$2a$10$' || encode(digest('NayraKanisya3847', 'sha256'), 'hex'),
  'Nayra Kanisya Putri',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- NONI JULEHA
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'nonijuleha@gmail.com',
  '$2a$10$' || encode(digest('NoniJuleha5926', 'sha256'), 'hex'),
  'Noni Juleha',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- NOVIANA NILA SUKMA
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'noviananila@gmail.com',
  '$2a$10$' || encode(digest('NovianaNila1473', 'sha256'), 'hex'),
  'Noviana Nila Sukma',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- OCTAVIA SAFITRI
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'octaviasafitri@gmail.com',
  '$2a$10$' || encode(digest('OctaviaSafitri8542', 'sha256'), 'hex'),
  'Octavia Safitri',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- PAHROJI HIDAYATULOH
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'pahrojihidayatuloh@gmail.com',
  '$2a$10$' || encode(digest('PahrojiHidayatuloh2698', 'sha256'), 'hex'),
  'Pahroji Hidayatuloh',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- RIZKY FADILA RAMADHON
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'rizkyfadila@gmail.com',
  '$2a$10$' || encode(digest('RizkyFadila7351', 'sha256'), 'hex'),
  'Rizky Fadila Ramadhon',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- SHIFA FAUZIAH
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'shifafauziah@gmail.com',
  '$2a$10$' || encode(digest('ShifaFauziah4829', 'sha256'), 'hex'),
  'Shifa Fauziah',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- SISKA WULANDARI
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'siskawulandari@gmail.com',
  '$2a$10$' || encode(digest('SiskaWulandari9176', 'sha256'), 'hex'),
  'Siska Wulandari',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- SYIFA KEISA AUDIA
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'syifakeisa@gmail.com',
  '$2a$10$' || encode(digest('SyifaKeisa6384', 'sha256'), 'hex'),
  'Syifa Keisa Audia',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- TIARA SALSABILA
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'tiarasalsabila@gmail.com',
  '$2a$10$' || encode(digest('TiaraSalsabila5217', 'sha256'), 'hex'),
  'Tiara Salsabila',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- VERLITA AZZAHRA
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'verlitaazzahra@gmail.com',
  '$2a$10$' || encode(digest('VerlitaAzzahra8935', 'sha256'), 'hex'),
  'Verlita Azzahra',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- ZULFA RAIHANA PUTRI
INSERT INTO "User" (id, email, password, name, "kelas", "isDanton", "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'zulfaraihana@gmail.com',
  '$2a$10$' || encode(digest('ZulfaRaihana4761', 'sha256'), 'hex'),
  'Zulfa Raihana Putri',
  'XI BC 1',
  false,
  false,
  NOW(),
  NOW()
);

-- Script selesai
-- Total: 40 siswa + 1 subscription untuk kelas XI BC 1

