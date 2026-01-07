'use client'

import { useState, useMemo } from 'react'
import { trpc } from '@/lib/trpc'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { toast } from '@/components/ui/ToastContainer'
import { TrashIcon, PlusIcon, BookIcon, XIconSmall } from '@/components/ui/Icons'
import ComboBox from '@/components/ui/ComboBox'

// Generate list of kelas options
const generateKelasOptions = () => {
  const kelasOptions: string[] = []
  const tingkat = ['X', 'XI', 'XII']
  const jurusan = ['RPL', 'TKJ', 'BC']
  const nomor = ['1', '2']

  tingkat.forEach((t) => {
    jurusan.forEach((j) => {
      nomor.forEach((n) => {
        kelasOptions.push(`${t} ${j} ${n}`)
      })
    })
  })

  return kelasOptions
}

export default function ClassSubjectList() {
  const [selectedKelas, setSelectedKelas] = useState<string>('')
  const [newSubject, setNewSubject] = useState<string>('')
  const [showAddForm, setShowAddForm] = useState(false)
  
  const { data: allClassSubjects, isLoading, refetch } = trpc.classSubject.getAllClassSubjects.useQuery()
  const utils = trpc.useUtils()
  const kelasOptions = generateKelasOptions()

  const addSubjectMutation = trpc.classSubject.addClassSubject.useMutation({
    onSuccess: () => {
      console.log('[SUCCESS] Mata pelajaran berhasil ditambahkan')
      setNewSubject('')
      setShowAddForm(false)
      utils.classSubject.getAllClassSubjects.invalidate()
      refetch()
    },
    onError: (error: any) => {
      console.error('[ERROR]', error.message || 'Gagal menambahkan mata pelajaran')
    },
  })

  const removeSubjectMutation = trpc.classSubject.removeClassSubject.useMutation({
    onSuccess: () => {
      console.log('[SUCCESS] Mata pelajaran berhasil dihapus')
      utils.classSubject.getAllClassSubjects.invalidate()
      refetch()
    },
    onError: (error: any) => {
      console.error('[ERROR]', error.message || 'Gagal menghapus mata pelajaran')
    },
  })

  const currentClassSubjects = useMemo(() => {
    if (!selectedKelas || !allClassSubjects) return []
    return allClassSubjects[selectedKelas] || []
  }, [selectedKelas, allClassSubjects])

  const handleAddSubject = () => {
    if (!selectedKelas || !newSubject.trim()) {
      console.error('[ERROR] Pilih kelas dan masukkan nama mata pelajaran')
      return
    }

    addSubjectMutation.mutate({
      kelas: selectedKelas,
      subject: newSubject.trim(),
    })
  }

  const handleRemoveSubject = (id: string) => {
    if (confirm('Yakin ingin menghapus mata pelajaran ini?')) {
      removeSubjectMutation.mutate({ id })
    }
  }

  if (isLoading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <LoadingSpinner size={32} />
        <p style={{ color: 'var(--text-light)', marginTop: '1rem' }}>Memuat mata pelajaran...</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Manajemen Mata Pelajaran per Kelas</h2>
        <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '0.875rem' }}>
          Kelola daftar mata pelajaran untuk setiap kelas. Mata pelajaran yang ditambahkan akan muncul di combobox filter dan form buat PR untuk user di kelas tersebut.
        </p>
      </div>

      {/* Kelas Selector */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.75rem', 
          fontWeight: 600, 
          fontSize: '0.875rem',
          color: 'var(--text-primary)'
        }}>
          Pilih Kelas
        </label>
        <ComboBox
          value={selectedKelas}
          onChange={setSelectedKelas}
          placeholder="Pilih Kelas"
          options={kelasOptions}
          showAllOption={false}
          searchPlaceholder="Cari kelas..."
          emptyMessage="Tidak ada kelas yang ditemukan"
          icon={<BookIcon size={18} style={{ color: 'var(--text-light)', flexShrink: 0 }} />}
        />
      </div>

      {selectedKelas && (
        <>
          {/* Add Subject Form */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>
                Tambah Mata Pelajaran untuk {selectedKelas}
              </h3>
              <button
                onClick={() => {
                  setShowAddForm(!showAddForm)
                  setNewSubject('')
                }}
                className="btn btn-primary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                {showAddForm ? (
                  <>
                    <XIconSmall size={16} style={{ marginRight: '0.5rem' }} />
                    Tutup
                  </>
                ) : (
                  <>
                    <PlusIcon size={16} style={{ marginRight: '0.5rem' }} />
                    Tambah
                  </>
                )}
              </button>
            </div>

            {showAddForm && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: 500, 
                    fontSize: '0.875rem',
                    color: 'var(--text-primary)'
                  }}>
                    Nama Mata Pelajaran
                  </label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="Ketik nama mata pelajaran..."
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.75rem',
                      fontSize: '0.875rem',
                      border: '1px solid var(--border)',
                      borderRadius: '0.5rem',
                      background: 'var(--card)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)'
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !addSubjectMutation.isLoading && newSubject.trim()) {
                        e.preventDefault()
                        handleAddSubject()
                      }
                    }}
                  />
                </div>

                <button
                  onClick={handleAddSubject}
                  className="btn btn-primary"
                  disabled={!newSubject.trim() || addSubjectMutation.isLoading}
                  style={{ padding: '0.625rem 1rem' }}
                >
                  {addSubjectMutation.isLoading ? 'Menambahkan...' : 'Tambah Mata Pelajaran'}
                </button>
              </div>
            )}
          </div>

          {/* Subjects List */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: 600 }}>
              Daftar Mata Pelajaran {selectedKelas}
            </h3>

            {currentClassSubjects.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {currentClassSubjects.map((subject: any, index: number) => (
                  <div
                    key={subject.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      background: 'var(--bg-secondary)',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <BookIcon size={18} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {subject.subject}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveSubject(subject.id)}
                      className="btn"
                      disabled={removeSubjectMutation.isLoading}
                      style={{
                        padding: '0.375rem 0.75rem',
                        background: 'transparent',
                        color: 'var(--error)',
                        border: '1px solid var(--error)',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--error)'
                        e.currentTarget.style.color = 'white'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = 'var(--error)'
                      }}
                    >
                      <TrashIcon size={16} />
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem',
                color: 'var(--text-light)',
                fontSize: '0.875rem'
              }}>
                Belum ada mata pelajaran untuk kelas ini. Tambahkan mata pelajaran di atas.
              </div>
            )}
          </div>
        </>
      )}

      {!selectedKelas && (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: 'var(--text-light)', margin: 0 }}>
            Pilih kelas terlebih dahulu untuk mengelola mata pelajaran.
          </p>
        </div>
      )}
    </div>
  )
}

