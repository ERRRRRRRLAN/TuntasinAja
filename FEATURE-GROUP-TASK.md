# 📋 Fitur Tugas Kelompok - Dokumentasi Lengkap

## 🎯 Konsep Utama

Fitur tugas kelompok memungkinkan user untuk membuat tugas yang hanya bisa dilihat dan dikerjakan oleh anggota kelompok tertentu. User pembuat tugas bisa memilih anggota kelompoknya, dan hanya anggota yang dipilih yang bisa melihat thread tersebut.

---

## 🔄 Flow Lengkap

### 1. Pembuatan Tugas Kelompok
```
User buat thread → Toggle "Tugas Kelompok" ON → Input "Maksimal Anggota" (default 5, termasuk pembuat)
→ Upload → Thread muncul dengan badge "Kelompok" + tombol "Buat Kelompok"
```

### 2. Membuat Kelompok
```
User klik "Buat Kelompok" → Modal dengan autocomplete/search
→ User ketik nama (misal: "makarim") → Muncul "Makarim Ahmad Muharram"
→ User pilih anggota dari autocomplete → Validasi: jumlah anggota + pembuat <= maxGroupMembers
→ Submit → Validasi: semua nama harus exact match dengan database
→ Jika ada nama tidak ditemukan → Error: "User bernama 'makarim' tidak ada"
→ Jika valid → Anggota otomatis jadi anggota + pembuat otomatis jadi anggota
→ Thread muncul di feed mereka
```

### 3. Visibility Control
```
User D (tidak dipilih) → Thread TIDAK muncul di feed mereka
Anggota yang sudah join → Checkbox muncul, bisa check/uncheck
```

---

## 🗄️ Database Schema

### Model Thread
```prisma
model Thread {
  // ... existing fields
  isGroupTask     Boolean   @default(false) @map("is_group_task")
  maxGroupMembers Int?      @map("max_group_members") // Maksimal anggota per kelompok (termasuk pembuat)
  groupMembers    GroupMember[]
}
```

### Model GroupMember
```prisma
model GroupMember {
  id          String    @id @default(cuid())
  threadId    String    @map("thread_id")
  userId      String    @map("user_id")
  addedBy     String    @map("added_by") // User yang menambahkan (pembuat thread)
  addedAt     DateTime  @default(now()) @map("added_at")
  
  thread      Thread    @relation(fields: [threadId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  adder       User      @relation("AddedBy", fields: [addedBy], references: [id], onDelete: Cascade)
  
  @@unique([threadId, userId])
  @@index([threadId])
  @@index([userId])
  @@map("group_members")
}
```

### Update User Model
```prisma
model User {
  // ... existing fields
  groupMembers     GroupMember[]
  addedGroupMembers GroupMember[] @relation("AddedBy")
}
```

---

## 🔍 Visibility Control Logic

### Query Filter di `thread.getAll`
```typescript
const whereClause = isAdmin
  ? undefined // Admin sees all
  : {
      OR: [
        // Regular threads (not group task) - show to all in same kelas
        {
          isGroupTask: false,
          author: { kelas: userKelas }
        },
        // Group tasks - only show if user is a member
        {
          isGroupTask: true,
          groupMembers: {
            some: {
              userId: userId
            }
          }
        }
      ]
    }
```

---

## 🎨 UI Components

### 1. Toggle di Form Create Thread
```tsx
<div className="form-group">
  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
    <input 
      type="checkbox" 
      checked={isGroupTask}
      onChange={(e) => setIsGroupTask(e.target.checked)}
    />
    <span>Tugas Kelompok</span>
  </label>
  <small className="form-hint">
    {isGroupTask 
      ? "Tugas ini untuk kelompok tertentu. Setelah upload, Anda bisa pilih anggota kelompok."
      : "Tugas biasa untuk semua siswa di kelas yang sama."
    }
  </small>
</div>

{/* Field Maksimal Anggota - hanya muncul jika isGroupTask = true */}
{isGroupTask && (
  <div className="form-group">
    <label htmlFor="maxGroupMembers">Maksimal Anggota (termasuk Anda) *</label>
    <input
      id="maxGroupMembers"
      type="number"
      min="2"
      max="50"
      value={maxGroupMembers}
      onChange={(e) => setMaxGroupMembers(parseInt(e.target.value) || 5)}
      required={isGroupTask}
    />
    <small className="form-hint">
      Jumlah maksimal anggota per kelompok. Anda (pembuat) sudah termasuk dalam jumlah ini.
    </small>
  </div>
)}
```

