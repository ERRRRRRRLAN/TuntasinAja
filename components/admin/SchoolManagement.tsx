'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { PlusIcon, TrashIcon, EditIcon, SchoolIcon, BookIcon, XCloseIcon } from '@/components/ui/Icons'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { toast } from '@/components/ui/ToastContainer'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

export default function SchoolManagement() {
    const [isCreating, setIsCreating] = useState(false)
    const [isEditing, setIsEditing] = useState<string | null>(null)
    const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null)
    const [formData, setFormData] = useState({ name: '', address: '', logoUrl: '' })

    // Class management
    const [newClassName, setNewClassName] = useState('')
    const [isAddingClass, setIsAddingClass] = useState(false)

    // Confirmations
    const [deleteSchoolId, setDeleteSchoolId] = useState<string | null>(null)
    const [deleteClassId, setDeleteClassId] = useState<string | null>(null)

    const utils = trpc.useUtils()

    // Queries
    const { data: schools, isLoading: isLoadingSchools } = trpc.school.getAll.useQuery()
    const { data: classes, isLoading: isLoadingClasses } = trpc.school.getClasses.useQuery(
        { schoolId: selectedSchoolId! },
        { enabled: !!selectedSchoolId }
    )

    // Mutations (Schools)
    const createSchool = trpc.school.create.useMutation({
        onSuccess: () => {
            utils.school.getAll.invalidate()
            setIsCreating(false)
            setFormData({ name: '', address: '', logoUrl: '' })
            toast.success('Sekolah berhasil dibuat')
        },
        onError: (err) => toast.error(err.message)
    })

    const updateSchool = trpc.school.update.useMutation({
        onSuccess: () => {
            utils.school.getAll.invalidate()
            setIsEditing(null)
            setFormData({ name: '', address: '', logoUrl: '' })
            toast.success('Sekolah berhasil diperbarui')
        },
        onError: (err) => toast.error(err.message)
    })

    const deleteSchool = trpc.school.delete.useMutation({
        onSuccess: () => {
            utils.school.getAll.invalidate()
            setDeleteSchoolId(null)
            if (selectedSchoolId === deleteSchoolId) setSelectedSchoolId(null)
            toast.success('Sekolah berhasil dihapus')
        },
        onError: (err) => toast.error(err.message)
    })

    // Mutations (Classes)
    const addClass = trpc.school.addClass.useMutation({
        onSuccess: () => {
            utils.school.getClasses.invalidate({ schoolId: selectedSchoolId! })
            setNewClassName('')
            setIsAddingClass(false)
            toast.success('Kelas berhasil ditambahkan')
        },
        onError: (err) => toast.error(err.message)
    })

    const removeClass = trpc.school.removeClass.useMutation({
        onSuccess: () => {
            utils.school.getClasses.invalidate({ schoolId: selectedSchoolId! })
            setDeleteClassId(null)
            toast.success('Kelas berhasil dihapus')
        },
        onError: (err) => toast.error(err.message)
    })

    const handleSubmitSchool = (e: React.FormEvent) => {
        e.preventDefault()
        if (isEditing) {
            updateSchool.mutate({ id: isEditing, ...formData })
        } else {
            createSchool.mutate(formData)
        }
    }

    const handleAddClass = (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedSchoolId) return
        addClass.mutate({ schoolId: selectedSchoolId, name: newClassName })
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Manajemen Sekolah</h2>
                    <p style={{ color: 'var(--text-light)' }}>Kelola daftar sekolah dan kelas</p>
                </div>
                {!selectedSchoolId && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <PlusIcon size={20} />
                        Tambah Sekolah
                    </button>
                )}
            </div>

            {/* Main Content Area */}
            <div style={{ display: 'grid', gridTemplateColumns: selectedSchoolId ? '1fr 1fr' : '1fr', gap: '2rem' }}>

                {/* Left Panel: School List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {isLoadingSchools ? (
                        <div style={{ padding: '2rem', textAlign: 'center' }}><LoadingSpinner /></div>
                    ) : schools?.length === 0 ? (
                        <div style={{
                            padding: '3rem',
                            textAlign: 'center',
                            background: 'var(--card)',
                            borderRadius: '1rem',
                            border: '1px dashed var(--border)'
                        }}>
                            <p style={{ color: 'var(--text-light)' }}>Belum ada sekolah terdaftar</p>
                        </div>
                    ) : (
                        schools?.map(school => (
                            <div
                                key={school.id}
                                onClick={() => setSelectedSchoolId(school.id)}
                                style={{
                                    padding: '1.5rem',
                                    background: 'var(--card)',
                                    borderRadius: '1rem',
                                    border: `2px solid ${selectedSchoolId === school.id ? 'var(--primary)' : 'transparent'}`,
                                    boxShadow: 'var(--shadow)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '0.75rem',
                                            background: 'var(--primary)15',
                                            color: 'var(--primary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <SchoolIcon size={24} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontWeight: 600, fontSize: '1.1rem', margin: 0 }}>{school.name}</h3>
                                            {school.address && (
                                                <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', margin: '0.25rem 0 0 0' }}>
                                                    {school.address}
                                                </p>
                                            )}
                                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-light)' }}>
                                                <span>{(school as any)._count?.classes || 0} Kelas</span>
                                                <span>{(school as any)._count?.users || 0} Siswa</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setFormData({
                                                    name: school.name,
                                                    address: school.address || '',
                                                    logoUrl: school.logoUrl || ''
                                                })
                                                setIsEditing(school.id)
                                            }}
                                            className="btn-icon"
                                            style={{ padding: '0.5rem', borderRadius: '0.5rem', color: 'var(--text-light)' }}
                                        >
                                            <EditIcon size={18} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setDeleteSchoolId(school.id)
                                            }}
                                            className="btn-icon"
                                            style={{ padding: '0.5rem', borderRadius: '0.5rem', color: 'var(--danger)' }}
                                        >
                                            <TrashIcon size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Right Panel: Class Management (Visible when school selected) */}
                {selectedSchoolId && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.3s' }}>
                        <div style={{
                            background: 'var(--card)',
                            borderRadius: '1rem',
                            padding: '1.5rem',
                            boxShadow: 'var(--shadow)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Daftar Kelas</h3>
                                <button
                                    onClick={() => setIsAddingClass(true)}
                                    className="btn btn-sm"
                                    style={{
                                        background: 'var(--primary)15',
                                        color: 'var(--primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <PlusIcon size={16} />
                                    Tambah Kelas
                                </button>
                            </div>

                            {isAddingClass && (
                                <form onSubmit={handleAddClass} style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={newClassName}
                                        onChange={(e) => setNewClassName(e.target.value)}
                                        placeholder="Nama Kelas (cth: XI PPLG 1)"
                                        style={{ flex: 1, padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                                        disabled={addClass.isLoading}
                                    />
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={!newClassName.trim() || addClass.isLoading}
                                    >
                                        Simpan
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingClass(false)}
                                        className="btn"
                                        style={{ border: '1px solid var(--border)' }}
                                    >
                                        Batal
                                    </button>
                                </form>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {isLoadingClasses ? (
                                    <div style={{ padding: '2rem', textAlign: 'center' }}><LoadingSpinner /></div>
                                ) : classes?.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '2rem' }}>
                                        Belum ada kelas di sekolah ini
                                    </p>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
                                        {classes?.map((cls) => (
                                            <div
                                                key={cls.id}
                                                style={{
                                                    padding: '0.75rem 1rem',
                                                    background: 'var(--bg-secondary)',
                                                    borderRadius: '0.5rem',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 500
                                                }}
                                            >
                                                <span>{cls.name}</span>
                                                <button
                                                    onClick={() => setDeleteClassId(cls.id)}
                                                    style={{
                                                        border: 'none',
                                                        background: 'transparent',
                                                        color: 'var(--text-light)',
                                                        cursor: 'pointer',
                                                        padding: '0.25rem',
                                                        display: 'flex'
                                                    }}
                                                    className="hover:text-danger"
                                                >
                                                    <XCloseIcon size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Legacy Migration Section */}
                            <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                                <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Migrasi Data Lama</h4>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '1rem', lineHeight: 1.5 }}>
                                    Kelas di bawah ini ditemukan di data siswa (legacy) tetapi mungkin belum terdaftar di sekolah ini.
                                    Klik tombol untuk mengimpor kelas dan menautkan siswa ke sekolah <strong>{schools?.find(s => s.id === selectedSchoolId)?.name}</strong>.
                                </p>

                                <LegacyClassList
                                    classes={classes || []}
                                    selectedSchoolId={selectedSchoolId}
                                    onSuccess={() => {
                                        utils.school.getClasses.invalidate({ schoolId: selectedSchoolId! })
                                        utils.school.getAll.invalidate()
                                    }}
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedSchoolId(null)}
                            style={{ alignSelf: 'flex-start', color: 'var(--text-light)', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            Tutup detail sekolah
                        </button>
                    </div>
                )}
            </div>

            {/* Create/Edit School Modal */}
            {(isCreating || isEditing) && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: 'var(--card)', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '500px',
                        boxShadow: 'var(--shadow-lg)'
                    }}>
                        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                            {isEditing ? 'Edit Sekolah' : 'Tambah Sekolah Baru'}
                        </h3>

                        <form onSubmit={handleSubmitSchool} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Nama Sekolah</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="form-input"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                                    placeholder="Contoh: SMA Negeri 1 Jakarta"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Alamat (Opsional)</label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="form-input"
                                    rows={3}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                                    placeholder="Jl. Pendidikan No. 1..."
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCreating(false)
                                        setIsEditing(null)
                                        setFormData({ name: '', address: '', logoUrl: '' })
                                    }}
                                    className="btn"
                                    style={{ border: '1px solid var(--border)', background: 'transparent' }}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={createSchool.isLoading || updateSchool.isLoading}
                                >
                                    {createSchool.isLoading || updateSchool.isLoading ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete School Confirmation */}
            <ConfirmDialog
                isOpen={!!deleteSchoolId}
                title="Hapus Sekolah"
                message="Apakah Anda yakin ingin menghapus sekolah ini? Semua kelas dan data terkait akan ikut terhapus. Tindakan ini tidak dapat dibatalkan."
                confirmText="Hapus"
                cancelText="Batal"
                danger
                isLoading={deleteSchool.isLoading}
                onConfirm={() => deleteSchoolId && deleteSchool.mutate({ id: deleteSchoolId })}
                onCancel={() => setDeleteSchoolId(null)}
            />

            {/* Delete Class Confirmation */}
            <ConfirmDialog
                isOpen={!!deleteClassId}
                title="Hapus Kelas"
                message="Apakah Anda yakin ingin menghapus kelas ini?"
                confirmText="Hapus"
                cancelText="Batal"
                danger
                isLoading={removeClass.isLoading}
                onConfirm={() => deleteClassId && removeClass.mutate({ classId: deleteClassId })}
                onCancel={() => setDeleteClassId(null)}
            />
        </div>
    )
}

function LegacyClassList({ classes, selectedSchoolId, onSuccess }: {
    classes: any[];
    selectedSchoolId: string;
    onSuccess: () => void;
}) {
    const { data: legacyClasses, isLoading } = trpc.school.getLegacyClasses.useQuery()
    const migrateClass = trpc.school.migrateClass.useMutation({
        onSuccess: (res) => {
            toast.success(`Berhasil migrasi kelas. ${res.usersUpdated} siswa diperbarui.`)
            onSuccess()
        },
        onError: (err) => toast.error(err.message)
    })

    const [migratingName, setMigratingName] = useState<string | null>(null)
    const [confirming, setConfirming] = useState<{ name: string, count: number } | null>(null)

    if (isLoading) return <LoadingSpinner />

    if (!legacyClasses?.length) return <p style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>Tidak ada data kelas legacy ditemukan.</p>

    return (
        <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                {legacyClasses.map((legacy) => {
                    const alreadyExists = classes?.some(c => c.name === legacy.name)
                    return (
                        <div key={legacy.name} style={{
                            padding: '0.75rem',
                            background: 'var(--bg-secondary)',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--border)',
                            opacity: alreadyExists ? 0.7 : 1
                        }}>
                            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{legacy.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '0.75rem' }}>
                                {legacy.studentCount} Siswa terdaftar
                            </div>
                            <button
                                onClick={() => setConfirming({ name: legacy.name, count: legacy.studentCount })}
                                className="btn btn-sm btn-full"
                                style={{
                                    width: '100%',
                                    background: alreadyExists ? 'var(--text-light)' : 'var(--primary)',
                                    color: 'white',
                                    fontSize: '0.8rem',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '0.5rem',
                                    borderRadius: '0.25rem'
                                }}
                                disabled={!!migratingName}
                            >
                                {migratingName === legacy.name ? '...' : (alreadyExists ? 'Sync Siswa' : 'Import ke Sini')}
                            </button>
                        </div>
                    )
                })}
            </div>

            <ConfirmDialog
                isOpen={!!confirming}
                title="Konfirmasi Migrasi"
                message={`Apakah Anda yakin ingin memigrasikan kelas "${confirming?.name}" beserta ${confirming?.count} siswanya ke sekolah ini?`}
                confirmText="Ya, Migrasi"
                cancelText="Batal"
                isLoading={migrateClass.isLoading}
                onConfirm={() => {
                    if (confirming) {
                        const name = confirming.name
                        setMigratingName(name)
                        migrateClass.mutate({ schoolId: selectedSchoolId, className: name }, {
                            onSettled: () => setMigratingName(null)
                        })
                        setConfirming(null)
                    }
                }}
                onCancel={() => setConfirming(null)}
            />
        </>
    )
}