### 2. Thread Card - Belum Ada Anggota
```tsx
{isGroupTask && !hasGroupMembers && isThreadAuthor && (
  <div style={{ 
    padding: '0.75rem',
    background: 'var(--bg-secondary)',
    borderRadius: '0.5rem',
    marginTop: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem'
  }}>
    <span style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
      👥 Tugas Kelompok - Belum ada anggota
    </span>
    <button 
      onClick={() => setShowCreateGroupModal(true)}
      className="btn btn-primary"
      style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
    >
      Buat Kelompok
    </button>
  </div>
)}
```

### 3. Thread Card - Sudah Ada Anggota
```tsx
{isGroupTask && hasGroupMembers && (
  <div style={{ 
    padding: '0.5rem',
    background: 'var(--bg-secondary)',
    borderRadius: '0.5rem',
    marginTop: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem'
  }}>
    <span>👥 Kelompok</span>
    <span style={{ color: 'var(--text-light)' }}>
      {memberCount} anggota
    </span>
    {isThreadAuthor && (
      <button 
        onClick={() => setShowManageGroupModal(true)}
        className="btn btn-secondary"
        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', marginLeft: 'auto' }}
      >
        Kelola
      </button>
    )}
  </div>
)}
```

### 4. Badge Kelompok
```tsx
{isGroupTask && (
  <span className="badge-group" style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.25rem 0.5rem',
    background: 'var(--primary-light)',
    color: 'var(--primary)',
    borderRadius: '0.25rem',
    fontSize: '0.75rem',
    fontWeight: 500
  }}>
    👥 Kelompok
  </span>
)}
```

### 5. Checkbox Conditional Rendering
```tsx
// Di ThreadCard dan ThreadQuickView
{session && !isAdmin && (!isGroupTask || isGroupMember) && (
  <Checkbox ... />
)}
```

---

## 🔌 API Endpoints (tRPC)

### Router: `groupTask`

#### 1. getAvailableUsers
```typescript
getAvailableUsers: protectedProcedure
  .input(z.object({ threadId: z.string() }))
  .query(async ({ ctx, input }) => {
    // Get thread author's kelas
    // Get users from same kelas (exclude current user, admin, already added)
    // Return list of available users
  })
```

#### 2. searchUsersByName (untuk autocomplete)
```typescript
searchUsersByName: protectedProcedure
  .input(z.object({
    threadId: z.string(),
    query: z.string().min(1) // Nama yang diketik user
  }))
  .query(async ({ ctx, input }) => {
    // Get thread author's kelas
    // Search users by name (case-insensitive, contains match)
    // Exclude current user, admin, already added members
    // Return list dengan nama lengkap untuk autocomplete
    // Format: { id, name, email } - name adalah nama lengkap dari database
  })
```

#### 3. createGroup
```typescript
createGroup: protectedProcedure
  .input(z.object({
    threadId: z.string(),
    userNames: z.array(z.string()) // Array of names (bukan userIds)
  }))
  .mutation(async ({ ctx, input }) => {
    // Validate: user is thread author
    // Validate: thread is group task
    // Validate: semua nama harus exact match dengan database
    // Jika ada nama tidak ditemukan → Error: "User bernama 'X' tidak ada"
    // Validate: jumlah anggota + pembuat <= maxGroupMembers
    // Convert names to userIds
    // Auto-add creator as member
    // Add members (batch insert)
    // Return success
  })
```

#### 3. getGroupMembers
```typescript
getGroupMembers: protectedProcedure
  .input(z.object({ threadId: z.string() }))
  .query(async ({ ctx, input }) => {
    // Get all members with user info
    // Include progress status (optional)
    // Return members list
  })
```

#### 4. removeMember
```typescript
removeMember: protectedProcedure
  .input(z.object({
    threadId: z.string(),
    userId: z.string()
  }))
  .mutation(async ({ ctx, input }) => {
    // Validate: user is thread author
    // Validate: not removing creator (or allow with special handling)
    // Remove member
    // Return success
  })
```

#### 5. addMembers (untuk manage group)
```typescript
addMembers: protectedProcedure
  .input(z.object({
    threadId: z.string(),
    userIds: z.array(z.string())
  }))
  .mutation(async ({ ctx, input }) => {
    // Validate: user is thread author
    // Validate: users from same kelas
    // Add members (skip duplicates)
    // Return success
  })
```

---

## ✅ Validasi & Edge Cases

### 1. Validasi Create Group
- ✅ Minimal 1 anggota (selain pembuat)
- ✅ Maksimal anggota: jumlah anggota yang dipilih + pembuat <= maxGroupMembers (dari thread)
- ✅ User harus dari kelas yang sama dengan pembuat
- ✅ Tidak bisa menambahkan user yang sudah jadi anggota
- ✅ Hanya pembuat thread yang bisa create/manage group
- ✅ **Validasi Nama Exact Match**: Semua nama yang dipilih harus exact match dengan database. Jika user ketik "makarim" dan submit, tapi tidak ada user dengan nama exact "makarim", maka error: "User bernama 'makarim' tidak ada"

### 2. Validasi Remove Member
- ✅ Tidak bisa remove semua anggota (minimal pembuat harus tetap ada)
- ✅ Hanya pembuat thread yang bisa remove member
- ✅ Validasi ownership di backend

### 3. Edge Cases
- ✅ Handle thread yang sudah ada anggota (ubah tombol jadi "Kelola")
- ✅ Handle user yang dihapus dari kelas (tetap jadi anggota atau auto-remove)
- ✅ Handle thread yang sudah selesai (boleh tambah anggota)
- ✅ Handle concurrent requests (race condition)

---

## 🎯 Fitur Tambahan (Saran)

### Fase 1 (MVP - Wajib)
1. ✅ Auto-add pembuat sebagai anggota
2. ✅ Validasi minimal 1 anggota
3. ✅ Validasi ownership (hanya pembuat bisa manage)
4. ✅ Validasi kelas (anggota harus dari kelas yang sama)
5. ✅ Error messages yang jelas

### Fase 2 (Nice to Have)
6. ✅ Search/filter di modal pilih anggota
7. ✅ Progress tracking per anggota
8. ✅ Notifikasi ke anggota baru (opsional)
9. ✅ Mobile optimization (bottom sheet)

### Fase 3 (Future)
10. ✅ Group templates
11. ✅ Group chat/discussion
12. ✅ Task assignment per anggota
13. ✅ Group deadlines berbeda per anggota

---

## 📱 Mobile Optimization

### Bottom Sheet Modal
```tsx
// Untuk mobile, gunakan bottom sheet style
<div className="modal-overlay" style={{
  // ... overlay styles
  '@media (max-width: 768px)': {
    alignItems: 'flex-end'
  }
}}>
  <div className="modal-content" style={{
    // ... content styles
    '@media (max-width: 768px)': {
      maxHeight: '80vh',
      borderTopLeftRadius: '1rem',
      borderTopRightRadius: '1rem',
      borderBottomLeftRadius: '0',
      borderBottomRightRadius: '0'
    }
  }}>
    {/* Modal content */}
  </div>
</div>
```

---

## 🔔 Notifikasi (Opsional)

### Notifikasi ke Anggota Baru
```typescript
// Saat anggota ditambahkan
await sendNotificationToUsers(
  userIds,
  {
    title: 'Anda ditambahkan ke tugas kelompok',
    body: `${thread.title} - ${author.name} menambahkan Anda ke kelompok`,
    data: { threadId: thread.id, type: 'group_added' }
  }
)
```

---

## 📊 Progress Tracking

### Status Per Anggota
- ⭕ Belum mulai: Tidak ada progress sama sekali
- ⏳ Sedang: Ada progress (beberapa sub-tugas selesai)
- ✅ Selesai: Semua tugas selesai

### Progress Bar
```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
  <div style={{ flex: 1, height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
    <div style={{ 
      height: '100%', 
      background: 'var(--primary)', 
      width: `${(completedCount / totalCount) * 100}%`,
      transition: 'width 0.3s ease'
    }} />
  </div>
  <span style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
    {completedCount}/{totalCount} selesai
  </span>
</div>
```

---

## 🧪 Test Cases

### 1. Create Group
- [ ] Create dengan 0 anggota → Error
- [ ] Create dengan 1 anggota → Success
- [ ] Create dengan banyak anggota → Success
- [ ] Create dengan user dari kelas berbeda → Error
- [ ] Create dengan user yang sudah jadi anggota → Skip duplicate

### 2. Remove Member
- [ ] Remove anggota biasa → Success
- [ ] Remove semua anggota → Error (minimal pembuat)
- [ ] Remove oleh non-pembuat → Error

### 3. Visibility
- [ ] User non-anggota tidak melihat thread → Correct
- [ ] User anggota melihat thread → Correct
- [ ] Admin melihat semua → Correct

### 4. Checkbox
- [ ] Checkbox muncul untuk anggota → Correct
- [ ] Checkbox tidak muncul untuk non-anggota → Correct
- [ ] Checkbox berfungsi normal untuk anggota → Correct

---

## 🚀 Implementation Order

1. Database schema & migration
2. API endpoints (tRPC router)
3. UI toggle di create form
4. Visibility control di query
5. Thread card UI (badge, tombol)
6. Modal create group
7. Checkbox conditional rendering
8. Progress tracking
9. Manage group (tambah/hapus anggota)
10. Error handling & validasi
11. Mobile optimization
12. Testing & polish

---

## 📝 Notes

- Pembuat thread otomatis jadi anggota saat create group
- Tidak perlu fitur "join" - hanya "create/manage" oleh pembuat
- Visibility control di query level untuk performa
- Progress tracking optional, bisa ditambah nanti
- Notifikasi optional, bisa ditambah nanti

